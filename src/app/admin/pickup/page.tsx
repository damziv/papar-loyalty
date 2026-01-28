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
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pickup</h1>
        <p className="mt-2 text-sm text-red-600">{rolesErr.message}</p>
      </div>
    );
  }

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pickup</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don’t have access.</p>
      </div>
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
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Pickup</h1>
        <Link className="text-sm underline" href="/admin">
          Back
        </Link>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Paste/scan customer QR card code to find their pending orders.
      </p>

      <form method="get" className="mt-4 flex gap-2 max-w-xl">
        <input
          name="card_code"
          defaultValue={cardCode}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
          placeholder="Paste card code here"
          required
        />
        <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
          Find orders
        </button>
      </form>

      {showDone ? (
        <div className="mt-3 rounded-xl border p-3 text-sm">
          ✅ Order finalized successfully.
        </div>
      ) : null}

      {cardCode ? (
        <div className="mt-4 text-sm text-muted-foreground">
          Lookup for <span className="font-mono">{cardCode}</span>: found{" "}
          <span className="font-semibold">{rows.length}</span> pending order(s).
        </div>
      ) : null}

      {cardCode ? (
        <div className="mt-6">
          {lookupError ? (
            <div className="rounded-2xl border p-4 text-sm text-red-600">{lookupError}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
              No pending orders found for this customer.
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((o) => (
                <div key={o.order_id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        Order #{String(o.order_id).slice(0, 8)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {o.location_name} • {formatDate(o.created_at)}
                      </div>
                    </div>

                    <div className="text-sm font-semibold">Total €{euros(o.total_cents)}</div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(o.items ?? []).map((it: any, idx: number) => (
                      <div
                        key={`${o.order_id}-${idx}`}
                        className="flex items-center justify-between rounded-xl border p-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">{it.name}</div>
                          <div className="text-muted-foreground">
                            €{euros(it.unit_price_cents)} × {it.quantity}
                          </div>
                        </div>
                        <div className="font-semibold">€{euros(it.line_total_cents)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <form action={finalizeFromPickup}>
                      <input type="hidden" name="order_id" value={o.order_id} />
                      <input type="hidden" name="card_code" value={cardCode} />
                      <button className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                        Finalize pickup
                      </button>
                    </form>

                    <Link
                      href={`/admin/orders/${o.order_id}`}
                      className="w-full rounded-lg border px-4 py-2 text-sm text-center hover:bg-muted"
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
    </div>
  );
}
