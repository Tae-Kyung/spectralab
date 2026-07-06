-- =============================================
-- SpectraLab: Magneto-Raman Analysis Platform
-- Reset & Create Tables (prefix: acc_)
-- =============================================

-- Drop existing tables (old names without prefix)
DROP VIEW IF EXISTS dataset_stats CASCADE;
DROP VIEW IF EXISTS acc_dataset_stats CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS peak_tracks CASCADE;
DROP TABLE IF EXISTS external_data CASCADE;
DROP TABLE IF EXISTS fitting_results CASCADE;
DROP TABLE IF EXISTS spectra CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS acc_peak_tracks CASCADE;
DROP TABLE IF EXISTS acc_external_data CASCADE;
DROP TABLE IF EXISTS acc_fitting_results CASCADE;
DROP TABLE IF EXISTS acc_spectra CASCADE;
DROP TABLE IF EXISTS acc_datasets CASCADE;

-- Datasets
CREATE TABLE acc_datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  researcher TEXT NOT NULL,
  material TEXT,
  technique TEXT NOT NULL DEFAULT 'Raman',
  is_published BOOLEAN DEFAULT false,
  description TEXT,
  file_storage_path TEXT,
  original_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spectra
CREATE TABLE acc_spectra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES acc_datasets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sheet_name TEXT,
  x_unit TEXT NOT NULL DEFAULT 'cm⁻¹',
  y_unit TEXT NOT NULL DEFAULT 'counts',
  x_data DOUBLE PRECISION[] NOT NULL,
  y_data DOUBLE PRECISION[] NOT NULL,
  data_type TEXT DEFAULT 'raw' CHECK (data_type IN ('raw', 'baseline_corrected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fitting Results
CREATE TABLE acc_fitting_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spectrum_id UUID REFERENCES acc_spectra(id) ON DELETE CASCADE,
  roi_min DOUBLE PRECISION,
  roi_max DOUBLE PRECISION,
  model TEXT NOT NULL DEFAULT 'voigt',
  peaks JSONB NOT NULL,
  fitted_curve_x DOUBLE PRECISION[],
  fitted_curve_y DOUBLE PRECISION[],
  residual_rms DOUBLE PRECISION,
  r_squared DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Peak Tracks
CREATE TABLE acc_peak_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES acc_datasets(id) ON DELETE CASCADE,
  peak_label TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_unit TEXT,
  condition_values DOUBLE PRECISION[],
  peak_positions DOUBLE PRECISION[],
  position_unit TEXT DEFAULT 'cm⁻¹',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- External Data (VSM etc.)
CREATE TABLE acc_external_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  x_label TEXT,
  y_label TEXT,
  x_data DOUBLE PRECISION[] NOT NULL,
  y_data DOUBLE PRECISION[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_acc_spectra_dataset ON acc_spectra(dataset_id);
CREATE INDEX idx_acc_spectra_metadata ON acc_spectra USING GIN(metadata);
CREATE INDEX idx_acc_fitting_spectrum ON acc_fitting_results(spectrum_id);
CREATE INDEX idx_acc_peak_tracks_dataset ON acc_peak_tracks(dataset_id);

-- RLS
ALTER TABLE acc_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_spectra ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_fitting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_peak_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_external_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON acc_datasets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON acc_spectra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON acc_fitting_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON acc_peak_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON acc_external_data FOR ALL USING (true) WITH CHECK (true);

-- Stats View
CREATE OR REPLACE VIEW acc_dataset_stats AS
SELECT
  d.id, d.name, d.researcher, d.technique, d.material, d.is_published,
  COUNT(s.id) AS spectra_count
FROM acc_datasets d
LEFT JOIN acc_spectra s ON s.dataset_id = d.id
GROUP BY d.id;
