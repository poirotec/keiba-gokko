export type ComboKey = string; // "first-second-third"

// picks が持っていれば良い最小の形だけ定義（衝突しない）
type PickLike = {
  firstId: string;
  secondId: string;
  thirdId: string;
};

type Horse = { id: string; number: number; name: string; icon?: string };
type Race = { id: string; title: string; horses: Horse[] };

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
 * 擬似単勝オッズ（1着に選ばれた人気から算出）
 * - 投票が0のときは空
 * - count=0の馬は share=0, odds=Infinity 扱いになるので、表示側で除外するのが無難
 */
export function computeHorseWinOdds(race: Race, picks: PickLike[], margin: number = 1) {
  // 1着票のカウント
  const firstCount = new Map<string, number>();
  for (const h of race.horses) firstCount.set(h.id, 0);

  for (const p of picks) {
    firstCount.set(p.firstId, (firstCount.get(p.firstId) ?? 0) + 1);
  }

  const N = picks.length;

  // N=0なら空で返す
  if (N === 0) {
    return { N: 0, entries: [] as any[] };
  }

  const entries = race.horses
    .map((h) => {
      const count = firstCount.get(h.id) ?? 0;
      const share = count / N;
      // 擬似単勝：人気が高いほどオッズが低い（単純な逆数モデル）
      // margin は「控除率っぽい調整」（1ならそのまま）
      const odds = share > 0 ? (1 / share) * margin : Number.POSITIVE_INFINITY;
      return {
        horseId: h.id,
        number: h.number,
        name: h.name,
        icon: (h as any).icon,
        count,
        share,
        odds,
      };
    })
    // 表示は人気順（count desc）→ 枠番順で安定
    .sort((a, b) => b.count - a.count || a.number - b.number);

  return { N, entries };
}
