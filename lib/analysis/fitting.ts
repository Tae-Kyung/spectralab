// ============================================================
// Peak Fitting with Levenberg-Marquardt Optimization
// Scientific-grade implementation for spectroscopy data
// ============================================================

export interface DetectedPeak {
  index: number;
  center: number;
  height: number;
  fwhm: number;
  area: number;
}

export interface FitPeak {
  center: number;
  height: number;
  fwhm: number;
  area: number;
  centerErr?: number;
  heightErr?: number;
  fwhmErr?: number;
}

export interface FitResult {
  peaks: FitPeak[];
  fittedCurve: number[];
  residual: number[];
  rSquared: number;
  chi2: number;
  converged: boolean;
  iterations: number;
}

// ---- Peak Profile Functions ----

export function lorentzian(x: number, center: number, height: number, fwhm: number): number {
  const gamma = fwhm / 2;
  return height * (gamma * gamma) / ((x - center) * (x - center) + gamma * gamma);
}

export function gaussian(x: number, center: number, height: number, fwhm: number): number {
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
  const dx = x - center;
  return height * Math.exp(-(dx * dx) / (2 * sigma * sigma));
}

/**
 * Pseudo-Voigt approximation (Thompson et al., 1987).
 * Linear combination of Gaussian and Lorentzian with mixing parameter eta.
 * eta ≈ 0.5 is a good default for many spectroscopy applications.
 */
export function pseudoVoigt(x: number, center: number, height: number, fwhm: number, eta: number = 0.5): number {
  return eta * lorentzian(x, center, height, fwhm) + (1 - eta) * gaussian(x, center, height, fwhm);
}

// ---- Peak Detection ----

export function findPeaks(
  x: number[],
  y: number[],
  prominence: number = 50,
  minWidth: number = 3,
  minDistance: number = 5
): DetectedPeak[] {
  const n = y.length;
  if (n < 3) return [];

  const peaks: number[] = [];

  // Find local maxima (compare with neighbors within minWidth)
  for (let i = 1; i < n - 1; i++) {
    let isMax = true;
    const start = Math.max(0, i - Math.max(1, Math.floor(minWidth / 2)));
    const end = Math.min(n - 1, i + Math.max(1, Math.floor(minWidth / 2)));
    for (let j = start; j <= end; j++) {
      if (j !== i && y[j] > y[i]) {
        isMax = false;
        break;
      }
    }
    if (isMax && y[i] > y[i - 1] && y[i] > y[i + 1]) {
      peaks.push(i);
    }
  }

  // Calculate prominence for each peak
  const withProm: Array<{ idx: number; prom: number }> = [];
  for (const idx of peaks) {
    // Search left for higher peak or boundary
    let leftMin = y[idx];
    for (let j = idx - 1; j >= Math.max(0, idx - Math.min(200, Math.floor(n / 4))); j--) {
      leftMin = Math.min(leftMin, y[j]);
      if (y[j] > y[idx]) break;
    }

    // Search right for higher peak or boundary
    let rightMin = y[idx];
    for (let j = idx + 1; j <= Math.min(n - 1, idx + Math.min(200, Math.floor(n / 4))); j++) {
      rightMin = Math.min(rightMin, y[j]);
      if (y[j] > y[idx]) break;
    }

    const prom = y[idx] - Math.max(leftMin, rightMin);
    if (prom >= prominence) {
      withProm.push({ idx, prom });
    }
  }

  // Sort by prominence (strongest first) then filter by distance
  withProm.sort((a, b) => b.prom - a.prom);
  const selected: number[] = [];
  for (const { idx } of withProm) {
    if (selected.every(s => Math.abs(s - idx) >= minDistance)) {
      selected.push(idx);
    }
  }
  selected.sort((a, b) => a - b);

  return selected.map(idx => {
    const height = y[idx];
    const { fwhm, leftHalf, rightHalf } = estimateFWHM(x, y, idx);
    const area = estimateArea(x, y, idx, leftHalf, rightHalf);

    return { index: idx, center: x[idx], height, fwhm, area };
  });
}

