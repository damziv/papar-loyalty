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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = await getHighestRole();
  if (role !== "super_admin") redirect("/app");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">PaparGrill</div>
            <div className="text-lg font-semibold">Super Admin</div>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link className="underline-offset-4 hover:underline" href="/super">
              Overview
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/super/locations">
              Locations
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/super/settings">
              Settings
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/super/admins">
                 Admins
            </Link>


            <form action="/logout" method="post">
              <button className="rounded-xl border px-3 py-1.5">Logout</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
