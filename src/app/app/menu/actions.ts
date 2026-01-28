"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type CartLine = { menu_item_id: string; quantity: number };

function assertPositiveInt(n: unknown, name: string) {
  if (!Number.isInteger(n) || (n as number) <= 0) throw new Error(`${name} must be a positive integer`);
}

export async function placeOrder(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const locationId = String(formData.get("location_id") ?? "").trim();
  const cartJson = String(formData.get("cart_json") ?? "").trim();

  if (!locationId) throw new Error("Please choose a pickup location.");
  if (!cartJson) throw new Error("Cart is empty.");

  let cart: CartLine[];
  try {
    cart = JSON.parse(cartJson);
  } catch {
    throw new Error("Invalid cart payload.");
  }

  if (!Array.isArray(cart) || cart.length === 0) throw new Error("Cart is empty.");

  // sanitize cart
  const sanitized: CartLine[] = cart.map((x) => ({
    menu_item_id: String(x.menu_item_id ?? ""),
    quantity: Number(x.quantity ?? 0),
  }));

  for (const line of sanitized) {
    if (!line.menu_item_id) throw new Error("Invalid cart item.");
    assertPositiveInt(line.quantity, "Quantity");
  }

  // verify location exists
  const { data: loc, error: locErr } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .maybeSingle();

  if (locErr) throw new Error(locErr.message);
  if (!loc) throw new Error("Selected location does not exist.");

  // fetch authoritative prices
  const ids = Array.from(new Set(sanitized.map((l) => l.menu_item_id)));

  const { data: dbItems, error: itemsErr } = await supabase
    .from("menu_items")
    .select("id,base_price_cents,active")
    .in("id", ids);

  if (itemsErr) throw new Error(itemsErr.message);

  const priceMap = new Map<string, { price: number; active: boolean }>();
  for (const it of dbItems ?? []) {
    priceMap.set(it.id, { price: it.base_price_cents, active: it.active });
  }

  // build order lines using DB prices
  let subtotalCents = 0;
  const orderItems = sanitized.map((line) => {
    const db = priceMap.get(line.menu_item_id);
    if (!db) throw new Error("One of the items in your cart no longer exists.");
    if (!db.active) throw new Error("One of the items in your cart is no longer available.");

    const unit = db.price;
    const lineTotal = unit * line.quantity;
    subtotalCents += lineTotal;

    return {
      menu_item_id: line.menu_item_id,
      quantity: line.quantity,
      unit_price_cents: unit,
      line_total_cents: lineTotal,
    };
  });

  // Insert order first
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      location_id: locationId,
      status: "created",
      subtotal_cents: subtotalCents,
      discount_cents: 0,
      total_cents: subtotalCents,
    })
    .select("id")
    .single();

  if (orderErr) throw new Error(orderErr.message);

  // Insert order items
  const { error: oiErr } = await supabase.from("order_items").insert(
    orderItems.map((oi) => ({
      order_id: order.id,
      ...oi,
    }))
  );

  if (oiErr) {
    // Best-effort rollback (not fully atomic). We’ll replace with an RPC later for perfect atomicity.
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error(oiErr.message);
  }

  revalidatePath("/app/menu");
  revalidatePath("/app/orders");

  redirect("/app/orders");
}
