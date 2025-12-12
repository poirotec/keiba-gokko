"use client";

import { useMemo, useState } from "react";
import VoteForm from "./[raceId]/VoteForm";

type Horse = { id: string; number: number; name: string };

type OddsEntry = {
  horseId: string;
  number: number;
  name: string;
  count: number;
  odds: number;
  share: number;
};

type TrifectaEntry = {
  key: string; // "p01-p02-p03"
  count: number;
};

type RaceView = {
  race: {
    id: string;
    title: string;
    horses: Horse[];
    result?: { firstId: string; secondId: string; thirdId: string };
  };
  odds: { N: number; entries: OddsEntry[] };
  trifecta: { total: number; entries: TrifectaEntry[] };
  voted: boolean;
  myPickIds: string[] | null;
  closed: boolean;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-100">
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">{children}</div>;
}

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-4">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {right}
    </div>
  );
}

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="mr-2">??</span>;
  if (rank === 2) return <span className="mr-2">??</span>;
  if (rank === 3) return <span className="mr-2">??</span>;
  return <span className="mr-2 text-neutral-400">{rank}.</span>;
}

function SegTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { key: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
      {items.map((it) => (
        <button
          key={it.key}
          className={`rounded-2xl px-4 py-2 text-sm font-medium ${
            value === it.key ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
          }`}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function RacesTabs({ heavy, light }: { heavy: RaceView; light: RaceView }) {
  const [raceTab, setRaceTab] = useState<"heavy" | "light">("heavy");
  const current = raceTab === "heavy" ? heavy : light;

  // 右側の表示タブ（縦長改善の主役）
  const [rightTab, setRightTab] = useState<"odds" | "horses">("odds");

  const horseName = useMemo(
    () => (id: string) => current.race.horses.find((h) => h.id === id)?.name ?? id,
    [current.race.horses]
  );

  const myPickText =
    current.myPickIds?.length === 3
      ? `${horseName(current.myPickIds[0])} → ${horseName(current.myPickIds[1])} → ${horseName(current.myPickIds[2])}`
      : null;

  const resultText = current.race.result
    ? `${horseName(current.race.result.firstId)} / ${horseName(current.race.result.secondId)} / ${horseName(
        current.race.result.thirdId
      )}`
    : null;

  const myKey =
    current.myPickIds?.length === 3 ? `${current.myPickIds[0]}-${current.myPickIds[1]}-${current.myPickIds[2]}` : null;

  const horsesSorted = useMemo(
    () => [...current.race.horses].sort((a, b) => a.number - b.number),
    [current.race.horses]
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">プロ体体重競馬ごっこ</h1>
          <p className="mt-1 text-sm text-neutral-600">
            三連単で予想！オッズは疑似計算です。
          </p>
        </div>

        {/* Race Tabs */}
        <div className="mb-6">
          <SegTabs
            value={raceTab}
            onChange={(v) => setRaceTab(v as any)}
            items={[
              { key: "heavy", label: "重量級" },
              { key: "light", label: "軽量級" },
            ]}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: 投票 */}
          <Card>
            <CardHeader title={current.race.title} right={<Badge>{current.closed ? "確定済み" : "受付中"}</Badge>} />
            <div className="p-4">
              <div className="mb-4 rounded-xl bg-neutral-50 p-3">
                <div className="text-xs text-neutral-500">あなたの予想（三連単）</div>
                <div className="mt-1 text-sm font-medium text-neutral-900">
                  {myPickText ?? (current.voted ? "投票済み（内容取得不可）" : "未投票")}
                </div>
              </div>

              {current.voted ? (
                <div className="rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700">
                  このレースは投票済みです。
                </div>
              ) : current.closed ? (
                <div className="rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700">
                  結果が確定したため投票は終了しました。
                </div>
              ) : (
                <VoteForm raceId={current.race.id} horses={current.race.horses} />
              )}

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-neutral-900">結果</h3>
                <div className="mt-2 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700">
                  {resultText ?? "未確定（主催が入力）"}
                </div>
              </div>
            </div>
          </Card>

          {/* Right: タブで高さを抑える */}
          <Card>
            <CardHeader
              title={rightTab === "odds" ? "オッズ / 人気" : `出走（${current.race.horses.length}人）`}
              right={
                <div className="flex items-center gap-2">
                  <Badge>{rightTab === "odds" ? `総投票 ${current.odds.N}` : "一覧"}</Badge>
                  <div className="hidden sm:block">
                    <SegTabs
                      value={rightTab}
                      onChange={(v) => setRightTab(v as any)}
                      items={[
                        { key: "odds", label: "オッズ" },
                        { key: "horses", label: "出走" },
                      ]}
                    />
                  </div>
                </div>
              }
            />

            {/* モバイル用のタブ（ヘッダ右に入らないので） */}
            <div className="p-4 sm:hidden">
              <SegTabs
                value={rightTab}
                onChange={(v) => setRightTab(v as any)}
                items={[
                  { key: "odds", label: "オッズ" },
                  { key: "horses", label: "出走" },
                ]}
              />
            </div>

            <div className="p-4 pt-0">
              {rightTab === "odds" ? (
                <div className="grid gap-4">
                  {/* 各馬オッズ */}
                  {current.odds.entries.length === 0 ? (
                    <div className="text-sm text-neutral-600">まだ投票がありません。</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-100 text-neutral-700">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">馬</th>
                            <th className="px-3 py-2 text-right font-medium">人気</th>
                            <th className="px-3 py-2 text-right font-medium">単勝</th>
                          </tr>
                        </thead>
                        <tbody>
                          {current.odds.entries.map((e) => (
                            <tr key={e.horseId} className="border-t border-neutral-200">
                              <td className="px-3 py-2">
                                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                                  {e.number}
                                </span>
                                <span className="font-medium text-neutral-900">{e.name}</span>
                              </td>
                              <td className="px-3 py-2 text-right text-neutral-700">
                                {(e.share * 100).toFixed(1)}%（{e.count}）
                              </td>
                              <td className="px-3 py-2 text-right font-semibold tabular-nums text-neutral-900">
                                {e.odds.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 三連単人気：同じカード内で上位だけ */}
                  <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-neutral-900">三連単 人気ランキング</div>
                      <div className="text-xs text-neutral-600">総投票 {current.trifecta.total}</div>
                    </div>

                    {current.trifecta.entries.length === 0 ? (
                      <div className="text-sm text-neutral-600">まだ投票がありません。</div>
                    ) : (
                      <ol className="space-y-2">
                        {current.trifecta.entries.slice(0, 5).map((e, i) => {
                          const [a, b, c] = e.key.split("-");
                          const label = `${horseName(a)} → ${horseName(b)} → ${horseName(c)}`;
                          const isMine = myKey && e.key === myKey;

                          return (
                            <li
                              key={e.key}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                                isMine ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center text-sm font-medium text-neutral-900">
                                <Medal rank={i + 1} />
                                <span>{label}</span>
                                {isMine && <span className="ml-2 text-xs text-neutral-600">(あなた)</span>}
                              </div>
                              <div className="text-sm text-neutral-700">{e.count} 票</div>
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    <div className="mt-2 text-xs text-neutral-500">
                      ※ 三連単は「投票された回数」で人気順（オッズ計算は表示しません）
                    </div>
                  </div>
                </div>
              ) : (
                // 出走タブ
                <div className="grid grid-cols-2 gap-2">
                  {horsesSorted.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-800">
                        {h.number}
                      </span>
                      <span className="text-sm font-medium text-neutral-900">{h.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-8 text-xs text-neutral-500">
          ※ Cookieを削除/別端末/シークレットモードでは再投票できる可能性があります（仕様）。
        </div>
      </div>
    </div>
  );
}
