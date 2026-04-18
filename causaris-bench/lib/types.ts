export type AreaType = "city" | "city_group" | "region";
export type PropertyCategory = "residential" | "commercial";
export type Quality = "green" | "yellow" | "red";
export type Aggregation = "area" | "aggregated" | "national" | "insufficient";
export type SignificanceFilter =
  | "all"
  | "significant_only"
  | "not_significant_only";
export type ExplorerSortDirection = "asc" | "desc";
export type ExplorerSortKey =
  | "default"
  | "area"
  | "property"
  | "median_2025"
  | "median_2024"
  | "index_value"
  | "yoy_pct"
  | "ci"
  | "sample"
  | "quality"
  | "significant";

export interface AnalyticalArea {
  id: number;
  name: string;
  type: AreaType;
  description: string | null;
}

export interface PropertyType {
  code: string;
  name_sl: string;
  name_en: string;
  category: PropertyCategory;
  warning: string | null;
}

export interface AnnualIndex {
  id: number;
  area_id: number;
  property_code: string;
  n_2025: number | null;
  n_2024: number | null;
  median_2025: number | null;
  median_2024: number | null;
  index_value: number | null;
  yoy_pct: number | null;
  ci_95_low: number | null;
  ci_95_high: number | null;
  quality: Quality;
  aggregation: Aggregation;
  significant_5pct: boolean;
  data_warning: string | null;
}

export interface HalfYearIndex {
  id: number;
  area_id: number;
  property_code: string;
  period: string;
  index_value: number | null;
  quality: Quality;
  n_current: number | null;
  n_base: number | null;
}

export interface LargeIndexComment {
  id: number;
  area_id: number;
  property_code: string;
  yoy_pct: number;
  narrative: string;
}

export interface ExplorerRow extends AnnualIndex {
  area: AnalyticalArea;
  propertyType: PropertyType;
  comment: LargeIndexComment | null;
}

export interface ExplorerFilters {
  propertyCodes: string[];
  areaIds: number[];
  qualityLevels: Quality[];
  significance: SignificanceFilter;
  minSample: number;
  aggregationLevels: Aggregation[];
  sortKey: ExplorerSortKey;
  sortDirection: ExplorerSortDirection;
}

export interface ExplorerPageData {
  filters: ExplorerFilters;
  rows: ExplorerRow[];
  filteredCount: number;
  totalCount: number;
  areas: AnalyticalArea[];
  propertyTypes: PropertyType[];
  errorMessage: string | null;
}

export interface ImportPayload {
  metadata: {
    methodology: string;
  };
  analytical_areas: AnalyticalArea[];
  property_types: PropertyType[];
  annual_indices: Omit<AnnualIndex, "id">[];
  half_year_indices: Omit<HalfYearIndex, "id">[];
  large_index_comments: Omit<LargeIndexComment, "id">[];
}

export const PROPERTY_FILTER_ORDER = [
  "ST",
  "H",
  "SZ",
  "P",
  "L",
  "I",
  "PZ",
  "KZ",
  "GZ",
] as const;

export const DEFAULT_SORT_PROPERTY_ORDER = [
  "ST",
  "H",
  "P",
  "L",
  "I",
  "SZ",
  "PZ",
  "KZ",
  "GZ",
] as const;

export const QUALITY_ORDER = ["green", "yellow", "red"] as const;
export const AGGREGATION_ORDER = [
  "area",
  "aggregated",
  "national",
  "insufficient",
] as const;
export const DEFAULT_PROPERTY_FILTER = ["ST", "H"] as const;
export const DEFAULT_QUALITY_FILTER = ["green", "yellow"] as const;
export const DEFAULT_AGGREGATION_FILTER = [
  "area",
  "aggregated",
  "national",
] as const;

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = {
  propertyCodes: [...DEFAULT_PROPERTY_FILTER],
  areaIds: [],
  qualityLevels: [...DEFAULT_QUALITY_FILTER],
  significance: "all",
  minSample: 0,
  aggregationLevels: [...DEFAULT_AGGREGATION_FILTER],
  sortKey: "default",
  sortDirection: "asc",
};

export interface Database {
  public: {
    Tables: {
      analytical_areas: {
        Row: AnalyticalArea;
        Insert: AnalyticalArea;
        Update: Partial<AnalyticalArea>;
      };
      property_types: {
        Row: PropertyType;
        Insert: PropertyType;
        Update: Partial<PropertyType>;
      };
      annual_indices: {
        Row: AnnualIndex;
        Insert: Omit<AnnualIndex, "id"> & Partial<Pick<AnnualIndex, "id">>;
        Update: Partial<AnnualIndex>;
      };
      half_year_indices: {
        Row: HalfYearIndex;
        Insert: HalfYearIndex;
        Update: Partial<HalfYearIndex>;
      };
      large_index_comments: {
        Row: LargeIndexComment;
        Insert: LargeIndexComment;
        Update: Partial<LargeIndexComment>;
      };
    };
  };
}

export function isExplorerSortKey(value: string): value is ExplorerSortKey {
  return [
    "default",
    "area",
    "property",
    "median_2025",
    "median_2024",
    "index_value",
    "yoy_pct",
    "ci",
    "sample",
    "quality",
    "significant",
  ].includes(value);
}

export function getDefaultSortDirection(
  sortKey: ExplorerSortKey,
): ExplorerSortDirection {
  switch (sortKey) {
    case "median_2025":
    case "median_2024":
    case "index_value":
    case "yoy_pct":
    case "sample":
      return "desc";
    default:
      return "asc";
  }
}
