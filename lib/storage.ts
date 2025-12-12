import fs from "fs";
import path from "path";

export type Race = {
  id: string;
  title: string;
  horses: { id: string; number: number; name: string }[];
  result?: { firstId: string; secondId: string; thirdId: string };
  createdAt: string;
};

export type Pick = {
  id: string;
  raceId: string;
  cookieId: string; // cookie由来の匿名ID（固定）
  firstId: string;
  secondId: string;
  thirdId: string;
  createdAt: string;
  updatedAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const racesPath = path.join(dataDir, "races.json");
const picksPath = path.join(dataDir, "picks.json");

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function writeJson<T>(filePath: string, obj: T) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
}

// 超簡易ロック（同時書き込み対策の最低限）
let writeLock: Promise<void> = Promise.resolve();
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((r) => (release = r));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export function listRaces(): Race[] {
  return readJson<Race[]>(racesPath);
}

export function getRace(raceId: string): Race | null {
  const races = listRaces();
  return races.find((r) => r.id === raceId) ?? null;
}

export function listPicksByRace(raceId: string): Pick[] {
  const all = readJson<Pick[]>(picksPath);
  return all.filter((p) => p.raceId === raceId);
}

export function getPickByRaceAndCookie(raceId: string, cookieId: string): Pick | null {
  const all = readJson<Pick[]>(picksPath);
  return all.find((p) => p.raceId === raceId && p.cookieId === cookieId) ?? null;
}

export async function upsertPick(pick: Pick): Promise<Pick> {
  return withLock(async () => {
    const all = readJson<Pick[]>(picksPath);
    const idx = all.findIndex((p) => p.raceId === pick.raceId && p.cookieId === pick.cookieId);
    if (idx >= 0) {
      all[idx] = pick;
    } else {
      all.push(pick);
    }
    writeJson(picksPath, all);
    return pick;
  });
}

export async function setRaceResult(
  raceId: string,
  result: { firstId: string; secondId: string; thirdId: string }
): Promise<Race> {
  return withLock(async () => {
    const races = listRaces();
    const idx = races.findIndex((r) => r.id === raceId);
    if (idx < 0) throw new Error("RACE_NOT_FOUND");

    races[idx] = {
      ...races[idx],
      result,
    };
    writeJson(racesPath, races);
    return races[idx];
  });
}