function estimateFWHM(x: number[], y: number[], peakIdx: number): { fwhm: number; leftHalf: number; rightHalf: number } {
  const n = y.length;
  const halfMax = y[peakIdx] / 2;

  // Interpolate left half-max position
  let leftIdx = peakIdx;
  while (leftIdx > 0 && y[leftIdx] > halfMax) leftIdx--;
  let leftX: number;
  if (leftIdx === peakIdx) {
    leftX = x[peakIdx];
  } else {
    // Linear interpolation between leftIdx and leftIdx+1
    const frac = (halfMax - y[leftIdx]) / (y[leftIdx + 1] - y[leftIdx] || 1);
    leftX = x[leftIdx] + frac * (x[leftIdx + 1] - x[leftIdx]);
  }

  // Interpolate right half-max position
  let rightIdx = peakIdx;
  while (rightIdx < n - 1 && y[rightIdx] > halfMax) rightIdx++;
  let rightX: number;
  if (rightIdx === peakIdx) {
    rightX = x[peakIdx];
  } else {
    const frac = (halfMax - y[rightIdx]) / (y[rightIdx - 1] - y[rightIdx] || 1);
    rightX = x[rightIdx] - frac * (x[rightIdx] - x[rightIdx - 1]);
  }

  const fwhm = Math.abs(rightX - leftX);
  return { fwhm: Math.max(fwhm, Math.abs(x[1] - x[0])), leftHalf: leftIdx, rightHalf: rightIdx };
}

function estimateArea(x: number[], y: number[], peakIdx: number, left: number, right: number): number {
  // Trapezoidal integration over peak region
  let area = 0;
  const lo = Math.max(0, left);
  const hi = Math.min(x.length - 1, right);
  for (let i = lo; i < hi; i++) {
    area += (y[i] + y[i + 1]) / 2 * Math.abs(x[i + 1] - x[i]);
  }
  return area;
}

// ---- Levenberg-Marquardt Optimizer ----

type ModelFn = (x: number, params: number[]) => number;

interface LMOptions {
  maxIter: number;
  tolerance: number;
  lambdaInit: number;
  lambdaUp: number;
  lambdaDown: number;
}

const LM_DEFAULTS: LMOptions = {
  maxIter: 200,
  tolerance: 1e-8,
  lambdaInit: 1e-3,
  lambdaUp: 10,
  lambdaDown: 10,
};

/**
 * Levenberg-Marquardt least squares optimization.
 * Minimizes sum((y - model(x, params))^2) over params.
 */
