import csv
import urllib.request
import re
import html
import json
import os
import time
import random

CSV_PATH = "src/data/markers/missouri/greater-kansas-city/platte_county.csv"
JSON_OUTPUT_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
TS_OUTPUT_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"

def clean_text(raw):
    if not raw:
        return ""
    # Strip javascript
    raw = re.sub(r"<script.*?</script>", "", raw, flags=re.DOTALL | re.IGNORECASE)
    raw = re.sub(r"function\s+incrementViewCount.*?$", "", raw, flags=re.DOTALL | re.IGNORECASE)
    t = re.sub(r"<[^>]+>", " ", raw)
    t = html.unescape(t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def parse_hmdb_page(marker_id, csv_row, retry_count=0):
    url = f"https://www.hmdb.org/m.asp?m={marker_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.hmdb.org/",
    }
    req = urllib.request.Request(url, headers=headers)
    page = ""
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            page = resp.read().decode("windows-1252", errors="ignore")
    except urllib.error.HTTPError as e:
        if e.code == 429 and retry_count < 4:
            wait_sec = (retry_count + 1) * 3 + random.uniform(1.0, 2.5)
            print(f"    [Rate limit 429] Waiting {round(wait_sec, 1)}s before retry {retry_count+1}/4...")
            time.sleep(wait_sec)
            return parse_hmdb_page(marker_id, csv_row, retry_count + 1)
        else:
            print(f"  [Error] {url}: {e}")
            return None
    except Exception as e:
        print(f"  [Error] {url}: {e}")
        return None

    # 1. Inscription
    inscription = ""
    insc_match = re.search(r"<div\s+id=inscription\d*\s+style='display:none;'>(.*?)</div>", page, re.DOTALL | re.IGNORECASE)
    if insc_match:
        inscription = clean_text(insc_match.group(1))
    else:
        insc_head = re.search(r"<span class=sectionhead>Inscription\.\s*</span>(.*?)<span class=sectionhead>", page, re.DOTALL | re.IGNORECASE)
        if insc_head:
            inscription = clean_text(insc_head.group(1))

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

    # 4. Page Credits
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

        is_plaque_photo = any(k in caption.lower() or k in subcaption.lower() for k in ["plaque", "inscription", "close-up", "marker", "face"])

        photos.append({
            "photoId": pid,
            "url": img_url,
            "caption": caption or title,
            "description": subcaption,
            "credit": credit,
            "isPlaquePhoto": is_plaque_photo
        })

    category = map_category(topics, title, subtitle)

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
        "missing": "Confirmed Missing" in csv_row.get("Missing", "") or "Reported missing" in csv_row.get("Location", "") or "Reported permanently removed" in csv_row.get("Location", ""),
        "historicalContext": more_context if more_context else None,
        "submissionCredits": submission_info if submission_info else None,
        "photos": photos,
        "hmdbUrl": csv_row.get("Link", f"https://www.hmdb.org/m.asp?m={marker_id}").strip()
    }

def map_category(topics, title, subtitle):
    combined = (" ".join(topics) + " " + title + " " + (subtitle or "")).lower()
    if any(w in combined for w in ["civil war", "confederate", "union", "paw paw", "battle"]):
        return "Civil War"
    elif any(w in combined for w in ["veteran", "military", "honor", "post 501"]):
        return "Notable Figures"
    elif any(w in combined for w in ["airport", "aviation", "flight", "terminal", "transit", "rail", "anchor"]):
        return "Aviation & Transit"
    elif any(w in combined for w in ["native american", "indigenous", "tribal", "campsite", "village site", "bear medison"]):
        return "Indigenous History"
    elif any(w in combined for w in ["lewis and clark", "pony express", "trail", "expedition", "pioneer", "stagecoach", "frontier"]):
        return "Pioneer & Trails"
    elif any(w in combined for w in ["building", "hotel", "church", "house", "courthouse", "jail", "art deco", "architecture", "bank"]):
        return "Architecture"
    elif any(w in combined for w in ["jazz", "music", "art and soul", "benton", "theatre"]):
        return "Music & Culture"
    elif any(w in combined for w in ["civil rights", "slavery", "dred scott", "dinah robinson", "freedom"]):
        return "Civil Rights"
    elif any(w in combined for w in ["cemetery", "grave", "laurel hill"]):
        return "Cultural Heritage"
    else:
        return "Cultural Heritage"

def main():
    print(f"Loading existing data...")
    with open(JSON_OUTPUT_PATH, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    # Read original CSV rows map
    csv_rows_by_id = {}
    with open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("MarkerID"):
                csv_rows_by_id[r["MarkerID"].strip()] = r

    # Clean existing data of any javascript artifacts
    for item in existing_data:
        if item.get("historicalContext"):
            item["historicalContext"] = clean_text(item["historicalContext"])
        if item.get("plaqueText"):
            item["plaqueText"] = clean_text(item["plaqueText"])

    # Identify records that need enrichment (empty photos or short placeholder plaque)
    needs_enrichment = []
    for idx, item in enumerate(existing_data):
        mid = str(item["hmdbId"])
        # If it was a 429 fallback, photos is [] or plaque text is just the title
        if len(item.get("photos", [])) == 0 and (item["plaqueText"] == item["title"] or not item.get("submissionCredits")):
            needs_enrichment.append((idx, mid, item["title"]))

    print(f"Found {len(needs_enrichment)} markers needing full extraction retry.")

    for count, (idx, mid, title) in enumerate(needs_enrichment, 1):
        print(f"[{count}/{len(needs_enrichment)}] Enriching #{mid}: {title}...")
        csv_row = csv_rows_by_id.get(mid, {})
        new_record = parse_hmdb_page(mid, csv_row)
        if new_record and len(new_record["photos"]) > 0 or (new_record and len(new_record["plaqueText"]) > len(title)):
            existing_data[idx] = new_record
            print(f"    -> SUCCESS! Inscription: {len(new_record['plaqueText'])} chars, Photos: {len(new_record['photos'])}")
        else:
            print(f"    -> Note: Retrieved record with {len(new_record.get('photos', [])) if new_record else 0} photos.")

        # Respectful delay between requests
        time.sleep(1.2 + random.uniform(0.3, 0.8))

    # Calculate final stats
    total_markers = len(existing_data)
    total_photos = sum(len(m.get("photos", [])) for m in existing_data)
    total_with_photos = sum(1 for m in existing_data if len(m.get("photos", [])) > 0)
    total_with_full_inscriptions = sum(1 for m in existing_data if len(m.get("plaqueText", "")) > 30)

    print("\n==========================================")
    print("FINAL ENRICHMENT RESULTS:")
    print(f"Total Markers: {total_markers}")
    print(f"Markers with Full Inscriptions: {total_with_full_inscriptions}/{total_markers}")
    print(f"Markers with Photos: {total_with_photos}/{total_markers}")
    print(f"Total Photos Extracted: {total_photos}")
    print("==========================================\n")

    # Save final JSON and TypeScript
    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    print(f"Saved complete JSON to: {JSON_OUTPUT_PATH}")

    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(existing_data, indent=2, ensure_ascii=False)};
"""
    with open(TS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Saved TypeScript module to: {TS_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
