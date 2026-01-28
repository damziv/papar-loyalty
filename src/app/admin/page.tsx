import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
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

  const allowed = (roles ?? []).some(r => r.role === "admin" || r.role === "super_admin");
  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don’t have access to admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="mt-6">
        <Link className="rounded-2xl border p-4 inline-block hover:bg-muted/40" href="/admin/orders">
          <div className="text-lg font-semibold">Pending orders</div>
          <div className="mt-1 text-sm text-muted-foreground">Finalize at pickup</div>
        </Link>
      </div>
    </div>
  );
}
