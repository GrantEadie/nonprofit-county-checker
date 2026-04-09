"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nonprofit_checker_welcome_seen";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide]     = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so it doesn't flash in before the page settles
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function advance() {
    setAnimating(true);
    setTimeout(() => {
      setSlide(1);
      setAnimating(false);
    }, 200);
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[340px]
                 rounded-2xl border border-[var(--border-accent)]
                 bg-surface shadow-2xl shadow-black/20 dark:shadow-black/50
                 transition-all duration-300"
      style={{ animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-tangerine" />
          <span className="text-xs font-semibold text-ink-3 uppercase tracking-widest">
            {slide === 0 ? "How it works" : "How to use it"}
          </span>
        </div>
        <button
          onClick={dismiss}
          className="text-ink-4 hover:text-ink-2 transition-colors text-sm leading-none p-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Slide content */}
      <div
        className="px-5 py-4 transition-opacity duration-200"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {slide === 0 ? <SlideOne /> : <SlideTwo />}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        {/* Dots */}
        <div className="flex gap-1.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                i === slide ? "bg-tangerine" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>

        {slide === 0 ? (
          <button
            onClick={advance}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold
                       bg-tangerine hover:opacity-90 text-white transition-all"
          >
            Okay
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={dismiss}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold
                       bg-tangerine hover:opacity-90 text-white transition-all"
          >
            Got it
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Slide 1: visual pipeline ─────────────────────────────────────── */
function SlideOne() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2 leading-relaxed">
        Search the <span className="text-ink-1 font-medium">IRS Exempt Organizations</span> database
        — every registered US nonprofit — filtered down to exactly the county and cities you care about.
      </p>

      {/* Flow diagram */}
      <div className="flex items-stretch gap-1.5">

        {/* Step 1 */}
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-surface-2 p-3 flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
            <svg className="w-4 h-4 text-ink-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-ink-1 leading-tight">Your Filters</p>
          <p className="text-[10px] text-ink-3 leading-tight">State · County · Cities · Revenue</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-ink-4 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 2 */}
        <div className="flex-1 rounded-xl border border-tangerine/30 bg-tangerine/8 p-3 flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 rounded-lg bg-tangerine/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-tangerine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6M9 15h4" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-ink-1 leading-tight">IRS BMF</p>
          <p className="text-[10px] text-ink-3 leading-tight">1M+ nonprofits updated monthly</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-ink-4 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 3 */}
        <div className="flex-1 rounded-xl border border-[var(--viable-border)] bg-[var(--viable-bg)] p-3 flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 rounded-lg bg-[var(--viable-bg)] border border-[var(--viable-border)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--viable-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-ink-1 leading-tight">Results</p>
          <p className="text-[10px] text-ink-3 leading-tight">Sorted · filterable · exportable</p>
        </div>

      </div>

      <p className="text-xs text-ink-3 leading-relaxed">
        Revenue figures come from each org&apos;s most recent Form 990 filing.
        <span className="text-viable font-medium"> Viable</span> = meets your revenue threshold.
      </p>
    </div>
  );
}

/* ── Slide 2: how to use ─────────────────────────────────────────── */
const STEPS = [
  {
    n: "1",
    title: "Pick a state",
    desc: "Counties load automatically.",
  },
  {
    n: "2",
    title: "Pick a county → Find Cities",
    desc: "Fetches every city in that county from the Census Bureau.",
  },
  {
    n: "3",
    title: "Select cities & threshold",
    desc: "Toggle individual cities or use All / None. Choose a minimum annual revenue.",
  },
  {
    n: "4",
    title: "Hit Search",
    desc: "Results stream in below — sort, filter, or export to CSV.",
  },
];

function SlideTwo() {
  return (
    <div className="space-y-2.5">
      {STEPS.map((s) => (
        <div key={s.n} className="flex items-start gap-3">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-tangerine/15 border border-tangerine/30
                           text-tangerine text-[11px] font-bold flex-shrink-0
                           flex items-center justify-center">
            {s.n}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-1 leading-snug">{s.title}</p>
            <p className="text-xs text-ink-3 leading-relaxed mt-0.5">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
