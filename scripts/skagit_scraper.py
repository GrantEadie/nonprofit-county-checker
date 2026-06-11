"""
Skagit County Nonprofit Scraper
Uses the ProPublica Nonprofit Explorer API (free, no auth required)
https://projects.propublica.org/nonprofits/api/v2

Usage:
    pip install requests
    python skagit_scraper.py
"""

import requests
import csv
import time

# Cities/towns in Skagit County
CITIES = [
    "Mount Vernon",
    "Burlington",
    "Anacortes",
    "Sedro-Woolley",
    "Concrete",
    "La Conner",
    "Bow",
    "Conway",
    "Hamilton",
    "Lyman",
    "Rockport",
    "Marblemount",
]

OUTPUT_FILE = "skagit_nonprofits_propublica.csv"
BASE_URL = "https://projects.propublica.org/nonprofits/api/v2/search.json"


def fetch_orgs_for_city(city, state="WA"):
    orgs = []
    page = 0
    per_page = 100

    while True:
        params = {
            "q": "",
            "state[id]": state,
            "city": city,
            "per_page": per_page,
            "page": page,
        }

        try:
            response = requests.get(BASE_URL, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"  Error fetching page {page} for {city}: {e}")
            break

        results = data.get("organizations", [])
        if not results:
            break

        orgs.extend(results)
        total = data.get("total_results", 0)
        print(f"  {city}: page {page + 1}, got {len(results)} orgs (total reported: {total})")

        # If we've got everything, stop
        if len(orgs) >= total or len(results) < per_page:
            break

        page += 1
        time.sleep(0.5)  # be polite to the API

    return orgs


def format_revenue(value):
    if value is None:
        return "n/a"
    return f"${value:,}"


def main():
    all_orgs = {}  # keyed by EIN to deduplicate

    for city in CITIES:
        print(f"Fetching: {city}")
        orgs = fetch_orgs_for_city(city)

        for org in orgs:
            ein = org.get("ein", "")
            if ein and ein not in all_orgs:
                all_orgs[ein] = org

        print(f"  -> {len(orgs)} fetched, {len(all_orgs)} unique total so far")
        time.sleep(1)  # pause between cities

    print(f"\nWriting {len(all_orgs)} orgs to {OUTPUT_FILE}...")

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "EIN", "City", "State", "Revenue", "Assets", "IRS Type", "NTEE Code"])

        for org in sorted(all_orgs.values(), key=lambda x: x.get("name", "")):
            writer.writerow([
                org.get("name", ""),
                org.get("ein", ""),
                org.get("city", ""),
                org.get("state", ""),
                format_revenue(org.get("income_amount")),
                format_revenue(org.get("asset_amount")),
                org.get("subsection_code", ""),
                org.get("ntee_code", ""),
            ])

    print(f"Done! Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
