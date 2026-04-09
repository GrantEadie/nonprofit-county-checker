// US state abbreviation → FIPS code
export const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06",
  CO: "08", CT: "09", DE: "10", DC: "11", FL: "12",
  GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
  IA: "19", KS: "20", KY: "21", LA: "22", ME: "23",
  MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33",
  NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38",
  OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49",
  VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
  WY: "56",
};

const CENSUS_BASE = "https://api.census.gov/data/2020/acs/acs5";

// Suffixes to strip from Census place names (applied after splitting on comma)
const PLACE_SUFFIX = /\s+(city|town|CDP|CCD|village|borough|municipality|charter township|township|unorganized territory|county|balance of county)\b.*/i;
const SKIP_TERMS = /unorganized|balance of|remainder|not in|reservation/i;

async function getCountyFips(stateFips: string, countyName: string): Promise<string | null> {
  const url = `${CENSUS_BASE}?get=NAME&for=county:*&in=state:${stateFips}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const rows: string[][] = await res.json();
  const target = countyName.toLowerCase().replace(/\s*county\s*$/i, "").trim();

  for (const [name, , countyFips] of rows.slice(1)) {
    const normalized = name.toLowerCase().split(",")[0].replace(/\s*county\s*$/, "").trim();
    if (normalized === target || normalized.includes(target) || target.includes(normalized)) {
      return countyFips;
    }
  }
  return null;
}

export async function getCitiesForCounty(state: string, county: string): Promise<string[]> {
  const stateFips = STATE_FIPS[state.toUpperCase()];
  if (!stateFips) throw new Error(`Unknown state: ${state}`);

  const countyFips = await getCountyFips(stateFips, county);
  if (!countyFips) throw new Error(`County not found: ${county}, ${state}`);

  const url = `${CENSUS_BASE}?get=NAME&for=county+subdivision:*&in=state:${stateFips}+county:${countyFips}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch cities from Census API");

  const rows: string[][] = await res.json();

  const cities = rows
    .slice(1)
    // Split "Anacortes CCD, Skagit County, Washington" → "Anacortes CCD"
    .map(([name]) => name.split(",")[0].trim())
    .filter((name) => !SKIP_TERMS.test(name))
    // Strip type suffix: "Anacortes CCD" → "Anacortes"
    .map((name) => name.replace(PLACE_SUFFIX, "").trim())
    .filter(Boolean)
    .sort();

  return [...new Set(cities)];
}
