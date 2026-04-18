CREATE TABLE analytical_areas (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'city_group', 'region')),
  description TEXT
);

CREATE TABLE property_types (
  code TEXT PRIMARY KEY,
  name_sl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial')),
  warning TEXT
);

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

CREATE TABLE large_index_comments (
  id SERIAL PRIMARY KEY,
  area_id SMALLINT NOT NULL,
  property_code TEXT NOT NULL,
  yoy_pct NUMERIC NOT NULL,
  narrative TEXT NOT NULL,
  FOREIGN KEY (area_id, property_code) REFERENCES annual_indices (area_id, property_code)
);

CREATE INDEX idx_annual_area ON annual_indices (area_id);
CREATE INDEX idx_annual_property ON annual_indices (property_code);
CREATE INDEX idx_annual_quality ON annual_indices (quality);

ALTER TABLE analytical_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE half_year_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE large_index_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read analytical_areas"
  ON analytical_areas FOR SELECT
  USING (true);

CREATE POLICY "public read property_types"
  ON property_types FOR SELECT
  USING (true);

CREATE POLICY "public read annual_indices"
  ON annual_indices FOR SELECT
  USING (true);

CREATE POLICY "public read half_year_indices"
  ON half_year_indices FOR SELECT
  USING (true);

CREATE POLICY "public read large_index_comments"
  ON large_index_comments FOR SELECT
  USING (true);
