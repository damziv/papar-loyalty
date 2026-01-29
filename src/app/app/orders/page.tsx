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

function statusClasses(status?: string) {
  switch (status) {
    case "created":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "ready":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "picked_up":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
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
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track pickup and totals.
              </p>
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
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              View your recent orders and pickup status.
            </p>
          </div>
          <Link
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            href="/app/menu"
          >
            Back to menu
          </Link>
        </div>

        {/* List */}
        <div className="mt-6 space-y-4">
          {(orders ?? []).length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
              No orders yet.
            </div>
          ) : (
            (orders ?? []).map((o: any) => {
              const locationName =
                o.locations?.name ?? String(o.location_id).slice(0, 8);

              const items = (o.order_items ?? []) as any[];

              return (
                <div
                  key={o.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">
                          Order #{String(o.id).slice(0, 8)}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {locationName} • {formatDate(o.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-lg font-bold">
                        €{euros(o.total_cents)}
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 grid gap-2 rounded-2xl border bg-gray-50 p-3 text-sm sm:grid-cols-3 sm:p-4">
                    <div className="flex items-center justify-between sm:block">
                      <div className="text-gray-500">Subtotal</div>
                      <div className="font-medium">€{euros(o.subtotal_cents)}</div>
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <div className="text-gray-500">Discount</div>
                      <div className="font-medium">€{euros(o.discount_cents)}</div>
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <div className="text-gray-500">Total</div>
                      <div className="font-semibold">€{euros(o.total_cents)}</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold">Items</div>

                    {items.length === 0 ? (
                      <div className="mt-2 rounded-2xl border bg-gray-50 p-3 text-sm text-gray-500">
                        No items found for this order.
                      </div>
                    ) : (
                      <div className="mt-2 divide-y rounded-2xl border bg-white">
                        {items.map((it: any) => {
                          const name =
                            it.menu_items?.name ??
                            String(it.menu_item_id).slice(0, 8);

                          return (
                            <div key={it.id} className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium leading-snug">
                                    {name}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-500">
                                    €{euros(it.unit_price_cents)} × {it.quantity}
                                  </div>
                                </div>
                                <div className="shrink-0 font-semibold">
                                  €{euros(it.line_total_cents)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {o.status === "created" ? (
                    <div className="mt-4 rounded-2xl border bg-amber-50 p-3 text-sm text-amber-800">
                      Waiting for pickup finalize (QR scan at counter).
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
