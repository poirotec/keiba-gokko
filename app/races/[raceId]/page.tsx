import Link from "next/link";
import { getRace } from "@/lib/storage";

export default async function RacesPage() {
  const heavy = await getRace("race_heavy");
  const light = await getRace("race_light");

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        体重競馬ごっこ
      </h1>

      <div style={{ display: "grid", gap: 10 }}>
        <RaceCard title="重量級" race={heavy} />
        <RaceCard title="軽量級" race={light} />
      </div>
    </div>
  );
}

function RaceCard({
  title,
  race,
}: {
  title: string;
  race: Awaited<ReturnType<typeof getRace>>;
}) {
  if (!race) {
    return (
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ opacity: 0.8, fontSize: 13 }}>レースが見つかりません</div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>{race.title}</div>
        </div>

        <Link
          href={`/races/${race.id}`}
          style={{
            alignSelf: "center",
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          開く
        </Link>
      </div>
    </div>
  );
}
