"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import BCorpResultsTable from "@/components/BCorpResultsTable";
import SavedSearches, { useSavedSearches } from "@/components/SavedSearches";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import WelcomePopup from "@/components/WelcomePopup";
import type { SearchParams, SearchResponse, BCorpSearchResponse, SearchMode } from "@/lib/types";

export default function Home() {
  const [mode,       setMode]       = useState<SearchMode>("nonprofits");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [npResults,  setNpResults]  = useState<SearchResponse | null>(null);
  const [bcResults,  setBcResults]  = useState<BCorpSearchResponse | null>(null);
  const [lastParams, setLastParams] = useState<SearchParams | undefined>();

  const { saved, saveSearch, deleteSearch } = useSavedSearches();

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setError("");
    setNpResults(null);
    setBcResults(null);

    try {
      const endpoint = mode === "bcorps" ? "/api/bcorp" : "/api/search";
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      if (mode === "bcorps") {
        setBcResults(data as BCorpSearchResponse);
        saveSearch(params, data.total, 0);
      } else {
        setNpResults(data as SearchResponse);
        saveSearch(params, data.total, data.viable);
      }
      setLastParams(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(newMode: SearchMode) {
    setMode(newMode);
    setError("");
    setNpResults(null);
    setBcResults(null);
  }

  const results = mode === "bcorps" ? bcResults : npResults;

  return (
    <div className="min-h-screen">
      <WelcomePopup />

      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-surface backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 text-tangerine flex-shrink-0" />
            <div>
              <h1 className="font-oswald text-sm uppercase tracking-wide text-ink-1">
                Org County Checker
              </h1>
              <p className="text-xs text-ink-3 mt-0.5">
                Nonprofits · B Corps · by county
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p className="text-xs text-ink-3 hidden sm:block">
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
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        {/* Saved searches */}
        {saved.length > 0 && (
          <SavedSearches
            saved={saved}
            onLoad={handleSearch}
            onDelete={deleteSearch}
          />
        )}

        {/* Search card */}
        <div className="rounded-2xl border border-[var(--border-accent)] bg-surface shadow-xl shadow-black/10 dark:shadow-black/30 p-6 sm:p-8">

          {/* Mode toggle */}
          <div className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-[var(--border)] w-fit">
            {(["nonprofits", "bcorps"] as SearchMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  mode === m
                    ? m === "bcorps"
                      ? "bg-bcorp/20 text-bcorp border border-bcorp/40 shadow-sm"
                      : "bg-tangerine/20 text-tangerine border border-tangerine/40 shadow-sm"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {m === "nonprofits" ? "Nonprofits" : "B Corps"}
              </button>
            ))}
          </div>

          <h2 className="text-xs font-medium text-ink-3 uppercase tracking-widest mb-6">
            Search
          </h2>
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            initialParams={lastParams}
            mode={mode}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="rounded-2xl border border-[var(--border-accent)] bg-surface shadow-xl shadow-black/10 dark:shadow-black/30 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-medium text-ink-3 uppercase tracking-widest">
                Results
              </h2>
              <span className="text-xs text-ink-3">
                {results.county} County, {results.state}
              </span>
            </div>
            {mode === "bcorps" && bcResults ? (
              <BCorpResultsTable data={bcResults} />
            ) : npResults ? (
              <ResultsTable data={npResults} />
            ) : null}
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-ink-4 text-center pb-8">
          {mode === "bcorps" ? (
            <>
              B Corp data from the{" "}
              <a
                href="https://www.bcorporation.net/en-us/find-a-b-corp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-3 hover:text-tangerine transition-colors underline underline-offset-2"
              >
                B Lab directory
              </a>
              . Certification status verified by B Lab.
            </>
          ) : (
            <>
              Data from the{" "}
              <a
                href="https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-3 hover:text-tangerine transition-colors underline underline-offset-2"
              >
                IRS Exempt Organizations Business Master File
              </a>
              . Revenue figures from most recent Form 990 filing.
            </>
          )}
        </p>
      </main>
    </div>
  );
}
