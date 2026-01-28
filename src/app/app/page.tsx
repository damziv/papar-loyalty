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
        <Link
          href="/app/card"
          className="rounded-2xl border p-4 hover:bg-muted/40"
        >
          <div className="text-lg font-semibold">My QR Card</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Show this at pickup to finalize your order
          </div>
        </Link>

        {/* placeholders for next steps */}
        <div className="rounded-2xl border p-4 opacity-60">
          <div className="text-lg font-semibold">Menu</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Coming next: browse & order
          </div>
        </div>

        <div className="rounded-2xl border p-4 opacity-60">
          <div className="text-lg font-semibold">Orders</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Coming next: order history
          </div>
        </div>
      </div>
    </div>
  );
}
