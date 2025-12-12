import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type Pick = {
  firstId: string;
  secondId: string;
  thirdId: string;
};

export function getRace(raceId: string) {
  const races = require("../data/races.json");
  return races.find((r: any) => r.id === raceId) ?? null;
}

/**
 * 投票を追加（Redisに保存）
 */
export async function addPick(raceId: string, pick: Pick) {
  const key = `race:${raceId}:picks`;
  await redis.rpush(key, JSON.stringify(pick));
}

/**
 * レースの全投票を取得
 */
export async function listPicksByRace(raceId: string): Promise<Pick[]> {
  const key = `race:${raceId}:picks`;
  const arr = await redis.lrange<string>(key, 0, -1);
  return arr.map((s) => JSON.parse(s));
}
