"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function finalizePickup(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const cardCode = String(formData.get("card_code") ?? "").trim();

  if (!orderId) throw new Error("Missing order id");
  if (!cardCode) throw new Error("Card code is required");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("finalize_order_at_pickup", {
    order_id: orderId,
    card_code: cardCode,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  redirect("/admin/orders");
}
