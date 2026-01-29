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
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Pending orders</h1>
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">No access.</p>
          </div>
        </div>
      </main>
    );
  }

  let allowedLocationIds: string[] = [];

  if (!isSuperAdmin) {
    const { data: adminLocs, error: adminLocErr } = await supabase
      .from("admin_locations")
      .select("location_id")
      .eq("admin_user_id", user.id);

    if (adminLocErr) {
      return (
        <main className="min-h-screen bg-gray-50 px-4 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Pending orders</h1>
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
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
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Pending orders</h1>
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
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

  const { data: locations } = await supabase.from("locations").select("id,name");

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
  console.log("ADMIN ORDERS DEBUG", {
    userId: user.id,
    allowedLocationIds,
    error,
    count: orders?.length,
  });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Pending orders</h1>
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <pre className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
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
            <h1 className="text-2xl font-bold tracking-tight">Pending orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Open orders waiting for pickup finalization.
            </p>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
          >
            Back
          </Link>
        </div>

        {/* List */}
        <div className="mt-6 space-y-3">
          {(orders ?? []).length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
              No pending orders.
            </div>
          ) : (
            orders!.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm transition
                           hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">
                        Order #{o.id.slice(0, 8)}
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
                      {locMap.get(o.location_id) ?? o.location_id} •{" "}
                      {formatDate(o.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-bold">€{euros(o.total_cents)}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
