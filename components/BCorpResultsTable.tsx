"use client";

import { useState, useMemo } from "react";
import type { BCorpResult, BCorpSearchResponse } from "@/lib/types";

type SortKey = "name" | "city" | "score" | "industry" | "certifiedDate";
type SortDir = "asc" | "desc";

function fmtScore(score: number | null): string {
  if (score === null) return "—";
  return score.toFixed(1);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  // Handles ISO strings like "2012-03-15T00:00:00.000Z" or "2012-03-15"
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function exportCsv(rows: BCorpResult[], county: string, state: string) {
  const headers = [
    "Company Name","Website","City","State","Industry","Sector",
    "Employees","B Impact Score","Certified Date","Profile URL",
  ];
  const lines = rows.map((r) => [
    `"${r.name.replace(/"/g, '""')}"`,
    r.website, r.city, r.state, r.industry, r.sector,
    r.employees, r.score ?? "", r.certifiedDate, r.profileUrl,
  ].join(","));
  const csv  = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${county.toLowerCase().replace(/\s+/g, "_")}_${state.toLowerCase()}_bcorps.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props { data: BCorpSearchResponse }

export default function BCorpResultsTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search,  setSearch]  = useState("");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "score" ? "desc" : "asc"); }
  }

  const filtered = useMemo(() => {
    let rows = data.results;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.industry.toLowerCase().includes(q) ||
          r.sector.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "score") {
        av = a.score ?? -1;
        bv = b.score ?? -1;
      } else {
        av = a[sortKey] ?? "";
        bv = b[sortKey] ?? "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data.results, search, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="opacity-20 ml-1 text-xs">↕</span>;
    return <span className="text-school-yellow ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thCls =
    "px-4 py-3 text-left text-xs font-medium text-ink-3 uppercase tracking-wider cursor-pointer select-none hover:text-ink-1 transition-colors whitespace-nowrap";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total B Corps", value: data.total,                      cls: "text-ink-1" },
          { label: "Showing",       value: filtered.length.toLocaleString(), cls: "text-bcorp" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-2 rounded-xl border border-[var(--border-accent)] px-4 py-3">
            <p className={`text-2xl font-semibold tabular-nums ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-ink-3 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, city, industry…"
            className="dark-input w-full pl-9"
          />
        </div>

        <button
          type="button"
          onClick={() => exportCsv(filtered, data.county, data.state)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg
                     border border-[var(--border)] bg-surface-2 text-ink-3
                     hover:text-ink-1 hover:border-[var(--border-accent)] transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <p className="text-xs text-ink-4">
        Showing <span className="text-ink-2">{filtered.length.toLocaleString()}</span> of {data.total.toLocaleString()} B Corps
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-accent)] shadow-lg shadow-black/10 dark:shadow-black/40">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-surface-2">
              <th className={thCls} onClick={() => handleSort("name")}>Company <SortIcon col="name" /></th>
              <th className={thCls} onClick={() => handleSort("city")}>City <SortIcon col="city" /></th>
              <th className={thCls} onClick={() => handleSort("industry")}>Industry <SortIcon col="industry" /></th>
              <th className={thCls} onClick={() => handleSort("score")}>B Score <SortIcon col="score" /></th>
              <th className={thCls} onClick={() => handleSort("certifiedDate")}>Certified <SortIcon col="certifiedDate" /></th>
              <th className={`${thCls} cursor-default`}>Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((org, i) => (
              <tr
                key={org.id}
                className={`results-row ${i % 2 === 0 ? "bg-surface" : "bg-surface-2"} hover:bg-surface-3`}
              >
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-medium text-ink-1 truncate" title={org.name}>{org.name}</div>
                  {org.employees && (
                    <div className="text-xs text-ink-4 mt-0.5">{org.employees} employees</div>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{org.city}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-ink-3">{org.industry || "—"}</div>
                  {org.sector && org.sector !== org.industry && (
                    <div className="text-xs text-ink-4 mt-0.5">{org.sector}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {org.score !== null ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium
                                     text-bcorp bg-bcorp/10 border border-bcorp/30
                                     px-2 py-0.5 rounded-full tabular-nums">
                      {fmtScore(org.score)}
                    </span>
                  ) : (
                    <span className="text-ink-4 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-3 whitespace-nowrap tabular-nums text-xs">
                  {fmtDate(org.certifiedDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <a
                      href={org.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-bcorp hover:opacity-80 transition-opacity whitespace-nowrap"
                    >
                      B Lab ↗
                    </a>
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-tangerine hover:opacity-80 transition-opacity whitespace-nowrap"
                      >
                        Website ↗
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-ink-3">
                  No B Corps found in this area.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
