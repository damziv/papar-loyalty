import { createClient } from "@/lib/supabase/server";
import { createLocation } from "./actions";

export default async function LocationsPage() {
  const supabase = await createClient();

  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, name, address, city, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="font-semibold">Failed to load locations</div>
        <div className="mt-1 text-sm text-red-700">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and view PaparGrill locations.
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {(locations ?? []).length} total
        </div>
      </div>

      {/* Create */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Create location</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add a new store location for orders and pickup.
            </p>
          </div>
        </div>

        <form action={createLocation} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              placeholder="e.g. PaparGrill Center"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">City</label>
            <input
              name="city"
              placeholder="e.g. Zagreb"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              name="address"
              placeholder="Street and number"
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="sm:col-span-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Name is required. City/address are optional.
            </p>
            <button
              className="w-full sm:w-auto rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white
                         hover:bg-gray-900"
            >
              Create
            </button>
          </div>
        </form>
      </section>

      {/* Table */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">All locations</h2>
          <div className="text-sm text-gray-500">
            {(locations ?? []).length === 0 ? "No locations yet" : "Latest first"}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-3 font-medium text-gray-600">Name</th>
                <th className="py-3 px-3 font-medium text-gray-600">City</th>
                <th className="py-3 px-3 font-medium text-gray-600">Address</th>
                <th className="py-3 px-3 font-medium text-gray-600">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(locations ?? []).map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-3 font-medium">{l.name}</td>
                  <td className="py-3 px-3">{l.city ?? "-"}</td>
                  <td className="py-3 px-3">{l.address ?? "-"}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        l.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {l.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {locations?.length === 0 && (
          <div className="mt-3 text-sm text-gray-500">
            Create your first location above.
          </div>
        )}
      </section>
    </div>
  );
}
