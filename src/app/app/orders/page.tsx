import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,status,subtotal_cents,discount_cents,total_cents,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <Link className="text-sm underline" href="/app/menu">
          Back to menu
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            No orders yet.
          </div>
        ) : (
          orders!.map((o) => (
            <div key={o.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Order #{o.id.slice(0, 8)}</div>
                <div className="text-sm rounded-full border px-2 py-1">{o.status}</div>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                Subtotal: €{euros(o.subtotal_cents)}{" "}
                {o.discount_cents ? ` • Discount: €${euros(o.discount_cents)}` : ""}
                {" • "}
                Total: <span className="font-semibold text-foreground">€{euros(o.total_cents)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
