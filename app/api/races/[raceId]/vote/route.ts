export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({
    ok: true,
    message: "vote API reached (nodejs runtime)",
  });

  res.cookies.set("vote_test", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
