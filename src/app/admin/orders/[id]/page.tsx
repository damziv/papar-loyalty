import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizePickup } from "./actions";

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
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
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // ✅ Robust params resolution (prevents empty/undefined id issues)
  const resolved = await Promise.resolve(params as any);
  const orderId = String(resolved?.id ?? "").trim();

  if (!isUuid(orderId)) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Invalid order id in URL: {orderId || "(empty)"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Roles
  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
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
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">You don’t have access.</p>
          </div>
        </div>
      </main>
    );
  }

  // Allowed locations for admins (super_admin bypass)
  let allowedLocationIds: string[] = [];

  if (!isSuperAdmin) {
    const { data: adminLocs, error: adminLocErr } = await supabase
      .from("admin_locations")
      .select("location_id")
      .eq("admin_user_id", user.id);

    if (adminLocErr) {
      return (
        <main className="min-h-screen bg-gray-50 px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Order</h1>
              <Link
                className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
                href="/admin/orders"
              >
                Back
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {adminLocErr.message}
              </p>
            </div>
          </div>
        </main>
      );
    }

    allowedLocationIds = Array.from(
      new Set(
        (adminLocs ?? [])
          .map((r: any) => String(r.location_id ?? ""))
          .filter((x) => isUuid(x))
      )
    );

    if (allowedLocationIds.length === 0) {
      return (
        <main className="min-h-screen bg-gray-50 px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Order</h1>
              <Link
                className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
                href="/admin/orders"
              >
                Back
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600">
                You are an admin but no locations are assigned.
              </p>
            </div>
          </div>
        </main>
      );
    }
  }

  // Fetch order with location scope
  let orderQuery = supabase
    .from("orders")
    .select(
      "id,status,subtotal_cents,discount_cents,total_cents,created_at,location_id,user_id"
    )
    .eq("id", orderId);

  if (!isSuperAdmin) {
    orderQuery = orderQuery.in("location_id", allowedLocationIds);
  }

  const { data: order, error: orderErr } = await orderQuery.maybeSingle();

  if (orderErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {orderErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              Order not found or you don’t have access.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Location name
  const { data: locationRow } = await supabase
    .from("locations")
    .select("name")
    .eq("id", order.location_id)
    .maybeSingle();

  const locationName = locationRow?.name ?? String(order.location_id).slice(0, 8);

  // Items with menu names
  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("id,quantity,unit_price_cents,line_total_cents,menu_item_id,menu_items(name)")
    .eq("order_id", orderId);

  if (itemsErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Order</h1>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/admin/orders"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {itemsErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Order #{order.id.slice(0, 8)}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-500">
              Location: <span className="font-medium text-gray-700">{locationName}</span>
            </div>
          </div>

          <Link
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            href="/admin/orders"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: receipt */}
          <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Items</h2>
              <div className="text-xs text-gray-500">
                {(items ?? []).length} item{(items ?? []).length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-4 divide-y rounded-2xl border">
              {(items ?? []).length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No items found.</div>
              ) : (
                (items ?? []).map((it: any) => {
                  const itemName =
                    it.menu_items?.name ?? String(it.menu_item_id).slice(0, 8);

                  return (
                    <div key={it.id} className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium leading-snug">{itemName}</div>
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
                })
              )}
            </div>

            <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">€{euros(order.subtotal_cents)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">€{euros(order.discount_cents)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>€{euros(order.total_cents)}</span>
              </div>
            </div>
          </section>

          {/* Right: finalize */}
          <aside className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 h-fit">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Finalize at pickup</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the customer’s card code (from their QR).
                </p>
              </div>
              <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                Action
              </span>
            </div>

            <form action={finalizePickup} className="mt-4 space-y-3">
              <input type="hidden" name="order_id" value={orderId} />
              <div>
                <label className="text-sm font-medium text-gray-700">Card code</label>
                <input
                  name="card_code"
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-mono outline-none
                             focus:ring-2 focus:ring-black/10"
                  placeholder="Paste card code here"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white
                           hover:bg-gray-900 disabled:opacity-50 disabled:hover:bg-black"
                disabled={order.status !== "created"}
                title={order.status !== "created" ? "Order is not pending" : "Finalize"}
              >
                Finalize pickup
              </button>
            </form>

            {order.status !== "created" ? (
              <div className="mt-3 rounded-2xl border bg-gray-50 p-3 text-sm text-gray-600">
                This order is already finalized.
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border bg-amber-50 p-3 text-sm text-amber-800 border-amber-200">
                Tip: Scan the customer’s QR and paste the code here to apply discount + points.
              </div>
            )}
          </aside>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
