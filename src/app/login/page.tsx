"use client";

import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    const origin = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">PaparGrill Loyalty</h1>
        <p className="mt-2 text-sm opacity-80">Sign in to access your loyalty account.</p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-xl bg-black text-white py-2"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
