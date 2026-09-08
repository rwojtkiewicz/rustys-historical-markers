import json
import urllib.request
import re
import html
import time
import os

JSON_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
TS_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"

def clean_text(raw):
    if not raw: return ""
    raw = re.sub(r"<script.*?</script>", "", raw, flags=re.DOTALL | re.IGNORECASE)
    raw = re.sub(r"function\s+incrementViewCount.*?$", "", raw, flags=re.DOTALL | re.IGNORECASE)
    t = re.sub(r"<[^>]+>", " ", raw)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()

def fix_all_photos():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        markers = json.load(f)

    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.hmdb.org/",
    }

    print(f"Verifying photo URLs for {len(markers)} markers...")
    updated_count = 0

    for idx, m in enumerate(markers, 1):
        mid = str(m["hmdbId"])
        url = f"https://www.hmdb.org/m.asp?m={mid}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                page = resp.read().decode("windows-1252", errors="ignore")
        except Exception as e:
            print(f"  [{idx}] Error fetching {url}: {e}")
            time.sleep(1.0)
            continue

        # Find all photo containers: img with class=photoimage or src=Photos*/...
        # Also find captions and credits
        photos = []
        photo_cards = re.finditer(r"(<a[^>]+PhotoFullSize\.asp\?PhotoID=(\d+)[^>]*>.*?)(?=<div class=photocard|<div class=photocardcontainer|<span class=sectionhead|</div>\s*</div>\s*</div>)", page, re.DOTALL | re.IGNORECASE)
        
        seen_pids = set()
        for pc in photo_cards:
            block = pc.group(1)
            pid = pc.group(2)
            if pid in seen_pids:
                continue
            seen_pids.add(pid)

            # Find exact src from block
            img_src_m = re.search(r"src=['\"]?(Photos\d*/\d+/Photo\d+\.jpg)", block, re.IGNORECASE)
            if img_src_m:
                raw_src = img_src_m.group(1)
                full_url = f"https://www.hmdb.org/{raw_src}"
                # High resolution version
                hi_res_url = f"https://www.hmdb.org/{raw_src.replace('.jpg', 'o.jpg')}"
            else:
                full_url = f"https://www.hmdb.org/Photos/{pid[:2]}/Photo{pid}.jpg"
                hi_res_url = full_url

            # Credit
            credit = ""
            credit_m = re.search(r"<div class=imagecredit>(.*?)</div>", block, re.DOTALL | re.IGNORECASE)
            if credit_m:
                credit = clean_text(credit_m.group(1))

            # Caption
            caption = ""
            caption_m = re.search(r"<div class=imagecaption>(.*?)</div>", block, re.DOTALL | re.IGNORECASE)
            if caption_m:
                caption = clean_text(caption_m.group(1))

            # Subcaption
            subcaption = ""
            subcap_m = re.search(r"<div class=imagesubcaption[^>]*>(.*?)</div>", block, re.DOTALL | re.IGNORECASE)
            if subcap_m:
                subcaption = clean_text(subcap_m.group(1))

            is_plaque = any(k in caption.lower() or k in subcaption.lower() for k in ["plaque", "inscription", "close-up", "marker", "face"])

            photos.append({
                "photoId": pid,
                "url": full_url,
                "hiResUrl": hi_res_url,
                "caption": caption or m.get("title", ""),
                "description": subcaption,
                "credit": credit,
                "isPlaquePhoto": is_plaque
            })

        if photos:
            m["photos"] = photos
            updated_count += 1
            if idx % 10 == 0 or idx == len(markers):
                print(f"  [{idx}/{len(markers)}] Updated #{mid} ({m['title']}): {len(photos)} photos")

        time.sleep(0.4)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(markers, f, indent=2, ensure_ascii=False)

    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(markers, indent=2, ensure_ascii=False)};
"""
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"\nCompleted photo URL verification for all {updated_count} markers!")

if __name__ == "__main__":
    fix_all_photos()
