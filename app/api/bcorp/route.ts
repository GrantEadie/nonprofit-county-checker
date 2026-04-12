import { NextRequest, NextResponse } from "next/server";
import { searchBCorps } from "@/lib/bcorp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { state, county, cities } = body as {
    state: string;
    county: string;
    cities: string[];
  };

  if (!state || !county || !cities?.length) {
    return NextResponse.json(
      { error: "state, county, and cities are required" },
      { status: 400 }
    );
  }

  try {
    const results = await searchBCorps(state, cities);

    return NextResponse.json({
      results,
      total: results.length,
      state,
      county,
      cities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
