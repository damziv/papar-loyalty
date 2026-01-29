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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border shadow-sm p-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Papar<span className="text-orange-600">Grill</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access your loyalty account
          </p>
        </div>

        {/* Action */}
        <button
          onClick={signInWithGoogle}
          className="mt-8 w-full rounded-xl bg-black text-white py-2.5 font-medium
                     hover:bg-gray-900 active:scale-[0.99] transition"
        >
          Continue with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to our terms & privacy policy
        </p>
      </div>
    </main>
  );
}
