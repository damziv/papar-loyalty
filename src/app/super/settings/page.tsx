import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("app_settings")
    .select("points_per_eur, eur_per_100_points, discount_percent, cashback_percent, updated_at")
    .eq("id", true)
    .single();

  if (error) {
    return (
      <div className="rounded-2xl border p-4">
        <div className="font-semibold">Failed to load settings</div>
        <div className="text-sm opacity-80">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm opacity-80">
          Global loyalty rules. Applies to all locations.
        </p>
      </div>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Loyalty rules</h2>
        <p className="mt-1 text-sm opacity-70">
          Last updated: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : "—"}
        </p>

        <form action={updateSettings} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm opacity-80">Points per €</span>
            <input
              name="points_per_eur"
              defaultValue={settings?.points_per_eur ?? 1}
              inputMode="decimal"
              className="rounded-xl border px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-80">€ per 100 points</span>
            <input
              name="eur_per_100_points"
              defaultValue={settings?.eur_per_100_points ?? 5}
              inputMode="decimal"
              className="rounded-xl border px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-80">Discount % (pickup)</span>
            <input
              name="discount_percent"
              defaultValue={settings?.discount_percent ?? 15}
              inputMode="decimal"
              className="rounded-xl border px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-80">Cashback %</span>
            <input
              name="cashback_percent"
              defaultValue={settings?.cashback_percent ?? 0}
              inputMode="decimal"
              className="rounded-xl border px-3 py-2"
              required
            />
          </label>

          <div className="sm:col-span-2">
            <button className="rounded-xl bg-black text-white px-4 py-2">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
