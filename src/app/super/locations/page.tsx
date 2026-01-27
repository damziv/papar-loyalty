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
      <div className="rounded-2xl border p-4">
        <div className="font-semibold">Failed to load locations</div>
        <div className="text-sm opacity-80">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Locations</h1>
        <p className="text-sm opacity-80">Create and view PaparGrill locations.</p>
      </div>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Create location</h2>

        <form action={createLocation} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            placeholder="Name (required)"
            className="rounded-xl border px-3 py-2"
            required
          />
          <input
            name="city"
            placeholder="City"
            className="rounded-xl border px-3 py-2"
          />
          <input
            name="address"
            placeholder="Address"
            className="rounded-xl border px-3 py-2 sm:col-span-3"
          />

          <div className="sm:col-span-3">
            <button className="rounded-xl bg-black text-white px-4 py-2">
              Create
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">All locations</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4">Address</th>
                <th className="py-2 pr-4">Active</th>
              </tr>
            </thead>
            <tbody>
              {(locations ?? []).map((l) => (
                <tr key={l.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-medium">{l.name}</td>
                  <td className="py-2 pr-4">{l.city ?? "-"}</td>
                  <td className="py-2 pr-4">{l.address ?? "-"}</td>
                  <td className="py-2 pr-4">{l.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {locations?.length === 0 && (
            <div className="mt-3 text-sm opacity-70">No locations yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
