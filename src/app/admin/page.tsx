import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Allow admin OR super_admin
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold tracking-tight">Admin</h1>
          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allowed = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "super_admin"
  );

  if (!allowed) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold tracking-tight">Admin</h1>
          <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              You don’t have access to admin.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose what you want to do.
            </p>
          </div>

          <div className="hidden sm:block text-xs text-gray-400">
            {user.email}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Pickup (primary) */}
          <Link
            href="/admin/pickup"
            className="group rounded-2xl border bg-white p-5 shadow-sm transition
                       hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight group-hover:text-black">
                  Pickup
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Scan customer QR and finalize order
                </div>
              </div>
              <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                Primary
              </span>
            </div>
          </Link>

          {/* Orders list */}
          <Link
            href="/admin/orders"
            className="group rounded-2xl border bg-white p-5 shadow-sm transition
                       hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-lg font-semibold tracking-tight group-hover:text-black">
              Pending orders
            </div>
            <div className="mt-1 text-sm text-gray-500">
              View all open orders for your location
            </div>
          </Link>
        </div>

        {/* Mobile footer info */}
        <div className="mt-6 sm:hidden rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Signed in as</div>
          <div className="mt-1 text-sm font-medium">{user.email}</div>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
