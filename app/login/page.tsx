"use client";

import { useState } from "react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);

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
      window.location.href = "/";
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
          <Logo className="w-12 h-12 text-tangerine" />
          <h1 className="font-oswald text-sm uppercase tracking-wide text-ink-1">
            Nonprofit County Checker
          </h1>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border-accent)] bg-surface shadow-xl shadow-black/10 dark:shadow-black/30 p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter password"
                className="dark-input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1 transition-colors"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  // Eye-off
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0013.5 13.5M6.5 6.5A9.77 9.77 0 003 12c1.636 3.643 5.195 6 9 6a9.77 9.77 0 004.5-1.1M9 9a3 3 0 014.243 4.243M17.5 17.5A9.77 9.77 0 0021 12c-1.636-3.643-5.195-6-9-6a9.77 9.77 0 00-2.5.33" />
                  </svg>
                ) : (
                  // Eye
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400 pt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-7 py-2.5 rounded-lg text-sm font-semibold
                       bg-tangerine hover:opacity-90 text-white
                       shadow-lg shadow-tangerine/20
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-tangerine/50"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>

        <p className="text-center text-xs text-ink-4">
          Built with love by{" "}
          <a
            href="https://granteadie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tangerine hover:opacity-80 transition-opacity"
          >
            Grant Eadie
          </a>
        </p>
      </div>
    </div>
  );
}
