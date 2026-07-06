/**
 * Seed script: Fathiya YIG Raman Published data → local DB + Supabase
 * Usage: node scripts/seed-data.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const XLSXModule = await import('xlsx');
const XLSX = XLSXModule.default || XLSXModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load .env.local
config({ path: path.join(PROJECT_ROOT, '.env.local') });

const DB_DIR = path.join(PROJECT_ROOT, '.data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const DATA_PATH = path.resolve(PROJECT_ROOT, '..', 'dataset', 'Published data', 'Fathiya_Published data', 'Raman Data (YIG Film).xlsx');

if (!existsSync(DATA_PATH)) {
  console.error('Data file not found:', DATA_PATH);
  process.exit(1);
}

console.log('Reading:', DATA_PATH);

const buf = readFileSync(DATA_PATH);
const workbook = XLSX.read(buf);
console.log('Sheets:', workbook.SheetNames);

function parseSheet(sheetName) {
  const ws = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const headerRow = raw[2] || [];
  const dataStartIdx = 3;

  const polMatch = sheetName.match(/\b(LL|RL|RR|LR)\b/);
  const polarization = polMatch ? polMatch[1] : undefined;

  const sheetLower = sheetName.toLowerCase();
  let variable;
  if (sheetLower.includes('temp')) variable = 'temperature';
  if (sheetLower.includes('field')) variable = 'field';

  const xData = [];
  for (let r = dataStartIdx; r < raw.length; r++) {
    const val = raw[r]?.[0];
    if (val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) {
      xData.push(val);
    }
  }

  const spectra = [];

  for (let col = 1; col < headerRow.length; col++) {
    const colHeader = String(headerRow[col] || '').trim();
    if (!colHeader) continue;

    const yData = [];
    for (let r = dataStartIdx; r < dataStartIdx + xData.length; r++) {
      const val = raw[r]?.[col];
      yData.push(typeof val === 'number' && !isNaN(val) ? val : 0);
    }

    if (yData.every(v => v === 0)) continue;

    const metadata = {};
    const tempMatch = colHeader.match(/(\d+)\s*K/i);
    if (tempMatch) {
      metadata.temperature = parseInt(tempMatch[1]);
      metadata.temperature_unit = 'K';
    }
    const fieldMatch = colHeader.match(/(\d+)\s*Oe/i);
    if (fieldMatch) {
      metadata.field = parseInt(fieldMatch[1]);
      metadata.field_unit = 'Oe';
    }
    if (polarization) metadata.polarization = polarization;
    if (variable) metadata.variable = variable;

    const label = [colHeader, polarization].filter(Boolean).join(', ');

    spectra.push({ label, xData, yData, metadata });
  }

  return spectra;
}

// ============ Parse all sheets ============

const sheets = [
  { name: 'LL TEMPERATURE DEPENDENT', dsName: 'YIG LL Temperature Dependent' },
  { name: 'RL TEMP DEPENDENT', dsName: 'YIG RL Temperature Dependent' },
  { name: 'LL FIELD DEPENDENT', dsName: 'YIG LL Field Dependent' },
];

const allDatasets = [];
const allSpectra = [];

for (const sheet of sheets) {
  const spectraData = parseSheet(sheet.name);

  const datasetId = crypto.randomUUID();
  const dataset = {
    id: datasetId,
    name: sheet.dsName,
    researcher: 'Fathiya',
    material: 'YIG (Y₃Fe₅O₁₂)',
    technique: 'Raman',
    is_published: true,
    description: `JALCOM 2026 - ${sheet.dsName}`,
    file_storage_path: null,
    original_filename: 'Raman Data (YIG Film).xlsx',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  allDatasets.push(dataset);

  for (const s of spectraData) {
    allSpectra.push({
      id: crypto.randomUUID(),
      dataset_id: datasetId,
      label: s.label,
      sheet_name: sheet.name,
      x_unit: 'cm⁻¹',
      y_unit: 'counts',
      x_data: s.xData,
      y_data: s.yData,
      data_type: 'raw',
      metadata: s.metadata,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`  ${sheet.dsName}: ${spectraData.length} spectra`);
}

// ============ Save to local JSON DB ============

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

const localDb = {
  datasets: allDatasets,
  spectra: allSpectra,
  fitting_results: [],
  peak_tracks: [],
  external_data: [],
};

writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2));
console.log(`\n[Local DB] Saved to ${DB_FILE}`);
console.log(`  Datasets: ${allDatasets.length}, Spectra: ${allSpectra.length}`);

// ============ Push to Supabase ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) {
  console.log('\n[Supabase] Skipped (placeholder URL)');
  process.exit(0);
}

console.log('\n[Supabase] Connecting...');

const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Clear existing data
console.log('[Supabase] Clearing existing data...');
await sb.from('acc_fitting_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await sb.from('acc_peak_tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await sb.from('acc_external_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await sb.from('acc_spectra').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await sb.from('acc_datasets').delete().neq('id', '00000000-0000-0000-0000-000000000000');

// Insert datasets
console.log('[Supabase] Inserting datasets...');
for (const ds of allDatasets) {
  const { id, created_at, updated_at, ...rest } = ds;
  const { error } = await sb.from('acc_datasets').insert({ id, ...rest });
  if (error) {
    console.error(`  ERROR inserting dataset "${ds.name}":`, error.message);
  }
}

// Insert spectra in chunks (Supabase payload limit)
console.log('[Supabase] Inserting spectra...');
const CHUNK_SIZE = 5; // small chunks because each spectrum has large arrays
for (let i = 0; i < allSpectra.length; i += CHUNK_SIZE) {
  const chunk = allSpectra.slice(i, i + CHUNK_SIZE).map(s => {
    const { created_at, ...rest } = s;
    return rest;
  });
  const { error } = await sb.from('acc_spectra').insert(chunk);
  if (error) {
    console.error(`  ERROR inserting spectra chunk ${i}:`, error.message);
    break;
  }
  process.stdout.write(`  ${Math.min(i + CHUNK_SIZE, allSpectra.length)}/${allSpectra.length}\r`);
}

// Verify
const { count: dsCount } = await sb.from('acc_datasets').select('*', { count: 'exact', head: true });
const { count: spCount } = await sb.from('acc_spectra').select('*', { count: 'exact', head: true });

console.log(`\n[Supabase] Done!`);
console.log(`  acc_datasets: ${dsCount} rows`);
console.log(`  acc_spectra: ${spCount} rows`);
