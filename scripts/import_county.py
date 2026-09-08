import csv
import urllib.request
import re
import html
import json
import os
import time

CSV_PATH = "src/data/markers/missouri/greater-kansas-city/platte_county.csv"
JSON_OUTPUT_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
TS_OUTPUT_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"

def clean_text(raw):
    if not raw:
        return ""
    t = re.sub(r"<[^>]+>", " ", raw)
    t = html.unescape(t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def parse_hmdb_page(marker_id, csv_row):
    url = f"https://www.hmdb.org/m.asp?m={marker_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    page = ""
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            page = resp.read().decode("windows-1252", errors="ignore")
    except Exception as e:
        print(f"  [Warning] Failed to fetch {url}: {e}")
        # Return fallback record from CSV if network fails
        return build_fallback_record(marker_id, csv_row)

    # 1. Inscription
    inscription = ""
    insc_match = re.search(r"<div\s+id=inscription\d*\s+style='display:none;'>(.*?)</div>", page, re.DOTALL | re.IGNORECASE)
    if insc_match:
        inscription = clean_text(insc_match.group(1))
    else:
        insc_head = re.search(r"<span class=sectionhead>Inscription\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
        if insc_head:
            inscription = clean_text(insc_head.group(1))

    # Clean double prefixes in inscription (e.g. Title repeated at start)
    title = csv_row.get("Title", "").strip()
    subtitle = csv_row.get("Subtitle", "").strip()
    
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

    # 4. Page Credits / Submissions
    submission_info = ""
    credits_match = re.search(r"<span class=sectionhead>Credits\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
    if credits_match:
        submission_info = clean_text(credits_match.group(1))

    # 5. Photos extraction
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

        # Check if this photo is a plaque close-up
        is_plaque_photo = "plaque" in caption.lower() or "inscription" in caption.lower() or "close-up" in caption.lower() or "marker" in caption.lower()

        photos.append({
            "photoId": pid,
            "url": img_url,
            "caption": caption or title,
            "description": subcaption,
            "credit": credit,
            "isPlaquePhoto": is_plaque_photo
        })

    # Category Mapping
    category = map_category(topics, title, subtitle)

    # Year erected
    year_val = None
    y_raw = csv_row.get("Year Erected", "").strip()
    if y_raw.isdigit():
        year_val = int(y_raw)

    return {
        "id": f"hmdb-{marker_id}",
        "hmdbId": int(marker_id),
        "markerNumber": csv_row.get("Marker No.", "").strip() or f"MO-PLT-{marker_id}",
        "title": title,
        "subtitle": subtitle if subtitle else None,
        "plaqueText": inscription if inscription else title,
        "category": category,
        "topics": topics,
        "era": str(year_val or (subtitle if len(subtitle)<=10 else "Historic")),
        "yearErected": year_val,
        "erectedBy": csv_row.get("Erected By", "").strip() or None,
        "lat": float(csv_row.get("Latitude (minus=S)")),
        "lng": float(csv_row.get("Longitude (minus=W)")),
        "streetAddress": csv_row.get("Street Address", "").strip() or None,
        "locationName": clean_text(csv_row.get("Location", "")) or csv_row.get("Street Address", "").strip() or f"{csv_row.get('City or Town', '')}, MO",
        "city": csv_row.get("City or Town", "").strip(),
        "county": "Platte County",
        "region": "Greater Kansas City",
        "state": "MO",
        "zip": csv_row.get("Zip or Postal Code", "").strip() or None,
        "missing": "Confirmed Missing" in csv_row.get("Missing", "") or "Reported missing" in csv_row.get("Location", ""),
        "historicalContext": more_context if more_context else None,
        "submissionCredits": submission_info if submission_info else None,
        "photos": photos,
        "hmdbUrl": csv_row.get("Link", f"https://www.hmdb.org/m.asp?m={marker_id}").strip()
    }

def map_category(topics, title, subtitle):
    combined = (" ".join(topics) + " " + title + " " + (subtitle or "")).lower()
    if any(w in combined for w in ["civil war", "confederate", "union", "paw paw", "battle"]):
        return "Civil War"
    elif any(w in combined for w in ["veteran", "military", "honor", "war", "army", "navy", "post 501"]):
        return "Notable Figures"
    elif any(w in combined for w in ["airport", "aviation", "flight", "terminal", "transit", "rail"]):
        return "Aviation & Transit"
    elif any(w in combined for w in ["native american", "indigenous", "tribal", "campsite", "village site", "bear medison"]):
        return "Indigenous History"
    elif any(w in combined for w in ["lewis and clark", "pony express", "trail", "expedition", "pioneer", "stagecoach", "frontier"]):
        return "Pioneer & Trails"
    elif any(w in combined for w in ["building", "hotel", "church", "house", "courthouse", "jail", "art deco", "architecture"]):
        return "Architecture"
    elif any(w in combined for w in ["jazz", "music", "art and soul", "benton", "theatre"]):
        return "Music & Culture"
    elif any(w in combined for w in ["civil rights", "slavery", "dred scott", "dinah robinson", "freedom"]):
        return "Civil Rights"
    elif any(w in combined for w in ["cemetery", "grave", "laurel hill"]):
        return "Cultural Heritage"
    else:
        return "Cultural Heritage"

def build_fallback_record(marker_id, csv_row):
    title = csv_row.get("Title", "").strip()
    subtitle = csv_row.get("Subtitle", "").strip()
    year_val = int(csv_row.get("Year Erected")) if csv_row.get("Year Erected", "").isdigit() else None
    return {
        "id": f"hmdb-{marker_id}",
        "hmdbId": int(marker_id),
        "markerNumber": csv_row.get("Marker No.", "").strip() or f"MO-PLT-{marker_id}",
        "title": title,
        "subtitle": subtitle if subtitle else None,
        "plaqueText": title,
        "category": "Cultural Heritage",
        "topics": [],
        "era": str(year_val or "Historic"),
        "yearErected": year_val,
        "erectedBy": csv_row.get("Erected By", "").strip() or None,
        "lat": float(csv_row.get("Latitude (minus=S)")),
        "lng": float(csv_row.get("Longitude (minus=W)")),
        "streetAddress": csv_row.get("Street Address", "").strip() or None,
        "locationName": clean_text(csv_row.get("Location", "")) or f"{csv_row.get('City or Town', '')}, MO",
        "city": csv_row.get("City or Town", "").strip(),
        "county": "Platte County",
        "region": "Greater Kansas City",
        "state": "MO",
        "zip": csv_row.get("Zip or Postal Code", "").strip() or None,
        "missing": "Confirmed Missing" in csv_row.get("Missing", ""),
        "historicalContext": None,
        "submissionCredits": None,
        "photos": [],
        "hmdbUrl": csv_row.get("Link", f"https://www.hmdb.org/m.asp?m={marker_id}").strip()
    }

def main():
    print(f"Reading CSV from {CSV_PATH}...")
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("MarkerID") and r.get("Latitude (minus=S)"):
                rows.append(r)

    total = len(rows)
    print(f"Found {total} historical markers in Platte County CSV.")
    
    results = []
    total_photos = 0
    start_time = time.time()

    for idx, row in enumerate(rows, 1):
        mid = row["MarkerID"].strip()
        title = row.get("Title", "Marker").strip()
        print(f"[{idx}/{total}] Fetching #{mid}: {title}...")
        
        record = parse_hmdb_page(mid, row)
        if record:
            results.append(record)
            num_photos = len(record.get("photos", []))
            total_photos += num_photos
            print(f"       -> OK! Plaque: {len(record['plaqueText'])} chars | Photos: {num_photos} | Category: {record['category']}")
        
        # Pacing
        time.sleep(0.2)

    elapsed = round(time.time() - start_time, 1)
    print("\n==========================================")
    print(f"SCRAPING COMPLETE in {elapsed}s!")
    print(f"Total Markers Processed: {len(results)}/{total}")
    print(f"Total Photos Extracted: {total_photos}")
    print("==========================================\n")

    # Ensure output directories exist
    os.makedirs(os.path.dirname(JSON_OUTPUT_PATH), exist_ok=True)

    # 1. Save JSON
    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Saved JSON to: {JSON_OUTPUT_PATH}")

    # 2. Save TypeScript module
    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(results, indent=2, ensure_ascii=False)};
"""
    with open(TS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Saved TypeScript module to: {TS_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
