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

  if (locErr) return <ErrorBox title="Menu" message={`Failed to load locations: ${locErr.message}`} />;

  const { data: categories, error: catErr } = await supabase
    .from("menu_categories")
    .select("id,name")
    .order("name");

  if (catErr) return <ErrorBox title="Menu" message={`Failed to load categories: ${catErr.message}`} />;

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("id,name,description,base_price_cents,category_id")
    .eq("active", true)
    .order("name");

  if (itemErr) return <ErrorBox title="Menu" message={`Failed to load items: ${itemErr.message}`} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Menu</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add items to cart and place an order for pickup.
      </p>

      <div className="mt-6">
        <CartClient
          locations={(locations ?? []) as Location[]}
          categories={(categories ?? []) as Category[]}
          items={(items ?? []) as MenuItem[]}
        />
      </div>
    </div>
  );
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-red-600">{message}</p>
    </div>
  );
}
