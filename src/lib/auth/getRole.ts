import { createClient } from "@/lib/supabase/server";

export async function getMyRoles() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error || !data) return [];
  return data.map((r) => r.role);
}

export async function getHighestRole() {
  const roles = await getMyRoles();
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("user")) return "user";
  return "none";
}
