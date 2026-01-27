import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHighestRole } from "@/lib/auth/getRole";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getHighestRole();

  if (role === "super_admin") redirect("/super");
  if (role === "admin") redirect("/admin");
  redirect("/app");
}
