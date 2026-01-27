import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UserAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: loyalty } = await supabase
    .from("loyalty_accounts")
    .select("points_balance, level")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">User Dashboard</h1>
      <p className="mt-2 text-sm opacity-80">Logged in as: {user.email}</p>

      <div className="mt-6 rounded-2xl border p-4">
        <div className="text-sm opacity-80">Points</div>
        <div className="text-3xl font-semibold">{loyalty?.points_balance ?? 0}</div>
        <div className="mt-1 text-sm opacity-80">Level: {loyalty?.level ?? "base"}</div>
      </div>

      <form action="/logout" method="post" className="mt-6">
        <button className="rounded-xl border px-4 py-2">Logout</button>
      </form>
    </main>
  );
}
