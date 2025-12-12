import { cookies } from "next/headers";
import { getRace, listPicksByRace } from "@/lib/storage";
import { computeHorseWinOdds, computeTrifectaPopularity } from "@/lib/odds";
import RacesTabs from "./RacesTabs";

export default async function RacesPage() {
  const heavy = getRace("race_heavy");
  const light = getRace("race_light");

  if (!heavy || !light) {
    return <div style={{ padding: 16 }}>レース定義が見つかりません</div>;
  }

  // ? Next 16: cookies は async
  const jar = await cookies();

  function buildRaceView(race: typeof heavy) {
    const picks = listPicksByRace(race.id);

    // ? ここで定義する
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
