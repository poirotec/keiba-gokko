"use client";

import { useMemo, useState } from "react";

type Horse = { id: string; number: number; name: string };
type Race = {
  id: string;
  title: string;
  horses: Horse[];
  result?: { firstId: string; secondId: string; thirdId: string };
};

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
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
      {children}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-neutral-700">{label}</div>
      <select
        className="w-full appearance-none rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function horseName(race: Race, id: string) {
  return race.horses.find((h) => h.id === id)?.name ?? id;
}

export default function AdminPanel({ races }: { races: Race[] }) {
  const [adminKey, setAdminKey] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {races.map((race) => (
        <RaceResultCard key={race.id} race={race} adminKey={adminKey} setAdminKey={setAdminKey} />
      ))}
    </div>
  );
}

function RaceResultCard({
  race,
  adminKey,
  setAdminKey,
}: {
  race: Race;
  adminKey: string;
  setAdminKey: (v: string) => void;
}) {
  const sorted = useMemo(() => [...race.horses].sort((a, b) => a.number - b.number), [race.horses]);

  const options = useMemo(
    () =>
      sorted.map((h) => ({
        value: h.id,
        label: `${h.number}. ${h.name}`,
      })),
    [sorted]
  );

  const initFirst = race.result?.firstId ?? sorted[0]?.id ?? "";
  const initSecond = race.result?.secondId ?? sorted[1]?.id ?? sorted[0]?.id ?? "";
  const initThird = race.result?.thirdId ?? sorted[2]?.id ?? sorted[0]?.id ?? "";

  const [firstId, setFirst] = useState(initFirst);
  const [secondId, setSecond] = useState(initSecond);
  const [thirdId, setThird] = useState(initThird);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const currentResultText = race.result
    ? `${horseName(race, race.result.firstId)} / ${horseName(race, race.result.secondId)} / ${horseName(
        race,
        race.result.thirdId
      )}`
    : "未確定";

  async function submit() {
    setMsg(null);

    if (!adminKey) {
      setMsg({ kind: "err", text: "ADMIN_KEY を入力してください" });
      return;
    }
    if (new Set([firstId, secondId, thirdId]).size !== 3) {
      setMsg({ kind: "err", text: "同じ馬を複数着に指定できません" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/races/${race.id}/result`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstId, secondId, thirdId, adminKey }),
      });
      const json = await res.json();

      if (!res.ok) {
        setMsg({ kind: "err", text: json?.error ?? "失敗しました" });
        return;
      }

      setMsg({ kind: "ok", text: "結果を保存しました。/races を更新してください。" });
    } catch {
      setMsg({ kind: "err", text: "通信エラー" });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setMsg(null);

    if (!adminKey) {
      setMsg({ kind: "err", text: "ADMIN_KEY を入力してください" });
      return;
    }

    if (!confirm("結果をリセットして未確定に戻します。よろしいですか？")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/races/${race.id}/result`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      const json = await res.json();

      if (!res.ok) {
        setMsg({ kind: "err", text: json?.error ?? "失敗しました" });
        return;
      }

      setMsg({ kind: "ok", text: "結果をリセットしました。/races を更新してください。" });
    } catch {
      setMsg({ kind: "err", text: "通信エラー" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title={race.title} right={<Badge>{race.result ? "確定済み" : "未確定"}</Badge>} />
      <div className="p-4">
        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3">
          <div className="text-xs text-neutral-500">現在の結果</div>
          <div className="mt-1 text-sm font-semibold text-neutral-900">{currentResultText}</div>
        </div>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-neutral-700">ADMIN_KEY（共通）</div>
          <input
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="例: poi-admin-123"
            type="password"
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Select label="1着" value={firstId} onChange={setFirst} options={options} />
          <Select label="2着" value={secondId} onChange={setSecond} options={options} />
          <Select label="3着" value={thirdId} onChange={setThird} options={options} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "処理中..." : "結果を確定する"}
          </button>

          <button
            onClick={reset}
            disabled={busy}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            リセット（未確定に戻す）
          </button>
        </div>

        {msg && (
          <div
            className={`mt-3 rounded-xl border p-3 text-sm ${
              msg.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="mt-3 text-xs text-neutral-500">
          ※ 保存/リセット後、表示反映のために <span className="font-semibold">/races</span> をリロードしてください。
        </div>
      </div>
    </Card>
  );
}
