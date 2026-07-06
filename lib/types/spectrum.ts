export interface Dataset {
  id: string;
  name: string;
  researcher: string;
  material: string | null;
  technique: 'Raman' | 'XPS' | 'THz' | 'PL';
  is_published: boolean;
  description: string | null;
  file_storage_path: string | null;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpectrumMetadata {
  temperature?: number;
  temperature_unit?: string;
  field?: number;
  field_unit?: string;
  thickness?: number;
  thickness_unit?: string;
  polarization?: string;
  angle?: number;
  element?: string;
  sample?: string;
  sample_id?: string | number;
  variable?: string;
  fluence?: number;
  magnetization?: string;
  sample_region?: string;
  pt_thickness?: number;
}

export interface Spectrum {
  id: string;
  dataset_id: string;
  label: string;
  sheet_name: string | null;
  x_unit: string;
  y_unit: string;
  x_data: number[];
  y_data: number[];
  data_type: 'raw' | 'baseline_corrected';
  metadata: SpectrumMetadata;
  created_at: string;
}

export interface Peak {
  label?: string;
  center: number;
  height: number;
  fwhm: number;
  wL?: number;
  wG?: number;
  area: number;
  centerErr?: number;
  heightErr?: number;
  fwhmErr?: number;
}

export interface FittingResult {
  id: string;
  spectrum_id: string;
  roi_min: number | null;
  roi_max: number | null;
  model: 'lorentzian' | 'gaussian' | 'voigt';
  peaks: Peak[];
  fitted_curve_x: number[] | null;
  fitted_curve_y: number[] | null;
  residual_rms: number | null;
  r_squared: number | null;
  created_at: string;
}

export interface PeakTrack {
  id: string;
  dataset_id: string;
  peak_label: string;
  condition_type: string;
  condition_unit: string | null;
  condition_values: number[];
  peak_positions: number[];
  position_unit: string;
  created_at: string;
}

export interface ExternalData {
  id: string;
  name: string;
  x_label: string | null;
  y_label: string | null;
  x_data: number[];
  y_data: number[];
  created_at: string;
}

export interface ParsedSheet {
  sheetName: string;
  spectra: ParsedSpectrum[];
}

export interface ParsedSpectrum {
  label: string;
  xData: number[];
  yData: number[];
  xUnit: string;
  yUnit: string;
  dataType: 'raw' | 'baseline_corrected';
  metadata: SpectrumMetadata;
}

export interface ParseResult {
  filename: string;
  sheets: ParsedSheet[];
  suggestedDataset: Partial<Dataset>;
}
