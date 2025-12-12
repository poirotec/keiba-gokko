export type ComboKey = string; // "first-second-third"

// picks が持っていれば良い最小の形だけ定義
export type PickLike = {
  firstId: string;
  secondId: string;
  thirdId: string;
};

type Horse = { id: string; number: number; name: string; icon?: string };
type Race = { id: string; title: string; horses: Horse[] };

/** 三連単の人気（票数順） */
export function computeTrifectaPopularity(picks: PickLike[]) {
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

/**
 * 擬似単勝オッズ（1着票の人気から）
 * odds = 1/share * margin
 */
export function computeHorseWinOdds(race: Race, picks: PickLike[], margin: number = 1) {
  const firstCount = new Map<string, number>();
  for (const h of race.horses) firstCount.set(h.id, 0);

  for (const p of picks) {
    firstCount.set(p.firstId, (firstCount.get(p.firstId) ?? 0) + 1);
  }

  const N = picks.length;

  if (N === 0) {
    return { N: 0, entries: [] as any[] };
  }

  const entries = race.horses
    .map((h) => {
      const count = firstCount.get(h.id) ?? 0;
      const share = count / N;
      const odds = share > 0 ? (1 / share) * margin : Number.POSITIVE_INFINITY;

      return {
        horseId: h.id,
        number: h.number,
        name: h.name,
        icon: h.icon,
        count,
        share,
        odds,
      };
    })
    .sort((a, b) => b.count - a.count || a.number - b.number);

  return { N, entries };
}

/** 的中判定：三連単が一致していたら true */
export function isHit(
  result: { firstId: string; secondId: string; thirdId: string } | null | undefined,
  pick: { firstId: string; secondId: string; thirdId: string } | null | undefined
) {
  if (!result || !pick) return false;
  return (
    result.firstId === pick.firstId &&
    result.secondId === pick.secondId &&
    result.thirdId === pick.thirdId
  );
}
