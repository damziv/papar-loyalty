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

  const totalItems = useMemo(() => {
    return cartLines.reduce((sum, l) => sum + l.qty, 0);
  }, [cartLines]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* MENU */}
        <div className="space-y-10 pb-28 lg:pb-0">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            if (catItems.length === 0) return null;

            return (
              <section key={cat.id}>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{cat.name}</h2>
                  <div className="text-xs text-gray-500">{catItems.length} items</div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {catItems.map((it) => {
                    const qty = cart[it.id] ?? 0;

                    return (
                      <div
                        key={it.id}
                        className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold leading-snug">{it.name}</div>
                            {it.description ? (
                              <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                                {it.description}
                              </div>
                            ) : null}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold">
                              €{euros(it.base_price_cents)}
                            </div>
                            {qty > 0 ? (
                              <div className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600">
                                In cart: <span className="ml-1 font-semibold">{qty}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Tap to add, adjust in cart
                          </div>

                          <button
                            type="button"
                            className="rounded-xl bg-black px-3 py-1.5 text-sm font-medium text-white
                                       hover:bg-gray-900 active:scale-[0.99] transition"
                            onClick={() => add(it.id)}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* CART (Desktop sidebar) */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl border bg-white p-4 shadow-sm lg:sticky lg:top-6 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Cart</h3>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-black underline underline-offset-4"
                onClick={() => setShowCart((s) => !s)}
              >
                {showCart ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Pickup location</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none
                           focus:ring-2 focus:ring-black/10"
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
                    <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-500">
                      Your cart is empty. Add something from the menu.
                    </div>
                  ) : (
                    cartLines.map(({ item, qty }) => (
                      <div key={item.id} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium leading-snug">{item.name}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              €{euros(item.base_price_cents)} × {qty}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold">
                              €{euros(item.base_price_cents * qty)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                            onClick={() => dec(item.id)}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                            onClick={() => add(item.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 rounded-xl border bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">€{euros(clientSubtotal)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Discount + points are applied at pickup when staff scans your QR.
                  </div>
                </div>

                <form action={placeOrder} className="mt-4 space-y-2">
                  <input type="hidden" name="location_id" value={locationId} />
                  <input type="hidden" name="cart_json" value={cartJson} />

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white
                               hover:bg-gray-900 disabled:opacity-50 disabled:hover:bg-black"
                    disabled={cartLines.length === 0 || !locationId}
                  >
                    Place order
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </aside>
      </div>

      {/* MOBILE CART: sticky bottom bar + expandable panel */}
      <div className="lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between rounded-xl border bg-white px-3 py-2
                           text-left shadow-sm active:scale-[0.99] transition"
                onClick={() => setShowCart(true)}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Cart</div>
                  <div className="text-xs text-gray-500">
                    {totalItems === 0 ? "Empty" : `${totalItems} item${totalItems === 1 ? "" : "s"}`}
                    {" • "}€{euros(clientSubtotal)}
                  </div>
                </div>
                <div className="text-xs text-gray-600 underline underline-offset-4">View</div>
              </button>

              <form action={placeOrder} className="shrink-0">
                <input type="hidden" name="location_id" value={locationId} />
                <input type="hidden" name="cart_json" value={cartJson} />

                <button
                  type="submit"
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white
                             hover:bg-gray-900 disabled:opacity-50 disabled:hover:bg-black"
                  disabled={cartLines.length === 0 || !locationId}
                >
                  Order
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Expandable panel */}
        {showCart ? (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCart(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white shadow-2xl">
              <div className="mx-auto max-w-6xl px-4 pb-6 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Your cart</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Discount + points are applied at pickup when staff scans your QR.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                    onClick={() => setShowCart(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium">Pickup location</label>
                  <select
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none
                               focus:ring-2 focus:ring-black/10"
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

                <div className="mt-4 space-y-3">
                  {cartLines.length === 0 ? (
                    <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-500">
                      Your cart is empty. Add something from the menu.
                    </div>
                  ) : (
                    cartLines.map(({ item, qty }) => (
                      <div key={item.id} className="rounded-2xl border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium leading-snug">{item.name}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              €{euros(item.base_price_cents)} × {qty}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold">
                              €{euros(item.base_price_cents * qty)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => dec(item.id)}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => add(item.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-lg font-semibold">€{euros(clientSubtotal)}</span>
                  </div>
                </div>

                <form action={placeOrder} className="mt-4 space-y-2">
                  <input type="hidden" name="location_id" value={locationId} />
                  <input type="hidden" name="cart_json" value={cartJson} />

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white
                               hover:bg-gray-900 disabled:opacity-50 disabled:hover:bg-black"
                    disabled={cartLines.length === 0 || !locationId}
                  >
                    Place order
                  </button>
                </form>

                <div className="h-3" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
