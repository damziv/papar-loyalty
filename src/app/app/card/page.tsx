import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl } from "./qr";

export default async function CardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: acct, error } = await supabase
    .from("loyalty_accounts")
    .select("card_code")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">My QR Card</h1>
        <p className="mt-2 text-sm text-red-600">
          Failed to load loyalty account: {error.message}
        </p>
        <div className="mt-4">
          <Link className="underline" href="/app">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const code = acct.card_code;

  // QR encodes the public-safe card code (not UUID).
  // Keep it simple: just encode the string for scanning.
  const dataUrl = await qrDataUrl(code);

  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My QR Card</h1>
        <Link className="text-sm underline" href="/app">
          Back
        </Link>
      </div>

      <div className="mt-6 max-w-md rounded-2xl border p-6">
        <div className="text-sm text-muted-foreground">
          Show this QR code at pickup. Staff will scan it to apply your discount
          and award points.
        </div>

        <div className="mt-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Loyalty QR code"
            className="h-64 w-64 rounded-xl border bg-white p-3"
          />
        </div>

        <div className="mt-4 text-center">
          <div className="text-xs text-muted-foreground">Card code</div>
          <div className="mt-1 font-mono text-sm">{code}</div>
        </div>
      </div>
    </div>
  );
}
