import { NextRequest, NextResponse } from "next/server";
import { fetchAndFilterOrgs } from "@/lib/irs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { state, county, cities, threshold = 1_000_000 } = body as {
    state: string;
    county: string;
    cities: string[];
    threshold?: number;
  };

  if (!state || !county || !cities?.length) {
    return NextResponse.json({ error: "state, county, and cities are required" }, { status: 400 });
  }

  try {
    const results = await fetchAndFilterOrgs(state, cities, threshold);
    const viable  = results.filter((r) => r.viable === true).length;
    const noData  = results.filter((r) => r.revenue === null).length;

    return NextResponse.json({
      results,
      total:  results.length,
      viable,
      noData,
      state,
      county,
      cities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
