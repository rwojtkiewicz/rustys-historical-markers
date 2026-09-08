import os
import json
import urllib.request
import time
import re

JSON_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
BASE_ASSETS_DIR = "public/assets/markers/missouri/greater-kansas-city/platte-county"

def sanitize_folder_name(name):
    clean = re.sub(r"[^\w\s-]", "", name).strip()
    return re.sub(r"[-\s]+", "-", clean).lower()

def download_marker_photos():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        markers = json.load(f)

    os.makedirs(BASE_ASSETS_DIR, exist_ok=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.hmdb.org/",
    }

    total_downloaded = 0
    total_photos = sum(len(m.get("photos", [])) for m in markers)
    print(f"Starting download of {total_photos} photos into '{BASE_ASSETS_DIR}'...")

    for m_idx, m in enumerate(markers, 1):
        mid = str(m["hmdbId"])
        title_slug = sanitize_folder_name(m.get("title", f"marker-{mid}"))[:35]
        marker_folder = os.path.join(BASE_ASSETS_DIR, f"{mid}-{title_slug}")
        os.makedirs(marker_folder, exist_ok=True)

        photos = m.get("photos", [])
        for p_idx, p in enumerate(photos, 1):
            pid = p.get("photoId", str(p_idx))
            url = p.get("url")
            if not url:
                continue

            file_ext = ".jpg"
            dest_file = os.path.join(marker_folder, f"photo_{pid}{file_ext}")

            if os.path.exists(dest_file) and os.path.getsize(dest_file) > 1000:
                p["localPath"] = f"/assets/markers/missouri/greater-kansas-city/platte-county/{mid}-{title_slug}/photo_{pid}{file_ext}"
                continue

            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = resp.read()
                    with open(dest_file, "wb") as out_f:
                        out_f.write(data)
                p["localPath"] = f"/assets/markers/missouri/greater-kansas-city/platte-county/{mid}-{title_slug}/photo_{pid}{file_ext}"
                total_downloaded += 1
                if total_downloaded % 10 == 0 or total_downloaded == total_photos:
                    print(f"  Downloaded [{total_downloaded}/{total_photos}] photos...")
                time.sleep(0.1)
            except Exception as e:
                print(f"  Failed photo {pid} from {url}: {e}")

    # Save updated JSON with localPath
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(markers, f, indent=2, ensure_ascii=False)

    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(markers, indent=2, ensure_ascii=False)};
"""
    with open("src/data/markers/missouri/greater-kansas-city/platte-county.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"\nAll photo downloads complete! {total_downloaded} new photos downloaded.")

if __name__ == "__main__":
    download_marker_photos()
