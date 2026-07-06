// ============================================================
// Baseline Correction Algorithms
// Scientific-grade implementations for spectroscopy data
// ============================================================

/**
 * ALS (Asymmetric Least Squares Smoothing) baseline estimation.
 * Implements Eilers & Boelens (2005) using Whittaker smoother
 * with a banded (pentadiagonal) matrix solver.
 *
 * @param y - intensity data
 * @param lam - smoothness parameter (1e4 ~ 1e9, higher = smoother)
 * @param p - asymmetry weight (0.001 ~ 0.05, lower = stricter below)
 * @param niter - number of reweighting iterations (10~50)
 */
export function alsBaseline(y: number[], lam: number = 1e6, p: number = 0.01, niter: number = 20): number[] {
  const n = y.length;
  if (n < 3) return [...y];

  const dtd = computeDtD(n);
  const w = new Array(n).fill(1);
  let z = [...y];

  for (let iter = 0; iter < niter; iter++) {
    z = solveBandedSystem(w, dtd, y, lam, n);

    for (let i = 0; i < n; i++) {
      w[i] = y[i] > z[i] ? p : (1 - p);
    }
  }

  return z;
}

/**
 * arPLS (Asymmetrically Reweighted Penalized Least Squares).
 * Zhang et al. (2010) - more robust than standard ALS.
 * Automatically adjusts weights based on negative residuals.
 */
export function arplsBaseline(y: number[], lam: number = 1e6, ratio: number = 0.01, maxIter: number = 50): number[] {
  const n = y.length;
  if (n < 3) return [...y];

  const dtd = computeDtD(n);
  const w = new Array(n).fill(1);
  let z = [...y];

  for (let iter = 0; iter < maxIter; iter++) {
    z = solveBandedSystem(w, dtd, y, lam, n);

    let dNegSum = 0;
    let dNegSqSum = 0;
    let negCount = 0;
    const d = new Array(n);

    for (let i = 0; i < n; i++) {
      d[i] = y[i] - z[i];
      if (d[i] < 0) {
        dNegSum += d[i];
        dNegSqSum += d[i] * d[i];
        negCount++;
      }
    }

    if (negCount === 0) break;

    const mean = dNegSum / negCount;
    const std = Math.sqrt(Math.max(0, dNegSqSum / negCount - mean * mean));
    if (std < 1e-10) break;

    const wOld = [...w];
    for (let i = 0; i < n; i++) {
      const t = (d[i] - (2 * std - mean)) / std;
      w[i] = 1 / (1 + Math.exp(2 * t));
    }

    let wChange = 0;
    for (let i = 0; i < n; i++) {
      wChange += Math.abs(w[i] - wOld[i]);
    }
    if (wChange / n < ratio) break;
  }

  return z;
}

/**
 * Compute D^T D for second-difference matrix D.
 * Returns { d0, d1, d2 } arrays for the pentadiagonal structure.
 */
function computeDtD(n: number): { d0: number[]; d1: number[]; d2: number[] } {
  const d0 = new Array(n).fill(0);
  const d1 = new Array(Math.max(0, n - 1)).fill(0);
  const d2 = new Array(Math.max(0, n - 2)).fill(0);

  for (let i = 0; i < n - 2; i++) {
    d0[i] += 1;
    d0[i + 1] += 4;
    d0[i + 2] += 1;
    d1[i] += -2;
    d1[i + 1] += -2;
    d2[i] += 1;
  }

  return { d0, d1, d2 };
}

/**
 * Solve (W + lam * D^T D) z = W * y using Cholesky decomposition
 * on the pentadiagonal banded system.
 */
