import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizeFromPickup } from "./actions";

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

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

export default async function AdminPickupPage({
  searchParams,
}: {
  searchParams:
    | { card_code?: string; done?: string }
    | Promise<{ card_code?: string; done?: string }>;
}) {
  // ✅ Next.js can pass searchParams as a Promise in some versions
  const sp = await Promise.resolve(searchParams as any);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-bold tracking-tight">Pickup</h1>
          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {rolesErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isSuperAdmin && !isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-bold tracking-tight">Pickup</h1>
          <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">You don’t have access.</p>
          </div>
        </div>
      </main>
    );
  }

  const cardCode = String(sp?.card_code ?? "").trim().toLowerCase();
  const showDone = String(sp?.done ?? "") === "1";

  let rows: any[] = [];
  let lookupError: string | null = null;

  if (cardCode) {
    const { data, error } = await supabase.rpc("get_pending_orders_for_pickup", {
      p_card_code: cardCode,
    });

    if (error) lookupError = error.message;
    else rows = (data ?? []) as any[];
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pickup</h1>
            <p className="mt-1 text-sm text-gray-500">
              Paste/scan customer QR card code to find pending orders.
            </p>
          </div>
          <Link
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            href="/admin"
          >
            Back
          </Link>
        </div>

        {/* Scanner / input card */}
        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold">Customer card code</div>
              <div className="mt-1 text-sm text-gray-500">
                Tip: on mobile, long-press to paste quickly.
              </div>
            </div>

            {cardCode ? (
              <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-700">
                Looking up: <span className="font-mono font-semibold">{cardCode}</span>
              </div>
            ) : null}
          </div>

          <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              name="card_code"
              defaultValue={cardCode}
              className="flex-1 rounded-xl border bg-white px-3 py-3 text-sm font-mono outline-none
                         focus:ring-2 focus:ring-black/10"
              placeholder="Paste card code here"
              required
            />
            <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900">
              Find orders
            </button>
          </form>

          {showDone ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              ✅ Order finalized successfully.
            </div>
          ) : null}

          {cardCode ? (
            <div className="mt-3 text-sm text-gray-500">
              Found <span className="font-semibold text-gray-900">{rows.length}</span>{" "}
              pending order(s).
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-500">
              Enter a card code to begin.
            </div>
          )}
        </div>

        {/* Results */}
        {cardCode ? (
          <div className="mt-6">
            {lookupError ? (
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {lookupError}
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
                No pending orders found for this customer.
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((o) => (
                  <div
                    key={o.order_id}
                    className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold">
                            Order #{String(o.order_id).slice(0, 8)}
                          </div>
                          <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                            pending
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {o.location_name} • {formatDate(o.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-lg font-bold">
                          €{euros(o.total_cents)}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-4 divide-y rounded-2xl border">
                      {(o.items ?? []).map((it: any, idx: number) => (
                        <div key={`${o.order_id}-${idx}`} className="p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium leading-snug">{it.name}</div>
                              <div className="mt-1 text-sm text-gray-500">
                                €{euros(it.unit_price_cents)} × {it.quantity}
                              </div>
                            </div>
                            <div className="shrink-0 font-semibold">
                              €{euros(it.line_total_cents)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <form action={finalizeFromPickup}>
                        <input type="hidden" name="order_id" value={o.order_id} />
                        <input type="hidden" name="card_code" value={cardCode} />
                        <button className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
                          Finalize pickup
                        </button>
                      </form>

                      <Link
                        href={`/admin/orders/${o.order_id}`}
                        className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-center
                                   hover:bg-gray-50"
                      >
                        Open details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="h-8" />
      </div>
    </main>
  );
}
