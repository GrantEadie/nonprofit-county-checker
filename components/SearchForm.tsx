"use client";

import { useState, useEffect } from "react";
import type { SearchParams } from "@/lib/types";

interface Props {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  initialParams?: SearchParams;
}

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

const THRESHOLD_OPTIONS = [
  { label: "$250K+", value: 250_000 },
  { label: "$500K+", value: 500_000 },
  { label: "$1M+",   value: 1_000_000 },
  { label: "$2M+",   value: 2_000_000 },
  { label: "$5M+",   value: 5_000_000 },
];

export default function SearchForm({ onSearch, loading, initialParams }: Props) {
  const [state,     setState]     = useState(initialParams?.state     ?? "");
  const [county,    setCounty]    = useState(initialParams?.county    ?? "");
  const [threshold, setThreshold] = useState(initialParams?.threshold ?? 1_000_000);

  const [allCounties,    setAllCounties]    = useState<string[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(false);

  const [allCities,      setAllCities]      = useState<string[]>(initialParams?.cities ?? []);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set(initialParams?.cities ?? [])
  );
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError,   setCityError]   = useState("");

  // Load counties whenever state changes
  useEffect(() => {
    if (!state) return;
    setCounty("");
    setAllCities([]);
    setSelectedCities(new Set());
    setAllCounties([]);
    setCountiesLoading(true);

    fetch(`/api/counties?state=${state}`)
      .then((r) => r.json())
      .then((data) => setAllCounties(data.counties ?? []))
      .catch(() => setAllCounties([]))
      .finally(() => setCountiesLoading(false));
  }, [state]);

  async function handleFindCities() {
    if (!state || !county) return;
    setCityLoading(true);
    setCityError("");
    setAllCities([]);
    setSelectedCities(new Set());

    try {
      const res = await fetch(
        `/api/cities?state=${state}&county=${encodeURIComponent(county)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch cities");
      const fetched: string[] = data.cities;
      setAllCities(fetched);
      setSelectedCities(new Set(fetched));
    } catch (err) {
      setCityError(err instanceof Error ? err.message : "Error fetching cities");
    } finally {
      setCityLoading(false);
    }
  }

  function toggleCity(city: string) {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      next.has(city) ? next.delete(city) : next.add(city);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCities.size) return;
    onSearch({ state, county, cities: [...selectedCities], threshold });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Row 1: State */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="dark-select w-full"
          >
            <option value="">Select a state…</option>
            {STATE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* County dropdown — visible once state is chosen */}
        {state && (
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              County
            </label>
            {countiesLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500 h-9">
                <svg className="animate-spin w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Loading counties…
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={county}
                  onChange={(e) => {
                    setCounty(e.target.value);
                    setAllCities([]);
                    setSelectedCities(new Set());
                  }}
                  className="dark-select flex-1"
                >
                  <option value="">Select a county…</option>
                  {allCounties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleFindCities}
                  disabled={cityLoading || !county}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-white/8 bg-surface-3
                             text-zinc-300 hover:text-zinc-100 hover:bg-surface-3/80
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-150 whitespace-nowrap"
                >
                  {cityLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Loading
                    </span>
                  ) : "Find Cities"}
                </button>
              </div>
            )}
            {cityError && <p className="text-xs text-red-400 mt-1">{cityError}</p>}
          </div>
        )}
      </div>

      {/* Revenue Threshold */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Revenue Threshold
        </label>
        <div className="flex flex-wrap gap-2">
          {THRESHOLD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setThreshold(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                threshold === opt.value
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                  : "border-white/8 bg-surface-2 text-zinc-400 hover:text-zinc-200 hover:border-white/15"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cities */}
      {allCities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Cities
              <span className="ml-2 text-zinc-500 normal-case tracking-normal font-normal">
                {selectedCities.size} of {allCities.length} selected
              </span>
            </label>
            <div className="flex gap-3 text-xs text-orange-400">
              <button type="button" onClick={() => setSelectedCities(new Set(allCities))} className="hover:text-orange-300 transition-colors">All</button>
              <button type="button" onClick={() => setSelectedCities(new Set())} className="hover:text-orange-300 transition-colors">None</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4 bg-surface-2 rounded-xl border border-white/5 max-h-52 overflow-y-auto">
            {allCities.map((city) => (
              <label key={city} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-150 ${
                    selectedCities.has(city)
                      ? "bg-orange-500 border-orange-500"
                      : "border-zinc-600 bg-surface-3 group-hover:border-zinc-400"
                  }`}
                  onClick={() => toggleCity(city)}
                >
                  {selectedCities.has(city) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span
                  className={`transition-colors ${selectedCities.has(city) ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"}`}
                  onClick={() => toggleCity(city)}
                >
                  {city}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={loading || selectedCities.size === 0}
          className="relative px-7 py-2.5 rounded-lg text-sm font-semibold
                     bg-orange-600 hover:bg-orange-500
                     text-white shadow-lg shadow-orange-500/20
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Searching…
            </span>
          ) : "Search Nonprofits"}
        </button>
      </div>
    </form>
  );
}
