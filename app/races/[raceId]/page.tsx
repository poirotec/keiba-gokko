import { cookies } from "next/headers";
import { getRace, listPicksByRace } from "@/lib/storage";
import { computeHorseWinOdds, computeTrifectaPopularity } from "@/lib/odds";
import VoteForm from "./VoteForm";

export default async function RacePage({
  params,
}: {
  params: { raceId: string };
}) {
  const race = await getRace(params.raceId);

  if (!race) {
    return <div style={{ padding: 16 }}>Race not found: {params.raceId}</div>;
  }

  const allPicks = await listPicksByRace(race.id);

  const { entries } = computeHorseWinOdds(race, allPicks, 1);
  const trifecta = computeTrifectaPopularity(allPicks).entries;

  // cookie は「表示用に読んでおくだけ」（VoteFormへは渡さない）
  const jar = await cookies();
  const voted = jar.get(`race_${race.id}_voted`)?.value === "1";

  const horseName = (id: string) => {
    const h = race.horses.find((x: { id: string; name: string }) => x.id === id);
    return h?.name ?? id;
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        {race.title}
      </h1>

      {voted && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            opacity: 0.9,
            fontSize: 13,
          }}
        >
          ? この端末（cookie）からは投票済みです
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          各馬（1着予想）オッズ
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 8,
          }}
        >
          {entries.map((e) => (
            <div
              key={e.horseId}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>{horseName(e.horseId)}</div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>
                {e.odds.toFixed(2)} 倍
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          三連単 人気（投票数順）
        </h2>

        <div style={{ display: "grid", gap: 8 }}>
          {trifecta.slice(0, 20).map((t) => {
            const [firstId, secondId, thirdId] = t.key.split("-");
            return (
              <div
                key={t.key}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {horseName(firstId)} → {horseName(secondId)} →{" "}
                  {horseName(thirdId)}
                </div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>{t.count} 票</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {/* voted は VoteForm の型に無いので渡さない */}
        <VoteForm raceId={race.id} horses={race.horses} />
      </div>
    </div>
  );
}
