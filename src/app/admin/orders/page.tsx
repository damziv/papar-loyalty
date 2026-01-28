import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Roles: allow admin OR super_admin
  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pending orders</h1>
        <p className="mt-2 text-sm text-red-600">{rolesErr.message}</p>
      </div>
    );
  }

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pending orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don’t have access to admin.</p>
      </div>
    );
  }

  // Location scope: only for admins (super_admin can see all)
  let allowedLocationIds: string[] = [];

  if (!isSuperAdmin) {
    const { data: adminLocs, error: adminLocErr } = await supabase
      .from("admin_locations")
      .select("location_id")
      .eq("user_id", user.id);

    if (adminLocErr) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Pending orders</h1>
          <p className="mt-2 text-sm text-red-600">{adminLocErr.message}</p>
        </div>
      );
    }

    allowedLocationIds = Array.from(new Set((adminLocs ?? []).map((r) => r.location_id)));

    if (allowedLocationIds.length === 0) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Pending orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are an admin but no locations are assigned.
          </p>
        </div>
      );
    }
  }

  let query = supabase
    .from("orders")
    .select("id,created_at,location_id,subtotal_cents,total_cents,status")
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!isSuperAdmin) {
    query = query.in("location_id", allowedLocationIds);
  }

  const { data: orders, error: ordersErr } = await query;

  if (ordersErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pending orders</h1>
        <p className="mt-2 text-sm text-red-600">{ordersErr.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Pending orders</h1>
        <Link className="text-sm underline" href="/admin">
          Back
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">No pending orders.</div>
        ) : (
          orders!.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="block rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">Order #{o.id.slice(0, 8)}</div>
                <div className="text-sm rounded-full border px-2 py-1">{o.status}</div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Location: {String(o.location_id).slice(0, 8)} • Total cents: {o.total_cents}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
