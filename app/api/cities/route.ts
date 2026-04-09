import { NextRequest, NextResponse } from "next/server";
import { getCitiesForCounty } from "@/lib/census";

export async function GET(req: NextRequest) {
  const state  = req.nextUrl.searchParams.get("state")?.trim().toUpperCase();
  const county = req.nextUrl.searchParams.get("county")?.trim();

  if (!state || !county) {
    return NextResponse.json({ error: "state and county are required" }, { status: 400 });
  }

  try {
    const cities = await getCitiesForCounty(state, county);
    return NextResponse.json({ cities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
