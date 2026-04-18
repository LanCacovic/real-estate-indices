# Codex Build Brief — Causaris Slovenian Real Estate Benchmark App (v1)

**Project codename:** `causaris-bench`
**Goal of this build:** A single polished page — the Index Explorer — that Trigal can evaluate as a working product demo.
**Time budget target:** 1–2 focused sessions.
**Critical principle:** Ship one feature bulletproof, not five features half-broken.

---

## 1. What you're building (in one paragraph)

A single-page web app at `/explorer` that shows a filterable, sortable table of 180 Slovenian real estate indices. A left sidebar has filters; the main area shows the results table; clicking any row expands an inline details panel showing the full data for that index (medians, confidence intervals, sample sizes, quality flags, and analyst notes when available). Styling is institutional/professional using shadcn/ui + Tailwind. **No auth, no routing beyond `/explorer`, no database writes, no charts** — just read-query-display done well.

---

## 2. Hard constraints (do not deviate)

- **Framework:** Next.js 14+ (App Router), TypeScript, React Server Components where possible.
- **Styling:** Tailwind CSS + shadcn/ui components only. No other UI libraries.
- **Data layer:** Supabase Postgres. Use `@supabase/supabase-js` client.
- **Deployment target:** Vercel (env vars via Vercel project settings).
- **Language of UI copy:** Slovenian (not English). All visible strings are in Slovenian.
- **No charting libraries yet** — the expanded row shows numbers in a clean layout, not graphs. Charts come in a later build.
- **No authentication.** Single public demo URL. Access control comes later.
- **No client-side state management libraries** (no Redux, Zustand, etc.). Use React state + URL search params.
- **Use shadcn/ui's `Table`, `Input`, `Select`, `Checkbox`, `Slider`, `Collapsible`, `Badge`, `Card`** — not custom-built components.

---

## 3. Data — already prepared

A file named `causaris_indices.json` is provided separately. It contains the full dataset (180 annual indices + metadata). Your job: import it into Supabase and query from there.

### 3.1 Expected JSON structure

```json
{
  "metadata": { ... },
  "analytical_areas": [ { "id": 1, "name": "Ljubljana mesto", "type": "city", "description": "..." }, ... ],
  "property_types": [ { "code": "ST", "name_sl": "Stanovanja", "name_en": "Apartments", "category": "residential" }, ... ],
  "annual_indices": [
    {
      "area_id": 1, "property_code": "ST",
      "n_2025": 1646, "n_2024": 2460,
      "median_2025": 4740, "median_2024": 4355,
      "index_value": 108.84, "yoy_pct": 8.84,
      "ci_95_low": 107.05, "ci_95_high": 110.84,
      "quality": "green", "aggregation": "area",
      "significant_5pct": true
    },
    ...
  ],
  "half_year_indices": [ ... ],
  "crr3_multi_year_averages": [ ... ],
  "rental_data": [ ... ],
  "price_distributions": [ ... ],
  "data_quality": { ... },
  "large_index_comments": [ ... ]
}
```

### 3.2 Supabase schema (create these tables exactly)

Use the Supabase SQL editor or run via `supabase/migrations/*.sql`. All column names snake_case.

