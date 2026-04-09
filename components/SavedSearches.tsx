"use client";

import { useEffect, useState } from "react";
import type { SavedSearch, SearchParams } from "@/lib/types";

const STORAGE_KEY = "nonprofit_checker_saved_searches";

export function useSavedSearches() {
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function saveSearch(params: SearchParams, resultCount?: number, viableCount?: number) {
    const entry: SavedSearch = {
      id:    crypto.randomUUID(),
      label: `${params.county} County, ${params.state}`,
      params,
      savedAt: new Date().toISOString(),
      resultCount,
      viableCount,
    };
    setSaved((prev) => {
      const next = [entry, ...prev].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function deleteSearch(id: string) {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { saved, saveSearch, deleteSearch };
}

interface Props {
  saved: SavedSearch[];
  onLoad: (params: SearchParams) => void;
  onDelete: (id: string) => void;
}

export default function SavedSearches({ saved, onLoad, onDelete }: Props) {
  if (!saved.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-3 uppercase tracking-wider">Recent Searches</p>
      <div className="flex flex-wrap gap-2">
        {saved.map((s) => (
          <div
            key={s.id}
            className="group flex items-center gap-1 bg-surface-2 border border-[var(--border-accent)]
                       rounded-lg pl-3.5 pr-2 py-1.5 transition-all duration-150
                       hover:border-tangerine/40 hover:bg-surface-3"
          >
            <button
              type="button"
              onClick={() => onLoad(s.params)}
              className="text-left"
            >
              <span className="text-sm font-medium text-ink-2">{s.label}</span>
              {s.resultCount !== undefined && (
                <span className="ml-2 text-xs text-ink-4">
                  {s.resultCount} orgs{s.viableCount !== undefined ? ` · ${s.viableCount} viable` : ""}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              aria-label="Remove"
              className="ml-1 text-ink-4 hover:text-ink-2 transition-colors text-xs p-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
