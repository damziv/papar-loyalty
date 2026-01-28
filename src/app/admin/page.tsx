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
      <div className="p-6">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  const allowed = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "super_admin"
  );

  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don’t have access to admin.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose what you want to do.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Pickup (primary) */}
        <Link
          href="/admin/pickup"
          className="rounded-2xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="text-lg font-semibold">Pickup</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Scan customer QR and finalize order
          </div>
        </Link>

        {/* Orders list */}
        <Link
          href="/admin/orders"
          className="rounded-2xl border p-5 hover:bg-muted/40 transition"
        >
          <div className="text-lg font-semibold">Pending orders</div>
          <div className="mt-1 text-sm text-muted-foreground">
            View all open orders for your location
          </div>
        </Link>
      </div>
    </div>
  );
}
