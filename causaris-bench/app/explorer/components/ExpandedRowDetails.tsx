"use client";

import { AlertTriangle, Info, MessageSquareText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCount,
  formatCurrency,
  formatIndex,
  formatInterval,
  formatPercent,
  getAggregationExplanation,
  getAggregationLabel,
  getQualityBadgeClass,
  getQualityExplanation,
  getQualityLabel,
} from "@/lib/formatters";
import type { ExplorerRow } from "@/lib/types";

interface ExpandedRowDetailsProps {
  row: ExplorerRow;
  onClose: () => void;
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

export function ExpandedRowDetails({
  row,
  onClose,
}: ExpandedRowDetailsProps) {
  return (
    <div className="space-y-5 bg-slate-50 px-6 py-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mediana 2025"
          value={formatCurrency(row.median_2025)}
          helper={`n = ${formatCount(row.n_2025)}`}
        />
        <StatCard
          label="Mediana 2024"
          value={formatCurrency(row.median_2024)}
          helper={`n = ${formatCount(row.n_2024)}`}
        />
        <StatCard
          label="Letni indeks"
          value={formatIndex(row.index_value)}
          helper={`YoY: ${formatPercent(row.yoy_pct)}`}
        />
        <StatCard
          label="95 % interval zaupanja"
          value={formatInterval(row.ci_95_low, row.ci_95_high)}
          helper="Bootstrap median ratio"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kakovost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge className={getQualityBadgeClass(row.quality)}>
              {getQualityLabel(row.quality)}
            </Badge>
            <p className="text-sm leading-6 text-slate-600">
              {getQualityExplanation(row.quality)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agregacija</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-slate-950">
              {getAggregationLabel(row.aggregation)}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {getAggregationExplanation(row.aggregation)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statistična značilnost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-slate-950">
              {row.significant_5pct
                ? "Potrjena pri 5 % ravni"
                : "Ni potrjena pri 5 % ravni"}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Metodologija predvideva Welchov t-test, Mann-Whitney U in
              Kolmogorov-Smirnov test. Ločeni izidi posameznih testov v JSON niso
              podani za vsak indeks posebej.
            </p>
          </CardContent>
        </Card>
      </div>

      {row.comment ? (
        <Card className="border-brand-red/20 bg-brand-red-soft shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-4 w-4 text-brand-red" />
              Komentar analitika
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-700">{row.comment.narrative}</p>
          </CardContent>
        </Card>
      ) : null}

      {row.data_warning ? (
        <Alert variant="destructive" className="border-brand-red/40 bg-brand-red-soft text-slate-900">
          <AlertTriangle className="h-4 w-4 text-brand-red" />
          <AlertTitle>Opozorilo o podatkih</AlertTitle>
          <AlertDescription>{row.data_warning}</AlertDescription>
        </Alert>
      ) : null}

      {!row.data_warning && row.propertyType.warning ? (
        <Alert className="border-slate-200 bg-white">
          <Info className="h-4 w-4 text-slate-500" />
          <AlertTitle>Metodološka opomba</AlertTitle>
          <AlertDescription>{row.propertyType.warning}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Zapri
        </Button>
      </div>
    </div>
  );
}