```sql
-- Analytical areas (20 rows)
CREATE TABLE analytical_areas (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'city_group', 'region')),
  description TEXT
);

-- Property types (9 rows)
CREATE TABLE property_types (
  code TEXT PRIMARY KEY,
  name_sl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial')),
  warning TEXT
);

-- Annual indices (180 rows)
CREATE TABLE annual_indices (
  id SERIAL PRIMARY KEY,
  area_id SMALLINT NOT NULL REFERENCES analytical_areas(id),
  property_code TEXT NOT NULL REFERENCES property_types(code),
  n_2025 INTEGER,
  n_2024 INTEGER,
  median_2025 NUMERIC,
  median_2024 NUMERIC,
  index_value NUMERIC,
  yoy_pct NUMERIC,
  ci_95_low NUMERIC,
  ci_95_high NUMERIC,
  quality TEXT NOT NULL CHECK (quality IN ('green', 'yellow', 'red')),
  aggregation TEXT NOT NULL CHECK (aggregation IN ('area', 'aggregated', 'national', 'insufficient')),
  significant_5pct BOOLEAN NOT NULL DEFAULT FALSE,
  data_warning TEXT,
  UNIQUE (area_id, property_code)
);

-- Half-year chain indices (80 rows) — for future view, load now
CREATE TABLE half_year_indices (
  id SERIAL PRIMARY KEY,
  area_id SMALLINT NOT NULL REFERENCES analytical_areas(id),
  property_code TEXT NOT NULL REFERENCES property_types(code),
  period TEXT NOT NULL,
  index_value NUMERIC,
  quality TEXT NOT NULL,
  n_current INTEGER,
  n_base INTEGER
);

-- Large-index commentary (19 rows) — links to annual_indices
CREATE TABLE large_index_comments (
  id SERIAL PRIMARY KEY,
  area_id SMALLINT NOT NULL,
  property_code TEXT NOT NULL,
  yoy_pct NUMERIC NOT NULL,
  narrative TEXT NOT NULL,
  FOREIGN KEY (area_id, property_code) REFERENCES annual_indices (area_id, property_code)
);

-- Indexes for typical queries
CREATE INDEX idx_annual_area ON annual_indices (area_id);
CREATE INDEX idx_annual_property ON annual_indices (property_code);
CREATE INDEX idx_annual_quality ON annual_indices (quality);
```

### 3.3 Data import script

Write `scripts/import-data.ts` that:
1. Reads `causaris_indices.json`
2. Inserts `analytical_areas`, then `property_types`, then `annual_indices` (preserving FKs)
3. Inserts `half_year_indices` and `large_index_comments`
4. Is idempotent — uses `upsert` so it can be re-run safely

Run it via `npx tsx scripts/import-data.ts`.

---

## 4. The Index Explorer page — exact behavior

### 4.1 Route

- Path: `/explorer`
- Also make `/` redirect to `/explorer`.
- This is the only user-facing page for now.

### 4.2 Layout

Two-column layout at desktop width (≥1024px):
- **Left sidebar** (fixed width ~280px): filters
- **Main area** (flex-1): header + results table

At mobile width (<1024px): filters collapse into a drawer accessible via a filter button at top of the screen.

### 4.3 Header (top of main area)

- Page title (h1, serif, large): *"Raziskovalec indeksov"*
- Subtitle (muted, smaller): *"180 letnih indeksov cen nepremičnin v 20 analitičnih območjih. Vir: GURS ETN."*
- A result-count indicator that live-updates: *"Prikazano: X od 180 indeksov"*

### 4.4 Filter sidebar — exact fields

Each filter updates the URL search params (Next.js router), so the filter state is shareable by URL.

| Filter | UI component | Options / default |
|---|---|---|
| **Tip nepremičnine** (Property type) | Checkbox group | All 9 codes (ST, H, SZ, P, L, I, PZ, KZ, GZ). Default: ST + H checked, others unchecked. |
| **Območje** (Area) | Searchable multi-select (shadcn `Command`) | All 20 areas. Group them in the dropdown under three headers: "Mesta" (city), "Regionalna območja" (region + city_group). Default: none selected (= all areas). |
| **Kakovost** (Quality) | Checkbox group | `green` / `yellow` / `red`. Default: green + yellow checked, red unchecked. |
| **Statistična značilnost** (Significance) | Radio | `all` / `significant_only` / `not_significant_only`. Default: `all`. |
| **Minimalna velikost vzorca (n)** (Min sample) | Slider | 0 to 500, default 0. Filters by `n_2025 >= value AND n_2024 >= value`. |
| **Način agregacije** (Aggregation level) | Checkbox group | `area` / `aggregated` / `national` / `insufficient`. Default: area + aggregated + national checked; insufficient unchecked. |

Above the filters: a **"Ponastavi filtre"** (Reset filters) button that clears everything back to defaults.

### 4.5 Results table

Use shadcn `Table` component. Columns:

