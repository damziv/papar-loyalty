"use client";

import { useEffect, useMemo, useState } from "react";
import { createMenuItem, toggleMenuItemActive, updateMenuItem } from "../actions";

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  base_price_cents: number;
  active: boolean;
  category_id: string | null;
};

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

function readCategoryFromHash(): string | "all" {
  const m = window.location.hash.match(/cat=([^&]+)/);
  if (!m) return "all";
  try {
    return decodeURIComponent(m[1]) || "all";
  } catch {
    return "all";
  }
}

export default function ItemsPanel({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    const sync = () => setSelectedCategory(readCategoryFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (!showInactive && !it.active) return false;
      if (selectedCategory === "all") return true;
      return it.category_id === selectedCategory;
    });
  }, [items, selectedCategory, showInactive]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Menu items</h2>
          <p className="text-sm text-muted-foreground">Showing {filtered.length} item(s)</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-right">Price (€)</th>
              <th className="px-3 py-2 text-center">Active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const cat = categories.find((c) => c.id === it.category_id)?.name ?? "—";
              return (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{it.name}</div>
                    {it.description ? <div className="text-xs text-muted-foreground">{it.description}</div> : null}
                  </td>
                  <td className="px-3 py-2">{cat}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{euros(it.base_price_cents)}</td>
                  <td className="px-3 py-2 text-center">
                    <form action={toggleMenuItemActive}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="active" value={String(!it.active)} />
                      <button className="rounded-lg border px-2 py-1 text-xs hover:bg-muted" type="submit">
                        {it.active ? "Yes" : "No"}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                      onClick={() => setEditing(it)}
                      type="button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 ? (
              <tr className="border-t">
                <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                  No items match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <hr className="my-6" />

      <h3 className="text-base font-semibold">Add item</h3>
      <ItemForm
        categories={categories}
        defaultCategoryId={selectedCategory === "all" ? "" : selectedCategory}
      />

      {editing ? <EditModal item={editing} categories={categories} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function ItemForm({ categories, defaultCategoryId }: { categories: Category[]; defaultCategoryId: string }) {
  return (
    <form action={createMenuItem} className="mt-3 grid gap-3 md:grid-cols-2">
      <input name="name" className="rounded-lg border px-3 py-2 text-sm" placeholder="Item name" required />
      <input name="price" className="rounded-lg border px-3 py-2 text-sm" placeholder="Price in € (e.g. 9.50)" required />
      <input
        name="description"
        className="md:col-span-2 rounded-lg border px-3 py-2 text-sm"
        placeholder="Description (optional)"
      />
      <select name="category_id" defaultValue={defaultCategoryId} className="rounded-lg border px-3 py-2 text-sm">
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Active
      </label>

      <div className="md:col-span-2">
        <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" type="submit">
          Create item
        </button>
      </div>
    </form>
  );
}

function EditModal({
  item,
  categories,
  onClose,
}: {
  item: MenuItem;
  categories: Category[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Edit item</div>
            <div className="text-sm text-muted-foreground">{item.name}</div>
          </div>
          <button className="rounded-lg border px-3 py-1 text-sm hover:bg-muted" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form action={updateMenuItem} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={item.id} />

          <input name="name" defaultValue={item.name} className="rounded-lg border px-3 py-2 text-sm" required />
          <input
            name="price"
            defaultValue={euros(item.base_price_cents)}
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input
            name="description"
            defaultValue={item.description ?? ""}
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Description"
          />
          <select name="category_id" defaultValue={item.category_id ?? ""} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={item.active} />
            Active
          </label>

          <div className="flex gap-2">
            <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" type="submit">
              Save
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
