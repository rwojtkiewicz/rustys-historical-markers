#!/usr/bin/env python3
import csv
import json
import os
import re

PLATTE_CSV = "src/data/markers/missouri/greater-kansas-city/platte_county.csv"
CLAY_CSV = "src/data/markers/missouri/greater-kansas-city/clay_county.csv"

PLATTE_JSON = "src/data/markers/missouri/greater-kansas-city/platte-county.json"
PLATTE_TS = "src/data/markers/missouri/greater-kansas-city/platte-county.ts"

CLAY_JSON = "src/data/markers/missouri/greater-kansas-city/clay-county.json"
CLAY_TS = "src/data/markers/missouri/greater-kansas-city/clay-county.ts"

OUTPUT_TS = "src/data/markersData.ts"

def clean_text(raw):
    if not raw:
        return ""
    t = re.sub(r"<[^>]+>", " ", raw)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def map_category(title, subtitle, addl_subtitle, location):
    combined = f"{title} {subtitle or ''} {addl_subtitle or ''} {location or ''}".lower()
    
    if any(w in combined for w in ["civil war", "confederate", "union", "trenches", "battle of liberty", "blue mills", "arsenal", "pow camp", "paw paw"]):
        return "Civil War"
    elif any(w in combined for w in ["jesse james", "daylight bank hold up", "outlaw", "bank hold up", "red crown", "bonnie and clyde"]):
        return "Outlaw & Lore"
    elif any(w in combined for w in ["african american", "juneteenth", "slave", "garrison school", "black pioneers", "reconstruction", "dinah robinson"]):
        return "Civil Rights"
    elif any(w in combined for w in ["airport", "aviation", "lou e. holland", "wheeler downtown", "interurban", "railroad", "railway", "caboose", "kci"]):
        return "Aviation & Transit"
    elif any(w in combined for w in ["lewis and clark", "old western border", "pioneer families", "old pike road", "landing", "pioneer", "trails"]):
        return "Pioneer & Trails"
    elif any(w in combined for w in ["alexander doniphan", "doniphan", "col. john thornton", "lucy a. ward", "john dougherty", "matthew david mason", "howard porter", "ruth ewing", "william lawrence smith", "ruth powell moore", "guy b. park", "dillingham"]):
        return "Notable Figures"
    elif any(w in combined for w in ["courthouse", "jail", "mormon jail", "hall of waters", "watkins mill", "atkins-johnson", "bell-pharis", "duckworth", "woodneath", "lightburne hall", "riverview", "museum", "church", "depot", "lodge no. 49", "main street", "kansas street", "boggess", "building", "hotel", "house", "benjamin wood", "st. george"]):
        return "Architecture"
    elif any(w in combined for w in ["statue of liberty", "memorial", "roll of honor", "remembrance", "fourth of july", "veterans", "war memorial", "purple heart", "cemetery", "grave", "laurel hill"]):
        return "Cultural Heritage"
    else:
        return "Cultural Heritage"

def estimate_era(year_erected, title, subtitle):
    combined = f"{title} {subtitle or ''}".lower()
    if year_erected and str(year_erected).isdigit():
        return str(year_erected)
    
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

def build_plaque_text(title, subtitle, addl_subtitle, location, erected_by, city, county, year_erected):
    parts = []
    headline = title
    if subtitle:
        headline += f" — {subtitle}"
    if addl_subtitle:
        headline += f" ({addl_subtitle})"
    parts.append(headline + ".")
    
    if city and city.lower() not in ["kansas city", "unincorporated"]:
        parts.append(f"Located in historic {city}, {county}, Missouri.")
    else:
        parts.append(f"Located in {county}, Missouri.")
        
    if location:
        loc_clean = clean_text(location)
        if loc_clean:
            parts.append(loc_clean)
            
    if erected_by:
        eb_clean = clean_text(erected_by)
        if eb_clean:
            parts.append(f"Erected by {eb_clean}" + (f" in {year_erected}." if year_erected else "."))
            
    return " ".join(parts)

