/**
 * B Corp directory search via B Lab's Typesense instance.
 *
 * Host, collection, and search key are all public (the key is embedded as a
 * URL parameter in bcorporation.net's frontend requests). It is read-only.
 *
 * To verify / update the key:
 *   1. Open https://www.bcorporation.net/en-us/find-a-b-corp/ in Chrome
 *   2. DevTools → Network → Fetch/XHR → run a search
 *   3. Look for requests to a1.typesense.net — the key is the
 *      x-typesense-api-key query parameter value
 *   4. Set it as BCORP_SEARCH_KEY in .env.local
 */

import type { BCorpResult } from "./types";

const TYPESENSE_HOST       = "https://94eo8lmsqa0nd3j5p.a1.typesense.net";
const TYPESENSE_COLLECTION = "companies-production-en-us";

// In-memory cache keyed by "stateCode:city1,city2,..."
const cache = new Map<string, { results: BCorpResult[]; ts: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Typesense stores full state names in hqProvince for US companies
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming",
};

function getSearchKey(): string {
  const key = process.env.BCORP_SEARCH_KEY;
  if (!key) throw new Error(
    "BCORP_SEARCH_KEY is not set. See lib/bcorp.ts for instructions."
  );
  return key;
}

interface TypesenseHit {
  document: {
    id?: string;
    name?: string;
    website?: string;
    hqCity?: string;
    hqProvince?: string;
    hqCountry?: string;
    industry?: string;
    sector?: string;
    size?: string;
    overallScore?: number;
    score?: number;
    certificationDate?: string;
    certifiedDate?: string;
    slug?: string;
    [key: string]: unknown;
  };
}

interface TypesenseResponse {
  results: Array<{
    hits: TypesenseHit[];
    found: number;
    out_of: number;
  }>;
}

function hitToResult(hit: TypesenseHit): BCorpResult {
  const doc  = hit.document;
  const slug = doc.slug ?? doc.name ?? doc.id ?? "";
  const score =
    typeof doc.overallScore === "number" ? doc.overallScore :
    typeof doc.score         === "number" ? doc.score       : null;
  const certifiedDate = doc.certificationDate ?? doc.certifiedDate ?? "";

  return {
    id:            String(doc.id ?? ""),
    name:          doc.name ?? "",
    website:       normalizeUrl(doc.website ?? ""),
    city:          doc.hqCity ?? "",
    state:         doc.hqProvince ?? "",
    country:       doc.hqCountry ?? "",
    industry:      doc.industry ?? "",
    sector:        doc.sector ?? "",
    employees:     doc.size ?? "",
    score,
    certifiedDate,
    profileUrl:    `https://www.bcorporation.net/en-us/find-a-b-corp/company/${encodeURIComponent(slug)}/`,
  };
}

function normalizeUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return "https://" + url;
}

/**
 * Fetch all B Corps in a given US state from B Lab's Typesense index,
 * then filter to the provided city set.
 */
export async function searchBCorps(
  state: string,
  cities: string[]
): Promise<BCorpResult[]> {
  const stateCode = state.toUpperCase();
  const citySet   = new Set(cities.map((c) => c.trim().toUpperCase()));
  const cacheKey  = `${stateCode}:${[...citySet].sort().join(",")}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.results;

  const searchKey = getSearchKey();
  const stateName = STATE_NAMES[stateCode] ?? stateCode;

  const hits: TypesenseHit[] = [];
  let page      = 1;
  const perPage = 250; // Typesense max

  while (true) {
    const body = JSON.stringify({
      searches: [{
        collection:      TYPESENSE_COLLECTION,
        q:               "*",
        query_by:        "name,hqCity,hqProvince",
        filter_by:       `hqCountry:=United States && hqProvince:=\`${stateName}\``,
        per_page:        perPage,
        page,
        // Only fetch what we need
        include_fields:  "id,name,website,hqCity,hqProvince,hqCountry,industry,sector,size,overallScore,score,certificationDate,certifiedDate,slug",
        exhaustive_search: true,
      }],
    });

    const res = await fetch(
      `${TYPESENSE_HOST}/multi_search?x-typesense-api-key=${searchKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Typesense error ${res.status}: ${text}`);
    }

    const data: TypesenseResponse = await res.json();
    const result = data.results[0];
    hits.push(...result.hits);

    const totalPages = Math.ceil(result.found / perPage);
    if (page >= totalPages) break;
    page++;
  }

  // Filter to matching cities
  const filtered = hits
    .filter((h) => {
      if (citySet.size === 0) return true;
      const city = (h.document.hqCity ?? "").trim().toUpperCase();
      return citySet.has(city);
    })
    .map(hitToResult);

  // Sort: highest B Impact score first, then alphabetically
  filtered.sort((a, b) => {
    if (a.score !== null && b.score !== null) return b.score - a.score;
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  cache.set(cacheKey, { results: filtered, ts: Date.now() });
  return filtered;
}
