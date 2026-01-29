import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("app_settings")
    .select(
      "points_per_eur, eur_per_100_points, discount_percent, cashback_percent, updated_at"
    )
    .eq("id", 1)
    .single();

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold">Failed to load settings</div>
        <div className="mt-1 text-sm text-red-700">{error.message}</div>
      </div>
    );
  }

  const lastUpdated = settings?.updated_at
    ? new Date(settings.updated_at).toLocaleString()
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Global loyalty rules. Applies to all locations.
          </p>
        </div>

        <div className="rounded-xl border bg-white px-3 py-2 text-xs text-gray-600">
          Last updated: <span className="font-medium text-gray-900">{lastUpdated}</span>
        </div>
      </div>

      {/* Rules */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Loyalty rules</h2>
            <p className="mt-1 text-sm text-gray-500">
              These values control how points, discounts, and cashback are calculated.
            </p>
          </div>
        </div>

        <form action={updateSettings} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Points per €</span>
            <input
              name="points_per_eur"
              defaultValue={settings?.points_per_eur ?? 1}
              inputMode="decimal"
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
            <span className="text-xs text-gray-500">
              Example: <span className="font-medium">1</span> means €1 = 1 point.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">€ per 100 points</span>
            <input
              name="eur_per_100_points"
              defaultValue={settings?.eur_per_100_points ?? 5}
              inputMode="decimal"
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
            <span className="text-xs text-gray-500">
              Example: <span className="font-medium">5</span> means 100 points = €5 value.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Discount % (pickup)</span>
            <input
              name="discount_percent"
              defaultValue={settings?.discount_percent ?? 15}
              inputMode="decimal"
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
            <span className="text-xs text-gray-500">
              Applied when staff finalizes pickup (QR scan).
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Cashback %</span>
            <input
              name="cashback_percent"
              defaultValue={settings?.cashback_percent ?? 0}
              inputMode="decimal"
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
            <span className="text-xs text-gray-500">
              Optional: add extra rewards on top of points.
            </span>
          </label>

          <div className="sm:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Tip: Keep values consistent across locations to avoid confusion.
            </div>

            <button className="w-full sm:w-auto rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
