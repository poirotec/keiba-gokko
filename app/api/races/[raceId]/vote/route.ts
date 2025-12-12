export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getRace, addPick } from "@/lib/storage";

function getRaceIdFromPath(req: NextRequest) {
  // /api/races/{raceId}/vote
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("races");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const raceId = getRaceIdFromPath(req);
    if (!raceId) return NextResponse.json({ error: "RACE_ID_NOT_FOUND" }, { status: 400 });

    const already = req.cookies.get(`race_${raceId}_voted`)?.value === "1";
    if (already) return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 409 });

    const race = getRace(raceId);
    if (!race) return NextResponse.json({ error: "RACE_NOT_FOUND" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const firstId = body?.firstId as string | undefined;
    const secondId = body?.secondId as string | undefined;
    const thirdId = body?.thirdId as string | undefined;

    if (!firstId || !secondId || !thirdId) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    if (new Set([firstId, secondId, thirdId]).size !== 3) {
      return NextResponse.json({ error: "DUPLICATE_PICK" }, { status: 400 });
    }

    // ここがVercelで落ちやすい（fs書き込み/永続化）
    await addPick(raceId, { firstId, secondId, thirdId });

    const res = NextResponse.json({ ok: true });

    // 1回制限（Cookie）
    res.cookies.set(`race_${raceId}_voted`, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true, // ← 本番必須
    });

    res.cookies.set(`race_${raceId}_pick`, `${firstId}.${secondId}.${thirdId}`, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });


    return res;
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: e?.message ?? String(e),
        name: e?.name ?? null,
      },
      { status: 500 }
    );
  }
}
