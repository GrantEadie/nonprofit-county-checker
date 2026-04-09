import { NextRequest, NextResponse } from "next/server";
import { STATE_FIPS } from "@/lib/census";

const CENSUS_BASE = "https://api.census.gov/data/2020/acs/acs5";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state")?.trim().toUpperCase();
  if (!state) return NextResponse.json({ error: "state is required" }, { status: 400 });

  const stateFips = STATE_FIPS[state];
  if (!stateFips) return NextResponse.json({ error: `Unknown state: ${state}` }, { status: 400 });

  try {
    const url = `${CENSUS_BASE}?get=NAME&for=county:*&in=state:${stateFips}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error("Census API error");

    const rows: string[][] = await res.json();

    // rows[0] = ["NAME", "state", "county"], rest = data
    const counties = rows
      .slice(1)
      .map(([name]) => name.split(",")[0].replace(/\s*county\s*$/i, "").trim())
      .filter(Boolean)
      .sort();

    return NextResponse.json({ counties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
