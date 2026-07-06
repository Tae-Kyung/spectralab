import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { SpectrumMetadata } from '@/lib/types/spectrum';
import {
  parseColumnHeader,
  detectXUnit,
  detectYUnit,
  detectTechnique,
  detectDataType,
  inferResearcher,
  inferMaterial,
} from '@/lib/utils/metadata-parser';

// Optimized parse result: xData at sheet level (not duplicated per spectrum)
interface ParsedSpectrumCompact {
  label: string;
  yData: number[];
  yUnit: string;
  dataType: 'raw' | 'baseline_corrected';
  metadata: SpectrumMetadata;
}

interface ParsedSheetCompact {
  sheetName: string;
  xData: number[];
  xUnit: string;
  spectra: ParsedSpectrumCompact[];
}

interface ParseResultCompact {
  filename: string;
  sheets: ParsedSheetCompact[];
  suggestedDataset: {
    name?: string;
    researcher?: string;
    material?: string;
    technique?: string;
    is_published?: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const filename = file.name;

    const technique = detectTechnique(filename, workbook.SheetNames);
    const researcher = inferResearcher(filename);
    const material = inferMaterial(researcher, filename);

    const sheets: ParsedSheetCompact[] = [];

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
      });

      if (raw.length < 4) continue;

      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, raw.length); i++) {
        const rowStr = (raw[i] || []).map(c => String(c || '')).join(' ').toLowerCase();
        if (rowStr.includes('raman shift') || rowStr.includes('x-axis') || rowStr.includes('binding energy') || rowStr.includes('time')) {
          headerRowIdx = i;
          break;
        }
      }

      const headerRow = raw[headerRowIdx] || [];
      const dataStartIdx = headerRowIdx + 1;

      let sheetPolarization: string | undefined;
      const polMatch = sheetName.match(/\b(LL|RL|RR|LR)\b/);
      if (polMatch) sheetPolarization = polMatch[1];

      let sheetVariable: string | undefined;
      const sheetLower = sheetName.toLowerCase();
      if (sheetLower.includes('temp')) sheetVariable = 'temperature';
      if (sheetLower.includes('field')) sheetVariable = 'field';

      const dataType = detectDataType(sheetName, headerRow.map(h => String(h || '')).join(' '));

      const xData: number[] = [];
      for (let r = dataStartIdx; r < raw.length; r++) {
        const val = raw[r]?.[0];
        if (val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) {
          xData.push(val);
        }
      }

      if (xData.length < 10) continue;

      const xUnit = detectXUnit(headerRow.map(h => String(h || '')), xData);
      const spectra: ParsedSpectrumCompact[] = [];

      for (let col = 1; col < headerRow.length; col++) {
        const colHeader = String(headerRow[col] || '').trim();
        if (!colHeader) continue;

        const yData: number[] = [];
        for (let r = dataStartIdx; r < dataStartIdx + xData.length; r++) {
          const val = raw[r]?.[col];
          yData.push(typeof val === 'number' && !isNaN(val) ? val : 0);
        }

        if (yData.every(v => v === 0)) continue;

        const colMeta = parseColumnHeader(colHeader);
        const metadata: SpectrumMetadata = {
          ...colMeta,
          ...(sheetPolarization && { polarization: sheetPolarization }),
          ...(sheetVariable && { variable: sheetVariable }),
        };

        const label = [colHeader, sheetPolarization].filter(Boolean).join(', ');

        spectra.push({
          label,
          yData,
          yUnit: detectYUnit(technique),
          dataType,
          metadata,
        });
      }

      if (spectra.length > 0) {
        sheets.push({ sheetName, xData, xUnit, spectra });
      }
    }

    const result: ParseResultCompact = {
      filename,
      sheets,
      suggestedDataset: {
        name: filename.replace(/\.xlsx?$/i, ''),
        researcher,
        material,
        technique,
        is_published: filename.toLowerCase().includes('published'),
      },
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
