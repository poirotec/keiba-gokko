import { cookies } from "next/headers";
import { getRace, listPicksByRace } from "@/lib/storage";
import { computeHorseWinOdds, isHit } from "@/lib/odds";
import VoteForm from "./VoteForm";

export default async function RacePage({ params }: { params: { raceId: string } }) {
  const raceId = params.raceId;
  const race = getRace(raceId);

  if (!race) return <div style={{ padding: 16 }}>Race not found: {raceId}</div>;

  const allPicks = listPicksByRace(raceId);

  // ? 各馬（1着予想）オッズ
  const { N, entries } = computeHorseWinOdds(race, allPicks, 1);

  // ? Next 16: cookies() は async
  const jar = await cookies();

  const voted = jar.get(`race_${raceId}_voted`)?.value === "1";
  const pickCookie = jar.get(`race_${raceId}_pick`)?.value; // "p01.p02.p03"
  const myPickIds = pickCookie?.split(".") ?? null;

  const closed = !!race.result;

  const horseName = (id: string) => race.horses.find((h) => h.id === id)?.name ?? id;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>{race.title}</h1>
      <p>状態: {closed ? "確定済み（投票終了）" : "受付中"}</p>

      <h2>出走（{race.horses.length}人）</h2>
      <ul>
        {[...race.horses]
          .sort((a, b) => a.number - b.number)
          .map((h) => (
            <li key={h.id}>
              {h.number}. {h.name}
            </li>
          ))}
      </ul>

      <hr />

      <h2>投票（三連単）</h2>
      {voted ? (
        <div>
          <p>このレースには投票済みです。</p>
          {myPickIds?.length === 3 && (
            <p>
              あなたの予想：{horseName(myPickIds[0])} - {horseName(myPickIds[1])} -{" "}
              {horseName(myPickIds[2])}
            </p>
          )}
        </div>
      ) : closed ? (
        <p>結果が確定したため投票は終了しました。</p>
      ) : (
        <VoteForm raceId={raceId} horses={race.horses} />
      )}

      <hr />

      <h2>各馬オッズ（1着予想の人気から計算）</h2>
      <p>総投票数: {N}</p>
      {entries.length === 0 ? (
        <p>まだ投票がありません。</p>
      ) : (
        <ol>
          {entries.map((e) => (
            <li key={e.horseId}>
              {e.number}. {e.name} / 1着指名 {e.count} / 人気 {(e.share * 100).toFixed(1)}% / 擬似単勝{" "}
              {e.odds.toFixed(2)}
            </li>
          ))}
        </ol>
      )}

      <hr />

      <h2>結果</h2>
      {race.result ? (
        <div>
          <p>
            1着: {horseName(race.result.firstId)} / 2着: {horseName(race.result.secondId)} / 3着:{" "}
            {horseName(race.result.thirdId)}
          </p>

          {voted && myPickIds?.length === 3 && (
            <p>
              あなたの判定：
              {isHit(race.result, {
                firstId: myPickIds[0],
                secondId: myPickIds[1],
                thirdId: myPickIds[2],
              })
                ? "? 的中"
                : "? ハズレ"}
            </p>
          )}
        </div>
      ) : (
        <p>未確定（/admin から入力）</p>
      )}
    </div>
  );
}
