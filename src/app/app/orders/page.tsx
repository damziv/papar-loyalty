import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /**
   * Single query with nested relations:
   * - locations(name) via orders.location_id -> locations.id
   * - order_items(...) via order_items.order_id -> orders.id
   * - menu_items(name) via order_items.menu_item_id -> menu_items.id
   *
   * If your PostgREST relationship names differ, this will error clearly and we’ll adjust.
   */
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      created_at,
      location_id,
      subtotal_cents,
      discount_cents,
      total_cents,
      locations(name),
      order_items(
        id,
        quantity,
        unit_price_cents,
        line_total_cents,
        menu_item_id,
        menu_items(name)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <Link className="text-sm underline" href="/app">
            Back
          </Link>
        </div>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <Link className="text-sm underline" href="/app/menu">
          Back to menu
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            No orders yet.
          </div>
        ) : (
          (orders ?? []).map((o: any) => {
            const locationName =
              o.locations?.name ?? String(o.location_id).slice(0, 8);

            const items = (o.order_items ?? []) as any[];

            return (
              <div key={o.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Order #{String(o.id).slice(0, 8)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {locationName} • {formatDate(o.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-1 text-sm">
                      {o.status}
                    </span>
                    <span className="text-sm font-semibold">
                      €{euros(o.total_cents)}
                    </span>
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-3 grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-3">
                  <div className="flex justify-between sm:block">
                    <span className="text-muted-foreground">Subtotal</span>{" "}
                    <span className="font-medium">€{euros(o.subtotal_cents)}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-muted-foreground">Discount</span>{" "}
                    <span className="font-medium">€{euros(o.discount_cents)}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-muted-foreground">Total</span>{" "}
                    <span className="font-semibold">€{euros(o.total_cents)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3">
                  <div className="text-sm font-medium">Items</div>

                  {items.length === 0 ? (
                    <div className="mt-2 rounded-xl border p-3 text-sm text-muted-foreground">
                      No items found for this order.
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {items.map((it: any) => {
                        const name =
                          it.menu_items?.name ??
                          String(it.menu_item_id).slice(0, 8);

                        return (
                          <div
                            key={it.id}
                            className="flex items-center justify-between rounded-xl border p-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">{name}</div>
                              <div className="text-muted-foreground">
                                €{euros(it.unit_price_cents)} × {it.quantity}
                              </div>
                            </div>
                            <div className="font-semibold">
                              €{euros(it.line_total_cents)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {o.status === "created" ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Waiting for pickup finalize (QR scan at counter).
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
