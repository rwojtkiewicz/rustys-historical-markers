import urllib.request
import re
import html
import json
import time

def parse_hmdb_marker(marker_id, csv_row):
    url = f"https://www.hmdb.org/m.asp?m={marker_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            page = resp.read().decode("windows-1252", errors="ignore")
    except Exception as e:
        print(f"Error fetching {marker_id}: {e}")
        return None

    # Clean HTML helper
    def clean_text(raw):
        if not raw:
            return ""
        t = re.sub(r"<[^>]+>", " ", raw)
        t = html.unescape(t)
        t = re.sub(r"\s+", " ", t).strip()
        return t

    # 1. Inscription
    inscription = ""
    insc_match = re.search(r"<div\s+id=inscription\d*\s+style='display:none;'>(.*?)</div>", page, re.DOTALL | re.IGNORECASE)
    if insc_match:
        inscription = clean_text(insc_match.group(1))
    else:
        insc_head = re.search(r"<span class=sectionhead>Inscription\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
        if insc_head:
            inscription = clean_text(insc_head.group(1))

    # 2. More about this marker / Historical Context
    more_context = ""
    more_match = re.search(r"<span class=sectionhead>More about this marker\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
    if more_match:
        more_context = clean_text(more_match.group(1))

    # 3. Topics
    topics = []
    topics_match = re.search(r"<span class=sectionhead>Topics\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
    if topics_match:
        topics_raw = re.findall(r"<a[^>]*>(.*?)</a>", topics_match.group(1))
        topics = [clean_text(t) for t in topics_raw if t.strip()]

    # 4. Page Credits / Submission
    submission_info = ""
    credits_match = re.search(r"<span class=sectionhead>Credits\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
    if credits_match:
        submission_info = clean_text(credits_match.group(1))

    # 5. Photos
    photos = []
    photo_id_matches = re.finditer(r"PhotoFullSize\.asp\?PhotoID=(\d+)", page, re.IGNORECASE)
    seen_photo_ids = set()
    
    for pm in photo_id_matches:
        pid = pm.group(1)
        if pid in seen_photo_ids:
            continue
        seen_photo_ids.add(pid)
        
        chunk = page[max(0, pm.start() - 100):min(len(page), pm.end() + 1000)]
        
        img_url = f"https://www.hmdb.org/Photos/{pid[:2] if len(pid)>=2 else '0'}/Photo{pid}.jpg"
        img_src_m = re.search(r"src=(Photos/\d+/Photo\d+\.jpg)", chunk, re.IGNORECASE)
        if img_src_m:
            img_url = f"https://www.hmdb.org/{img_src_m.group(1)}"
            
        credit = ""
        credit_m = re.search(r"<div class=imagecredit>(.*?)</div>", chunk, re.DOTALL | re.IGNORECASE)
        if credit_m:
            credit = clean_text(credit_m.group(1))
            
        caption = ""
        caption_m = re.search(r"<div class=imagecaption>(.*?)</div>", chunk, re.DOTALL | re.IGNORECASE)
        if caption_m:
            caption = clean_text(caption_m.group(1))
            
        subcaption = ""
        subcap_m = re.search(r"<div class=imagesubcaption[^>]*>(.*?)</div>", chunk, re.DOTALL | re.IGNORECASE)
        if subcap_m:
            subcaption = clean_text(subcap_m.group(1))
            
        photos.append({
            "photoId": pid,
            "url": img_url,
            "caption": caption,
            "description": subcaption,
            "credit": credit
        })

    category = "Cultural Heritage"
    topics_str = " ".join(topics).lower()
    title_str = (csv_row.get("Title", "") + " " + csv_row.get("Subtitle", "")).lower()
    
    if "war" in topics_str or "war" in title_str or "confederate" in topics_str or "civil war" in title_str:
        category = "Civil War"
    elif "military" in topics_str or "veteran" in title_str:
        category = "Notable Figures"
    elif "aviation" in topics_str or "airport" in title_str:
        category = "Aviation & Transit"
    elif "native american" in topics_str or "indigenous" in topics_str or "tribal" in title_str:
        category = "Indigenous History"
    elif "pioneer" in topics_str or "trail" in title_str or "lewis and clark" in title_str or "expedition" in title_str:
        category = "Pioneer & Trails"
    elif "architecture" in topics_str or "building" in title_str or "hotel" in title_str or "church" in title_str:
        category = "Architecture"
    elif "music" in topics_str or "jazz" in title_str:
        category = "Music & Culture"
    elif "baseball" in topics_str or "satchel" in title_str:
        category = "Cultural Heritage"

    return {
        "id": f"hmdb-{marker_id}",
        "hmdbId": int(marker_id),
        "markerNumber": csv_row.get("Marker No.", "") or f"MO-PLT-{marker_id}",
        "title": csv_row.get("Title", ""),
        "subtitle": csv_row.get("Subtitle", ""),
        "plaqueText": inscription or csv_row.get("Title", ""),
        "category": category,
        "topics": topics,
        "era": str(csv_row.get("Year Erected", "") or "Historic"),
        "yearErected": int(csv_row.get("Year Erected")) if csv_row.get("Year Erected", "").isdigit() else None,
        "erectedBy": csv_row.get("Erected By", ""),
        "lat": float(csv_row.get("Latitude (minus=S)")),
        "lng": float(csv_row.get("Longitude (minus=W)")),
        "streetAddress": csv_row.get("Street Address", ""),
        "locationName": csv_row.get("Location", "") or csv_row.get("Street Address", "") or f"{csv_row.get('City or Town', '')}, MO",
        "city": csv_row.get("City or Town", ""),
        "county": "Platte County",
        "region": "Greater Kansas City",
        "state": "MO",
        "zip": csv_row.get("Zip or Postal Code", ""),
        "missing": csv_row.get("Missing", "") == "Confirmed Missing",
        "historicalContext": more_context,
        "submissionCredits": submission_info,
        "photos": photos,
        "hmdbUrl": csv_row.get("Link", f"https://www.hmdb.org/m.asp?m={marker_id}")
    }

sample_data = [
    {"MarkerID": "22004", "Marker No.": "", "Title": "Camden Point Veterans' Marker", "Subtitle": "", "Year Erected": "2009", "Erected By": "Citizens of Camden Point and surrounding areas", "Latitude (minus=S)": "39.45337", "Longitude (minus=W)": "-94.75620", "Street Address": "", "City or Town": "Camden Point", "County or Parish": "Platte County", "State or Prov.": "Missouri", "Zip or Postal Code": "64018", "Location": "It is on County Road E 0.1 miles Interurban Road", "Missing": "", "Link": "https://www.hmdb.org/m.asp?m=22004"},
    {"MarkerID": "40986", "Marker No.": "", "Title": "John H. Dillingham", "Subtitle": "", "Year Erected": "", "Erected By": "Platte County Historical Society", "Latitude (minus=S)": "39.28176", "Longitude (minus=W)": "-94.83145", "Street Address": "108 Main Street", "City or Town": "Farley", "County or Parish": "Platte County", "State or Prov.": "Missouri", "Zip or Postal Code": "64028", "Location": "It is on Main Street", "Missing": "", "Link": "https://www.hmdb.org/m.asp?m=40986"},
    {"MarkerID": "44521", "Marker No.": "", "Title": "\"Bear Medison Island\"", "Subtitle": "Monday, July 2, 1804 [and] Sunday, September 14, 1806", "Year Erected": "", "Erected By": "St. Joseph Museum, Platte County Visitors Bureau, and The Native Sons of Greater Kansas City.", "Latitude (minus=S)": "39.40925", "Longitude (minus=W)": "-94.90328", "Street Address": "", "City or Town": "Weston", "County or Parish": "Platte County", "State or Prov.": "Missouri", "Zip or Postal Code": "64098", "Location": "It is on Main Street", "Missing": "", "Link": "https://www.hmdb.org/m.asp?m=44521"}
]

for row in sample_data:
    res = parse_hmdb_marker(row["MarkerID"], row)
    print("========================================")
    print(f"ID: {res['id']}")
    print(f"Title: {res['title']}")
    print(f"Plaque Text (snippet): {res['plaqueText'][:150]}...")
    print(f"Category: {res['category']} | Topics: {res['topics']}")
    print(f"Context: {res['historicalContext'][:100]}...")
    print(f"Photos ({len(res['photos'])}):")
    for p in res["photos"]:
        print(f"  - [{p['photoId']}] {p['url']}")
        print(f"    Caption: {p['caption']}")
        print(f"    Desc: {p['description']}")
        print(f"    Credit: {p['credit']}")
