import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getRace, getPickByRaceAndCookie, upsertPick } from "@/lib/storage";
import { nowIso, randomId } from "@/lib/ids";

type Body = { firstId: string; secondId: string; thirdId: string };

function getOrCreateAnonCookieId(req: NextRequest) {
  const existing = req.cookies.get("anon_id")?.value;
  if (existing) return existing;
  return crypto.randomBytes(16).toString("hex");
}

// ? ctx.params に依存せず、URLから raceId を抜く
function getRaceIdFromPath(req: NextRequest) {
  // 例: /api/races/race_heavy_001/vote
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  // ["api","races","race_heavy_001","vote"]
  const idx = parts.indexOf("races");
  const raceId = idx >= 0 ? parts[idx + 1] : undefined;
  return raceId;
}

export async function POST(req: NextRequest) {
  const raceId = getRaceIdFromPath(req);
  if (!raceId) {
    return NextResponse.json({ error: "RACE_ID_NOT_FOUND" }, { status: 400 });
  }

  const race = getRace(raceId);
  if (!race) return NextResponse.json({ error: "RACE_NOT_FOUND" }, { status: 404 });

  // 締切なし：結果が入ったら投票終了
  if (race.result) return NextResponse.json({ error: "RACE_CLOSED" }, { status: 400 });

  const body = (await req.json()) as Body;
  const { firstId, secondId, thirdId } = body;

  if (!firstId || !secondId || !thirdId) {
    return NextResponse.json({ error: "INVALID_PICK" }, { status: 400 });
  }
  if (new Set([firstId, secondId, thirdId]).size !== 3) {
    return NextResponse.json({ error: "PICKS_MUST_BE_DISTINCT" }, { status: 400 });
  }

  const validIds = new Set(race.horses.map((h) => h.id));
  if (!validIds.has(firstId) || !validIds.has(secondId) || !validIds.has(thirdId)) {
    return NextResponse.json({ error: "UNKNOWN_HORSE" }, { status: 400 });
  }

  const anonId = getOrCreateAnonCookieId(req);

  const votedFlagName = `race_${raceId}_voted`;
  if (req.cookies.get(votedFlagName)?.value === "1") {
    return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 400 });
  }

  const existingPick = getPickByRaceAndCookie(raceId, anonId);
  if (existingPick) {
    return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 400 });
  }

  const ts = nowIso();
  const pick = await upsertPick({
    id: randomId("pick"),
    raceId,
    cookieId: anonId,
    firstId,
    secondId,
    thirdId,
    createdAt: ts,
    updatedAt: ts,
  });

  const res = NextResponse.json({ ok: true, pick });

  res.cookies.set({
    name: "anon_id",
    value: anonId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  res.cookies.set({
    name: votedFlagName,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  res.cookies.set({
    name: `race_${raceId}_pick`,
    value: `${firstId}.${secondId}.${thirdId}`,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
