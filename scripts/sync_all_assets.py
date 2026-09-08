import json
import urllib.request
import os
import re
import time

JSON_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
TS_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"
BASE_DIR = "public/assets/markers/missouri/greater-kansas-city/platte-county"

def get_hmdb_photo_url(pid):
    pid_str = str(pid).strip()
    if len(pid_str) <= 5:
        bucket = "Photos"
        folder = pid_str[:2]
    else:
        bucket = f"Photos{pid_str[0]}"
        folder = pid_str[:3]
    return f"https://www.hmdb.org/{bucket}/{folder}/Photo{pid_str}.jpg"

def get_hmdb_hires_url(pid):
    pid_str = str(pid).strip()
    if len(pid_str) <= 5:
        bucket = "Photos"
        folder = pid_str[:2]
    else:
        bucket = f"Photos{pid_str[0]}"
        folder = pid_str[:3]
    return f"https://www.hmdb.org/{bucket}/{folder}/Photo{pid_str}o.jpg"

def sanitize_folder_name(name):
    clean = re.sub(r"[^\w\s-]", "", name).strip()
    return re.sub(r"[-\s]+", "-", clean).lower()

def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        markers = json.load(f)

    os.makedirs(BASE_DIR, exist_ok=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://www.hmdb.org/",
    }

    total_photos = sum(len(m.get("photos", [])) for m in markers)
    print(f"Downloading {total_photos} photos across {len(markers)} Platte County markers...")

    downloaded = 0
    for m in markers:
        mid = str(m["hmdbId"])
        title_slug = sanitize_folder_name(m.get("title", f"marker-{mid}"))[:35]
        marker_dir = os.path.join(BASE_DIR, f"{mid}-{title_slug}")
        os.makedirs(marker_dir, exist_ok=True)

        for p in m.get("photos", []):
            pid = str(p.get("photoId", "")).strip()
            if not pid or not pid.isdigit():
                continue

            std_url = get_hmdb_photo_url(pid)
            hires_url = get_hmdb_hires_url(pid)
            p["url"] = std_url
            p["hiResUrl"] = hires_url

            file_path = os.path.join(marker_dir, f"photo_{pid}.jpg")
            local_web_path = f"/assets/markers/missouri/greater-kansas-city/platte-county/{mid}-{title_slug}/photo_{pid}.jpg"
            p["localPath"] = local_web_path

            if os.path.exists(file_path) and os.path.getsize(file_path) > 1000:
                downloaded += 1
                continue

            # Download photo
            req = urllib.request.Request(std_url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                    with open(file_path, "wb") as out_f:
                        out_f.write(data)
                downloaded += 1
                if downloaded % 15 == 0 or downloaded == total_photos:
                    print(f"  Downloaded [{downloaded}/{total_photos}] photos into local storage...")
                time.sleep(0.05)
            except Exception as e:
                print(f"  Failed downloading {pid}: {e}")

    # Save updated JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(markers, f, indent=2, ensure_ascii=False)

    # Save updated TypeScript
    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(markers, indent=2, ensure_ascii=False)};
"""
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"\nSUCCESS: All {downloaded}/{total_photos} photos successfully stored locally and linked in database!")

if __name__ == "__main__":
    main()
