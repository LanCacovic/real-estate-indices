import {
  AGGREGATION_ORDER,
  DEFAULT_AGGREGATION_FILTER,
  DEFAULT_EXPLORER_FILTERS,
  DEFAULT_QUALITY_FILTER,
  DEFAULT_SORT_PROPERTY_ORDER,
  PROPERTY_FILTER_ORDER,
  QUALITY_ORDER,
  getDefaultSortDirection,
  isExplorerSortKey,
  type Aggregation,
  type AnalyticalArea,
  type ExplorerFilters,
  type ExplorerPageData,
  type ExplorerRow,
  type LargeIndexComment,
  type PropertyType,
  type Quality,
} from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

function readParam(
  searchParams: SearchParamsInput,
  key: string,
): string | undefined {
  if (!searchParams) return undefined;

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseCsvValue(value: string | undefined): string[] {
  if (!value) return [];
  if (value === "none") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseEnumArray<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
  defaultValues: readonly T[],
): T[] {
  if (value === undefined) {
    return [...defaultValues];
  }

  const selected = parseCsvValue(value).filter((entry): entry is T =>
    allowedValues.includes(entry as T),
  );

  return dedupe(selected);
}

function parseAreaIds(value: string | undefined): number[] {
  if (!value) return [];
  return dedupe(
    parseCsvValue(value)
      .map((entry) => Number(entry))
      .filter((entry) => Number.isInteger(entry) && entry > 0),
  );
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function compareNullableString(a: string | null, b: string | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a.localeCompare(b, "sl-SI");
}

function applyDirection(value: number, direction: "asc" | "desc"): number {
  return direction === "asc" ? value : value * -1;
}

function sortRows(rows: ExplorerRow[], filters: ExplorerFilters): ExplorerRow[] {
  const propertyRank = new Map<string, number>(
    DEFAULT_SORT_PROPERTY_ORDER.map((code, index) => [code, index]),
  );
  const qualityRank = new Map<string, number>(
    QUALITY_ORDER.map((code, index) => [code, index]),
  );

  return [...rows].sort((left, right) => {
    const direction = filters.sortDirection;

    if (filters.sortKey === "default") {
      const areaComparison = left.area_id - right.area_id;
      if (areaComparison !== 0) return areaComparison;
      return (
        (propertyRank.get(left.property_code) ?? Number.MAX_SAFE_INTEGER) -
        (propertyRank.get(right.property_code) ?? Number.MAX_SAFE_INTEGER)
      );
    }

    let comparison = 0;

    switch (filters.sortKey) {
      case "area":
        comparison =
          compareNullableString(left.area.name, right.area.name) ||
          left.area_id - right.area_id;
        break;
      case "property":
        comparison =
          (propertyRank.get(left.property_code) ?? Number.MAX_SAFE_INTEGER) -
          (propertyRank.get(right.property_code) ?? Number.MAX_SAFE_INTEGER);
        break;
      case "median_2025":
        comparison = compareNullableNumber(left.median_2025, right.median_2025);
        break;
      case "median_2024":
        comparison = compareNullableNumber(left.median_2024, right.median_2024);
        break;
      case "index_value":
        comparison = compareNullableNumber(left.index_value, right.index_value);
        break;
      case "yoy_pct":
        comparison = compareNullableNumber(left.yoy_pct, right.yoy_pct);
        break;
      case "ci":
        comparison =
          compareNullableNumber(left.ci_95_low, right.ci_95_low) ||
          compareNullableNumber(left.ci_95_high, right.ci_95_high);
        break;
      case "sample":
        comparison =
          compareNullableNumber(left.n_2025, right.n_2025) ||
          compareNullableNumber(left.n_2024, right.n_2024);
        break;
      case "quality":
        comparison =
          (qualityRank.get(left.quality) ?? Number.MAX_SAFE_INTEGER) -
          (qualityRank.get(right.quality) ?? Number.MAX_SAFE_INTEGER);
        break;
      case "significant":
        comparison = Number(left.significant_5pct) - Number(right.significant_5pct);
        break;
    }

    if (comparison === 0) {
      comparison =
        compareNullableString(left.area.name, right.area.name) ||
        compareNullableString(left.property_code, right.property_code);
    }

    return applyDirection(comparison, direction);
  });
}

export function parseExplorerSearchParams(
  searchParams: SearchParamsInput,
): ExplorerFilters {
  const propertyCodes = parseEnumArray(
    readParam(searchParams, "property"),
    PROPERTY_FILTER_ORDER,
    DEFAULT_EXPLORER_FILTERS.propertyCodes,
  );

  const qualityLevels = parseEnumArray(
    readParam(searchParams, "quality"),
    QUALITY_ORDER,
    DEFAULT_QUALITY_FILTER,
  ) as Quality[];

  const aggregationLevels = parseEnumArray(
    readParam(searchParams, "aggregation"),
    AGGREGATION_ORDER,
    DEFAULT_AGGREGATION_FILTER,
  ) as Aggregation[];

  const significanceParam = readParam(searchParams, "significance");
  const significance =
    significanceParam === "significant_only" ||
    significanceParam === "not_significant_only"
      ? significanceParam
      : "all";

  const minSampleValue = Number(readParam(searchParams, "minSample"));
  const minSample =
    Number.isFinite(minSampleValue) && minSampleValue > 0
      ? Math.min(500, Math.round(minSampleValue))
      : 0;

  const sortParam = readParam(searchParams, "sort");
  const sortKey = sortParam && isExplorerSortKey(sortParam) ? sortParam : "default";

  const directionParam = readParam(searchParams, "direction");
  const sortDirection =
    directionParam === "asc" || directionParam === "desc"
      ? directionParam
      : getDefaultSortDirection(sortKey);

  return {
    propertyCodes,
    areaIds: parseAreaIds(readParam(searchParams, "area")),
    qualityLevels,
    significance,
    minSample,
    aggregationLevels,
    sortKey,
    sortDirection,
  };
}

export async function getExplorerPageData(
  searchParams: SearchParamsInput,
): Promise<ExplorerPageData> {
  const filters = parseExplorerSearchParams(searchParams);
  const supabase = createSupabaseClient();

  if (!supabase) {
    return {
      filters,
      rows: [],
      filteredCount: 0,
      totalCount: 0,
      areas: [],
      propertyTypes: [],
      errorMessage:
        "Manjkajo okoljske spremenljivke za Supabase povezavo. Nastavite NEXT_PUBLIC_SUPABASE_URL in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  }

  try {
    const [areasResult, propertyTypesResult, commentsResult, totalCountResult] =
      await Promise.all([
        supabase.from("analytical_areas").select("*").order("id"),
        supabase.from("property_types").select("*"),
        supabase.from("large_index_comments").select("*"),
        supabase
          .from("annual_indices")
          .select("*", { head: true, count: "exact" }),
      ]);

    if (areasResult.error) throw areasResult.error;
    if (propertyTypesResult.error) throw propertyTypesResult.error;
    if (commentsResult.error) throw commentsResult.error;
    if (totalCountResult.error) throw totalCountResult.error;

    const areas = (areasResult.data ?? []) as AnalyticalArea[];
    const propertyTypes = (propertyTypesResult.data ?? []) as PropertyType[];
    const comments = (commentsResult.data ?? []) as LargeIndexComment[];

    if (
      filters.propertyCodes.length === 0 ||
      filters.qualityLevels.length === 0 ||
      filters.aggregationLevels.length === 0
    ) {
      return {
        filters,
        rows: [],
        filteredCount: 0,
        totalCount: totalCountResult.count ?? 0,
        areas,
        propertyTypes,
        errorMessage: null,
      };
    }

    let annualQuery = supabase.from("annual_indices").select("*");

    annualQuery = annualQuery.in("property_code", filters.propertyCodes);
    annualQuery = annualQuery.in("quality", filters.qualityLevels);
    annualQuery = annualQuery.in("aggregation", filters.aggregationLevels);

    if (filters.areaIds.length > 0) {
      annualQuery = annualQuery.in("area_id", filters.areaIds);
    }

    if (filters.significance === "significant_only") {
      annualQuery = annualQuery.eq("significant_5pct", true);
    }

    if (filters.significance === "not_significant_only") {
      annualQuery = annualQuery.eq("significant_5pct", false);
    }

    if (filters.minSample > 0) {
      annualQuery = annualQuery.gte("n_2025", filters.minSample);
      annualQuery = annualQuery.gte("n_2024", filters.minSample);
    }

    const annualResult = await annualQuery;
    if (annualResult.error) throw annualResult.error;

    const areaMap = new Map(areas.map((area) => [area.id, area]));
    const propertyMap = new Map(propertyTypes.map((type) => [type.code, type]));
    const commentMap = new Map(
      comments.map((comment) => [`${comment.area_id}:${comment.property_code}`, comment]),
    );

    const rows = sortRows(
      (annualResult.data ?? [])
        .map((row) => {
          const area = areaMap.get(row.area_id);
          const propertyType = propertyMap.get(row.property_code);

          if (!area || !propertyType) {
            return null;
          }

          return {
            ...row,
            area,
            propertyType,
            comment: commentMap.get(`${row.area_id}:${row.property_code}`) ?? null,
          } satisfies ExplorerRow;
        })
        .filter((row): row is ExplorerRow => row !== null),
      filters,
    );

    return {
      filters,
      rows,
      filteredCount: rows.length,
      totalCount: totalCountResult.count ?? 0,
      areas,
      propertyTypes,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Neznana napaka pri branju podatkov iz Supabase.";

    return {
      filters,
      rows: [],
      filteredCount: 0,
      totalCount: 0,
      areas: [],
      propertyTypes: [],
      errorMessage: `Podatkov iz Supabase trenutno ni bilo mogoče prebrati: ${message}`,
    };
  }
}
