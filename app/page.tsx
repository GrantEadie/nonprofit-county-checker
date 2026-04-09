"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import SavedSearches, { useSavedSearches } from "@/components/SavedSearches";
import Logo from "@/components/Logo";
import type { SearchParams, SearchResponse } from "@/lib/types";

export default function Home() {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [results,    setResults]    = useState<SearchResponse | null>(null);
  const [lastParams, setLastParams] = useState<SearchParams | undefined>();

  const { saved, saveSearch, deleteSearch } = useSavedSearches();

  async function handleSearch(params: SearchParams) {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data as SearchResponse);
      setLastParams(params);
      saveSearch(params, data.total, data.viable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="relative border-b border-orange-500/10 bg-surface-1/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 text-orange-500 flex-shrink-0" />
            <div>
              <h1 className="font-krona text-sm uppercase tracking-wide text-zinc-100">
                Nonprofit County Checker
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                IRS public data · updated monthly
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
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
      </header>

      <main className="relative max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        {/* Saved searches */}
        {saved.length > 0 && (
          <SavedSearches
            saved={saved}
            onLoad={handleSearch}
            onDelete={deleteSearch}
          />
        )}

        {/* Search card */}
        <div className="rounded-2xl border border-orange-500/10 bg-surface-1 shadow-xl shadow-black/30 p-6 sm:p-8">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">
            Search
          </h2>
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            initialParams={lastParams}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="rounded-2xl border border-orange-500/10 bg-surface-1 shadow-xl shadow-black/30 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
                Results
              </h2>
              <span className="text-xs text-zinc-500">
                {results.county} County, {results.state}
              </span>
            </div>
            <ResultsTable data={results} />
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-zinc-600 text-center pb-8">
          Data from the{" "}
          <a
            href="https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-orange-400 transition-colors underline underline-offset-2"
          >
            IRS Exempt Organizations Business Master File
          </a>
          . Revenue figures from most recent Form 990 filing.
        </p>
      </main>
    </div>
  );
}
