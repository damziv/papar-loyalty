"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHighestRole } from "@/lib/auth/getRole";

async function requireSuper() {
  const role = await getHighestRole();
  if (role !== "super_admin") throw new Error("Not allowed");
}

export async function makeAdmin(formData: FormData) {
  await requireSuper();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const supabase = await createClient();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("user_id,email")
    .eq("email", email)
    .single();

  if (pErr || !profile) throw new Error("User not found. Ask them to login once first.");

  const { error } = await supabase.from("user_roles").insert({
    user_id: profile.user_id,
    role: "admin",
  });

  // ignore duplicate insert
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }

  revalidatePath("/super/admins");
}

export async function assignAdminToLocation(formData: FormData) {
  await requireSuper();

  const admin_user_id = String(formData.get("admin_user_id") ?? "").trim();
  const location_id = String(formData.get("location_id") ?? "").trim();

  if (!admin_user_id || !location_id) throw new Error("Admin and location required");

  const supabase = await createClient();
  const { error } = await supabase.from("admin_locations").insert({
    admin_user_id,
    location_id,
  });

  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }

  revalidatePath("/super/admins");
}
