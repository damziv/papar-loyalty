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
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold">Failed to load</div>
        <div className="mt-2 text-sm text-red-700">
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
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
          <p className="mt-1 text-sm text-gray-500">
            Promote users to admins and assign them to locations. Users must login once so they exist in profiles.
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {adminProfiles.length} admin{adminProfiles.length === 1 ? "" : "s"} •{" "}
          {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Make admin */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Make admin</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter a user email that already exists in profiles.
            </p>
          </div>
        </div>

        <form action={makeAdmin} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">User email</label>
            <input
              name="email"
              placeholder="user@email.com"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
          </div>

          <button className="sm:mt-6 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
            Promote to admin
          </button>
        </form>
      </section>

      {/* Assign */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Assign admin to location</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose an admin and the location they manage.
            </p>
          </div>
        </div>

        <form action={assignAdminToLocation} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">Admin</label>
            <select
              name="admin_user_id"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            >
              <option value="">Select admin…</option>
              {adminProfiles.map((a: { user_id: string; full_name: string | null; email: string | null }) => (
                <option key={a.user_id} value={a.user_id}>
                  {a.email ?? a.full_name ?? a.user_id}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <select
              name="location_id"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            >
              <option value="">Select location…</option>
              {locs.map((l: LocationRow) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.city ? `(${l.city})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
              Assign
            </button>
          </div>
        </form>
      </section>

      {/* Assignments */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Current assignments</h2>
          <div className="text-sm text-gray-500">
            {assignments.length === 0 ? "None yet" : "Latest shown in table"}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-3 font-medium text-gray-600">Admin</th>
                <th className="py-3 px-3 font-medium text-gray-600">Location</th>
                <th className="py-3 px-3 font-medium text-gray-600">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((as) => {
                const admin = adminMap.get(as.admin_user_id);
                const loc = locMap.get(as.location_id);
                return (
                  <tr key={`${as.admin_user_id}-${as.location_id}`} className="hover:bg-gray-50/60">
                    <td className="py-3 px-3">
                      <div className="font-medium">
                        {admin?.email ?? admin?.full_name ?? as.admin_user_id}
                      </div>
                      {admin?.full_name && admin?.email ? (
                        <div className="mt-0.5 text-xs text-gray-500">{admin.full_name}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">
                        {loc ? `${loc.name}${loc.city ? ` (${loc.city})` : ""}` : as.location_id}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {as.created_at ? new Date(as.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {assignments.length === 0 && (
          <div className="mt-3 rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
            No assignments yet. Use the form above to assign an admin to a location.
          </div>
        )}
      </section>
    </div>
  );
}
