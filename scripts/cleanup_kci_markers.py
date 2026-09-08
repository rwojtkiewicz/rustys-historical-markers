import json
import os
import shutil

JSON_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
TS_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"
BASE_DIR = "public/assets/markers/missouri/greater-kansas-city/platte-county"

def cleanup():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        markers = json.load(f)

    print(f"Total markers before cleanup: {len(markers)}")

    # Specific KCI marker IDs: 43178 through 43253 and related airport panels
    kci_ids = set()
    for m in markers:
        mid = int(m["hmdbId"])
        erected = str(m.get("erectedBy", ""))
        # 43178 to 43253, and 149313, 196085, 196103 (KCI airport exhibits)
        if (43178 <= mid <= 43253) or mid in [149313, 196085, 196103] or "Kansas City International Airport" in erected:
            kci_ids.add(mid)

    filtered_markers = []
    removed_markers = []

    for m in markers:
        mid = int(m["hmdbId"])
        if mid in kci_ids:
            removed_markers.append(m)
        else:
            filtered_markers.append(m)

    print(f"\nRemoved {len(removed_markers)} airport/non-germane markers:")
    for m in removed_markers:
        print(f"  - #{m['hmdbId']}: {m['title']}")

    print(f"\nRetained {len(filtered_markers)} authentic Platte County markers:")
    for m in filtered_markers:
        print(f"  + #{m['hmdbId']}: {m['title']} ({m.get('city', 'Platte County')})")

    # Clean up corresponding directories in public/assets
    deleted_folders_count = 0
    if os.path.exists(BASE_DIR):
        for entry in os.listdir(BASE_DIR):
            entry_path = os.path.join(BASE_DIR, entry)
            if os.path.isdir(entry_path):
                # check if folder starts with any of the kci_ids
                folder_id_part = entry.split("-")[0]
                if folder_id_part.isdigit() and int(folder_id_part) in kci_ids:
                    shutil.rmtree(entry_path)
                    deleted_folders_count += 1
                    print(f"Deleted folder: {entry}")

    print(f"\nDeleted {deleted_folders_count} image folders from public assets.")

    # Save cleaned JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(filtered_markers, f, indent=2, ensure_ascii=False)

    # Save cleaned TypeScript
    ts_content = f"""// Platte County, Missouri - Historical Marker Dataset
// Automatically extracted and normalized from HMdb.org
import {{ HistoricalMarker }} from '../../../../types';

export const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(filtered_markers, indent=2, ensure_ascii=False)};
"""
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"Saved cleaned JSON to {JSON_PATH}")
    print(f"Saved cleaned TypeScript to {TS_PATH}")

if __name__ == "__main__":
    cleanup()
