import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache to avoid re-fetching the same EIN
const cache = new Map<string, string | null>();

export async function GET(req: NextRequest) {
  const ein = req.nextUrl.searchParams.get("ein")?.trim();
  if (!ein) {
    return NextResponse.json({ website: null }, { status: 400 });
  }

  if (cache.has(ein)) {
    return NextResponse.json({ website: cache.get(ein) ?? null });
  }

  try {
    const res = await fetch(
      `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      cache.set(ein, null);
      return NextResponse.json({ website: null });
    }
    const data = await res.json();
    const website: string | null = data?.organization?.website ?? null;
    cache.set(ein, website);
    return NextResponse.json({ website });
  } catch {
    return NextResponse.json({ website: null });
  }
}
