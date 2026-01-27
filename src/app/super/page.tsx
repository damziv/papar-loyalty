import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHighestRole } from "@/lib/auth/getRole";

export default function SuperAdminHome() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Overview</h1>
      <p className="text-sm opacity-80">
        Use Locations to manage stores, and Settings to manage points/discount rules.
      </p>
    </div>
  );
}