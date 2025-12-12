export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getRace, addPick } from "@/lib/storage";

console.log("DEBUG PICKS:", debug);


function getRaceIdFromPath(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("races");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

function getOrCreateVoterId(req: NextRequest) {
  const existing = req.cookies.get("voter_id")?.value;
  if (existing) return { voterId: existing, created: false };
  const voterId = crypto.randomUUID();
  return { voterId, created: true };
}

export async function POST(req: NextRequest) {
  const raceId = getRaceIdFromPath(req);
  if (!raceId) return NextResponse.json({ error: "RACE_ID_NOT_FOUND" }, { status: 400 });

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

  // voterId は今はまだ使わない（1人1票のRedis実装が整ってから使う）
  const { voterId, created } = getOrCreateVoterId(req);

  await addPick(raceId, { firstId, secondId, thirdId });

  const res = NextResponse.json({ ok: true });

  // voter_id を固定（Redis側の1票制御に使う）
  if (created) {
    res.cookies.set("voter_id", voterId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // UI用（見た目の“投票済み”）
  res.cookies.set(`race_${raceId}_voted`, "1", { path: "/", httpOnly: true, sameSite: "lax", secure: true });
  res.cookies.set(`race_${raceId}_pick`, `${firstId}.${secondId}.${thirdId}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });

  return res;
}
