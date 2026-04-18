import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ImportPayload } from "../lib/types";
import { createSupabaseAdminClient } from "../lib/supabase";

async function loadPayload(): Promise<ImportPayload> {
  const sourcePath = path.join(process.cwd(), "public", "causaris_indices.json");
  const raw = await readFile(sourcePath, "utf8");
  return JSON.parse(raw) as ImportPayload;
}

async function main() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error(
      "Import zahteva NEXT_PUBLIC_SUPABASE_URL in SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const payload = await loadPayload();

  const analyticalAreas = payload.analytical_areas.map((area) => ({
    ...area,
    description: area.description ?? null,
  }));

  const propertyTypes = payload.property_types.map((propertyType) => ({
    ...propertyType,
    warning: propertyType.warning ?? null,
  }));

  const annualIndices = payload.annual_indices.map((row) => ({
    ...row,
    data_warning: row.data_warning ?? null,
  }));

  const halfYearIndices = payload.half_year_indices.map((row, index) => ({
    id: index + 1,
    ...row,
  }));

  const comments = payload.large_index_comments.map((comment, index) => ({
    id: index + 1,
    ...comment,
  }));

  const analyticalAreasResult = await supabase
    .from("analytical_areas")
    .upsert(analyticalAreas, { onConflict: "id" });
  if (analyticalAreasResult.error) throw analyticalAreasResult.error;

  const propertyTypesResult = await supabase
    .from("property_types")
    .upsert(propertyTypes, { onConflict: "code" });
  if (propertyTypesResult.error) throw propertyTypesResult.error;

  const annualIndicesResult = await supabase
    .from("annual_indices")
    .upsert(annualIndices, { onConflict: "area_id,property_code" });
  if (annualIndicesResult.error) throw annualIndicesResult.error;

  const halfYearIndicesResult = await supabase
    .from("half_year_indices")
    .upsert(halfYearIndices, { onConflict: "id" });
  if (halfYearIndicesResult.error) throw halfYearIndicesResult.error;

  const commentsResult = await supabase
    .from("large_index_comments")
    .upsert(comments, { onConflict: "id" });
  if (commentsResult.error) throw commentsResult.error;

  const verification = await supabase
    .from("annual_indices")
    .select("*", { count: "exact", head: true });
  if (verification.error) throw verification.error;

  console.log(
    JSON.stringify(
      {
        analyticalAreas: analyticalAreas.length,
        propertyTypes: propertyTypes.length,
        annualIndices: verification.count ?? 0,
        halfYearIndices: halfYearIndices.length,
        comments: comments.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Neznana napaka pri uvozu.";
  console.error(message);
  process.exitCode = 1;
});
