import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const correctPassword = process.env.APP_PASSWORD;
  const secret          = process.env.AUTH_SECRET;

  if (!correctPassword || !secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", secret, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/",
    // No maxAge = session cookie; add maxAge: 60 * 60 * 24 * 30 for 30-day persistence
  });

  return res;
}
