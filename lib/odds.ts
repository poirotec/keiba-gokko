import type { Pick } from "./storage";

export type ComboKey = string; // "first-second-third"

export function comboKey(firstId: string, secondId: string, thirdId: string): ComboKey {
  return `${firstId}-${secondId}-${thirdId}`;
}

/**
 * DBなし・購入なしなので「投稿数ベースの擬似オッズ」
 * N: 総投稿数、c: その組の投稿数
 * odds = (N + alpha) / (c + alpha)   (alpha=1 推奨)
 */
export function computePseudoOdds(picks: Pick[], alpha = 1) {
  const N = picks.length;
  const counts = new Map<ComboKey, number>();

  for (const p of picks) {
    const k = comboKey(p.firstId, p.secondId, p.thirdId);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const entries = [...counts.entries()].map(([k, c]) => {
    const odds = (N + alpha) / (c + alpha);
    const share = N > 0 ? c / N : 0;
    return { key: k, count: c, odds, share };
  });

  // 人気順（count desc）
  entries.sort((a, b) => b.count - a.count);

  return { N, entries };
}

export function isHit(
  result: { firstId: string; secondId: string; thirdId: string } | undefined,
  pick: { firstId: string; secondId: string; thirdId: string }
) {
  if (!result) return false;
  return (
    result.firstId === pick.firstId &&
    result.secondId === pick.secondId &&
    result.thirdId === pick.thirdId
  );
}

import type { Pick, Race } from "./storage";

export function computeHorseWinOdds(race: Race, picks: Pick[], alpha = 1) {
  const N = picks.length;
  const counts = new Map<string, number>();

  for (const h of race.horses) counts.set(h.id, 0);
  for (const p of picks) counts.set(p.firstId, (counts.get(p.firstId) ?? 0) + 1);

  const entries = race.horses.map((h) => {
    const c = counts.get(h.id) ?? 0;
    const odds = (N + alpha) / (c + alpha);
    const share = N > 0 ? c / N : 0;
    return { horseId: h.id, number: h.number, name: h.name, count: c, odds, share };
  });

  // 人気順（1着指名回数が多い順）
  entries.sort((a, b) => b.count - a.count);

  return { N, entries };
}

import type { Pick } from "./storage";

export function computeTrifectaPopularity(picks: Pick[]) {
  const map = new Map<string, number>();

  for (const p of picks) {
    const key = `${p.firstId}-${p.secondId}-${p.thirdId}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const entries = [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: picks.length,
    entries,
  };
}
