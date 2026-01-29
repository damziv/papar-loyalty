import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("hr-HR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getDelta(row: any): number {
  // Most common names we’ve used in similar designs
  const candidates = ["points_delta", "delta_points", "points", "amount", "value"];
  for (const k of candidates) {
    const v = row?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function getReason(row: any): string {
  return (
    row?.reason ||
    row?.description ||
    row?.note ||
    row?.type ||
    (row?.order_id ? "Order" : "—")
  );
}

function deltaClasses(delta: number) {
  if (delta > 0) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (delta < 0) return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default async function PointsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get loyalty account (we’ll use it for balance if available)
  const { data: account, error: accErr } = await supabase
    .from("loyalty_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Points</h1>
              <p className="mt-1 text-sm text-gray-500">Your balance and history.</p>
            </div>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/app"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {accErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Ledger history
  const { data: ledger, error: ledErr } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (ledErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Points</h1>
              <p className="mt-1 text-sm text-gray-500">Your balance and history.</p>
            </div>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/app"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {ledErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Location name mapping (optional nice UX)
  const { data: locations } = await supabase.from("locations").select("id,name");

  const locMap = new Map<string, string>(
    (locations ?? []).map((l: any) => [l.id, l.name])
  );

  // Balance: prefer account.points_balance if present, else sum ledger
  const accountBalance =
    typeof (account as any)?.points_balance === "number"
      ? (account as any).points_balance
      : null;

  const computedBalance = (ledger ?? []).reduce((sum: number, row: any) => {
    return sum + getDelta(row);
  }, 0);

  const balance = accountBalance ?? computedBalance;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Points</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your rewards across all locations.
            </p>
          </div>
          <Link
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            href="/app"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Balance card */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Current balance</div>
                <div className="mt-2 text-4xl font-bold tracking-tight">
                  {balance}
                </div>
              </div>
              <div className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                Points
              </div>
            </div>

            {accountBalance === null ? (
              <div className="mt-2 text-xs text-gray-500">
                Balance is calculated from ledger history.
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">
                Balance is stored on your loyalty account.
              </div>
            )}

            <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
              Points are awarded when staff finalizes your pickup (QR scan).
            </div>
          </div>

          {/* Ledger */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight">History</h2>
              <div className="text-sm text-gray-500">
                Last {Math.min((ledger ?? []).length, 100)} entries
              </div>
            </div>

            <div className="mt-4">
              {(ledger ?? []).length === 0 ? (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                  No points history yet.
                </div>
              ) : (
                <div className="divide-y rounded-2xl border">
                  {(ledger ?? []).map((row: any) => {
                    const delta = getDelta(row);
                    const locName =
                      row?.location_id && locMap.has(row.location_id)
                        ? locMap.get(row.location_id)
                        : null;

                    return (
                      <div
                        key={row.id ?? `${row.created_at}-${row.order_id ?? ""}`}
                        className="p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium leading-snug">
                              {getReason(row)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {formatDate(row.created_at)}
                              {locName ? ` • ${locName}` : ""}
                              {row?.order_id
                                ? ` • Order ${String(row.order_id).slice(0, 8)}`
                                : ""}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${deltaClasses(
                              delta
                            )}`}
                          >
                            {delta >= 0 ? `+${delta}` : `${delta}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
