import { AlertCircle } from "lucide-react";

import { FilterSidebar } from "@/app/explorer/components/FilterSidebar";
import { MobileFilterDrawer } from "@/app/explorer/components/MobileFilterDrawer";
import { ResultsTable } from "@/app/explorer/components/ResultsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getExplorerPageData } from "@/lib/queries";

interface ExplorerPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ExplorerPage({
  searchParams,
}: ExplorerPageProps) {
  const data = await getExplorerPageData(searchParams);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <FilterSidebar
              areas={data.areas}
              propertyTypes={data.propertyTypes}
              filters={data.filters}
            />
          </aside>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-panel sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h1 className="font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">
                      Raziskovalec indeksov
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                      180 letnih indeksov cen nepremičnin v 20 analitičnih območjih.
                      Vir: GURS ETN.
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Prikazano: {data.filteredCount} od {data.totalCount || 180} indeksov
                  </p>
                </div>
                <div className="lg:hidden">
                  <MobileFilterDrawer
                    areas={data.areas}
                    propertyTypes={data.propertyTypes}
                    filters={data.filters}
                  />
                </div>
              </div>
            </div>

            {data.errorMessage ? (
              <Alert
                variant="destructive"
                className="border-brand-red/40 bg-brand-red-soft text-slate-900"
              >
                <AlertCircle className="h-4 w-4 text-brand-red" />
                <AlertTitle>Povezava do podatkov ni uspela</AlertTitle>
                <AlertDescription>{data.errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <ResultsTable rows={data.rows} filters={data.filters} />
          </section>
        </div>
      </div>
    </main>
  );
}