def parse_county_csv(csv_path, county_name, county_prefix):
    with open(csv_path, "r", encoding="utf-8-sig", errors="replace") as f:
        raw_lines = [l for l in f if l.strip()]
        
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
        city = (row.get("City or Town") or "").strip() or ("Liberty" if county_prefix == "clay" else "Platte City")
        county = (row.get("County or Parish") or "").strip() or county_name
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
        plaque_text = build_plaque_text(title, subtitle, addl_sub, location, erected_by, city, county, year_erected)
        
        # Route assignments
        route_ids = [f"route-{county_prefix}-all-county", "route-greater-kc-northland"]
        
        t_low = title.lower()
        c_low = (city or "").lower()
        
        if county_prefix == "platte":
            if c_low == "weston" or "weston" in t_low or "iatan" in t_low or "cow island" in t_low:
                route_ids.append("route-platte-weston-river")
            if c_low in ["platte city", "camden point", "ferrelview"] or "airport" in t_low or "kci" in t_low or "red crown" in t_low:
                route_ids.append("route-platte-city-kci")
            if c_low in ["parkville", "riverside", "farley"] or "renner" in t_low or "paw paw" in t_low:
                route_ids.append("route-platte-south-parkville")
        elif county_prefix == "clay":
            if c_low == "liberty" or "liberty" in t_low:
                route_ids.append("route-clay-liberty-historic")
            if c_low in ["kearney", "smithville"] or any(w in t_low for w in ["jesse james", "watkins", "smithville"]):
                route_ids.append("route-clay-kearney-smithville")
            if c_low in ["north kansas city", "gladstone"] or any(w in t_low for w in ["airport", "aviation", "lou e. holland", "wheeler", "burlington"]):
                route_ids.append("route-clay-nkc-aviation")
                
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
            "id": f"marker-{county_prefix}-{mid}",
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
            "routeIds": list(dict.fromkeys(route_ids)),
            "photos": photos,
            "historicalContext": f"Official {county} historical marker documented in HMdb (#{mid}) in {city}, Missouri."
        }
        markers.append(marker_obj)
        
    return markers

