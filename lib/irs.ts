import type { OrgResult } from "./types";

const IRS_BMF_URL = "https://www.irs.gov/pub/irs-soi/eo_{state}.csv";

// In-memory cache: survives for the lifetime of the server instance (warm lambdas on Vercel)
const bmfCache = new Map<string, { rows: Record<string, string>[]; ts: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// 501(c) subsection code → human-readable label
const SUBSECTION_LABELS: Record<string, string> = {
  "3":  "501(c)(3)",
  "4":  "501(c)(4)",
  "5":  "501(c)(5)",
  "6":  "501(c)(6)",
  "7":  "501(c)(7)",
  "8":  "501(c)(8)",
  "9":  "501(c)(9)",
  "10": "501(c)(10)",
  "19": "501(c)(19)",
};

// Top-level NTEE category from first letter
const NTEE_CATEGORIES: Record<string, string> = {
  A: "Arts & Culture",
  B: "Education",
  C: "Environment",
  D: "Animal-Related",
  E: "Health Care",
  F: "Mental Health",
  G: "Disease Research",
  H: "Medical Research",
  I: "Crime & Legal",
  J: "Employment",
  K: "Food & Agriculture",
  L: "Housing",
  M: "Public Safety",
  N: "Recreation & Sports",
  O: "Youth Development",
  P: "Human Services",
  Q: "International",
  R: "Civil Rights",
  S: "Community Improvement",
  T: "Philanthropy",
  U: "Science & Technology",
  V: "Social Science",
  W: "Public Affairs",
  X: "Religion",
  Y: "Mutual Benefit",
  Z: "Unknown",
};

function parseAmount(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "0") return null;
  const n = parseInt(val.replace(/\D/g, ""), 10);
  return isNaN(n) ? null : n;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

async function getStateRows(state: string): Promise<Record<string, string>[]> {
  const key = state.toLowerCase();
  const cached = bmfCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.rows;

  const url = IRS_BMF_URL.replace("{state}", key);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download IRS data for ${state}: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const text = new TextDecoder("latin1").decode(buffer);
  const rows = parseCsv(text);

  bmfCache.set(key, { rows, ts: Date.now() });
  return rows;
}

export async function fetchAndFilterOrgs(
  state: string,
  cities: string[],
  threshold: number
): Promise<OrgResult[]> {
  const rows = await getStateRows(state);

  const citySet = new Set(cities.map((c) => c.trim().toUpperCase()));

  const results: OrgResult[] = [];

  for (const row of rows) {
    const city = (row["CITY"] ?? "").trim().toUpperCase();
    if (!citySet.has(city)) continue;

    const ein = row["EIN"]?.trim() ?? "";
    if (!ein) continue;

    const revenue = parseAmount(row["INCOME_AMT"]) ?? parseAmount(row["REVENUE_AMT"]);
    const assets  = parseAmount(row["ASSET_AMT"]);
    const nteeCode = (row["NTEE_CD"] ?? "").trim();
    const subsectionRaw = (row["SUBSECTION"] ?? "").trim();
    const taxPeriod = (row["TAX_PERIOD"] ?? "").trim();

    // Format tax period YYYYMM → YYYY
    const filingYear = taxPeriod.length >= 4 ? taxPeriod.slice(0, 4) : taxPeriod;

    results.push({
      ein,
      name: (row["NAME"] ?? "").trim(),
      city: (row["CITY"] ?? "").trim(),
      state: (row["STATE"] ?? "").trim(),
      nteeCode,
      nteeCategory: NTEE_CATEGORIES[nteeCode[0]?.toUpperCase()] ?? "Unknown",
      subsection: SUBSECTION_LABELS[subsectionRaw] ?? `501(c)(${subsectionRaw})`,
      revenue,
      assets,
      taxPeriod: filingYear,
      viable: revenue !== null ? revenue >= threshold : null,
      propublicaUrl: `https://projects.propublica.org/nonprofits/organizations/${ein}`,
      deductibility: row["DEDUCTIBILITY"]?.trim() ?? "",
    });
  }

  // Sort: viable first, then by revenue descending
  results.sort((a, b) => {
    if (a.viable && !b.viable) return -1;
    if (!a.viable && b.viable) return 1;
    return (b.revenue ?? -1) - (a.revenue ?? -1);
  });

  return results;
}