function levenbergMarquardt(
  xData: number[],
  yData: number[],
  model: ModelFn,
  initialParams: number[],
  opts: Partial<LMOptions> = {}
): { params: number[]; covariance: number[][]; iterations: number; converged: boolean } {
  const { maxIter, tolerance, lambdaInit, lambdaUp, lambdaDown } = { ...LM_DEFAULTS, ...opts };
  const n = xData.length;
  const m = initialParams.length;

  let params = [...initialParams];
  let lambda = lambdaInit;

  // Compute residuals
  const computeResiduals = (p: number[]) => {
    const r = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      r[i] = yData[i] - model(xData[i], p);
    }
    return r;
  };

  const computeCost = (r: Float64Array) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += r[i] * r[i];
    return s;
  };

  // Compute Jacobian by finite differences
  const computeJacobian = (p: number[]): Float64Array[] => {
    const J: Float64Array[] = [];
    const h = 1e-7;
    for (let j = 0; j < m; j++) {
      const col = new Float64Array(n);
      const pPlus = [...p];
      const pMinus = [...p];
      pPlus[j] += h * (Math.abs(p[j]) + 1);
      pMinus[j] -= h * (Math.abs(p[j]) + 1);
      const step = pPlus[j] - pMinus[j];
      for (let i = 0; i < n; i++) {
        col[i] = (model(xData[i], pPlus) - model(xData[i], pMinus)) / step;
      }
      J.push(col);
    }
    return J;
  };

  let residuals = computeResiduals(params);
  let cost = computeCost(residuals);
  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIter; iter++) {
    const J = computeJacobian(params);

    // J^T J
    const JtJ = Array.from({ length: m }, () => new Float64Array(m));
    for (let j = 0; j < m; j++) {
      for (let k = j; k < m; k++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += J[j][i] * J[k][i];
        JtJ[j][k] = s;
        JtJ[k][j] = s;
      }
    }

    // J^T r
    const Jtr = new Float64Array(m);
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += J[j][i] * residuals[i];
      Jtr[j] = s;
    }

    // Try step: solve (J^T J + lambda * diag(J^T J)) * delta = J^T r
    const A = Array.from({ length: m }, (_, i) => {
      const row = new Array(m);
      for (let j = 0; j < m; j++) {
        row[j] = JtJ[i][j];
      }
      row[i] += lambda * (JtJ[i][i] || 1);
      return row;
    });

    const delta = solveLinear(A, Array.from(Jtr));
    if (!delta) break;

    const newParams = params.map((p, i) => p + delta[i]);
    const newResiduals = computeResiduals(newParams);
    const newCost = computeCost(newResiduals);

    if (newCost < cost) {
      // Accept step
      const improvement = (cost - newCost) / cost;
      params = newParams;
      residuals = newResiduals;
      cost = newCost;
      lambda /= lambdaDown;

      if (improvement < tolerance) {
        converged = true;
        break;
      }
    } else {
      // Reject step, increase damping
      lambda *= lambdaUp;
    }
  }

  // Estimate covariance: (J^T J)^{-1} * (cost / (n - m))
  const J = computeJacobian(params);
  const JtJ = Array.from({ length: m }, () => new Array(m).fill(0));
  for (let j = 0; j < m; j++) {
    for (let k = j; k < m; k++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += J[j][i] * J[k][i];
      JtJ[j][k] = s;
      JtJ[k][j] = s;
    }
  }

  const variance = n > m ? cost / (n - m) : cost;
  const covariance = invertMatrix(JtJ).map(row => row.map(v => v * variance));

  return { params, covariance, iterations: iter, converged: converged || iter < maxIter };
}

function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    if (Math.abs(aug[i][i]) < 1e-15) return null;

    for (let k = i + 1; k < n; k++) {
      const factor = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) {
        aug[k][j] -= factor * aug[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }
  return x;
}

function invertMatrix(M: number[][]): number[][] {
  const n = M.length;
  const aug = M.map((row, i) => {
    const extended = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) extended[j] = row[j];
    extended[n + i] = 1;
    return extended;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-15) {
      // Singular - return identity-like
      return Array.from({ length: n }, (_, i) => {
        const row = new Array(n).fill(0);
        row[i] = 1;
        return row;
      });
    }

    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = aug[k][i];
      for (let j = 0; j < 2 * n; j++) {
        aug[k][j] -= factor * aug[i][j];
      }
    }
  }

  return aug.map(row => row.slice(n));
}

// ---- Multi-Peak Fitting ----

/**
 * Fit multiple peaks simultaneously using Levenberg-Marquardt.
 * Each peak has 3 parameters: [center, height, fwhm].
 *
 * @param x - x data
 * @param y - y data (should be baseline-corrected)
 * @param initialPeaks - initial peak estimates from findPeaks
 * @param model - peak profile type
 */
