import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl } from "./qr";

export default async function CardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch the most recent loyalty account (defensive: no .single())
  const { data, error } = await supabase
    .from("loyalty_accounts")
    .select("card_code, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My QR Card</h1>
              <p className="mt-1 text-sm text-gray-500">
                Show this at pickup to apply benefits.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/app"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load loyalty account: {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const acct = data?.[0];

  if (!acct) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My QR Card</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your digital loyalty card.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
              href="/app"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 max-w-md rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Your loyalty card is not ready yet. Please refresh the page or contact staff.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const code = acct.card_code;

  // Generate QR from public-safe card code
  const dataUrl = await qrDataUrl(code);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My QR Card</h1>
            <p className="mt-1 text-sm text-gray-500">
              Show this QR at pickup. Staff will scan it to apply your discount and award points.
            </p>
          </div>

          <Link
            className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
            href="/app"
          >
            Back
          </Link>
        </div>

        {/* Card */}
        <div className="mt-6 max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm">
            {/* subtle decorative header */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gray-100 to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-500">PaparGrill Loyalty</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight">Digital Card</div>
                </div>
                <div className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                  QR
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt="Loyalty QR code"
                  className="h-64 w-64 rounded-2xl border bg-white p-3 shadow-sm"
                />
              </div>

              <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Card code</div>
                  <div className="text-xs text-gray-500">Show at pickup</div>
                </div>
                <div className="mt-1 font-mono text-sm tracking-wide text-gray-900">
                  {code}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Keep this code private. It identifies your loyalty account.
              </div>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </main>
  );
}
