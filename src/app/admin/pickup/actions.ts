"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function finalizeFromPickup(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const cardCode = String(formData.get("card_code") ?? "").trim().toLowerCase();

  if (!orderId) throw new Error("Missing order id");
  if (!cardCode) throw new Error("Card code is required");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.rpc("finalize_order_at_pickup", {
    p_order_id: orderId,
    p_card_code: cardCode,
  });

  if (error) throw new Error(`Finalize failed: ${error.message}`);

  revalidatePath("/admin/pickup");
  revalidatePath("/admin/orders");
  revalidatePath("/app/orders");
  revalidatePath("/app/points");

  // keep them on pickup screen for the next customer
  redirect(`/admin/pickup?card_code=${encodeURIComponent(cardCode)}&done=1`);
}
