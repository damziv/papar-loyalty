import { createClient } from "@/lib/supabase/server";
import { assignAdminToLocation, makeAdmin } from "./actions";

type LocationRow = {
  id: string;
  name: string;
  city: string | null;
};

type AdminRow = {
  admin_user_id: string;
  email: string | null;
  full_name: string | null;
  location_id: string | null;
  location_name: string | null;
  city: string | null;
  assigned_at: string | null;
};

export default async function SuperAdminsPage() {
  const supabase = await createClient();

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id,name,city")
    .order("created_at", { ascending: false });

  const { data: adminRowsRaw, error: adminErr } = await supabase.rpc(
    "super_admin_list_admins"
  );

  if (locErr || adminErr) {
    return (
      <div className="rounded-2xl border p-4">
        <div className="font-semibold">Failed to load</div>
        <div className="mt-2 text-sm opacity-80">
          {locErr?.message ?? adminErr?.message}
        </div>
      </div>
    );
  }

  // ✅ Cast the RPC result to the expected shape (no generic rpc typing)
  const adminRows = (adminRowsRaw ?? []) as AdminRow[];
  const locs = (locations ?? []) as LocationRow[];

  const adminProfiles = adminRows.map((r: AdminRow) => ({
    user_id: r.admin_user_id,
    full_name: r.full_name,
    email: r.email,
  }));

  const assignments = adminRows
    .filter((r: AdminRow) => !!r.location_id)
    .map((r: AdminRow) => ({
      admin_user_id: r.admin_user_id,
      location_id: r.location_id as string,
      created_at: r.assigned_at,
    }));

  const locMap = new Map(locs.map((l: LocationRow) => [l.id, l]));
  const adminMap = new Map(adminProfiles.map((a) => [a.user_id, a]));

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
            {adminProfiles.map((a: { user_id: string; full_name: string | null; email: string | null }) => (
              <option key={a.user_id} value={a.user_id}>
                {a.email ?? a.full_name ?? a.user_id}
              </option>
            ))}
          </select>

          <select name="location_id" className="rounded-xl border px-3 py-2" required>
            <option value="">Select location…</option>
            {locs.map((l: LocationRow) => (
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
              {assignments.map((as) => {
                const admin = adminMap.get(as.admin_user_id);
                const loc = locMap.get(as.location_id);
                return (
                  <tr key={`${as.admin_user_id}-${as.location_id}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">
                      {admin?.email ?? admin?.full_name ?? as.admin_user_id}
                    </td>
                    <td className="py-2 pr-4">
                      {loc ? `${loc.name}${loc.city ? ` (${loc.city})` : ""}` : as.location_id}
                    </td>
                    <td className="py-2 pr-4">
                      {as.created_at ? new Date(as.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {assignments.length === 0 && (
            <div className="mt-3 text-sm opacity-70">No assignments yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
