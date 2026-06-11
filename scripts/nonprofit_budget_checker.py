from __future__ import annotations

"""
Nonprofit Budget Checker
========================
Looks up annual revenue for a list of nonprofits using the ProPublica
Nonprofit Explorer API and outputs a CSV flagging orgs above a $2M threshold.

Usage:
    1. Add your org names to the ORGANIZATIONS list below.
    2. Run: python nonprofit_budget_checker.py
    3. Results saved to: nonprofit_results.csv

Requirements:
    pip install requests
"""

import requests
import csv
import time
import re

# -----------------------------------------------------------------------
# PASTE YOUR ORGANIZATIONS HERE — one string per line
# -----------------------------------------------------------------------
ORGANIZATIONS = [
    "A Better-Way Out",
    "Acme Firefighters Association",
    "Alderwood PTA",
    "Allied Arts of Whatcom County",
    "American Climber Science Program",
    "American Red Cross Northwest Region",
    "Animals as Natural Therapy",
    "ARC of Whatcom County",
    "Artistic Recovery Therapies",
    "Assistance League Of Bellingham Washington",
    "BAAY - Bellingham Arts Academy for Youth",
    "Bellingham Alternative Library",
    "Bellingham Central Lions Club Foundation",
    "Bellingham Chamber Chorale",
    "Bellingham Chapter of Sister Cities International",
    "Bellingham Childcare & Learning Center",
    "Bellingham Circus Guild",
    "Bellingham Festival of Music",
    "Bellingham Food Bank",
    "Bellingham MakerSpace Inc",
    "Bellingham Music Club",
    "Bellingham Public Schools Foundation",
    "Bellingham SeaFeast",
    "Bellingham Symphony Orchestra",
    "Bellingham Technical College Foundation",
    "Bellingham Theatre Guild",
    "Bellingham Theatre Works",
    "Bellingham Threshold Singers",
    "Birchwood Neighborhood Association",
    "Blaine Food Bank",
    "Blue Skies for Children",
    "Boys & Girls Clubs of Whatcom County",
    "Brigadoon Service Dogs",
    "Brigid Collins House",
    "Camp Fire Samish",
    "CASCADIA International Women's Film Festival",
    "Cedar Tree Montessori School",
    "Chuckanut Health Foundation",
    "Children of the Setting Sun Productions",
    "Columbia Parent Association",
    "Common Threads Farm",
    "Communities in Schools of Whatcom & Skagit Counties",
    "Community Boating Center",
    "Cordata Neighborhood Association",
    "Country Dance & Song Society Inc",
    "Dementia Support Northwest",
    "Domestic Violence & Sexual Assault Services of Whatcom County",
    "Downtown Bellingham Partnership",
    "Engedi Refuge Ministries",
    "Explorations Academy",
    "FACES Northwest",
    "Fatherhood the Foundation",
    "Ferndale Band Boosters",
    "Ferndale Community Services",
    "Ferndale Downtown Development Association",
    "Ferndale Food Bank",
    "Ferndale Heritage Society",
    "Ferndale Public Schools Foundation",
    "Foothills Food Bank",
    "Foster Hearts",
    "Friends of Bellingham Public Library",
    "Friends of Birch Bay Library",
    "Friends Of Island Library",
    "Friends of North Fork Community Library",
    "Friends of Point Roberts Library",
    "Friends of Sumas Library",
    "Friends of the Deming Library",
    "Friends of the Ferndale Library",
    "FuturesNW",
    "Gifts of Music NW",
    "Growing Veterans",
    "Habitat for Humanity in Whatcom County",
    "Healing Through Hope",
    "Hearing Speech & Deafness Center",
    "HomesNOW Not Later",
    "Huckleberry Health and Development",
    "Immigrant Resources & Immediate Support",
    "Inner Child Studio",
    "Institute for Washington's Future",
    "Interfaith Coalition of Whatcom County",
    "Jansen Art Center",
    "Kendall PTA",
    "Kulshan Community Media",
    "Komo Kulshan Ski Club",
    "Kulshan Carbon Trust",
    "Kulshan Community Land Trust",
    "Law Advocates",
    "League of Women Voters of Bellingham Whatcom County",
    "Lhaq'temish Foundation",
    "Lighthouse Mission Ministries",
    "Love2Hope",
    "Lummi Island Foundation for Education",
    "Lummi Island Heritage Trust",
    "Lummi Youth Academy",
    "Lydia Place",
    "Lynden Community Senior Center",
    "Lynden Scholarship Foundation",
    "Make.Shift Art Space",
    "Master Gardener Foundation of Whatcom County",
    "Max Higbee Center",
    "Meadows Montessori School",
    "Miracle Food Network",
    "Mount Baker Theatre",
    "NAMI of Whatcom County",
    "New Way Ministries",
    "Nooksack Salmon Enhancement Association",
    "Nooksack Valley Food Bank",
    "North Cascades Audubon Society",
    "North Sound Accountable Community of Health",
    "Northwest Indian College",
    "Northwest Indian College Foundation",
    "Northwest Straits Marine Conservation Foundation",
    "Northwest Therapeutic Riding Center",
    "Northwest Washington Fair Foundation",
    "Northwest Youth Services",
    "Opportunity Council",
    "Pacific Arts Association",
    "Pacific Northwest Tribal Lending",
    "Peace Centers",
    "PeaceHealth St. Joseph Medical Center Foundation",
    "Pickford Film Center",
    "Pipeline Safety Trust",
    "PNW Plateful",
    "Point Roberts Animal Wellbeing Society",
    "Point Roberts Circle of Care",
    "Point Roberts Dollars For Scholars",
    "Point Roberts Food Bank",
    "Point Roberts Historical Society",
    "Puget Sound Guitar Workshop",
    "Racial Unity Now",
    "Ragfinery",
    "Rebound Of Whatcom County",
    "Recreation Northwest",
    "Rescued Hearts Northwest Inc",
    "RE Sources",
    "Restoration Outdoors",
    "Road2Home",
    "Rotary Club of Bellingham Foundation",
    "Running for Combat Veterans",
    "Salish Center for Sustainable Fishing Methods",
    "Salish Current",
    "Samish Montessori School",
    "Sardis Wildlife Center Inc",
    "Sea-Mar Community Health Center",
    "Sean Humphrey House",
    "Shifting Gears",
    "Silver Beach Education Association",
    "SISU Children's Fund",
    "Skookum Kids",
    "Spark Museum of Electrical Invention",
    "Summit To Sound Search & Rescue",
    "Sun Community Service",
    "Sustainable Bellingham",
    "Sustainable Connections",
    "Technology Alliance Group for Northwest Washington",
    "The AIROW Project",
    "The Evergreen Land Trust Association",
    "The Jazz Project",
    "The Salvation Army",
    "The Whatcom Dream",
    "Twin Sisters Mobile Market",
    "United Way of Whatcom County",
    "Unity Care Northwest",
    "Vamos Outdoors Project",
    "Washington Center for Employee Ownership",
    "We Care of Whatcom County",
    "Western Washington University Foundation",
    "Whatcom Center for Early Learning",
    "Whatcom Chamber Foundation",
    "Whatcom Chorale",
    "Whatcom Clubhouse",
    "Whatcom Community College Foundation",
    "Whatcom Council On Aging",
    "Whatcom County Library Foundation",
    "Whatcom County Old Settlers Association",
    "Whatcom County Re-Entry Coalition",
    "Whatcom County Search & Rescue Council",
    "Whatcom County Sheriffs Office Support Foundation",
    "Whatcom Dispute Resolution Center",
    "Whatcom Family & Community Network",
    "Whatcom Family Farmers Education",
    "Whatcom Family YMCA",
    "Whatcom Feline Alliance",
    "Whatcom Genealogical Society",
    "Whatcom Hills Waldorf School",
    "Whatcom Hospice Foundation",
    "Whatcom Humane Society",
    "Whatcom Intergenerational High School",
    "Whatcom Jazz Music Arts Center",
    "Whatcom Land Trust",
    "Whatcom Literacy Council",
    "Whatcom Long Term Recovery Group",
    "Whatcom Million Trees Project",
    "Whatcom Mountain Bike Coalition",
    "Whatcom Museum Foundation",
    "Whatcom Peace & Justice Center",
    "Whatcom Poetry Series",
    "Whatcom READS!",
    "Whatcom Working Waterfront Foundation",
    "White Crow String Works",
    "Whiteswan Environmental",
    "Wild Whatcom",
    "YWCA Bellingham",
]

