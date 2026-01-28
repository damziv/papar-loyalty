"use client";

import { useMemo, useState } from "react";
import { placeOrder } from "../actions";

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  base_price_cents: number;
  category_id: string | null;
};
type Location = { id: string; name: string };

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function CartClient({
  locations,
  categories,
  items,
}: {
  locations: Location[];
  categories: Category[];
  items: MenuItem[];
}) {
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [showCart, setShowCart] = useState(true);

  // cart map: itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});

  const cartLines = useMemo(() => {
    const lines = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? { item, qty } : null;
      })
      .filter(Boolean) as { item: MenuItem; qty: number }[];

    return lines;
  }, [cart, items]);

  const clientSubtotal = useMemo(() => {
    return cartLines.reduce((sum, l) => sum + l.item.base_price_cents * l.qty, 0);
  }, [cartLines]);

  const cartJson = useMemo(() => {
    return JSON.stringify(cartLines.map((l) => ({ menu_item_id: l.item.id, quantity: l.qty })));
  }, [cartLines]);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const cur = next[id] ?? 0;
      if (cur <= 1) delete next[id];
      else next[id] = cur - 1;
      return next;
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* MENU */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          if (catItems.length === 0) return null;

          return (
            <section key={cat.id}>
              <h2 className="text-lg font-semibold">{cat.name}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {catItems.map((it) => (
                  <div key={it.id} className="rounded-2xl border p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-medium">{it.name}</div>
                      <div className="font-semibold">€{euros(it.base_price_cents)}</div>
                    </div>
                    {it.description ? (
                      <div className="mt-1 text-sm text-muted-foreground">{it.description}</div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        In cart: <span className="font-medium">{cart[it.id] ?? 0}</span>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
                        onClick={() => add(it.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* CART */}
      <div className="rounded-2xl border p-4 lg:sticky lg:top-6 h-fit">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cart</h3>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setShowCart((s) => !s)}
          >
            {showCart ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">Pickup location</label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {showCart ? (
          <>
            <div className="mt-4 space-y-3">
              {cartLines.length === 0 ? (
                <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                  Your cart is empty.
                </div>
              ) : (
                cartLines.map(({ item, qty }) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="flex items-baseline justify-between">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm">€{euros(item.base_price_cents * qty)}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        €{euros(item.base_price_cents)} × {qty}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                          onClick={() => dec(item.id)}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                          onClick={() => add(item.id)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 rounded-xl border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">€{euros(clientSubtotal)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Discount + points are applied at pickup when staff scans your QR.
              </div>
            </div>

            <form action={placeOrder} className="mt-4 space-y-2">
              <input type="hidden" name="location_id" value={locationId} />
              <input type="hidden" name="cart_json" value={cartJson} />

              <button
                type="submit"
                className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
                disabled={cartLines.length === 0 || !locationId}
              >
                Place order
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
