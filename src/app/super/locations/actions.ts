"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHighestRole } from "@/lib/auth/getRole";

export async function createLocation(formData: FormData) {
  const role = await getHighestRole();
  if (role !== "super_admin") throw new Error("Not allowed");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!name) throw new Error("Location name is required");

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    name,
    address: address || null,
    city: city || null,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/super/locations");
}
