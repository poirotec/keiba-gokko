export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type Horse = { id: string; number: number; name: string };
type RaceResult = { firstId: string; secondId: string; thirdId: string };
type Race = {
  id: string;
  title: string;
  horses: Horse[];
  createdAt?: string;
  result?: RaceResult;
};

function racesFilePath() {
  return path.join(process.cwd(), "data", "races.json");
}

function readRaces(): Race[] {
  const fp = racesFilePath();
  const raw = fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : "[]";
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed) as Race[];
}

function writeRaces(races: Race[]) {
  const fp = racesFilePath();
  fs.writeFileSync(fp, JSON.stringify(races, null, 2), "utf8");
}

function getRaceIdFromPath(req: NextRequest) {
  // /api/races/{raceId}/result
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("races");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

function isAdminKeyValid(adminKey?: string) {
  const expected = process.env.ADMIN_KEY;
  return !!expected && !!adminKey && adminKey === expected;
}

function validateResult(race: Race, result: RaceResult) {
  const { firstId, secondId, thirdId } = result;

  if (!firstId || !secondId || !thirdId) return "INVALID_RESULT";
  if (new Set([firstId, secondId, thirdId]).size !== 3) return "RESULT_MUST_BE_DISTINCT";

  const valid = new Set(race.horses.map((h) => h.id));
  if (!valid.has(firstId) || !valid.has(secondId) || !valid.has(thirdId)) return "UNKNOWN_HORSE_ID";

  return null;
}

// ? 結果確定
export async function POST(req: NextRequest) {
  const raceId = getRaceIdFromPath(req);
  if (!raceId) return NextResponse.json({ error: "RACE_ID_NOT_FOUND" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const adminKey = body?.adminKey as string | undefined;

  if (!isAdminKeyValid(adminKey)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const races = readRaces();
  const race = races.find((r) => r.id === raceId);
  if (!race) return NextResponse.json({ error: "RACE_NOT_FOUND" }, { status: 404 });

  const result: RaceResult = {
    firstId: body?.firstId,
    secondId: body?.secondId,
    thirdId: body?.thirdId,
  };

  const err = validateResult(race, result);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  race.result = result;
  writeRaces(races);

  return NextResponse.json({ ok: true, raceId, result });
}

// ? 結果リセット（未確定に戻す）
export async function DELETE(req: NextRequest) {
  const raceId = getRaceIdFromPath(req);
  if (!raceId) return NextResponse.json({ error: "RACE_ID_NOT_FOUND" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const adminKey = body?.adminKey as string | undefined;

  if (!isAdminKeyValid(adminKey)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const races = readRaces();
  const race = races.find((r) => r.id === raceId);
  if (!race) return NextResponse.json({ error: "RACE_NOT_FOUND" }, { status: 404 });

  // result を削除
  delete (race as any).result;
  writeRaces(races);

  return NextResponse.json({ ok: true, raceId, reset: true });
}
