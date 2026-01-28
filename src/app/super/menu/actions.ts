"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parsePriceToCents(input: string): number {
  const cleaned = input.trim().replace(",", ".");
  if (!cleaned) throw new Error("Price is required");

  const euros = Number(cleaned);
  if (!Number.isFinite(euros) || euros < 0) throw new Error("Invalid price");

  return Math.round(euros * 100);
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").insert({ name });
  if (error) throw new Error(error.message);

  revalidatePath("/super/menu");
}

export async function renameCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!id) throw new Error("Missing category id");
  if (!name) throw new Error("Category name is required");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/super/menu");
}

export async function createMenuItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceInput = String(formData.get("price") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  if (!name) throw new Error("Item name is required");

  const base_price_cents = parsePriceToCents(priceInput);

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    name,
    description,
    base_price_cents,
    category_id: categoryId,
    active,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/super/menu");
}

export async function updateMenuItem(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceInput = String(formData.get("price") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const active = formData.get("active") === "on";

  if (!id) throw new Error("Missing item id");
  if (!name) throw new Error("Item name is required");

  const base_price_cents = parsePriceToCents(priceInput);

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      description,
      base_price_cents,
      category_id: categoryId,
      active,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/super/menu");
}

export async function toggleMenuItemActive(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";

  if (!id) throw new Error("Missing item id");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/super/menu");
}
