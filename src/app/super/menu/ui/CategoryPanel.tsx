"use client";

import { useMemo, useState } from "react";
import { createCategory, renameCategory } from "../actions";

type Category = { id: string; name: string };

export default function CategoryPanel({ categories }: { categories: Category[] }) {
  const [selectedId, setSelectedId] = useState<string | "all">("all");
  const [newName, setNewName] = useState("");

  const onSelect = (id: string | "all") => {
    setSelectedId(id);
    const hash = id === "all" ? "" : `#cat=${encodeURIComponent(id)}`;
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const selected = useMemo(() => {
    if (selectedId === "all") return null;
    return categories.find((c) => c.id === selectedId) ?? null;
  }, [categories, selectedId]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Filter items and keep your menu organized.
          </p>
        </div>

        <button
          className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          type="button"
          onClick={() => onSelect("all")}
        >
          Show all
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
            No categories yet. Create one below.
          </div>
        ) : (
          categories.map((c) => {
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "border-gray-300 bg-gray-100 font-semibold"
                    : "border-gray-200 bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{c.name}</span>
                  {active ? (
                    <span className="shrink-0 rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                      Selected
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="my-5 h-px bg-gray-200" />

      {/* Create */}
      <form action={createCategory} className="space-y-2">
        <div className="text-sm font-semibold">Add category</div>
        <input
          name="name"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10"
          placeholder="e.g. Burgers"
          required
        />
        <button
          className="w-full rounded-xl bg-black px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
          type="submit"
        >
          Create
        </button>
      </form>

      <div className="my-5 h-px bg-gray-200" />

      {/* Rename */}
      <div className="space-y-2">
        <div className="text-sm font-semibold">Rename selected</div>

        <input
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-black/10 disabled:bg-gray-50"
          placeholder={selected ? selected.name : "Select a category first"}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={!selected}
        />

        <form action={renameCategory}>
          <input type="hidden" name="id" value={selected?.id ?? ""} />
          <input type="hidden" name="name" value={newName} />
          <button
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            type="submit"
            disabled={!selected || !newName.trim()}
          >
            Rename
          </button>
        </form>

        {!selected ? (
          <div className="text-xs text-gray-500">
            Tip: Select a category above to rename it.
          </div>
        ) : null}
      </div>
    </div>
  );
}