# -----------------------------------------------------------------------
# SETTINGS
# -----------------------------------------------------------------------
REVENUE_THRESHOLD = 1_000_000   # Minimum annual revenue to be flagged "viable"
OUTPUT_FILE = "nonprofit_results.csv"
STATE_FILTER = "WA"             # Helps narrow results to Washington state
DELAY_BETWEEN_REQUESTS = 0.5    # Seconds to wait between API calls (be polite)

# -----------------------------------------------------------------------
# PROPUBLICA API
# -----------------------------------------------------------------------
PROPUBLICA_SEARCH_URL = "https://projects.propublica.org/nonprofits/api/v2/search.json"
PROPUBLICA_ORG_URL    = "https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json"


LOCATION_SUFFIXES = re.compile(
    r"\s+(?:of|for|in)\s+"
    r"(?:Whatcom County|Whatcom|Bellingham|Skagit|Ferndale|Lynden|Blaine|"
    r"Northwest Washington|Northwest Region|NW|"
    r"Bellingham Whatcom County|Whatcom & Skagit Counties|"
    r"Washington)\s*$",
    re.IGNORECASE,
)
COMMON_SUFFIXES = re.compile(
    r"\s+(?:Inc|Incorporated|Association|Foundation|Project|LLC|Corp|Corporation)\s*\.?\s*$",
    re.IGNORECASE,
)
SPECIAL_CHARS = re.compile(r"[&'\.!\-]")
PREFIX_PATTERN = re.compile(r"^(?:The|BAAY)\s*[-–—:]\s*", re.IGNORECASE)
LEADING_THE = re.compile(r"^The\s+", re.IGNORECASE)
STOPWORDS = {"the", "of", "for", "in", "and", "a", "an"}


