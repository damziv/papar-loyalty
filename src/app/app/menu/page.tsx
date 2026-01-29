import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CartClient from "./ui/CartClient";

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  base_price_cents: number;
  category_id: string | null;
};
type Location = { id: string; name: string };

export default async function UserMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id,name")
    .order("name");

  if (locErr)
    return (
      <ErrorBox
        title="Menu"
        message={`Failed to load locations: ${locErr.message}`}
      />
    );

  const { data: categories, error: catErr } = await supabase
    .from("menu_categories")
    .select("id,name")
    .order("name");

  if (catErr)
    return (
      <ErrorBox
        title="Menu"
        message={`Failed to load categories: ${catErr.message}`}
      />
    );

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("id,name,description,base_price_cents,category_id")
    .eq("active", true)
    .order("name");

  if (itemErr)
    return (
      <ErrorBox
        title="Menu"
        message={`Failed to load items: ${itemErr.message}`}
      />
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add items to cart and place an order for pickup.
          </p>
        </div>

        {/* Content */}
        <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
          <CartClient
            locations={(locations ?? []) as Location[]}
            categories={(categories ?? []) as Category[]}
            items={(items ?? []) as MenuItem[]}
          />
        </div>

        {/* Small footer spacer for mobile scrolling comfort */}
        <div className="h-8" />
      </div>
    </main>
  );
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        </div>
      </div>
    </main>
  );
}
