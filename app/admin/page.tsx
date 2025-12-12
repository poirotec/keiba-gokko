import { getRace } from "@/lib/storage";
import AdminPanel from "./AdminPanel";

export default function AdminPage() {
  const heavy = getRace("race_heavy");
  const light = getRace("race_light");

  if (!heavy || !light) {
    return <div className="p-6">レース定義が見つかりません（data/races.json を確認）</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900">管理画面（結果入力）</h1>
        <p className="mt-1 text-sm text-neutral-600">
          ADMIN_KEY を入力して、重量級/軽量級の結果（三連単）を確定します。
        </p>

        <div className="mt-6">
          <AdminPanel races={[heavy, light]} />
        </div>

        <div className="mt-6 text-xs text-neutral-500">
          ※ 結果を確定すると投票は終了扱いになります（結果が入っているレースは投票不可）。
        </div>
      </div>
    </div>
  );
}
