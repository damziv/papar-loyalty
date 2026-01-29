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

function pillActive(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-gray-200 bg-gray-50 text-gray-700";
}

export default function ItemsPanel({
  categories,
  items,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
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

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All categories"
      : categories.find((c) => c.id === selectedCategory)?.name ?? "Selected";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Menu items</h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
            item(s) • <span className="font-medium text-gray-700">{selectedCategoryName}</span>
          </p>
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="border-b">
              <th className="px-3 py-3 font-medium text-gray-600">Name</th>
              <th className="px-3 py-3 font-medium text-gray-600">Category</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Price (€)</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600">Active</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((it) => {
              const cat = categories.find((c) => c.id === it.category_id)?.name ?? "—";
              return (
                <tr key={it.id} className="hover:bg-gray-50/60">
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium leading-snug">{it.name}</div>
                    {it.description ? (
                      <div className="mt-0.5 text-xs text-gray-500">{it.description}</div>
                    ) : null}
                  </td>

                  <td className="px-3 py-3 align-top text-gray-700">{cat}</td>

                  <td className="px-3 py-3 align-top text-right tabular-nums font-medium">
                    {euros(it.base_price_cents)}
                  </td>

                  <td className="px-3 py-3 align-top text-center">
                    <form action={toggleMenuItemActive}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="active" value={String(!it.active)} />
                      <button
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pillActive(
                          it.active
                        )}`}
                        type="submit"
                      >
                        {it.active ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>

                  <td className="px-3 py-3 align-top text-right">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
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
              <tr>
                <td className="px-3 py-10 text-center text-sm text-gray-500" colSpan={5}>
                  No items match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Add */}
      <div className="my-6 h-px bg-gray-200" />

      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Add item</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new menu item (price in €).
          </p>
        </div>
      </div>

      <ItemForm
        categories={categories}
        defaultCategoryId={selectedCategory === "all" ? "" : selectedCategory}
      />

      {editing ? (
        <EditModal item={editing} categories={categories} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

function ItemForm({
  categories,
  defaultCategoryId,
}: {
  categories: Category[];
  defaultCategoryId: string;
}) {
  return (
    <form action={createMenuItem} className="mt-4 grid gap-3 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-gray-700">Name</label>
        <input
          name="name"
          className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10"
          placeholder="Item name"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Price (€)</label>
        <input
          name="price"
          className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10"
          placeholder="e.g. 9.50"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <input
          name="description"
          className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10"
          placeholder="Description (optional)"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          name="category_id"
          defaultValue={defaultCategoryId}
          className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <label className="inline-flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
          Active
        </label>
      </div>

      <div className="md:col-span-2">
        <button
          className="w-full sm:w-auto rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
          type="submit"
        >
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
      <div className="w-full max-w-lg rounded-2xl border bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold tracking-tight">Edit item</div>
            <div className="mt-1 text-sm text-gray-500">{item.name}</div>
          </div>
          <button
            className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <form action={updateMenuItem} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={item.id} />

          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              defaultValue={item.name}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Price (€)</label>
            <input
              name="price"
              defaultValue={euros(item.base_price_cents)}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input
              name="description"
              defaultValue={item.description ?? ""}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
              placeholder="Description"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              defaultValue={item.category_id ?? ""}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-black/10"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={item.active} className="h-4 w-4" />
            Active
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
