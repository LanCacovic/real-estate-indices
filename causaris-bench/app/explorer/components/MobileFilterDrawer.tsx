"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { FilterControls } from "@/app/explorer/components/FilterSidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AnalyticalArea, ExplorerFilters, PropertyType } from "@/lib/types";

interface MobileFilterDrawerProps {
  areas: AnalyticalArea[];
  propertyTypes: PropertyType[];
  filters: ExplorerFilters;
}

export function MobileFilterDrawer({
  areas,
  propertyTypes,
  filters,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filtri
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Filtri raziskovalca</SheetTitle>
          <SheetDescription>
            Filtri so deljivi prek URL povezave in se uporabijo takoj.
          </SheetDescription>
        </SheetHeader>
        <FilterControls
          areas={areas}
          propertyTypes={propertyTypes}
          filters={filters}
          compact
        />
      </SheetContent>
    </Sheet>
  );
}
