import { cookies } from "next/headers";
import RacesTabs from "./RacesTabs";
import { getRace, listPicksByRace } from "@/lib/storage";
import { computeHorseWinOdds, computeTrifectaPopularity } from "@/lib/odds";

type NonNull<T> = T extends null | undefined ? never : T;

export default async function RacesPage() {
  const heavy0 = getRace("race_heavy");
  const light0 = getRace("race_light");

  if (!heavy0 || !light0) {
    return <div className="p-6">レース定義が見つかりません（data/races.json を確認）</div>;
  }

  // ここから先は non-null として扱う
  const heavy: NonNull<typeof heavy0> = heavy0;
  const light: NonNull<typeof light0> = light0;

  const jar = await cookies();

  function buildRaceView(race: NonNull<typeof heavy0>) {
    const picks = listPicksByRace(race.id);

    const voted = jar.get(`race_${race.id}_voted`)?.value === "1";
    const pickCookie = jar.get(`race_${race.id}_pick`)?.value;
    const myPickIds = pickCookie?.split(".") ?? null;

    return {
      race,
      voted,
      myPickIds,
      closed: !!race.result,
      odds: computeHorseWinOdds(race, picks, 1),
      trifecta: computeTrifectaPopularity(picks),
    };
  }

  return <RacesTabs heavy={buildRaceView(heavy)} light={buildRaceView(light)} />;
}
