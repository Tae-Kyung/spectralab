export const TECHNIQUE_COLORS: Record<string, string> = {
  Raman: '#00D2FF',
  XPS: '#FF6B6B',
  THz: '#4ECB71',
  PL: '#FFD93D',
};

export const TECHNIQUE_UNITS: Record<string, { x: string; y: string }> = {
  Raman: { x: 'cm⁻¹', y: 'Intensity (counts)' },
  XPS: { x: 'Binding Energy (eV)', y: 'Counts/s' },
  THz: { x: 'Time delay (ps)', y: 'THz Signal (a.u.)' },
  PL: { x: 'Wavelength (nm)', y: 'PL Intensity (a.u.)' },
};

export const RESEARCHERS = [
  'Fathiya',
  'Anabil',
  'Priyanka',
  'Qoima',
  'Kim My',
] as const;

export const MATERIALS = [
  'YIG (Y₃Fe₅O₁₂)',
  'FGT (Fe₃GeTe₂)',
  'Cr₂S₃/MoS₂',
  'MoS₂',
  'Cr₂S₃',
] as const;

export const FITTING_MODELS = [
  { value: 'voigt', label: 'Voigt (Pseudo-Voigt)' },
  { value: 'lorentzian', label: 'Lorentzian' },
  { value: 'gaussian', label: 'Gaussian' },
] as const;

export const BASELINE_METHODS = [
  { value: 'als', label: 'ALS (Asymmetric Least Squares)' },
  { value: 'snip', label: 'SNIP (Peak Clipping)' },
  { value: 'poly', label: 'Polynomial' },
] as const;

export const COLORSCALES = [
  'Viridis', 'Plasma', 'Inferno', 'Magma', 'Hot', 'YlOrRd', 'Blues',
] as const;

// Unit conversion constants
export const CM1_TO_THZ = 0.02998; // 1 cm⁻¹ = 0.02998 THz
export const CM1_TO_MEV = 0.12398; // 1 cm⁻¹ = 0.12398 meV

export function cm1ToTHz(cm1: number): number {
  return cm1 * CM1_TO_THZ;
}

export function cm1ToMeV(cm1: number): number {
  return cm1 * CM1_TO_MEV;
}

export function generateCoolwarmPalette(n: number): string[] {
  // Blue (cold) → Red (hot) for temperature-dependent data
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const r = Math.round(255 * Math.min(1, 2 * t));
    const b = Math.round(255 * Math.min(1, 2 * (1 - t)));
    const g = Math.round(255 * Math.max(0, 1 - 2 * Math.abs(t - 0.5)));
    return `rgb(${r},${g},${b})`;
  });
}

export function generateColorPalette(n: number): string[] {
  const hueStep = 360 / Math.max(1, n);
  return Array.from({ length: n }, (_, i) =>
    `hsl(${(i * hueStep + 200) % 360}, 70%, 60%)`
  );
}
