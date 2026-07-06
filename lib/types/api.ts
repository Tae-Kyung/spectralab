export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface BaselineCorrectionRequest {
  x: number[];
  y: number[];
  method: 'als' | 'snip' | 'poly';
  params: {
    lam?: number;
    p?: number;
    niter?: number;
    iterations?: number;
    degree?: number;
  };
}

export interface BaselineCorrectionResponse {
  baseline: number[];
  corrected: number[];
}

export interface FittingRequest {
  x: number[];
  y: number[];
  model: 'lorentzian' | 'gaussian' | 'voigt';
  peak_params: {
    prominence?: number;
    width?: number;
    distance?: number;
  };
}

export interface FittingResponse {
  peaks: Array<{
    center: number;
    height: number;
    fwhm: number;
    area: number;
  }>;
  fitted_curve: number[];
  residual: number[];
  r_squared: number;
}

export interface BatchFittingRequest {
  spectra: Array<{
    id: string;
    x: number[];
    y: number[];
  }>;
  model: 'lorentzian' | 'gaussian' | 'voigt';
  peak_params: {
    prominence?: number;
    width?: number;
  };
}
