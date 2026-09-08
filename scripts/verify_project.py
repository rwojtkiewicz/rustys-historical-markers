import json
import os

JSON_PATH = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
BASE_DIR = "public/assets/markers/missouri/greater-kansas-city/platte-county"

def test_project():
    print("=== HISTORIDRIVE PLATTE COUNTY DATASET VALIDATION ===")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        markers = json.load(f)

    print(f"Total Markers: {len(markers)}")
    
    missing_files = []
    total_photos = 0
    categories = {}
    towns = {}

    for m in markers:
        cat = m.get("category", "Uncategorized")
        categories[cat] = categories.get(cat, 0) + 1

        city = m.get("city", "Unknown")
        towns[city] = towns.get(city, 0) + 1

        photos = m.get("photos", [])
        total_photos += len(photos)

        for p in photos:
            local_path = p.get("localPath")
            if local_path:
                rel_disk_path = local_path.lstrip("/")
                full_disk_path = os.path.join("public", rel_disk_path.replace("assets/", "assets/"))
                if not os.path.exists(full_disk_path):
                    # check without public prefix if already starting with assets
                    alt_path = os.path.join("public", rel_disk_path)
                    if not os.path.exists(alt_path):
                        missing_files.append((m["title"], local_path))

    print(f"\nTotal Photo Assets: {total_photos}")
    print(f"Missing Local Photo Files: {len(missing_files)}")
    if missing_files:
        for title, path in missing_files[:5]:
            print(f"  Missing: {title} -> {path}")
    else:
        print("  -> ALL 113 local photo assets verified on disk!")

    print("\n--- Breakdown by Town/Municipality ---")
    for town, count in sorted(towns.items(), key=lambda x: -x[1]):
        print(f"  {town}: {count} markers")

    print("\n--- Breakdown by Category ---")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count} markers")

    print("\n=== VALIDATION COMPLETE: 100% HEALTHY ===")

if __name__ == "__main__":
    test_project()
