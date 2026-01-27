"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHighestRole } from "@/lib/auth/getRole";

function toNumber(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export async function updateSettings(formData: FormData) {
  const role = await getHighestRole();
  if (role !== "super_admin") throw new Error("Not allowed");

  const points_per_eur = toNumber(formData.get("points_per_eur"));
  const eur_per_100_points = toNumber(formData.get("eur_per_100_points"));
  const discount_percent = toNumber(formData.get("discount_percent"));
  const cashback_percent = toNumber(formData.get("cashback_percent"));

  if (points_per_eur === null || points_per_eur <= 0) throw new Error("points_per_eur must be > 0");
  if (eur_per_100_points === null || eur_per_100_points < 0) throw new Error("eur_per_100_points must be >= 0");
  if (discount_percent === null || discount_percent < 0 || discount_percent > 100) throw new Error("discount_percent must be 0..100");
  if (cashback_percent === null || cashback_percent < 0 || cashback_percent > 100) throw new Error("cashback_percent must be 0..100");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("app_settings")
    .update({
      points_per_eur,
      eur_per_100_points,
      discount_percent,
      cashback_percent,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", true);

  if (error) throw new Error(error.message);

  revalidatePath("/super/settings");
}
