export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import RacesTabs from "./RacesTabs";
import { getRace, listPicksByRace } from "@/lib/storage";
import { computeHorseWinOdds, computeTrifectaPopularity } from "@/lib/odds";

export default async function RacesPage() {
  const heavy = getRace("race_heavy");
  const light = getRace("race_light");

  if (!heavy || !light) return <div className="p-6">レース定義が見つかりません</div>;

  const jar = cookies();

  async function buildRaceView(race: typeof heavy) {
    const picks = await listPicksByRace(race.id);
    const result = await getRaceResult(race.id);

    const voted = jar.get(`race_${race.id}_voted`)?.value === "1";
    const pickCookie = jar.get(`race_${race.id}_pick`)?.value;
    const myPickIds = pickCookie?.split(".") ?? null;

    return {
      race: { ...race, result: result ?? undefined },
      voted,
      myPickIds,
      closed: !!result,
      odds: computeHorseWinOdds(race, picks, 1),
      trifecta: computeTrifectaPopularity(picks),
      __debugPickCount: picks.length,
    };
  }

  const heavyView = await buildRaceView(heavy);
  const lightView = await buildRaceView(light);

  return <RacesTabs heavy={heavyView} light={lightView} />;
}
