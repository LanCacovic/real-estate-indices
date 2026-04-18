# Causaris Bench

Enostranska demonstracijska aplikacija za raziskovanje letnih indeksov cen nepremičnin v Sloveniji.

## Lokalni zagon

1. Namestite odvisnosti z `pnpm install`.
2. Ustvarite `.env.local` po vzoru iz `.env.local.example`.
3. V Supabase zaženite SQL iz `supabase/migrations/001_initial_schema.sql`.
4. Za uvoz podatkov nastavite `SUPABASE_SERVICE_ROLE_KEY` in zaženite `pnpm import:data`.
5. Za razvoj zaženite `pnpm dev`.

## Ključne datoteke

- `app/explorer/page.tsx`: glavni strežniški pogled.
- `app/explorer/components/*`: filtri, mobilni predal, tabela in podrobnosti vrstice.
- `lib/queries.ts`: parsiranje URL filtrov in Supabase poizvedbe.
- `scripts/import-data.ts`: idempotenten uvoz pripravljene JSON datoteke.
- `supabase/migrations/001_initial_schema.sql`: začetna shema in javne `SELECT` politike.

## Pomembne opombe

- Aplikacija bere podatke iz Supabase in ne uporablja JSON datoteke neposredno v runtime-u.
- `public/causaris_indices.json` je kopija izvornih podatkov za uvoz in nadaljnji razvoj.
- Privzeti pogoji iz briefa po podanem JSON naboru vrnejo 40 vrstic; ta vrednost je potrjena in uporabljena kot pričakovano stanje.

## Deploy

Za javni Vercel deploy boste potrebovali:

- pravilno nastavljen GitHub remote,
- dostop do Vercel projekta ali žeton,
- Supabase okoljske spremenljivke v Vercel nastavitvah.
