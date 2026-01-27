import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHighestRole } from "@/lib/auth/getRole";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getHighestRole();
  if (role !== "admin" && role !== "super_admin") redirect("/app");

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-sm opacity-80">Coming next: orders for your location.</p>

      <form action="/logout" method="post" className="mt-6">
        <button className="rounded-xl border px-4 py-2">Logout</button>
      </form>
    </main>
  );
}