function solveBandedSystem(
  w: number[],
  dtd: { d0: number[]; d1: number[]; d2: number[] },
  y: number[],
  lam: number,
  n: number
): number[] {
  // Build A = W + lam * D^T D
  const a0 = new Array(n);
  const a1 = new Array(n - 1);
  const a2 = new Array(n - 2);

  for (let i = 0; i < n; i++) {
    a0[i] = w[i] + lam * dtd.d0[i];
  }
  for (let i = 0; i < n - 1; i++) {
    a1[i] = lam * dtd.d1[i];
  }
  for (let i = 0; i < n - 2; i++) {
    a2[i] = lam * dtd.d2[i];
  }

  // Right-hand side: W * y
  const rhs = new Array(n);
  for (let i = 0; i < n; i++) {
    rhs[i] = w[i] * y[i];
  }

  // Cholesky factorization of pentadiagonal matrix
  const l0 = new Array(n).fill(0);
  const l1 = new Array(n - 1).fill(0);
  const l2 = new Array(n - 2).fill(0);

  l0[0] = Math.sqrt(Math.max(1e-15, a0[0]));

  if (n > 1) {
    l1[0] = a1[0] / l0[0];
    l0[1] = Math.sqrt(Math.max(1e-15, a0[1] - l1[0] * l1[0]));
  }

  for (let i = 2; i < n; i++) {
    l2[i - 2] = a2[i - 2] / l0[i - 2];
    l1[i - 1] = (a1[i - 1] - l1[i - 2] * l2[i - 2]) / l0[i - 1];
    l0[i] = Math.sqrt(Math.max(1e-15, a0[i] - l1[i - 1] * l1[i - 1] - l2[i - 2] * l2[i - 2]));
  }

  // Forward substitution: L * u = rhs
  const u = new Array(n).fill(0);
  u[0] = rhs[0] / l0[0];
  if (n > 1) {
    u[1] = (rhs[1] - l1[0] * u[0]) / l0[1];
  }
  for (let i = 2; i < n; i++) {
    u[i] = (rhs[i] - l1[i - 1] * u[i - 1] - l2[i - 2] * u[i - 2]) / l0[i];
  }

  // Back substitution: L^T * z = u
  const z = new Array(n).fill(0);
  z[n - 1] = u[n - 1] / l0[n - 1];
  if (n > 1) {
    z[n - 2] = (u[n - 2] - l1[n - 2] * z[n - 1]) / l0[n - 2];
  }
  for (let i = n - 3; i >= 0; i--) {
    z[i] = (u[i] - l1[i] * z[i + 1] - l2[i] * z[i + 2]) / l0[i];
  }

  return z;
}

/**
 * Polynomial baseline with iterative reweighting.
 * Fits polynomial to non-peak regions by iteratively downweighting
 * points above the current estimate (Lieber & Mahadevan-Jansen, 2003).
 */
export function polyBaseline(x: number[], y: number[], degree: number = 3, niter: number = 50): number[] {
  const n = x.length;
  if (n < degree + 1) return [...y];

  const xMin = x[0], xMax = x[n - 1];
  const xRange = xMax - xMin || 1;
  const xNorm = x.map(v => (v - xMin) / xRange);

  let currentY = [...y];

  for (let iter = 0; iter < niter; iter++) {
    const coeffs = polyfit(xNorm, currentY, degree);
    const bl = xNorm.map(xi => polyeval(coeffs, xi));

    let changed = false;
    for (let i = 0; i < n; i++) {
      if (currentY[i] > bl[i]) {
        currentY[i] = bl[i];
        changed = true;
      }
    }
    if (!changed) break;
  }

  const coeffs = polyfit(xNorm, currentY, degree);
  return xNorm.map(xi => polyeval(coeffs, xi));
}

function polyfit(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const m = degree + 1;

  const XtX = Array.from({ length: m }, () => new Array(m).fill(0));
  const Xty = new Array(m).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const xj = Math.pow(x[i], j);
      Xty[j] += xj * y[i];
      for (let k = 0; k < m; k++) {
        XtX[j][k] += xj * Math.pow(x[i], k);
      }
    }
  }

  return gaussianElimination(XtX, Xty);
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    if (Math.abs(aug[i][i]) < 1e-12) continue;

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
    x[i] /= aug[i][i] || 1;
  }
  return x;
}

function polyeval(coeffs: number[], x: number): number {
  let result = coeffs[coeffs.length - 1];
  for (let i = coeffs.length - 2; i >= 0; i--) {
    result = result * x + coeffs[i];
  }
  return result;
}

/**
 * SNIP (Statistics-sensitive Non-linear Iterative Peak-clipping).
 * Ryan et al. (1988) - standard in X-ray spectroscopy.
 * Uses LLS (Log-Log-Square-root) transform for better peak suppression.
 */
export function snipBaseline(y: number[], iterations: number = 40): number[] {
  const n = y.length;
  if (n < 3) return [...y];

  // Forward LLS transform: v = log(log(sqrt(y + 1) + 1) + 1)
  const v = new Array(n);
  for (let i = 0; i < n; i++) {
    const val = Math.max(0, y[i]);
    v[i] = Math.log(Math.log(Math.sqrt(val + 1) + 1) + 1);
  }

  // Iterative clipping from large to small window
  for (let p = iterations; p >= 1; p--) {
    for (let i = p; i < n - p; i++) {
      const avg = (v[i - p] + v[i + p]) / 2;
      if (v[i] > avg) {
        v[i] = avg;
      }
    }
  }

  // Inverse LLS transform
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = Math.exp(v[i]) - 1;
    const s = Math.exp(t) - 1;
    result[i] = Math.max(0, s * s - 1);
  }

  return result;
}
