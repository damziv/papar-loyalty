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
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-red-600">
          Invalid order id in URL: {orderId || "(empty)"}
        </p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
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
    .eq("admin_user_id", user.id);

  if (rolesErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-red-600">{rolesErr.message}</p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don’t have access.</p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
    );
  }

  // Allowed locations for admins (super_admin bypass)
  let allowedLocationIds: string[] = [];

  if (!isSuperAdmin) {
    const { data: adminLocs, error: adminLocErr } = await supabase
      .from("admin_locations")
      .select("location_id")
      .eq("user_id", user.id);

    if (adminLocErr) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Order</h1>
          <p className="mt-2 text-sm text-red-600">{adminLocErr.message}</p>
          <div className="mt-4">
            <Link className="underline" href="/admin/orders">
              Back
            </Link>
          </div>
        </div>
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
        <div className="p-6">
          <h1 className="text-xl font-semibold">Order</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are an admin but no locations are assigned.
          </p>
          <div className="mt-4">
            <Link className="underline" href="/admin/orders">
              Back
            </Link>
          </div>
        </div>
      );
    }
  }

  // Fetch order with location scope
  let orderQuery = supabase
    .from("orders")
    .select("id,status,subtotal_cents,discount_cents,total_cents,created_at,location_id,user_id")
    .eq("id", orderId);

  if (!isSuperAdmin) {
    orderQuery = orderQuery.in("location_id", allowedLocationIds);
  }

  const { data: order, error: orderErr } = await orderQuery.maybeSingle();

  if (orderErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-red-600">{orderErr.message}</p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order not found or you don’t have access.
        </p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
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
      <div className="p-6">
        <h1 className="text-xl font-semibold">Order</h1>
        <p className="mt-2 text-sm text-red-600">{itemsErr.message}</p>
        <div className="mt-4">
          <Link className="underline" href="/admin/orders">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Status: {order.status} • Location: {locationName}
          </div>
        </div>
        <Link className="text-sm underline" href="/admin/orders">
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">Items</h2>

          <div className="mt-4 space-y-2">
            {(items ?? []).map((it: any) => {
              const itemName = it.menu_items?.name ?? String(it.menu_item_id).slice(0, 8);
              return (
                <div
                  key={it.id}
                  className="flex items-center justify-between rounded-xl border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{itemName}</div>
                    <div className="text-muted-foreground">
                      €{euros(it.unit_price_cents)} × {it.quantity}
                    </div>
                  </div>
                  <div className="font-semibold">€{euros(it.line_total_cents)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>€{euros(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>€{euros(order.discount_cents)}</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>€{euros(order.total_cents)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="text-lg font-semibold">Finalize at pickup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the customer’s card code (from their QR).
          </p>

          <form action={finalizePickup} className="mt-4 space-y-3">
            <input type="hidden" name="order_id" value={orderId} />
            <input
              name="card_code"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="Paste card code here"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              disabled={order.status !== "created"}
              title={order.status !== "created" ? "Order is not pending" : "Finalize"}
            >
              Finalize pickup
            </button>
          </form>

          {order.status !== "created" ? (
            <div className="mt-3 text-sm text-muted-foreground">This order is already finalized.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
