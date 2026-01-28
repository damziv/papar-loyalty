import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryPanel from "./ui/CategoryPanel";
import ItemsPanel from "./ui/ItemsPanel";

export default async function SuperMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Friendly gate (RLS still enforces real security)
const { data: roles, error: roleErr } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id);

  if (roleErr) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Menu</h1>
      <p className="mt-2 text-sm text-red-600">Failed to read role: {roleErr.message}</p>
    </div>
  );
}

const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");

if (!isSuperAdmin) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Super Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You don’t have access to this page.
      </p>
    </div>
  );
}

  const { data: categories, error: catErr } = await supabase
    .from("menu_categories")
    .select("id,name")
    .order("name");

  if (catErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Menu</h1>
        <p className="mt-2 text-sm text-red-600">Failed to load categories: {catErr.message}</p>
      </div>
    );
  }

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("id,name,description,base_price_cents,active,category_id")
    .order("name");

  if (itemErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Menu</h1>
        <p className="mt-2 text-sm text-red-600">Failed to load items: {itemErr.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-muted-foreground">Super Admin</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <CategoryPanel categories={categories ?? []} />
        <ItemsPanel categories={categories ?? []} items={items ?? []} />
      </div>
    </div>
  );
}
