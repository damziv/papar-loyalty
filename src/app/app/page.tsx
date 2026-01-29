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
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            My Papar<span className="text-orange-600">Grill</span>
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {/* Dashboard cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/app/menu"
            className="group rounded-2xl border bg-white p-5 shadow-sm
                       transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-lg font-semibold group-hover:text-orange-600">
              Menu
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Browse and place an order
            </div>
          </Link>

          <Link
            href="/app/orders"
            className="group rounded-2xl border bg-white p-5 shadow-sm
                       transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-lg font-semibold group-hover:text-orange-600">
              My Orders
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Track pickup and totals
            </div>
          </Link>

          <Link
            href="/app/points"
            className="group rounded-2xl border bg-white p-5 shadow-sm
                       transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-lg font-semibold group-hover:text-orange-600">
              Points
            </div>
            <div className="mt-1 text-sm text-gray-500">
              See balance and history
            </div>
          </Link>

          <Link
            href="/app/card"
            className="group rounded-2xl border bg-white p-5 shadow-sm
                       transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-lg font-semibold group-hover:text-orange-600">
              My QR Card
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Show at pickup to earn points
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
