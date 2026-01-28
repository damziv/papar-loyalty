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
    <div className="rounded-2xl border p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <button className="text-sm underline" type="button" onClick={() => onSelect("all")}>
          Show all
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              selectedId === c.id ? "bg-muted font-medium" : "hover:bg-muted/50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <hr className="my-4" />

      <form action={createCategory} className="space-y-2">
        <div className="text-sm font-medium">Add category</div>
        <input
          name="name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="e.g. Burgers"
          required
        />
        <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-muted" type="submit">
          Create
        </button>
      </form>

      <hr className="my-4" />

      <div className="space-y-2">
        <div className="text-sm font-medium">Rename selected</div>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder={selected ? selected.name : "Select a category first"}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={!selected}
        />
        <form action={renameCategory}>
          <input type="hidden" name="id" value={selected?.id ?? ""} />
          <input type="hidden" name="name" value={newName} />
          <button
            className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            type="submit"
            disabled={!selected || !newName.trim()}
          >
            Rename
          </button>
        </form>
      </div>
    </div>
  );
}
