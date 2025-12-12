"use client";

import { useMemo, useState } from "react";

type Horse = { id: string; number: number; name: string };

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

export default function VoteForm({ raceId, horses }: { raceId: string; horses: Horse[] }) {
  const sorted = useMemo(() => [...horses].sort((a, b) => a.number - b.number), [horses]);

  const options = useMemo(
    () =>
      sorted.map((h) => ({
        value: h.id,
        label: `${h.number}. ${h.name}`,
      })),
    [sorted]
  );

  const [firstId, setFirst] = useState(sorted[0]?.id ?? "");
  const [secondId, setSecond] = useState(sorted[1]?.id ?? sorted[0]?.id ?? "");
  const [thirdId, setThird] = useState(sorted[2]?.id ?? sorted[0]?.id ?? "");

  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setStatus(null);

    if (new Set([firstId, secondId, thirdId]).size !== 3) {
      setStatus({ kind: "err", msg: "同じ人を複数着に選べません" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/races/${raceId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstId, secondId, thirdId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatus({ kind: "err", msg: json?.error ?? "投票に失敗しました" });
        setBusy(false);
        return;
      }

      setStatus({ kind: "ok", msg: "投票しました！ページを更新してください。" });
    } catch {
      setStatus({ kind: "err", msg: "通信エラー" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">投票（三連単）</div>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">匿名・1回</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="1着" value={firstId} onChange={setFirst} options={options} />
        <Select label="2着" value={secondId} onChange={setSecond} options={options} />
        <Select label="3着" value={thirdId} onChange={setThird} options={options} />
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "送信中..." : "投票する"}
      </button>

      {status && (
        <div
          className={`mt-3 rounded-xl border p-3 text-sm ${
            status.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {status.msg}
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        ※ Cookieを削除/別端末/シークレットモードでは再投票できる可能性があります（仕様）。
      </p>
    </div>
  );
}
