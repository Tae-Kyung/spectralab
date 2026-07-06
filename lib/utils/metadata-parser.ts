import { SpectrumMetadata } from '@/lib/types/spectrum';

export function parseFilename(filename: string): Partial<SpectrumMetadata> {
  const meta: Partial<SpectrumMetadata> = {};

  // thickness: "10nm" pattern
  const thicknessMatch = filename.match(/(\d+(?:\.\d+)?)\s*nm/i);
  if (thicknessMatch) {
    meta.thickness = parseFloat(thicknessMatch[1]);
    meta.thickness_unit = 'nm';
  }

  // temperature: "50K" pattern
  const tempMatch = filename.match(/(\d+)\s*K(?!\w)/i);
  if (tempMatch) {
    meta.temperature = parseInt(tempMatch[1]);
    meta.temperature_unit = 'K';
  }

  return meta;
}

export function parseColumnHeader(header: string): Partial<SpectrumMetadata> {
  const meta: Partial<SpectrumMetadata> = {};

  // temperature
  const tempMatch = header.match(/(\d+)\s*K/i);
  if (tempMatch) {
    meta.temperature = parseInt(tempMatch[1]);
    meta.temperature_unit = 'K';
  }

  // field in mT
  const mTMatch = header.match(/(\d+)\s*mT/i);
  if (mTMatch) {
    meta.field = parseInt(mTMatch[1]);
    meta.field_unit = 'mT';
  }

  // field in Oe
  const oeMatch = header.match(/(\d+)\s*Oe/i);
  if (oeMatch) {
    meta.field = parseInt(oeMatch[1]);
    meta.field_unit = 'Oe';
  }

  // polarization
  const polMatch = header.match(/\b(LL|RL|RR|LR)\b/);
  if (polMatch) {
    meta.polarization = polMatch[1];
  }

  // magnetization
  const magMatch = header.match(/([+-]M)/);
  if (magMatch) {
    meta.magnetization = magMatch[1];
  }

  return meta;
}

export function detectXUnit(headers: string[], data: number[]): string {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('raman') || headerStr.includes('x-axis')) return 'cm⁻¹';
  if (headerStr.includes('binding energy')) return 'eV';
  if (headerStr.includes('time') || headerStr.includes('ps')) return 'ps';
  if (headerStr.includes('wavelength') || headerStr.includes('nm')) return 'nm';

  // heuristic by data range
  if (data.length > 0) {
    const min = Math.min(...data.slice(0, 10));
    const max = Math.max(...data.slice(0, 10));
    if (min < 0 && max < 10) return 'ps'; // THz time delay
    if (max > 400 && max < 1000) return 'eV'; // XPS
    if (max > 50 && max < 3000) return 'cm⁻¹'; // Raman
  }

  return 'a.u.';
}

export function detectYUnit(technique: string): string {
  switch (technique) {
    case 'Raman': return 'counts';
    case 'XPS': return 'c/s';
    case 'THz': return 'a.u.';
    case 'PL': return 'a.u.';
    default: return 'a.u.';
  }
}

export function detectTechnique(filename: string, sheetNames: string[]): string {
  const combined = (filename + ' ' + sheetNames.join(' ')).toLowerCase();
  if (combined.includes('raman') || combined.includes('x-axis')) return 'Raman';
  if (combined.includes('xps') || combined.includes('binding energy')) return 'XPS';
  if (combined.includes('thz') || combined.includes('terahertz') || combined.includes('emission')) return 'THz';
  if (combined.includes('pl') || combined.includes('photoluminescence')) return 'PL';
  return 'Raman'; // default
}

export function detectDataType(sheetName: string, headerStr: string): 'raw' | 'baseline_corrected' {
  const combined = (sheetName + ' ' + headerStr).toLowerCase();
  if (combined.includes('baseline') || combined.includes('corrected') || combined.includes('subtract')) {
    return 'baseline_corrected';
  }
  return 'raw';
}

export function inferResearcher(filepath: string): string {
  const lower = filepath.toLowerCase();
  if (lower.includes('kim my') || lower.includes('fgt')) return 'Kim My';
  if (lower.includes('fathiya')) return 'Fathiya';
  if (lower.includes('anabil')) return 'Anabil';
  if (lower.includes('priyanka')) return 'Priyanka';
  if (lower.includes('qoima')) return 'Qoima';
  return 'Unknown';
}

export function inferMaterial(researcher: string, filepath: string): string {
  if (researcher === 'Kim My') return 'FGT (Fe₃GeTe₂)';
  if (filepath.toLowerCase().includes('yig')) return 'YIG (Y₃Fe₅O₁₂)';
  if (researcher === 'Anabil') return 'Cr₂S₃/MoS₂';
  return '';
}
