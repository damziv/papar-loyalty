import { createClient } from "@/lib/supabase/server";
import { assignAdminToLocation, makeAdmin } from "./actions";

export default async function SuperAdminsPage() {
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id,name,city")
    .order("created_at", { ascending: false });

  // List admins (users who have role=admin)
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("role", "admin");

  const adminIds = (adminRoles ?? []).map((r) => r.user_id);

  const { data: adminProfiles } = adminIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", adminIds)
    : { data: [] as any[] };

  const { data: assignments } = await supabase
    .from("admin_locations")
    .select("admin_user_id, location_id, created_at");

  const locMap = new Map((locations ?? []).map((l) => [l.id, l]));
  const adminMap = new Map((adminProfiles ?? []).map((a) => [a.user_id, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admins</h1>
        <p className="text-sm opacity-80">
          Promote users to admins and assign them to locations. Users must login once so they exist in profiles.
        </p>
      </div>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Make admin</h2>
        <form action={makeAdmin} className="mt-4 flex gap-3 flex-col sm:flex-row">
          <input
            name="email"
            placeholder="user@email.com"
            className="rounded-xl border px-3 py-2 flex-1"
            required
          />
          <button className="rounded-xl bg-black text-white px-4 py-2">
            Promote to admin
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Assign admin to location</h2>

        <form action={assignAdminToLocation} className="mt-4 grid gap-3 sm:grid-cols-3">
          <select name="admin_user_id" className="rounded-xl border px-3 py-2" required>
            <option value="">Select admin…</option>
            {(adminProfiles ?? []).map((a) => (
              <option key={a.user_id} value={a.user_id}>
                {a.email ?? a.full_name ?? a.user_id}
              </option>
            ))}
          </select>

          <select name="location_id" className="rounded-xl border px-3 py-2" required>
            <option value="">Select location…</option>
            {(locations ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.city ? `(${l.city})` : ""}
              </option>
            ))}
          </select>

          <button className="rounded-xl bg-black text-white px-4 py-2">
            Assign
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Current assignments</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {(assignments ?? []).map((a) => {
                const admin = adminMap.get(a.admin_user_id);
                const loc = locMap.get(a.location_id);
                return (
                  <tr key={`${a.admin_user_id}-${a.location_id}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">{admin?.email ?? admin?.full_name ?? a.admin_user_id}</td>
                    <td className="py-2 pr-4">{loc ? `${loc.name}${loc.city ? ` (${loc.city})` : ""}` : a.location_id}</td>
                    <td className="py-2 pr-4">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {assignments?.length === 0 && (
            <div className="mt-3 text-sm opacity-70">No assignments yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
