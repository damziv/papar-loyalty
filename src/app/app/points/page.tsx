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
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Points</h1>
        <p className="mt-2 text-sm text-red-600">{accErr.message}</p>
      </div>
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
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Points</h1>
        <p className="mt-2 text-sm text-red-600">{ledErr.message}</p>
      </div>
    );
  }

  // Location name mapping (optional nice UX)
  const { data: locations } = await supabase
    .from("locations")
    .select("id,name");

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
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Points</h1>
        <Link className="text-sm underline" href="/app">
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Balance card */}
        <div className="rounded-2xl border p-5">
          <div className="text-sm text-muted-foreground">Current balance</div>
          <div className="mt-2 text-4xl font-semibold">{balance}</div>

          {accountBalance === null ? (
            <div className="mt-2 text-xs text-muted-foreground">
              Balance is calculated from ledger history.
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">
              Balance is stored on your loyalty account.
            </div>
          )}

          <div className="mt-4 rounded-xl border p-3 text-sm text-muted-foreground">
            Points are awarded when staff finalizes your pickup (QR scan).
          </div>
        </div>

        {/* Ledger */}
        <div className="rounded-2xl border p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">History</h2>
            <div className="text-sm text-muted-foreground">
              Last {Math.min((ledger ?? []).length, 100)} entries
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(ledger ?? []).length === 0 ? (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                No points history yet.
              </div>
            ) : (
              (ledger ?? []).map((row: any) => {
                const delta = getDelta(row);
                const locName =
                  row?.location_id && locMap.has(row.location_id)
                    ? locMap.get(row.location_id)
                    : null;

                return (
                  <div
                    key={row.id ?? `${row.created_at}-${row.order_id ?? ""}`}
                    className="rounded-xl border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{getReason(row)}</div>
                      <div className={`font-semibold ${delta >= 0 ? "" : ""}`}>
                        {delta >= 0 ? `+${delta}` : `${delta}`}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(row.created_at)}
                      {locName ? ` • ${locName}` : ""}
                      {row?.order_id ? ` • Order ${String(row.order_id).slice(0, 8)}` : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
