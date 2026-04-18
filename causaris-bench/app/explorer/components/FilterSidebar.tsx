"use client";

import { startTransition, useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AGGREGATION_ORDER,
  DEFAULT_AGGREGATION_FILTER,
  DEFAULT_PROPERTY_FILTER,
  DEFAULT_QUALITY_FILTER,
  PROPERTY_FILTER_ORDER,
  type Aggregation,
  type AnalyticalArea,
  type ExplorerFilters,
  type PropertyType,
  type Quality,
} from "@/lib/types";

interface FilterSidebarProps {
  areas: AnalyticalArea[];
  propertyTypes: PropertyType[];
  filters: ExplorerFilters;
}

interface FilterControlsProps extends FilterSidebarProps {
  compact?: boolean;
}

function arraysEqual(left: readonly string[] | readonly number[], right: readonly string[] | readonly number[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function formatAreaSummary(selectedAreaIds: number[], areas: AnalyticalArea[]): string {
  if (selectedAreaIds.length === 0) return "Vsa območja";
  if (selectedAreaIds.length === 1) {
    return areas.find((area) => area.id === selectedAreaIds[0])?.name ?? "1 območje";
  }
  return `${selectedAreaIds.length} izbranih območij`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FilterControls({
  areas,
  propertyTypes,
  filters,
  compact = false,
}: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, localTransition] = useTransition();
  const [areaQuery, setAreaQuery] = useState("");

  const selectedPropertySet = useMemo(
    () => new Set(filters.propertyCodes),
    [filters.propertyCodes],
  );
  const selectedQualitySet = useMemo(
    () => new Set(filters.qualityLevels),
    [filters.qualityLevels],
  );
  const selectedAggregationSet = useMemo(
    () => new Set(filters.aggregationLevels),
    [filters.aggregationLevels],
  );
  const selectedAreaSet = useMemo(() => new Set(filters.areaIds), [filters.areaIds]);

  const filteredAreas = useMemo(() => {
    const normalizedQuery = areaQuery.trim().toLocaleLowerCase("sl-SI");
    if (!normalizedQuery) return areas;
    return areas.filter((area) =>
      `${area.name} ${area.description ?? ""}`
        .toLocaleLowerCase("sl-SI")
        .includes(normalizedQuery),
    );
  }, [areaQuery, areas]);

  const cityAreas = filteredAreas.filter((area) => area.type === "city");
  const regionalAreas = filteredAreas.filter((area) => area.type !== "city");

  function pushParams(update: (params: URLSearchParams) => void) {
    localTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      update(params);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function writeArrayParam(
    params: URLSearchParams,
    key: string,
    values: string[],
    defaultValues: readonly string[],
  ) {
    if (arraysEqual(values, defaultValues)) {
      params.delete(key);
      return;
    }

    if (values.length === 0) {
      params.set(key, "none");
      return;
    }

    params.set(key, values.join(","));
  }

  function toggleProperty(code: string) {
    const next = PROPERTY_FILTER_ORDER.filter((value) =>
      value === code ? !selectedPropertySet.has(value) : selectedPropertySet.has(value),
    );

    pushParams((params) => {
      writeArrayParam(params, "property", next, DEFAULT_PROPERTY_FILTER);
    });
  }

  function toggleQuality(value: Quality) {
    const next = (["green", "yellow", "red"] as const).filter((entry) =>
      entry === value ? !selectedQualitySet.has(entry) : selectedQualitySet.has(entry),
    );

    pushParams((params) => {
      writeArrayParam(params, "quality", [...next], DEFAULT_QUALITY_FILTER);
    });
  }

  function toggleAggregation(value: Aggregation) {
    const next = AGGREGATION_ORDER.filter((entry) =>
      entry === value ? !selectedAggregationSet.has(entry) : selectedAggregationSet.has(entry),
    );

    pushParams((params) => {
      writeArrayParam(params, "aggregation", [...next], DEFAULT_AGGREGATION_FILTER);
    });
  }

  function toggleArea(id: number) {
    const next = areas
      .map((area) => area.id)
      .filter((areaId) =>
        areaId === id ? !selectedAreaSet.has(areaId) : selectedAreaSet.has(areaId),
      );

    pushParams((params) => {
      if (next.length === 0) {
        params.delete("area");
        return;
      }

      params.set("area", next.join(","));
    });
  }

  function resetFilters() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Filtri</p>
          <p className="text-sm text-slate-500">Stanje se zapisuje v URL.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={isPending}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Ponastavi filtre
        </Button>
      </div>

      <Section title="Tip nepremičnine">
        <div className="space-y-3">
          {PROPERTY_FILTER_ORDER.map((code) => {
            const propertyType = propertyTypes.find((item) => item.code === code);
            if (!propertyType) return null;

            return (
              <label
                key={code}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-slate-300"
              >
                <Checkbox
                  checked={selectedPropertySet.has(code)}
                  onCheckedChange={() => toggleProperty(code)}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">{code}</p>
                  <p className="text-sm text-slate-500">{propertyType.name_sl}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Območje">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-auto w-full justify-between gap-3 px-3 py-3 text-left"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {formatAreaSummary(filters.areaIds, areas)}
                </p>
                <p className="text-sm text-slate-500">
                  {filters.areaIds.length === 0
                    ? "Brez omejitve po območju."
                    : "Izbrana območja bodo obveljala po osvežitvi."}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(26rem,calc(100vw-2rem))] p-3" align="start">
            <div className="space-y-3">
              <Input
                value={areaQuery}
                onChange={(event) => setAreaQuery(event.target.value)}
                placeholder="Išči območje"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Noben izbor pomeni vsa območja.</p>
                {filters.areaIds.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      pushParams((params) => {
                        params.delete("area");
                      })
                    }
                  >
                    Počisti
                  </Button>
                ) : null}
              </div>
              <Command shouldFilter={false}>
                <CommandList>
                  <CommandEmpty>Ni območij, ki bi ustrezala iskanju.</CommandEmpty>
                  <CommandGroup heading="Mesta">
                    {cityAreas.map((area) => (
                      <CommandItem
                        key={area.id}
                        value={`${area.id}-${area.name}`}
                        onSelect={() => toggleArea(area.id)}
                        className="justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-xs text-slate-500">{area.description}</p>
                        </div>
                        {selectedAreaSet.has(area.id) ? (
                          <Check className="h-4 w-4 text-brand-red" />
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Regionalna območja">
                    {regionalAreas.map((area) => (
                      <CommandItem
                        key={area.id}
                        value={`${area.id}-${area.name}`}
                        onSelect={() => toggleArea(area.id)}
                        className="justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-xs text-slate-500">{area.description}</p>
                        </div>
                        {selectedAreaSet.has(area.id) ? (
                          <Check className="h-4 w-4 text-brand-red" />
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="Kakovost">
        <div className="space-y-3">
          {([
            ["green", "Zelena"],
            ["yellow", "Rumena"],
            ["red", "Rdeča"],
          ] as const).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedQualitySet.has(value)}
                  onCheckedChange={() => toggleQuality(value)}
                />
                <span className="text-sm font-medium text-slate-900">{label}</span>
              </div>
              <Badge
                className={cn(
                  "border-transparent",
                  value === "green" && "bg-quality-green/15 text-quality-green",
                  value === "yellow" && "bg-quality-yellow/15 text-quality-yellow",
                  value === "red" && "bg-quality-red/15 text-quality-red",
                )}
              >
                {label}
              </Badge>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Statistična značilnost">
        <RadioGroup
          value={filters.significance}
          onValueChange={(value) =>
            pushParams((params) => {
              if (value === "all") {
                params.delete("significance");
                return;
              }

              params.set("significance", value);
            })
          }
          className="space-y-3"
        >
          {([
            ["all", "Vsi"],
            ["significant_only", "Samo značilni"],
            ["not_significant_only", "Samo neznačilni"],
          ] as const).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-slate-300"
            >
              <RadioGroupItem value={value} />
              <span className="text-sm font-medium text-slate-900">{label}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Minimalna velikost vzorca (n)">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">n 2025 in n 2024 morata biti vsaj</p>
            <Badge variant="outline" className="font-medium text-slate-700">
              {filters.minSample}
            </Badge>
          </div>
          <Slider
            min={0}
            max={500}
            step={1}
            value={[filters.minSample]}
            onValueCommit={(value) =>
              pushParams((params) => {
                const [nextValue] = value;
                if (!nextValue) {
                  params.delete("minSample");
                  return;
                }
                params.set("minSample", String(nextValue));
              })
            }
          />
        </div>
      </Section>

      <Section title="Način agregacije">
        <div className="space-y-3">
          {([
            ["area", "Območje"],
            ["aggregated", "Agregirano"],
            ["national", "Nacionalni nadomestek"],
            ["insufficient", "Nezadostni podatki"],
          ] as const).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-slate-300"
            >
              <Checkbox
                checked={selectedAggregationSet.has(value)}
                onCheckedChange={() => toggleAggregation(value)}
              />
              <span className="text-sm font-medium text-slate-900">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {compact ? (
        <p className="text-xs leading-5 text-slate-500">
          Spremembe filtrov sprožijo novo poizvedbo v Supabase in ostanejo deljive v URL naslovu.
        </p>
      ) : null}
    </div>
  );
}

export function FilterSidebar({
  areas,
  propertyTypes,
  filters,
}: FilterSidebarProps) {
  return (
    <Card className="sticky top-6 border-slate-200 bg-white shadow-panel">
      <CardHeader>
        <CardTitle className="text-lg">Filtri</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterControls
          areas={areas}
          propertyTypes={propertyTypes}
          filters={filters}
        />
      </CardContent>
    </Card>
  );
}