| Header | Data | Formatting |
|---|---|---|
| Območje | `area.name` | plain text |
| Tip | `property_code` + small subtitle with `property_type.name_sl` | e.g., "ST" with "Stanovanja" below |
| Mediana 2025 | `median_2025` | e.g., "4.740 €" (Slovenian number format, space as thousands, comma as decimal) |
| Mediana 2024 | `median_2024` | same formatting |
| Indeks | `index_value` | 2 decimals, e.g., "108,84" |
| YoY | `yoy_pct` | "+8,84 %" or "−3,29 %". Green text if positive, dark grey if negative, grey if null. |
| IZ 95 % | `[ci_95_low, ci_95_high]` | e.g., "107,05–110,84" |
| n 2025 / 2024 | `n_2025 / n_2024` | e.g., "1.646 / 2.460" |
| Kakovost | `quality` | shadcn `Badge` component: green / yellow / red colored |
| Značilnost | `significant_5pct` | "●" filled green dot if true, "○" empty dot if false |

Sortable by any column. Default sort: area_id ascending, property_code in order [ST, H, P, L, I, SZ, PZ, KZ, GZ].

Sticky table header.

Empty state: if filters result in 0 rows, show *"Ni indeksov, ki bi ustrezali filtrom. Poskusite z manj strogimi merili."* with a reset button.

### 4.6 Row expansion

Clicking any row expands it inline using shadcn `Collapsible`. The expanded detail shows:

**Top row — key metrics as stat cards:**
- Mediana 2025 (with n below it)
- Mediana 2024 (with n below it)
- Letni indeks + YoY %
- 95% interval zaupanja

**Second section — Kakovost in značilnost:**
- Quality badge + explanation ("Zelena kakovost: n ≥ 30 v obeh letih, statistično robustno")
- Aggregation level + explanation ("Agregacija: območje" / "nacionalni nadomestek" etc.)
- Significance result with which of Welch/Mann-Whitney/KS agreed (if that data is in the JSON)

**Third section — Komentar (if present):**
- If `large_index_comments` has a matching entry for (area_id, property_code), show the `narrative` text in a highlighted card.

**Fourth section — Opozorila (if present):**
- If `data_warning` field is non-null on the index row, show it prominently in a red `Alert` card at the bottom.

Close the row with a small "Zapri" text/icon button.

Only one row expanded at a time (collapse others when a new one is opened).

### 4.7 URL state

All filter state reflected in URL search params so URLs like `/explorer?property=ST&quality=green&area=1,2,8` are shareable and refreshable without losing state.

---

## 5. Styling — institutional, not marketing

### 5.1 Color tokens (Tailwind config)

Use these custom colors (defined in `tailwind.config.ts`):

```ts
extend: {
  colors: {
    brand: {
      red: '#dd3333',          // accent
      'red-soft': '#f8dddd',   // soft background
    },
    quality: {
      green: '#2e8b3e',
      yellow: '#c09017',
      red: '#c13a3a',
    },
    neutral: {
      // use shadcn's default neutrals
    }
  }
}
```

### 5.2 Typography

- **Body:** system font stack (shadcn default — Inter fallback)
- **Headlines:** a serif font. Use **EB Garamond** from Google Fonts imported in `app/layout.tsx` via `next/font/google`.

### 5.3 shadcn/ui setup

Initialize shadcn with `npx shadcn@latest init`. Use the "New York" style, slate neutral color, CSS variables for theming. Install only the components used:

```bash
npx shadcn@latest add table
npx shadcn@latest add checkbox
npx shadcn@latest add slider
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add command
npx shadcn@latest add popover
npx shadcn@latest add collapsible
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add radio-group
npx shadcn@latest add sheet  # for mobile filter drawer
```

### 5.4 Overall feel

Reference aesthetic: **Linear**, **Metabase**, or a bank's internal analytics tool. Dense information, quiet color, generous whitespace, serif headlines as the only "branded" visual element. No gradients, no marketing illustrations, no hero images.

---

## 6. Project structure (follow exactly)

