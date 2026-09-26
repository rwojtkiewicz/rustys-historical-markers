#!/usr/bin/env python3
import csv
import json
import os
import re

SOURCE_CSV = "/Users/rwojtkiewicz/Rusty's Historical Markers Project/csv_imports/Greater KC Region/Clay County MO.csv"
DEST_CSV = "src/data/markers/missouri/greater-kansas-city/clay_county.csv"
DEST_JSON = "src/data/markers/missouri/greater-kansas-city/clay-county.json"
DEST_TS = "src/data/markers/missouri/greater-kansas-city/clay-county.ts"

def clean_text(raw):
    if not raw:
        return ""
    t = re.sub(r"<[^>]+>", " ", raw)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def map_category(title, subtitle, addl_subtitle, location):
    combined = f"{title} {subtitle or ''} {addl_subtitle or ''} {location or ''}".lower()
    
    if any(w in combined for w in ["civil war", "confederate", "union", "trenches", "battle of liberty", "blue mills", "arsenal", "pow camp"]):
        return "Civil War"
    elif any(w in combined for w in ["jesse james", "daylight bank hold up", "outlaw", "bank hold up"]):
        return "Outlaw & Lore"
    elif any(w in combined for w in ["african american", "juneteenth", "slave", "garrison school", "black pioneers", "reconstruction"]):
        return "Civil Rights"
    elif any(w in combined for w in ["airport", "aviation", "lou e. holland", "wheeler downtown", "interurban", "railroad", "railway", "caboose"]):
        return "Aviation & Transit"
    elif any(w in combined for w in ["lewis and clark", "old western border", "pioneer families", "old pike road", "landing"]):
        return "Pioneer & Trails"
    elif any(w in combined for w in ["alexander doniphan", "doniphan", "col. john thornton", "lucy a. ward", "john dougherty", "matthew david mason", "howard porter", "ruth ewing", "william lawrence smith", "ruth powell moore"]):
        return "Notable Figures"
    elif any(w in combined for w in ["courthouse", "jail", "mormon jail", "hall of waters", "watkins mill", "atkins-johnson", "bell-pharis", "duckworth", "woodneath", "lightburne hall", "riverview", "museum", "church", "depot", "lodge no. 49", "main street", "kansas street", "boggess"]):
        return "Architecture"
    elif any(w in combined for w in ["statue of liberty", "memorial", "roll of honor", "remembrance", "fourth of july", "veterans", "war memorial", "purple heart"]):
        return "Cultural Heritage"
    else:
        return "Cultural Heritage"

def estimate_era(year_erected, title, subtitle):
    combined = f"{title} {subtitle or ''}".lower()
    if year_erected and year_erected.isdigit():
        return year_erected
    
    # Check for dates in title/subtitle
    match_year = re.search(r"\b(1[789]\d\d|20\d\d)\b", combined)
    if match_year:
        return match_year.group(1)
    
    if any(w in combined for w in ["civil war", "arsenal", "doniphan", "1861", "1862", "1863", "1864", "1865"]):
        return "1860s"
    if any(w in combined for w in ["lewis and clark", "1804", "1806"]):
        return "1804-1806"
    if any(w in combined for w in ["jesse james", "bank hold up", "1866"]):
        return "1866"
    return "Historic"

def build_plaque_text(title, subtitle, addl_subtitle, location, erected_by, city, year_erected):
    parts = []
    headline = title
    if subtitle:
        headline += f" — {subtitle}"
    if addl_subtitle:
        headline += f" ({addl_subtitle})"
    parts.append(headline + ".")
    
    if city and city.lower() != "kansas city":
        parts.append(f"Located in historic {city}, Clay County, Missouri.")
    else:
        parts.append("Located in Clay County, Missouri.")
        
    if location:
        loc_clean = clean_text(location)
        if loc_clean:
            parts.append(loc_clean)
            
    if erected_by:
        eb_clean = clean_text(erected_by)
        if eb_clean:
            parts.append(f"Erected by {eb_clean}" + (f" in {year_erected}." if year_erected else "."))
            
    return " ".join(parts)

def build_route_assignments(marker_id, city, title, category):
    routes = ["route-clay-all-county", "route-greater-kc-northland"]
    
    title_lower = title.lower()
    city_lower = (city or "").lower()
    
    # Liberty Square & Historic Area
    if city_lower == "liberty" or "liberty" in title_lower:
        routes.append("route-clay-liberty-historic")
        
    # Kearney / Watkins Mill / Jesse James / Smithville
    if city_lower in ["kearney", "smithville"] or any(w in title_lower for w in ["jesse james", "watkins", "smithville"]):
        routes.append("route-clay-kearney-smithville")
        
    # NKC & Aviation
    if city_lower in ["north kansas city", "gladstone"] or any(w in title_lower for w in ["airport", "aviation", "lou e. holland", "wheeler", "burlington", "curran park"]):
        routes.append("route-clay-nkc-aviation")
        
    return list(dict.fromkeys(routes))

