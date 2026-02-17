#!/usr/bin/env python3
"""
Fetch GoingToCamp availability using camply. Outputs JSON for alpineos scrape script.

Usage:
  python scripts/camply_availability.py [--rec-area 12] [--limit 10]

Output (JSON to stdout):
  [{ "rec_area_id": 12, "facility_id": 123, "facility_name": "Alice Lake",
     "availability": { "2025-03-01": 5, "2025-03-02": 3, ... } }, ...]
"""

import argparse
import json
import sys
from datetime import date, timedelta

# Camply rec_area_id: 3=Washington, 12=BC Parks, 14=Parks Canada
REC_AREAS = {
    3: "wa_state_parks",
    12: "bcparks",
    14: "parks_canada",
}


def _fetch_nested(obj, *keys):
    for k in keys:
        try:
            obj = obj[k]
            if obj is None:
                return None
        except (KeyError, TypeError, IndexError):
            return None
    return obj


def fetch_availability(rec_area_id: int, limit: int = 0) -> list[dict]:
    """Use camply's GoingToCamp session to fetch availability. BC Parks API has custom structure."""
    from camply.providers import GoingToCamp

    CAMP_SITE = -2147483648
    OVERFLOW_SITE = -2147483647
    GROUP_SITE = -2147483643

    gtc = GoingToCamp()
    facilities_raw = gtc._api_request(rec_area_id, "LIST_CAMPGROUNDS")
    maps_raw = gtc._api_request(rec_area_id, "CAMP_DETAILS")

    # resourceLocationId -> childMapId from mapLinks
    map_by_location = {}
    for m in maps_raw if isinstance(maps_raw, list) else []:
        for link in m.get("mapLinks") or []:
            loc_id = link.get("resourceLocationId")
            child_id = link.get("childMapId")
            if loc_id is not None and child_id is not None:
                map_by_location[loc_id] = child_id

    facilities_list = facilities_raw if isinstance(facilities_raw, list) else []
    campgrounds = []
    for f in facilities_list:
        cats = f.get("resourceCategoryIds") or []
        if not any(c in (CAMP_SITE, OVERFLOW_SITE, GROUP_SITE) for c in cats):
            continue
        loc_id = f.get("resourceLocationId")
        if loc_id not in map_by_location:
            continue
        name = _fetch_nested(f, "localizedValues", 0, "fullName") or f.get("resourceLocationName") or "Unknown"
        campgrounds.append({"facility_id": loc_id, "facility_name": name, "map_id": map_by_location[loc_id]})

    if limit > 0:
        campgrounds = campgrounds[:limit]

    results = []
    today = date.today()
    end_date = today + timedelta(days=89)

    for camp in campgrounds:
        try:
            search_filter = {
                "mapId": camp["map_id"],
                "resourceLocationId": camp["facility_id"],
                "bookingCategoryId": 0,
                "startDate": today.isoformat(),
                "endDate": end_date.isoformat(),
                "isReserving": True,
                "getDailyAvailability": True,  # Per-date breakdown (required for BC Parks)
                "partySize": 1,
                "numEquipment": 1,
                "equipmentCategoryId": -32768,  # NON_GROUP_EQUIPMENT
                "filterData": [],
            }
            data = gtc._api_request(rec_area_id, "MAPDATA", search_filter)
        except Exception as e:
            print(f"# Error {camp['facility_name']}: {e}", file=sys.stderr)
            continue

        def parse_ra_to_by_date(ra):
            """Parse resourceAvailabilities into by_date when getDailyAvailability=True.
            Structure: site_id -> [{availability: 0|1|2}, ...] (90 elements, one per day).
            0=Available, 1=Reserved, 2=Not reservable.
            Returns: date -> N (spots available), 0 (booked), or -1 (closed)."""
            by_date = {}
            if not ra:
                return by_date
            sites = [
                s for s in ra.values()
                if isinstance(s, list) and len(s) >= 90
            ]
            if not sites:
                return by_date
            for i in range(90):
                d = (today + timedelta(days=i)).isoformat()
                avail_count = sum(
                    1 for s in sites
                    if isinstance(s[i], dict) and s[i].get("availability") == 0
                )
                closed_count = sum(
                    1 for s in sites
                    if isinstance(s[i], dict) and s[i].get("availability") == 2
                )
                if avail_count > 0:
                    by_date[d] = avail_count
                elif closed_count == len(sites):
                    by_date[d] = -1  # closed
                else:
                    by_date[d] = 0  # booked

            return by_date

        def merge_by_date(acc, link):
            for d, val in link.items():
                if d not in acc:
                    acc[d] = val
                elif acc[d] == -1 and val > 0:
                    acc[d] = val  # some areas open
                elif val == -1 and acc[d] <= 0:
                    acc[d] = -1  # both closed/booked -> closed takes precedence
                elif val > 0 and acc[d] >= 0:
                    acc[d] = (acc[d] if acc[d] > 0 else 0) + val  # sum spots

        by_date = parse_ra_to_by_date(data.get("resourceAvailabilities") or {})
        for link_map_id in list((data.get("mapLinkAvailabilities") or {}).keys()):
            try:
                sf2 = dict(search_filter, mapId=int(link_map_id))
                data2 = gtc._api_request(rec_area_id, "MAPDATA", sf2)
                link_by_date = parse_ra_to_by_date(data2.get("resourceAvailabilities") or {})
                if not by_date and link_by_date:
                    by_date = link_by_date
                elif link_by_date:
                    merge_by_date(by_date, link_by_date)
            except Exception:
                pass

        results.append({
            "rec_area_id": rec_area_id,
            "provider": REC_AREAS.get(rec_area_id, "unknown"),
            "facility_id": camp["facility_id"],
            "facility_name": camp["facility_name"],
            "map_id": camp["map_id"],
            "availability": by_date,
        })

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rec-area", type=int, choices=[3, 12, 14], help="Single rec area")
    parser.add_argument("--limit", type=int, default=0, help="Limit campgrounds per area")
    args = parser.parse_args()

    areas = [args.rec_area] if args.rec_area else [12, 14, 3]
    all_results = []

    for rec_area_id in areas:
        try:
            results = fetch_availability(rec_area_id, args.limit)
            all_results.extend(results)
        except Exception as e:
            import traceback
            print(f"# Error rec_area {rec_area_id}: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

    print(json.dumps(all_results, indent=0))


if __name__ == "__main__":
    main()
