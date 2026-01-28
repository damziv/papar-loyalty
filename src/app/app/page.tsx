import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UserHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My Papar Grill</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/app/menu" className="rounded-2xl border p-4 hover:bg-muted/40">
          <div className="text-lg font-semibold">Menu</div>
          <div className="mt-1 text-sm text-muted-foreground">Browse and place an order</div>
        </Link>

        <Link href="/app/orders" className="rounded-2xl border p-4 hover:bg-muted/40">
          <div className="text-lg font-semibold">My Orders</div>
          <div className="mt-1 text-sm text-muted-foreground">Track pickup and totals</div>
        </Link>

        <Link href="/app/points" className="rounded-2xl border p-4 hover:bg-muted/40">
          <div className="text-lg font-semibold">Points</div>
          <div className="mt-1 text-sm text-muted-foreground">See balance and history</div>
        </Link>

        <Link href="/app/card" className="rounded-2xl border p-4 hover:bg-muted/40">
          <div className="text-lg font-semibold">My QR Card</div>
          <div className="mt-1 text-sm text-muted-foreground">Show at pickup to earn points</div>
        </Link>
      </div>
    </div>
  );
}
