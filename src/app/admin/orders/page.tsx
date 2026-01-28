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

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pending orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">No access.</p>
      </div>
    );
  }

  let allowedLocationIds: string[] = [];

  if (!isSuperAdmin) {
    const { data: adminLocs } = await supabase
      .from("admin_locations")
      .select("location_id")
      .eq("user_id", user.id);

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
          <h1 className="text-xl font-semibold">Pending orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are an admin but no locations are assigned.
          </p>
        </div>
      );
    }
  }

  const { data: locations } = await supabase
    .from("locations")
    .select("id,name");

  const locMap = new Map((locations ?? []).map((l) => [l.id, l.name]));

  let query = supabase
    .from("orders")
    .select("id,created_at,location_id,subtotal_cents,total_cents,status")
    .eq("status", "created")
    .order("created_at", { ascending: false });

  if (!isSuperAdmin) {
    query = query.in("location_id", allowedLocationIds);
  }

  const { data: orders, error } = await query;

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Pending orders</h1>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Pending orders</h1>

      <div className="mt-6 space-y-3">
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            No pending orders.
          </div>
        ) : (
          orders!.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="block rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="flex justify-between">
                <div className="font-medium">Order #{o.id.slice(0, 8)}</div>
                <div className="text-sm">{o.status}</div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {locMap.get(o.location_id) ?? o.location_id} •{" "}
                {formatDate(o.created_at)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                €{euros(o.total_cents)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
