"use client";

import { useState, useMemo } from "react";
import type { OrgResult, SearchResponse } from "@/lib/types";

type SortKey = keyof Pick<OrgResult, "name" | "city" | "revenue" | "nteeCategory" | "taxPeriod">;
type SortDir = "asc" | "desc";

function fmt(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000)
    return "$" + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000)
    return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
}

function fmtFull(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function exportCsv(rows: OrgResult[], county: string, state: string) {
  const headers = [
    "Organization Name","EIN","City","State","NTEE Code","Category",
    "Tax Type","Annual Revenue","Assets","Filing Year","Viable","ProPublica URL",
  ];
  const lines = rows.map((r) => [
    `"${r.name.replace(/"/g, '""')}"`,
    r.ein, r.city, r.state, r.nteeCode, r.nteeCategory, r.subsection,
    r.revenue ?? "", r.assets ?? "", r.taxPeriod,
    r.viable === null ? "" : r.viable ? "YES" : "NO",
    r.propublicaUrl,
  ].join(","));
  const csv  = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${county.toLowerCase().replace(/\s+/g, "_")}_${state.toLowerCase()}_nonprofits.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type FilterMode = "all" | "viable" | "no-data";

interface Props { data: SearchResponse }

export default function ResultsTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter,  setFilter]  = useState<FilterMode>("all");
  const [search,  setSearch]  = useState("");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "revenue" ? "desc" : "asc"); }
  }

  const filtered = useMemo(() => {
    let rows = data.results;
    if (filter === "viable")  rows = rows.filter((r) => r.viable === true);
    if (filter === "no-data") rows = rows.filter((r) => r.revenue === null);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.nteeCategory.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let av: string | number = sortKey === "revenue" ? (a.revenue ?? -1) : (a[sortKey] ?? "");
      let bv: string | number = sortKey === "revenue" ? (b.revenue ?? -1) : (b[sortKey] ?? "");
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data.results, filter, search, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="opacity-20 ml-1 text-xs">↕</span>;
    return <span className="text-orange-400 ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thCls = "px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-300 transition-colors whitespace-nowrap";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orgs",   value: data.total,   color: "text-zinc-100" },
          { label: "Viable",       value: data.viable,  color: "text-emerald-400" },
          { label: "No Data",      value: data.noData,  color: "text-zinc-500" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-2 rounded-xl border border-orange-500/10 px-4 py-3">
            <p className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, city, category…"
            className="dark-input w-full pl-9"
          />
        </div>

        <div className="flex rounded-lg border border-white/8 overflow-hidden text-sm">
          {(["all", "viable", "no-data"] as FilterMode[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 font-medium transition-colors duration-100 ${
                filter === f
                  ? "bg-orange-500/20 text-orange-300"
                  : "bg-surface-2 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "no-data" ? "No Data" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => exportCsv(filtered, data.county, data.state)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg
                     border border-white/8 bg-surface-2 text-zinc-400
                     hover:text-zinc-100 hover:border-white/15 transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <p className="text-xs text-zinc-600">
        Showing <span className="text-zinc-400">{filtered.length.toLocaleString()}</span> of {data.total.toLocaleString()} organizations
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-orange-500/10 shadow-2xl shadow-black/40">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-surface-2">
              <th className={thCls} onClick={() => handleSort("name")}>Organization <SortIcon col="name" /></th>
              <th className={thCls} onClick={() => handleSort("city")}>City <SortIcon col="city" /></th>
              <th className={thCls} onClick={() => handleSort("nteeCategory")}>Category <SortIcon col="nteeCategory" /></th>
              <th className={thCls} onClick={() => handleSort("revenue")}>Revenue <SortIcon col="revenue" /></th>
              <th className={thCls} onClick={() => handleSort("taxPeriod")}>Year <SortIcon col="taxPeriod" /></th>
              <th className={`${thCls} cursor-default`}>Viable</th>
              <th className={`${thCls} cursor-default`}>Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((org, i) => (
              <tr
                key={org.ein}
                className={`results-row group ${i % 2 === 0 ? "bg-surface-1" : "bg-surface-1/50"} hover:bg-surface-3`}
              >
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-medium text-zinc-100 truncate" title={org.name}>{org.name}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{org.subsection}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{org.city}</td>
                <td className="px-4 py-3">
                  <span className="inline-block text-xs bg-white/5 rounded-md px-2 py-0.5 text-zinc-400 font-mono">
                    {org.nteeCode || "—"}
                  </span>
                  <div className="text-xs text-zinc-600 mt-0.5">{org.nteeCategory}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className="font-mono text-sm tabular-nums text-zinc-200"
                    title={fmtFull(org.revenue)}
                  >
                    {fmt(org.revenue)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap tabular-nums">{org.taxPeriod || "—"}</td>
                <td className="px-4 py-3">
                  {org.viable === true  && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Yes</span>}
                  {org.viable === false && <span className="inline-flex items-center text-xs font-medium text-zinc-600 bg-white/3 border border-white/5 px-2 py-0.5 rounded-full">No</span>}
                  {org.viable === null  && <span className="text-zinc-700 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={org.propublicaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:text-orange-300 transition-colors"
                  >
                    ProPublica ↗
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-zinc-600">
                  No results match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