```
causaris-bench/
├── app/
│   ├── layout.tsx                 # Root layout with EB Garamond font
│   ├── page.tsx                   # Redirect to /explorer
│   ├── explorer/
│   │   ├── page.tsx               # Main Index Explorer page
│   │   └── components/
│   │       ├── FilterSidebar.tsx
│   │       ├── ResultsTable.tsx
│   │       ├── ExpandedRowDetails.tsx
│   │       └── MobileFilterDrawer.tsx
│   └── globals.css
├── components/
│   └── ui/                        # shadcn components installed here
├── lib/
│   ├── supabase.ts                # Supabase client factory
│   ├── queries.ts                 # typed query functions
│   ├── formatters.ts              # Slovenian number + currency formatters
│   └── types.ts                   # TypeScript types matching DB schema
├── scripts/
│   └── import-data.ts             # one-time data import
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
│   └── causaris_indices.json      # source data
├── .env.local.example             # NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README.md
```

---

## 7. Code quality requirements

- **TypeScript strict mode on.** `tsconfig.json` has `"strict": true` and `"noUncheckedIndexedAccess": true`.
- **No `any` types.** If you're tempted, use `unknown` or define a proper type.
- **Server components by default.** Use `"use client"` only for components that need interactivity (filters, the expanded row toggle).
- **Data fetching on the server.** Main table data is fetched in a server component. Filters update URL → page re-renders with fresh data. Avoid client-side filtering — let Supabase do it.
- **Consistent formatting.** Run Prettier. ESLint with Next.js recommended config.
- **No dead code.** Delete unused shadcn defaults.

---

## 8. Slovenian number formatting helpers

Put these in `lib/formatters.ts`:

```ts
// 4.740 € (space as thousands separator)
export function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

// "108,84" (comma as decimal)
export function formatIndex(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// "+8,84 %" or "−3,29 %"
export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatIndex(Math.abs(value))} %`;
}

// "1.646 / 2.460"
export function formatSamplePair(n2025: number | null, n2024: number | null): string {
  return `${n2025?.toLocaleString("sl-SI") ?? "—"} / ${n2024?.toLocaleString("sl-SI") ?? "—"}`;
}
```

---

## 9. Definition of done

This build is complete when ALL of the following are true:

- [ ] `npm run dev` starts the app with no errors or warnings.
- [ ] Visiting `http://localhost:3000/` redirects to `/explorer`.
- [ ] All 180 annual indices are in the Supabase database.
- [ ] The default view (ST + H checked, green + yellow quality, area + aggregated + national aggregation) shows approximately 77 rows.
- [ ] Applying "only Ljubljana mesto" area filter narrows the view to at most 9 rows.
- [ ] Clicking a Green-quality ST row expands it and shows all metrics plus the commentary (if available for that index).
- [ ] Clicking a Red-quality GZ row shows the `data_warning` about garage mislabeling.
- [ ] Clicking "Ponastavi filtre" resets all filters to defaults.
- [ ] URL reflects filter state and survives page refresh.
- [ ] Mobile view (<1024px): filters are hidden behind a drawer, table is horizontally scrollable.
- [ ] `npm run build` completes with no errors.
- [ ] Deployed version on Vercel works identically to local.

---

## 10. Explicitly NOT in this build

Do not build any of these. They are later-stage features:
- Authentication or user accounts
- Charts or graphs of any kind
- Export to CSV/Excel
- Regional comparison view (multi-region side-by-side)
- Time series view (half-year data visualization)
- CRR3 compliance document generator
- Data quality dashboard
- Admin interface
- API for external clients
- Email notifications
- PDF generation

If you find yourself about to build any of those: stop. Flag it in a README note and move on.

---

## 11. Handoff notes

When you're done:
1. Push the repo to GitHub (private).
2. Deploy to Vercel with env vars set.
3. Return to the human with:
 - Repo URL
 - Live URL
 - Supabase project URL (so further development can continue)
 - Any questions or deviations from this brief (with justification)
 - One-paragraph note on anything that felt under-specified

---

## 12. If something is unclear

Do not improvise on architecture, data schema, or UI structure. Instead:
- If a data question: check `causaris_indices.json` directly.
- If a styling question: default to shadcn/ui defaults.
- If a scope question: default to "not in scope, flag in README."
- If truly blocked: write a question in a `QUESTIONS.md` file at the root and proceed with the clearest reasonable default.

---

**End of brief. Good luck.**
