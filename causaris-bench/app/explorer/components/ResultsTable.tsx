"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ExpandedRowDetails } from "@/app/explorer/components/ExpandedRowDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatIndex,
  formatInterval,
  formatPercent,
  formatSamplePair,
  getQualityBadgeClass,
  getQualityLabel,
  getSortLabel,
} from "@/lib/formatters";
import {
  getDefaultSortDirection,
  type ExplorerFilters,
  type ExplorerRow,
  type ExplorerSortKey,
} from "@/lib/types";

interface ResultsTableProps {
  rows: ExplorerRow[];
  filters: ExplorerFilters;
}

const SORTABLE_COLUMNS: ExplorerSortKey[] = [
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
];

export function ResultsTable({ rows, filters }: ResultsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (expandedRowId == null) return;
    if (!rows.some((row) => row.id === expandedRowId)) {
      setExpandedRowId(null);
    }
  }, [expandedRowId, rows]);

  function pushSort(sortKey: ExplorerSortKey, direction?: "asc" | "desc") {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextDirection = direction ?? getDefaultSortDirection(sortKey);

      if (sortKey === "default") {
        params.delete("sort");
        params.delete("direction");
      } else {
        params.set("sort", sortKey);
        params.set("direction", nextDirection);
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function toggleSort(sortKey: ExplorerSortKey) {
    if (filters.sortKey === sortKey) {
      pushSort(sortKey, filters.sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    pushSort(sortKey, getDefaultSortDirection(sortKey));
  }

  function resetFilters() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  function renderSortIcon(sortKey: ExplorerSortKey) {
    if (filters.sortKey !== sortKey) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }

    return filters.sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-brand-red" />
    ) : (
      <ArrowDown className="h-4 w-4 text-brand-red" />
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-panel">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-950">Ni zadetkov</h2>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Ni indeksov, ki bi ustrezali filtrom. Poskusite z manj strogimi merili.
            </p>
          </div>
          <Button variant="outline" onClick={resetFilters}>
            Ponastavi filtre
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-panel">
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Razvrščanje in razširitev vrstic
            </p>
            <p className="text-sm text-slate-500">
              Klik na vrstico odpre podrobnosti za posamezni indeks.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={filters.sortKey}
              onValueChange={(value) => pushSort(value as ExplorerSortKey)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Razvrsti po" />
              </SelectTrigger>
              <SelectContent>
                {SORTABLE_COLUMNS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getSortLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                pushSort(
                  filters.sortKey,
                  filters.sortDirection === "asc" ? "desc" : "asc",
                )
              }
              disabled={isPending}
              aria-label="Zamenjaj smer razvrščanja"
            >
              {filters.sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("area")}
                  className="inline-flex items-center gap-2"
                >
                  Območje
                  {renderSortIcon("area")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("property")}
                  className="inline-flex items-center gap-2"
                >
                  Tip
                  {renderSortIcon("property")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("median_2025")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  Mediana 2025
                  {renderSortIcon("median_2025")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("median_2024")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  Mediana 2024
                  {renderSortIcon("median_2024")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("index_value")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  Indeks
                  {renderSortIcon("index_value")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("yoy_pct")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  YoY
                  {renderSortIcon("yoy_pct")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("ci")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  IZ 95 %
                  {renderSortIcon("ci")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-right backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("sample")}
                  className="ml-auto inline-flex items-center gap-2"
                >
                  n 2025 / 2024
                  {renderSortIcon("sample")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("quality")}
                  className="inline-flex items-center gap-2"
                >
                  Kakovost
                  {renderSortIcon("quality")}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50/95 text-center backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleSort("significant")}
                  className="inline-flex items-center gap-2"
                >
                  Značilnost
                  {renderSortIcon("significant")}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isExpanded = expandedRowId === row.id;

              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer bg-white"
                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpandedRowId(isExpanded ? null : row.id);
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {row.area.name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{row.property_code}</p>
                        <p className="text-xs text-slate-500">
                          {row.propertyType.name_sl}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatCurrency(row.median_2025)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      {formatCurrency(row.median_2024)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      {formatIndex(row.index_value)}
                    </TableCell>
                    <TableCell
                      className={
                        row.yoy_pct == null
                          ? "text-right text-slate-400"
                          : row.yoy_pct >= 0
                            ? "text-right text-quality-green"
                            : "text-right text-slate-700"
                      }
                    >
                      {formatPercent(row.yoy_pct)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      {formatInterval(row.ci_95_low, row.ci_95_high)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      {formatSamplePair(row.n_2025, row.n_2024)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getQualityBadgeClass(row.quality)}>
                        {getQualityLabel(row.quality)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-lg">
                      {row.significant_5pct ? (
                        <span className="text-quality-green">●</span>
                      ) : (
                        <span className="text-slate-400">○</span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className={isExpanded ? "bg-slate-50/70" : "border-b-0"}>
                    <TableCell colSpan={10} className="p-0">
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent forceMount className={!isExpanded ? "hidden" : undefined}>
                          <ExpandedRowDetails
                            row={row}
                            onClose={() => setExpandedRowId(null)}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