def generate_name_variants(name: str) -> list[str]:
    """Return progressively simpler search queries for *name*.

    Each variant is a cleaned-up version of the original designed to be more
    likely to match the ProPublica keyword search.  The list is ordered from
    most specific to least specific.
    """
    seen: set[str] = set()
    variants: list[str] = []

    def _add(v: str):
        v = " ".join(v.split())  # collapse whitespace
        if v and v.lower() not in seen:
            seen.add(v.lower())
            variants.append(v)

    # 1. Replace & with "and" and strip other special characters
    cleaned = name.replace("&", "and")
    cleaned = SPECIAL_CHARS.sub(" ", cleaned)
    cleaned = " ".join(cleaned.split())
    _add(cleaned)

    # 2. Remove prefix (e.g. "BAAY - …", "The …")
    no_prefix = PREFIX_PATTERN.sub("", cleaned)
    no_prefix = LEADING_THE.sub("", no_prefix)
    _add(no_prefix)

    # 3. Remove location suffixes
    no_loc = LOCATION_SUFFIXES.sub("", no_prefix)
    _add(no_loc)

    # 4. Remove common corporate suffixes
    no_suffix = COMMON_SUFFIXES.sub("", no_loc)
    _add(no_suffix)

    # 5. Shorten to first 3 significant words, then 2
    words = [w for w in no_suffix.split() if w.lower() not in STOPWORDS]
    if len(words) > 3:
        _add(" ".join(words[:3]))
    if len(words) > 2:
        _add(" ".join(words[:2]))

    return variants


def _try_search(query: str, state: str | None = None) -> list[dict]:
    """Fire a single ProPublica search request and return the orgs list."""
    params: dict = {"q": query}
    if state:
        params["state[id]"] = state
    try:
        response = requests.get(PROPUBLICA_SEARCH_URL, params=params, timeout=10)
        response.raise_for_status()
        return response.json().get("organizations", [])
    except Exception:
        return []


def _pick_best_match(orgs: list[dict], desired_state: str) -> dict | None:
    """From a list of ProPublica results, return the best WA-based match."""
    # Prefer an org in the desired state
    for org in orgs:
        if (org.get("state") or "").upper() == desired_state.upper():
            return org
    return None


