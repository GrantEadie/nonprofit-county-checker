"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3">
          <Logo className="w-12 h-12 text-orange-500" />
          <h1 className="font-krona text-sm uppercase tracking-wide text-zinc-100">
            Nonprofit County Checker
          </h1>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-orange-500/10 bg-surface-1 shadow-xl shadow-black/30 p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="Enter password"
              className="dark-input w-full"
            />
            {error && <p className="text-xs text-red-400 pt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-7 py-2.5 rounded-lg text-sm font-semibold
                       bg-orange-600 hover:bg-orange-500 text-white
                       shadow-lg shadow-orange-500/20
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          Built with love by{" "}
          <a
            href="https://granteadie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            Grant Eadie
          </a>
        </p>
      </div>
    </div>
  );
}
