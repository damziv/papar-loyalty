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
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight">Menu</h1>
            <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to read role: {roleErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");

  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight">Super Admin</h1>
            <p className="mt-2 text-sm text-gray-600">
              You don’t have access to this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: categories, error: catErr } = await supabase
    .from("menu_categories")
    .select("id,name")
    .order("name");

  if (catErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight">Menu</h1>
            <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load categories: {catErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("id,name,description,base_price_cents,active,category_id")
    .order("name");

  if (itemErr) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight">Menu</h1>
            <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load items: {itemErr.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage categories and items shown to customers.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700">
            Super Admin
          </span>
        </div>

        {/* Panels */}
        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <CategoryPanel categories={categories ?? []} />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <ItemsPanel categories={categories ?? []} items={items ?? []} />
          </div>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