def main():
    print("Parsing Platte County markers...")
    platte_markers = parse_county_csv(PLATTE_CSV, "Platte County", "platte")
    
    # Add Muehlbach custom marker to Platte County
    muehlbach_marker = {
        "id": "marker-platte-custom-muehlbach-legacy",
        "title": "The Muehlbach Legacy",
        "subtitle": "Parkville Commons, MO Landmark",
        "plaqueText": "This marker is a tribute to the Muehlbach family of grocers. In 1874, George Muehlbach borrowed $300 from his mother to use as a payment on a grocery store that would become the longest operating father-to-son grocery business ownership in America. Four generations of Muehlbachs served this community until Frank Muehlbach retired, bringing to an end the record ownership run of 130 years. This site marks the final chapter to the oldest continuous father-to-son grocery business in America. The Parkville site of the Muehlbach grocery store was opened in 1968 and closed in 2003. With this marker, the hundreds of thousands of people served by the Muehlbachs express their eternal gratitude to the Muehlbach family of grocers.",
        "category": "Cultural Heritage",
        "era": "1874-2003",
        "lat": 39.209562,
        "lng": -94.684622,
        "locationName": "6325 Lewis St (Parkville Commons)",
        "city": "Parkville",
        "county": "Platte County",
        "state": "MO",
        "yearErected": 2003,
        "erectedBy": "Friends and Patrons of the Muehlbach Family of Grocers",
        "markerNumber": "CUSTOM-PARKVILLE-01",
        "missing": False,
        "hmdbId": None,
        "hmdbUrl": None,
        "submissionCredits": "Documented and contributed by local history contributors (Rusty's Historical Markers Project).",
        "routeIds": [
            "route-platte-all-county",
            "route-platte-south-parkville",
            "route-greater-kc-northland"
        ],
        "photos": [
            {
                "url": "/assets/markers/missouri/greater-kansas-city/platte-county/custom-muehlbach-legacy/muehlbach-marker.jpg",
                "localPath": "/assets/markers/missouri/greater-kansas-city/platte-county/custom-muehlbach-legacy/muehlbach-marker.jpg",
                "caption": "The Muehlbach Legacy Marker - Parkville Commons",
                "credit": "Rusty's Historical Markers Project",
                "isPlaquePhoto": True
            }
        ],
        "historicalContext": "Commemorating 130 continuous years of father-to-son grocery ownership (1874–2003) by the Muehlbach family in the Kansas City and Parkville region."
    }
    platte_markers.append(muehlbach_marker)
    print(f"Platte markers count: {len(platte_markers)}")
    
    print("Parsing Clay County markers...")
    clay_markers = parse_county_csv(CLAY_CSV, "Clay County", "clay")
    print(f"Clay markers count: {len(clay_markers)}")
    
    # Save individual county JSON & TS files
    with open(PLATTE_JSON, "w", encoding="utf-8") as f:
        json.dump(platte_markers, f, indent=2, ensure_ascii=False)
    with open(PLATTE_TS, "w", encoding="utf-8") as f:
        f.write(f"import {{ HistoricalMarker }} from '../../../../types';\n\nexport const PLATTE_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(platte_markers, indent=2, ensure_ascii=False)};\n")
        
    with open(CLAY_JSON, "w", encoding="utf-8") as f:
        json.dump(clay_markers, f, indent=2, ensure_ascii=False)
    with open(CLAY_TS, "w", encoding="utf-8") as f:
        f.write(f"import {{ HistoricalMarker }} from '../../../../types';\n\nexport const CLAY_COUNTY_MARKERS: HistoricalMarker[] = {json.dumps(clay_markers, indent=2, ensure_ascii=False)};\n")
        
    # Combine all markers
    all_markers = platte_markers + clay_markers
    print(f"Total Combined Markers: {len(all_markers)}")
    
    routes = [
        # 1. Greater KC Northland Grand Tour
        {
            "id": "route-greater-kc-northland",
            "name": "Greater KC Northland Heritage Grand Tour",
            "subtitle": f"Platte & Clay Counties Combined ({len(all_markers)} Markers)",
            "description": f"Comprehensive GPS audio tour scanning all {len(all_markers)} historical markers across both Platte and Clay Counties — from Weston and Parkville to Liberty, Kearney, and North Kansas City.",
            "region": "Greater KC Northland (Platte & Clay Counties)",
            "distanceMiles": 95.0,
            "approxDriveTimeHours": 3.0,
            "coverPhoto": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Platte City Courthouse",
                "lat": 39.37024,
                "lng": -94.78372
            },
            "endPoint": {
                "name": "Liberty Courthouse Square",
                "lat": 39.24648,
                "lng": -94.42019
            },
            "waypoints": [
                {"lat": 39.40922, "lng": -94.90328, "label": "Weston Historic River Port"},
                {"lat": 39.18909, "lng": -94.68293, "label": "Parkville Riverfront"},
                {"lat": 39.12035, "lng": -94.59028, "label": "Wheeler Downtown Airport"},
                {"lat": 39.24648, "lng": -94.42019, "label": "Liberty Courthouse & Historic Square"},
                {"lat": 39.39294, "lng": -94.32146, "label": "Jesse James Birthplace, Kearney"},
                {"lat": 39.38700, "lng": -94.57100, "label": "Smithville Heritage Memorials"}
            ],
            "bounds": {
                "north": 39.58,
                "south": 39.10,
                "east": -94.20,
                "west": -95.05
            },
            "markerIds": [m["id"] for m in all_markers]
        },
        
        # 2. All Platte County Free Roam
        {
            "id": "route-platte-all-county",
            "name": "All Platte County Historical Markers (Free Roam)",
            "subtitle": f"Comprehensive County-Wide GPS Tour ({len(platte_markers)} Markers)",
            "description": f"Continuous GPS scan of all {len(platte_markers)} historical markers across Platte County, Missouri including Weston, Platte City, KCI Airport, Ferrelview, Parkville, and Camden Point.",
            "region": "Platte County, MO (County-Wide)",
            "distanceMiles": 55.0,
            "approxDriveTimeHours": 1.8,
            "coverPhoto": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Platte City Courthouse",
                "lat": 39.37024,
                "lng": -94.78372
            },
            "endPoint": {
                "name": "Historic Weston Main St",
                "lat": 39.40922,
                "lng": -94.90328
            },
            "waypoints": [
                {"lat": 39.17577, "lng": -94.61508, "label": "Riverside Renner Site"},
                {"lat": 39.18909, "lng": -94.68293, "label": "Parkville Historic District"},
                {"lat": 39.31241, "lng": -94.68267, "label": "Red Crown Tavern Shootout"},
                {"lat": 39.31451, "lng": -94.70108, "label": "KCI Airport History Corridor"},
                {"lat": 39.37024, "lng": -94.78372, "label": "Platte City Main Street"},
                {"lat": 39.45337, "lng": -94.7562, "label": "Camden Point Memorial"},
                {"lat": 39.40922, "lng": -94.90328, "label": "Weston Historic River Town"},
                {"lat": 39.4579, "lng": -94.9696, "label": "Iatan / Cow Island"}
            ],
            "bounds": {
                "north": 39.55,
                "south": 39.15,
                "east": -94.55,
                "west": -95.05
            },
            "markerIds": [m["id"] for m in platte_markers]
        },
        
        # 3. All Clay County Free Roam
        {
            "id": "route-clay-all-county",
            "name": "All Clay County Historical Markers (Free Roam)",
            "subtitle": f"Comprehensive County-Wide GPS Tour ({len(clay_markers)} Markers)",
            "description": f"Continuous GPS scan of all {len(clay_markers)} historical markers across Clay County, Missouri including Liberty, Kearney, Smithville, North Kansas City, Gladstone, and Excelsior Springs.",
            "region": "Clay County, MO (County-Wide)",
            "distanceMiles": 60.0,
            "approxDriveTimeHours": 2.0,
            "coverPhoto": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Liberty Courthouse Square",
                "lat": 39.24648,
                "lng": -94.42019
            },
            "endPoint": {
                "name": "Jesse James Farm, Kearney",
                "lat": 39.39294,
                "lng": -94.32146
            },
            "waypoints": [
                {"lat": 39.12035, "lng": -94.59028, "label": "Wheeler Downtown Airport"},
                {"lat": 39.12651, "lng": -94.58025, "label": "North Kansas City Burlington Corridor"},
                {"lat": 39.21550, "lng": -94.56100, "label": "Gladstone Atkins-Johnson Farm"},
                {"lat": 39.24648, "lng": -94.42019, "label": "Liberty Historic Downtown Square"},
                {"lat": 39.24864, "lng": -94.41325, "label": "William Jewell College & Civil War Trenches"},
                {"lat": 39.39294, "lng": -94.32146, "label": "Jesse James Birthplace, Kearney"},
                {"lat": 39.41034, "lng": -94.25990, "label": "Watkins Woolen Mill State Historic Site"},
                {"lat": 39.38700, "lng": -94.57100, "label": "Smithville Heritage Memorials"}
            ],
            "bounds": {
                "north": 39.50,
                "south": 39.10,
                "east": -94.20,
                "west": -94.62
            },
            "markerIds": [m["id"] for m in clay_markers]
        },
        
        # 4. Historic Liberty Square & Civil War Trail
        {
            "id": "route-clay-liberty-historic",
            "name": "Historic Liberty Square & Civil War Trail",
            "subtitle": "Courthouse, 1866 Daylight Bank Hold Up, Doniphan & African American Memorial",
            "description": "Walk and drive through one of Missouri's oldest historic towns: the Clay County Courthouse, the 1866 Jesse James daylight bank robbery site, Alexander Doniphan's home, William Jewell Civil War trenches, Liberty Jail, and the Liberty African American Legacy Memorial.",
            "region": "Central Clay County (Liberty Historic Core)",
            "distanceMiles": 8.5,
            "approxDriveTimeHours": 0.5,
            "coverPhoto": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Clay County Courthouse",
                "lat": 39.24648,
                "lng": -94.42019
            },
            "endPoint": {
                "name": "William Jewell College / Mount Memorial",
                "lat": 39.24864,
                "lng": -94.41325
            },
            "waypoints": [
                {"lat": 39.24648, "lng": -94.42019, "label": "Clay County Courthouse & Square"},
                {"lat": 39.24660, "lng": -94.42100, "label": "Site of First Daylight Bank Hold Up (1866)"},
                {"lat": 39.24680, "lng": -94.42400, "label": "Historic Liberty Mormon Jail"},
                {"lat": 39.24300, "lng": -94.42423, "label": "Fairview Cemetery & Doniphan Memorial"},
                {"lat": 39.24864, "lng": -94.41325, "label": "William Jewell Civil War Memorial & Trenches"}
            ],
            "bounds": {
                "north": 39.27,
                "south": 39.22,
                "east": -94.38,
                "west": -94.46
            },
            "markerIds": [m["id"] for m in clay_markers if "route-clay-liberty-historic" in m.get("routeIds", [])]
        },
        
        # 5. Jesse James Birthplace & Watkins Mill Trail
        {
            "id": "route-clay-kearney-smithville",
            "name": "Jesse James Birthplace, Watkins Mill & Smithville Trail",
            "subtitle": "Kearney Outlaw Lore, 19th Century Textile Mill & Smithville Lake",
            "description": "Experience north Clay County history: visit the Jesse James Birthplace Farm and Kearney resting place, the preserved 1860s Watkins Woolen Mill and plantation, and Smithville railroad and veterans memorials.",
            "region": "North Clay County (Kearney, Smithville, Excelsior)",
            "distanceMiles": 26.0,
            "approxDriveTimeHours": 0.8,
            "coverPhoto": "https://images.unsplash.com/photo-1548625361-18da3a16bf15?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Jesse James Birthplace, Kearney",
                "lat": 39.39294,
                "lng": -94.32146
            },
            "endPoint": {
                "name": "Smithville Heritage Park",
                "lat": 39.38700,
                "lng": -94.57100
            },
            "waypoints": [
                {"lat": 39.39294, "lng": -94.32146, "label": "Jesse James Birthplace & Farm"},
                {"lat": 39.41034, "lng": -94.25990, "label": "Watkins Woolen Mill State Historic Site"},
                {"lat": 39.36200, "lng": -94.36000, "label": "Mount Olivet Cemetery, Kearney"},
                {"lat": 39.38700, "lng": -94.57100, "label": "Smithville Caboose #3 & Veterans Memorials"}
            ],
            "bounds": {
                "north": 39.45,
                "south": 39.32,
                "east": -94.22,
                "west": -94.62
            },
            "markerIds": [m["id"] for m in clay_markers if "route-clay-kearney-smithville" in m.get("routeIds", [])]
        },
        
        # 6. North Kansas City & Aviation Corridor
        {
            "id": "route-clay-nkc-aviation",
            "name": "North Kansas City, Wheeler Airport & River Corridor",
            "subtitle": "Aviation History, Lewis & Clark River Crossing & Burlington Corridor",
            "description": "Discover early Kansas City aviation at Charles B. Wheeler Downtown Airport and Lou E. Holland monument, Lewis and Clark river expeditions, and historic North Kansas City.",
            "region": "South Clay County (NKC / Riverfront / Gladstone)",
            "distanceMiles": 14.0,
            "approxDriveTimeHours": 0.5,
            "coverPhoto": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Charles B. Wheeler Downtown Airport",
                "lat": 39.12035,
                "lng": -94.59028
            },
            "endPoint": {
                "name": "Atkins-Johnson Farm, Gladstone",
                "lat": 39.21550,
                "lng": -94.56100
            },
            "waypoints": [
                {"lat": 39.12035, "lng": -94.59028, "label": "Charles B. Wheeler Downtown Airport"},
                {"lat": 39.12024, "lng": -94.59009, "label": "Lou E. Holland Aviation Monument"},
                {"lat": 39.12651, "lng": -94.58025, "label": "Lewis & Clark Expedition North KC"},
                {"lat": 39.21550, "lng": -94.56100, "label": "Atkins-Johnson Farmhouse, Gladstone"}
            ],
            "bounds": {
                "north": 39.24,
                "south": 39.10,
                "east": -94.52,
                "west": -94.62
            },
            "markerIds": [m["id"] for m in clay_markers if "route-clay-nkc-aviation" in m.get("routeIds", [])]
        },
        
        # 7. Historic Weston & Missouri River Heritage Trail (Platte)
        {
            "id": "route-platte-weston-river",
            "name": "Historic Weston & Missouri River Heritage Trail",
            "subtitle": "Lewis & Clark Trail, Antebellum Weston & Iatan",
            "description": "Explore 19th-century river port history, Lewis and Clark expedition stops at Bear Medison Island and Cow Island, and Weston antebellum architecture.",
            "region": "Northwest Platte County (MO-45 / MO-273 Corridor)",
            "distanceMiles": 18.0,
            "approxDriveTimeHours": 0.6,
            "coverPhoto": "https://images.unsplash.com/photo-1548625361-18da3a16bf15?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Weston Main Street",
                "lat": 39.40922,
                "lng": -94.90328
            },
            "endPoint": {
                "name": "Cow Island, Iatan",
                "lat": 39.4579,
                "lng": -94.9696
            },
            "waypoints": [
                {"lat": 39.40922, "lng": -94.90328, "label": "Weston Main Street"},
                {"lat": 39.41125, "lng": -94.9015, "label": "St. George Hotel"},
                {"lat": 39.41164, "lng": -94.90253, "label": "Weston 1911 Jail"},
                {"lat": 39.4216, "lng": -94.89576, "label": "Weston Veterans Memorial"},
                {"lat": 39.4579, "lng": -94.9696, "label": "Cow Island & Lewis/Clark"}
            ],
            "bounds": {
                "north": 39.48,
                "south": 39.38,
                "east": -94.85,
                "west": -94.98
            },
            "markerIds": [m["id"] for m in platte_markers if "route-platte-weston-river" in m.get("routeIds", [])]
        },
        
        # 8. Platte City, Camden Point & Red Crown Corridor
        {
            "id": "route-platte-city-kci",
            "name": "Platte City, Camden Point & Red Crown Corridor",
            "subtitle": "County Seat, Bonnie & Clyde Shootout & KCI History",
            "description": "Tour through the heart of Platte County: Platte City square, Camden Point veterans, the infamous Red Crown Tourist Cabins shootout site, and KCI Airport aviation landmarks.",
            "region": "Central & East Platte County (I-29 & MO-92 Corridor)",
            "distanceMiles": 24.0,
            "approxDriveTimeHours": 0.8,
            "coverPhoto": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Platte City Main Street",
                "lat": 39.37024,
                "lng": -94.78372
            },
            "endPoint": {
                "name": "Red Crown Tavern Site, Ferrelview",
                "lat": 39.31241,
                "lng": -94.68267
            },
            "waypoints": [
                {"lat": 39.45337, "lng": -94.7562, "label": "Camden Point Memorial"},
                {"lat": 39.37024, "lng": -94.78372, "label": "Platte City Courthouse & Guy Park"},
                {"lat": 39.31241, "lng": -94.68267, "label": "Red Crown Tourist Cabins Site"},
                {"lat": 39.31451, "lng": -94.70108, "label": "KCI Airport History Terminal"}
            ],
            "bounds": {
                "north": 39.48,
                "south": 39.28,
                "east": -94.65,
                "west": -94.82
            },
            "markerIds": [m["id"] for m in platte_markers if "route-platte-city-kci" in m.get("routeIds", [])]
        },
        
        # 9. South Platte & Historic Parkville Trail
        {
            "id": "route-platte-south-parkville",
            "name": "South Platte & Historic Parkville Trail",
            "subtitle": "Farley, Parkville Riverfront & Renner Village Site",
            "description": "Follow the southern Platte County river bluffs through historic Parkville, Paw Paw Civil War militia sites, and the ancient Hopewell Renner Village archaeological site.",
            "region": "South Platte County (MO-9 / Vivion Rd Corridor)",
            "distanceMiles": 16.0,
            "approxDriveTimeHours": 0.5,
            "coverPhoto": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
            "startPoint": {
                "name": "Farley Main Street",
                "lat": 39.28176,
                "lng": -94.83145
            },
            "endPoint": {
                "name": "Renner Village Site, Riverside",
                "lat": 39.17577,
                "lng": -94.61508
            },
            "waypoints": [
                {"lat": 39.28176, "lng": -94.83145, "label": "Farley Dillingham Marker"},
                {"lat": 39.18909, "lng": -94.68293, "label": "Parkville Historic 1st Street"},
                {"lat": 39.209562, "lng": -94.684622, "label": "Parkville Commons (Muehlbach Legacy)"},
                {"lat": 39.18842, "lng": -94.68182, "label": "Paw Paw Fort River Park"},
                {"lat": 39.17577, "lng": -94.61508, "label": "Renner Village Ancient Site"}
            ],
            "bounds": {
                "north": 39.3,
                "south": 39.15,
                "east": -94.6,
                "west": -94.85
            },
            "markerIds": [m["id"] for m in platte_markers if "route-platte-south-parkville" in m.get("routeIds", [])]
        }
    ]
    
    ts_content = f"""import {{ HistoricalMarker, DrivingRoute }} from '../types';

export const HISTORICAL_MARKERS: HistoricalMarker[] = {json.dumps(all_markers, indent=2, ensure_ascii=False)};

export const PRESET_ROUTES: DrivingRoute[] = {json.dumps(routes, indent=2, ensure_ascii=False)};
"""

    with open(OUTPUT_TS, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Successfully generated {OUTPUT_TS} with {len(all_markers)} markers across {len(routes)} preset routes.")

if __name__ == "__main__":
    main()
