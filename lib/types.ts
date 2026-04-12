export type SearchMode = "nonprofits" | "bcorps";

export interface BCorpResult {
  id: string;
  name: string;
  website: string;
  city: string;
  state: string;
  country: string;
  industry: string;
  sector: string;
  employees: string;
  score: number | null;
  certifiedDate: string;
  profileUrl: string;
}

export interface BCorpSearchResponse {
  results: BCorpResult[];
  total: number;
  state: string;
  county: string;
  cities: string[];
}

export interface OrgResult {
  ein: string;
  name: string;
  city: string;
  state: string;
  nteeCode: string;
  nteeCategory: string;
  subsection: string;
  revenue: number | null;
  assets: number | null;
  taxPeriod: string;
  viable: boolean | null;
  propublicaUrl: string;
  deductibility: string;
}

export interface SearchParams {
  state: string;
  county: string;
  cities: string[];
  threshold: number;
}

export interface SavedSearch {
  id: string;
  label: string;
  params: SearchParams;
  savedAt: string;
  resultCount?: number;
  viableCount?: number;
}

export interface SearchResponse {
  results: OrgResult[];
  total: number;
  viable: number;
  noData: number;
  state: string;
  county: string;
  cities: string[];
}