def main():
    print(f"Reading Clay County CSV from: {SOURCE_CSV}")
    
    os.makedirs(os.path.dirname(DEST_CSV), exist_ok=True)
    
    with open(SOURCE_CSV, "r", encoding="utf-8-sig", errors="replace") as f:
        raw_lines = [l for l in f if l.strip()]
        
    # Copy raw CSV to dest
    with open(DEST_CSV, "w", encoding="utf-8") as f:
        f.writelines(raw_lines)
    print(f"Copied CSV to {DEST_CSV}")
    
    if raw_lines[0].strip().lower() == "table 1":
        raw_lines = raw_lines[1:]
        
    reader = csv.DictReader(raw_lines)
    markers = []
    
    for row in reader:
        mid = (row.get("MarkerID") or "").strip()
        if not mid:
            continue
            
        title = (row.get("Title") or "").strip()
        subtitle = (row.get("Subtitle") or "").strip() or None
        addl_sub = (row.get("Add'l Subtitle") or "").strip() or None
        year_erected_str = (row.get("Year Erected") or "").strip()
        year_erected = int(year_erected_str) if year_erected_str.isdigit() else None
        erected_by = (row.get("Erected By") or "").strip() or None
        lat_str = (row.get("Latitude (minus=S)") or "").strip()
        lng_str = (row.get("Longitude (minus=W)") or "").strip()
        street = (row.get("Street Address") or "").strip() or None
        city = (row.get("City or Town") or "").strip() or "Liberty"
        section = (row.get("Section or Quarter") or "").strip() or None
        county = (row.get("County or Parish") or "").strip() or "Clay County"
        state = (row.get("State or Prov.") or "").strip() or "MO"
        if state.lower() == "missouri":
            state = "MO"
        zip_code = (row.get("Zip or Postal Code") or "").strip() or None
        location = (row.get("Location") or "").strip()
        missing_str = (row.get("Missing") or "").strip()
        is_missing = "missing" in missing_str.lower() or "missing" in location.lower()
        hmdb_link = (row.get("Link") or f"https://www.hmdb.org/m.asp?m={mid}").strip()
        
        try:
            lat = float(lat_str)
            lng = float(lng_str)
        except ValueError:
            print(f"Skipping {mid} - invalid coords ({lat_str}, {lng_str})")
            continue
            
        category = map_category(title, subtitle, addl_sub, location)
        era = estimate_era(year_erected_str, title, subtitle)
        plaque_text = build_plaque_text(title, subtitle, addl_sub, location, erected_by, city, year_erected)
        routes = build_route_assignments(mid, city, title, category)
        
        # Photo placeholder
        photo_caption = f"Historical Marker: {title}"
        if subtitle:
            photo_caption += f" - {subtitle}"
            
        photos = [
            {
                "url": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
                "caption": photo_caption,
                "credit": "HMdb.org contributing photographers & correspondents",
                "isPlaquePhoto": False
            }
        ]
        
        marker_obj = {
            "id": f"marker-clay-{mid}",
            "title": title,
            "subtitle": subtitle,
            "plaqueText": plaque_text,
            "category": category,
            "era": era,
            "lat": lat,
            "lng": lng,
            "locationName": street or clean_text(location) or f"{city}, MO",
            "city": city,
            "county": county,
            "state": state,
            "yearErected": year_erected,
            "erectedBy": erected_by,
            "markerNumber": f"HMdb-{mid}",
            "missing": is_missing,
            "hmdbId": int(mid) if mid.isdigit() else None,
            "hmdbUrl": hmdb_link,
            "submissionCredits": "Documented on The Historical Marker Database (HMdb.org) by volunteer correspondents.",
            "routeIds": routes,
            "photos": photos,
            "historicalContext": f"Official Clay County historical marker documented in HMdb (#{mid}) in {city}, Missouri."
        }
        
        markers.append(marker_obj)
        
    print(f"Successfully processed {len(markers)} Clay County markers.")
    
    # Save JSON
    with open(DEST_JSON, "w", encoding="utf-8") as f:
        json.dump(markers, f, indent=2, ensure_ascii=False)
    print(f"Saved {DEST_JSON}")
    
    # Save TS
    ts_content = f"""// Clay County, Missouri - Historical Marker Dataset
// Sourced from HMdb.org Greater KC Region
import {{ HistoricalMarker }} from '../../../../types';

export const CLAY_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(markers, indent=2, ensure_ascii=False)};
"""
    with open(DEST_TS, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Saved {DEST_TS}")

if __name__ == "__main__":
    main()