def search_org(name: str) -> dict | None:
    """Search ProPublica for an org by name, retrying with cleaned variants."""
    # --- first try: exact name with state filter ---
    orgs = _try_search(name, STATE_FILTER)
    if orgs:
        return orgs[0]

    # --- retry with progressively simpler names ---
    variants = generate_name_variants(name)
    for variant in variants:
        time.sleep(DELAY_BETWEEN_REQUESTS)
        orgs = _try_search(variant, STATE_FILTER)
        if orgs:
            print(f"  [RETRY] matched with query: '{variant}'")
            return orgs[0]

    # --- last resort: try variants without state filter ---
    for variant in [name] + variants:
        time.sleep(DELAY_BETWEEN_REQUESTS)
        orgs = _try_search(variant)
        if orgs:
            best = _pick_best_match(orgs, STATE_FILTER)
            if best:
                print(f"  [RETRY no-state] matched with query: '{variant}'")
                return best

    print(f"  [WARN] No match found after retries for '{name}'")
    return None


def get_org_financials(ein: str) -> dict | None:
    """Fetch detailed financials for an org by EIN."""
    try:
        response = requests.get(
            PROPUBLICA_ORG_URL.format(ein=ein),
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  [ERROR] Financials fetch failed for EIN {ein}: {e}")
        return None


def format_currency(amount) -> str:
    if amount is None:
        return "N/A"
    return f"${amount:,.0f}"


def check_organizations(org_names: list[str]) -> list[dict]:
    results = []

    for name in org_names:
        name = name.strip()
        if not name:
            continue

        print(f"Looking up: {name}")
        row = {
            "Organization Name":    name,
            "Matched Name":         "",
            "EIN":                  "",
            "State":                "",
            "Annual Revenue":       "",
            "Revenue (Raw)":        "",
            "Filing Year":          "",
            "Viable ($2M+)":        "",
            "ProPublica URL":       "",
            "Notes":                "",
        }

        match = search_org(name)

        if not match:
            row["Notes"] = "No match found in ProPublica"
            print(f"  → No match found")
            results.append(row)
            time.sleep(DELAY_BETWEEN_REQUESTS)
            continue

        ein = str(match.get("ein", "")).strip()
        row["Matched Name"] = match.get("name", "")
        row["EIN"]          = ein
        row["State"]        = match.get("state", "")
        row["ProPublica URL"] = f"https://projects.propublica.org/nonprofits/organizations/{ein}"

        # Fetch detailed financials
        financials = get_org_financials(ein) if ein else None

        if financials:
            filings = financials.get("filings_with_data", [])
            if filings:
                latest = filings[0]  # Most recent filing
                revenue = latest.get("totrevenue")
                tax_period = latest.get("tax_prd_yr", "")
                row["Revenue (Raw)"] = revenue if revenue is not None else ""
                row["Annual Revenue"] = format_currency(revenue)
                row["Filing Year"]    = tax_period

                if revenue is not None:
                    viable = revenue >= REVENUE_THRESHOLD
                    row["Viable ($2M+)"] = "YES" if viable else "NO"
                    flag = "✓ VIABLE" if viable else "✗ Below threshold"
                    print(f"  → {row['Matched Name']} | {row['Annual Revenue']} | {flag}")
                else:
                    row["Notes"] = "Revenue data not available"
                    print(f"  → {row['Matched Name']} | Revenue data unavailable")
            else:
                row["Notes"] = "No filing data available"
                print(f"  → {row['Matched Name']} | No filing data")
        else:
            row["Notes"] = "Could not retrieve financials"
            print(f"  → Could not retrieve financials")

        results.append(row)
        time.sleep(DELAY_BETWEEN_REQUESTS)

    return results


def write_csv(results: list[dict], filename: str):
    if not results:
        print("No results to write.")
        return

    fieldnames = [
        "Organization Name",
        "Matched Name",
        "EIN",
        "State",
        "Annual Revenue",
        "Revenue (Raw)",
        "Filing Year",
        "Viable ($2M+)",
        "ProPublica URL",
        "Notes",
    ]

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"\nResults saved to: {filename}")


def main():
    print(f"Nonprofit Budget Checker")
    print(f"Threshold: {format_currency(REVENUE_THRESHOLD)}+")
    print(f"Checking {len(ORGANIZATIONS)} organizations...\n")
    print("-" * 50)

    results = check_organizations(ORGANIZATIONS)
    write_csv(results, OUTPUT_FILE)

    # Quick summary
    viable   = [r for r in results if r["Viable ($2M+)"] == "YES"]
    no_match = [r for r in results if r["Matched Name"] == ""]
    print(f"\nSummary:")
    print(f"  Total checked:   {len(results)}")
    print(f"  Viable ($2M+):   {len(viable)}")
    print(f"  No match found:  {len(no_match)}")


if __name__ == "__main__":
    main()