export function fitPeaks(
  x: number[],
  y: number[],
  initialPeaks: DetectedPeak[],
  model: 'lorentzian' | 'gaussian' | 'voigt' = 'lorentzian'
): FitResult {
  if (initialPeaks.length === 0) {
    return {
      peaks: [],
      fittedCurve: new Array(x.length).fill(0),
      residual: [...y],
      rSquared: 0,
      chi2: y.reduce((s, v) => s + v * v, 0),
      converged: false,
      iterations: 0,
    };
  }

  const nPeaks = initialPeaks.length;
  const paramsPerPeak = 3; // center, height, fwhm

  // Build initial parameter vector
  const p0: number[] = [];
  for (const peak of initialPeaks) {
    p0.push(peak.center, peak.height, peak.fwhm);
  }

  // Select profile function
  const profileFn = model === 'gaussian' ? gaussian
    : model === 'voigt' ? (x: number, c: number, h: number, f: number) => pseudoVoigt(x, c, h, f, 0.5)
    : lorentzian;

  // Multi-peak model: sum of individual peaks
  const multiPeakModel = (xi: number, params: number[]): number => {
    let sum = 0;
    for (let p = 0; p < nPeaks; p++) {
      const offset = p * paramsPerPeak;
      sum += profileFn(xi, params[offset], params[offset + 1], params[offset + 2]);
    }
    return sum;
  };

  // Run LM optimization
  const result = levenbergMarquardt(x, y, multiPeakModel, p0, {
    maxIter: 300,
    tolerance: 1e-8,
  });

  // Extract fitted peaks with uncertainties
  const peaks: FitPeak[] = [];
  for (let p = 0; p < nPeaks; p++) {
    const offset = p * paramsPerPeak;
    const center = result.params[offset];
    const height = Math.abs(result.params[offset + 1]);
    const fwhm = Math.abs(result.params[offset + 2]);

    // Compute area analytically
    let area: number;
    if (model === 'lorentzian') {
      area = height * Math.PI * (fwhm / 2); // pi * h * gamma
    } else if (model === 'gaussian') {
      const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
      area = height * sigma * Math.sqrt(2 * Math.PI);
    } else {
      // Pseudo-Voigt: weighted average
      const areaL = height * Math.PI * (fwhm / 2);
      const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
      const areaG = height * sigma * Math.sqrt(2 * Math.PI);
      area = 0.5 * areaL + 0.5 * areaG;
    }

    const centerErr = Math.sqrt(Math.max(0, result.covariance[offset]?.[offset] ?? 0));
    const heightErr = Math.sqrt(Math.max(0, result.covariance[offset + 1]?.[offset + 1] ?? 0));
    const fwhmErr = Math.sqrt(Math.max(0, result.covariance[offset + 2]?.[offset + 2] ?? 0));

    peaks.push({ center, height, fwhm, area, centerErr, heightErr, fwhmErr });
  }

  // Generate fitted curve and residual
  const fittedCurve = x.map(xi => multiPeakModel(xi, result.params));
  const residual = y.map((yi, i) => yi - fittedCurve[i]);

  const mean = y.reduce((s, v) => s + v, 0) / y.length;
  const ssTot = y.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = residual.reduce((s, v) => s + v * v, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const dof = Math.max(1, x.length - nPeaks * paramsPerPeak);
  const chi2 = ssRes / dof;

  return {
    peaks,
    fittedCurve,
    residual,
    rSquared,
    chi2,
    converged: result.converged,
    iterations: result.iterations,
  };
}

// ---- Legacy-compatible wrappers (used by analysis page) ----

export function generateFittedCurve(
  x: number[],
  peaks: DetectedPeak[],
  model: 'lorentzian' | 'gaussian' | 'voigt'
): number[] {
  const fn = model === 'gaussian' ? gaussian
    : model === 'voigt' ? (x: number, c: number, h: number, f: number) => pseudoVoigt(x, c, h, f, 0.5)
    : lorentzian;
  return x.map(xi =>
    peaks.reduce((sum, peak) => sum + fn(xi, peak.center, peak.height, peak.fwhm), 0)
  );
}

export function calculateResidual(y: number[], fitted: number[]): number[] {
  return y.map((v, i) => v - (fitted[i] || 0));
}

export function calculateRSquared(y: number[], fitted: number[]): number {
  const mean = y.reduce((s, v) => s + v, 0) / y.length;
  const ssTot = y.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - (fitted[i] || 0)) ** 2, 0);
  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}
