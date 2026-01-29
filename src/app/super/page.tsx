import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHighestRole } from "@/lib/auth/getRole";

export default function SuperAdminHome() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
            Super Admin
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Use <span className="font-medium text-gray-700">Locations</span> to manage stores,
            and <span className="font-medium text-gray-700">Settings</span> to manage points/discount rules.
          </p>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
