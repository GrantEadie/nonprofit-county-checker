from __future__ import annotations

"""
County Nonprofit Checker
========================
1. Prompts for state abbreviation, county name, and cities.
2. Downloads the IRS Exempt Organizations Business Master File (EO BMF)
   for the given state — a free public CSV with every registered nonprofit.
3. Filters to orgs in the specified cities.
4. Fetches detailed financials from ProPublica for each org.
5. Outputs a CSV flagging orgs above the revenue threshold.

Usage:
    python county_nonprofit_checker.py

Requirements:
    pip install requests
"""

import csv
import io
import time

import requests

# -----------------------------------------------------------------------
# SETTINGS
# -----------------------------------------------------------------------
REVENUE_THRESHOLD = 1_000_000
DELAY = 0.3  # seconds between ProPublica API calls

IRS_BMF_URL      = "https://www.irs.gov/pub/irs-soi/eo_{state_lower}.csv"
PROPUBLICA_ORG_URL = "https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json"


# -----------------------------------------------------------------------
# DISCOVERY: IRS EO BMF
# -----------------------------------------------------------------------

def download_irs_bmf(state: str) -> list[dict]:
    """Download the IRS EO BMF CSV for a state and return a list of org dicts."""
    url = IRS_BMF_URL.format(state_lower=state.lower())
    print(f"Downloading IRS EO BMF for {state}...")
    print(f"  URL: {url}")

    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Could not download IRS data: {e}")
        return []

    # The IRS CSV uses latin-1 encoding
    text = r.content.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    orgs = list(reader)
    print(f"  Downloaded {len(orgs):,} total organizations in {state}.")
    return orgs


def filter_by_cities(orgs: list[dict], cities: list[str]) -> dict[str, dict]:
    """Return EIN -> org dict for orgs whose city matches any of the given cities."""
    city_set = {c.strip().upper() for c in cities}
    matched: dict[str, dict] = {}

    for org in orgs:
        city = (org.get("CITY") or "").strip().upper()
        if city in city_set:
            ein = (org.get("EIN") or "").strip()
            if ein and ein not in matched:
                matched[ein] = org

    return matched


# -----------------------------------------------------------------------
# FINANCIALS: ProPublica
# -----------------------------------------------------------------------

def get_org_financials(ein: str) -> dict | None:
    try:
        r = requests.get(PROPUBLICA_ORG_URL.format(ein=ein), timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  [ERROR] Financials for EIN {ein}: {e}")
        return None


def format_currency(amount) -> str:
    if amount is None:
        return "N/A"
    return f"${amount:,.0f}"


# -----------------------------------------------------------------------
# MAIN PIPELINE
# -----------------------------------------------------------------------

def check_orgs(orgs_by_ein: dict[str, dict]) -> list[dict]:
    results = []
    total = len(orgs_by_ein)
    viable_col = f"Viable (${REVENUE_THRESHOLD // 1_000_000}M+)"

    for i, (ein, org) in enumerate(orgs_by_ein.items(), 1):
        name = (org.get("NAME") or "").strip()
        city = (org.get("CITY") or "").strip().title()
        state = (org.get("STATE") or "").strip()
        ntee = (org.get("NTEE_CD") or "").strip()

        print(f"[{i}/{total}] {name}")

        row = {
            "Organization Name": name,
            "EIN":               ein,
            "City":              city,
            "State":             state,
            "NTEE Code":         ntee,
            "Annual Revenue":    "",
            "Revenue (Raw)":     "",
            "Filing Year":       "",
            viable_col:          "",
            "ProPublica URL":    f"https://projects.propublica.org/nonprofits/organizations/{ein}",
            "Notes":             "",
        }

        financials = get_org_financials(ein)

        if financials:
            filings = financials.get("filings_with_data", [])
            if filings:
                latest  = filings[0]
                revenue = latest.get("totrevenue")
                row["Revenue (Raw)"]  = revenue if revenue is not None else ""
                row["Annual Revenue"] = format_currency(revenue)
                row["Filing Year"]    = latest.get("tax_prd_yr", "")

                if revenue is not None:
                    viable = revenue >= REVENUE_THRESHOLD
                    row[viable_col] = "YES" if viable else "NO"
                    flag = "✓ VIABLE" if viable else "✗ below threshold"
                    print(f"  -> {row['Annual Revenue']} | {flag}")
                else:
                    row["Notes"] = "Revenue data not available"
                    print(f"  -> Revenue data unavailable")
            else:
                row["Notes"] = "No filing data available"
                print(f"  -> No filing data")
        else:
            row["Notes"] = "Could not retrieve financials"

        results.append(row)
        time.sleep(DELAY)

    return results


def write_csv(results: list[dict], filename: str):
    if not results:
        print("No results to write.")
        return

    viable_col = f"Viable (${REVENUE_THRESHOLD // 1_000_000}M+)"
    fieldnames = [
        "Organization Name",
        "EIN",
        "City",
        "State",
        "NTEE Code",
        "Annual Revenue",
        "Revenue (Raw)",
        "Filing Year",
        viable_col,
        "ProPublica URL",
        "Notes",
    ]

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"\nResults saved to: {filename}")


def prompt_input() -> tuple[str, str, list[str]]:
    print("=" * 50)
    print("County Nonprofit Checker")
    print("=" * 50)

    state  = input("\nState abbreviation (e.g. WA): ").strip().upper()
    county = input("County name (e.g. Skagit):     ").strip()

    print("\nEnter cities/towns in this county, one per line.")
    print("Press Enter twice when done.\n")

    cities: list[str] = []
    while True:
        city = input("  City: ").strip()
        if not city:
            if cities:
                break
            print("  (Please enter at least one city.)")
        else:
            cities.append(city)

    return state, county, cities


def main():
    state, county, cities = prompt_input()

    output_file = f"{county.lower().replace(' ', '_')}_{state.lower()}_nonprofits.csv"

    print(f"\nLooking up nonprofits in {county} County, {state}...")
    print(f"Cities: {', '.join(cities)}")
    print(f"Revenue threshold: {format_currency(REVENUE_THRESHOLD)}+")
    print("-" * 50)

    # Step 1: IRS data → discover all orgs in county cities
    all_state_orgs = download_irs_bmf(state)
    if not all_state_orgs:
        print("No IRS data retrieved. Exiting.")
        return

    orgs_by_ein = filter_by_cities(all_state_orgs, cities)
    print(f"  Found {len(orgs_by_ein):,} orgs matching cities: {', '.join(cities)}\n")

    if not orgs_by_ein:
        print("No organizations found for the given cities. Check spelling and try again.")
        return

    # Step 2: ProPublica → fetch financials for each org
    print("Fetching financials from ProPublica...")
    print("-" * 50)
    results = check_orgs(orgs_by_ein)

    write_csv(results, output_file)

    viable_col = f"Viable (${REVENUE_THRESHOLD // 1_000_000}M+)"
    viable  = [r for r in results if r.get(viable_col) == "YES"]
    no_data = [r for r in results if r["Notes"]]

    print(f"\nSummary:")
    print(f"  Total orgs checked:        {len(results):,}")
    print(f"  Viable (${REVENUE_THRESHOLD // 1_000_000}M+ revenue):     {len(viable):,}")
    print(f"  Missing/no filing data:    {len(no_data):,}")
    print(f"  Output file:               {output_file}")


if __name__ == "__main__":
    main()
