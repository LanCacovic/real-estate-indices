import type { Aggregation, ExplorerSortKey, Quality } from "@/lib/types";

export function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatIndex(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndex(Math.abs(value))} %`;
}

export function formatSamplePair(
  n2025: number | null,
  n2024: number | null,
): string {
  return `${n2025?.toLocaleString("sl-SI") ?? "—"} / ${
    n2024?.toLocaleString("sl-SI") ?? "—"
  }`;
}

export function formatCount(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("sl-SI");
}

export function formatInterval(low: number | null, high: number | null): string {
  if (low == null || high == null) return "—";
  return `${formatIndex(low)}–${formatIndex(high)}`;
}

export function getQualityLabel(value: Quality): string {
  switch (value) {
    case "green":
      return "Zelena";
    case "yellow":
      return "Rumena";
    case "red":
      return "Rdeča";
  }
}

export function getQualityBadgeClass(value: Quality): string {
  switch (value) {
    case "green":
      return "border-transparent bg-quality-green/15 text-quality-green";
    case "yellow":
      return "border-transparent bg-quality-yellow/15 text-quality-yellow";
    case "red":
      return "border-transparent bg-quality-red/15 text-quality-red";
  }
}

export function getQualityExplanation(value: Quality): string {
  switch (value) {
    case "green":
      return "Zelena kakovost: n ≥ 30 v obeh letih, statistično robustno.";
    case "yellow":
      return "Rumena kakovost: rezultat je uporaben, vendar je vzorec omejen ali manj stabilen.";
    case "red":
      return "Rdeča kakovost: podatek je nezanesljiv ali metodološko kompromitiran.";
  }
}

export function getAggregationLabel(value: Aggregation): string {
  switch (value) {
    case "area":
      return "Območje";
    case "aggregated":
      return "Agregirano";
    case "national":
      return "Nacionalni nadomestek";
    case "insufficient":
      return "Nezadostni podatki";
  }
}

export function getAggregationExplanation(value: Aggregation): string {
  switch (value) {
    case "area":
      return "Agregacija: območje. Indeks temelji neposredno na izbranem analitičnem območju.";
    case "aggregated":
      return "Agregacija: agregirano območje. Za stabilnost je uporabljen širši nadomestni nivo.";
    case "national":
      return "Agregacija: nacionalni nadomestek. Lokalni vzorec ni bil dovolj zanesljiv.";
    case "insufficient":
      return "Agregacija: nezadostni podatki. Indeksa ni mogoče interpretirati brez večje previdnosti.";
  }
}

export function getSortLabel(sortKey: ExplorerSortKey): string {
  switch (sortKey) {
    case "default":
      return "Privzeto";
    case "area":
      return "Območje";
    case "property":
      return "Tip nepremičnine";
    case "median_2025":
      return "Mediana 2025";
    case "median_2024":
      return "Mediana 2024";
    case "index_value":
      return "Indeks";
    case "yoy_pct":
      return "YoY";
    case "ci":
      return "IZ 95 %";
    case "sample":
      return "n 2025 / 2024";
    case "quality":
      return "Kakovost";
    case "significant":
      return "Značilnost";
  }
}
