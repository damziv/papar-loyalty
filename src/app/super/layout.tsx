import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHighestRole } from "@/lib/auth/getRole";

export default async function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getHighestRole();
  if (role !== "super_admin") redirect("/app");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Brand */}
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                PaparGrill
              </div>
              <div className="text-lg font-semibold tracking-tight">
                Super Admin
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/super"
                className="rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Overview
              </Link>
              <Link
                href="/super/locations"
                className="rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Locations
              </Link>
              <Link
                href="/super/menu"
                className="rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Menu
              </Link>
              <Link
                href="/super/settings"
                className="rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Settings
              </Link>
              <Link
                href="/super/admins"
                className="rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Admins
              </Link>

              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="ml-1 rounded-lg border px-3 py-1.5 text-sm font-medium
                             hover:bg-gray-100"
                >
                  Logout
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
