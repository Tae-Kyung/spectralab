import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { Dataset, Spectrum, FittingResult, PeakTrack, ExternalData } from '@/lib/types/spectrum';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DB {
  datasets: Dataset[];
  spectra: Spectrum[];
  fitting_results: FittingResult[];
  peak_tracks: PeakTrack[];
  external_data: ExternalData[];
}

function ensureDB(): DB {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  if (!existsSync(DB_FILE)) {
    const empty: DB = { datasets: [], spectra: [], fitting_results: [], peak_tracks: [], external_data: [] };
    writeFileSync(DB_FILE, JSON.stringify(empty));
    return empty;
  }
  const db = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
  if (!db.peak_tracks) db.peak_tracks = [];
  if (!db.external_data) db.external_data = [];
  return db;
}

function saveDB(db: DB) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Datasets
export function getDatasets(): Dataset[] {
  return ensureDB().datasets;
}

export function getDataset(id: string): Dataset | undefined {
  return ensureDB().datasets.find(d => d.id === id);
}

export function createDataset(dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>): Dataset {
  const db = ensureDB();
  const newDataset: Dataset = {
    ...dataset,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.datasets.push(newDataset);
  saveDB(db);
  return newDataset;
}

export function deleteDataset(id: string): boolean {
  const db = ensureDB();
  const idx = db.datasets.findIndex(d => d.id === id);
  if (idx === -1) return false;
  db.datasets.splice(idx, 1);
  db.spectra = db.spectra.filter(s => s.dataset_id !== id);
  db.fitting_results = db.fitting_results.filter(f => {
    const spectrum = db.spectra.find(s => s.id === f.spectrum_id);
    return spectrum !== undefined;
  });
  db.peak_tracks = db.peak_tracks.filter(p => p.dataset_id !== id);
  saveDB(db);
  return true;
}

// Spectra
export function getSpectra(datasetId?: string): Spectrum[] {
  const db = ensureDB();
  if (datasetId) return db.spectra.filter(s => s.dataset_id === datasetId);
  return db.spectra;
}

export function getSpectrum(id: string): Spectrum | undefined {
  return ensureDB().spectra.find(s => s.id === id);
}

export function createManySpectra(spectra: Omit<Spectrum, 'id' | 'created_at'>[]): Spectrum[] {
  const db = ensureDB();
  const created = spectra.map(s => ({
    ...s,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }));
  db.spectra.push(...created);
  saveDB(db);
  return created;
}

// Fitting Results
export function getFittingResults(spectrumId?: string): FittingResult[] {
  const db = ensureDB();
  if (spectrumId) return db.fitting_results.filter(f => f.spectrum_id === spectrumId);
  return db.fitting_results;
}

export function getFittingResultsByDataset(datasetId: string): FittingResult[] {
  const db = ensureDB();
  const spectrumIds = new Set(db.spectra.filter(s => s.dataset_id === datasetId).map(s => s.id));
  return db.fitting_results.filter(f => spectrumIds.has(f.spectrum_id));
}

export function createFittingResult(result: Omit<FittingResult, 'id' | 'created_at'>): FittingResult {
  const db = ensureDB();
  const newResult: FittingResult = {
    ...result,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.fitting_results.push(newResult);
  saveDB(db);
  return newResult;
}

export function createManyFittingResults(results: Omit<FittingResult, 'id' | 'created_at'>[]): FittingResult[] {
  const db = ensureDB();
  const created = results.map(r => ({
    ...r,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }));
  db.fitting_results.push(...created);
  saveDB(db);
  return created;
}

export function deleteFittingResultsByDataset(datasetId: string): number {
  const db = ensureDB();
  const spectrumIds = new Set(db.spectra.filter(s => s.dataset_id === datasetId).map(s => s.id));
  const before = db.fitting_results.length;
  db.fitting_results = db.fitting_results.filter(f => !spectrumIds.has(f.spectrum_id));
  saveDB(db);
  return before - db.fitting_results.length;
}

// Peak Tracks
export function getPeakTracks(datasetId?: string): PeakTrack[] {
  const db = ensureDB();
  if (datasetId) return db.peak_tracks.filter(p => p.dataset_id === datasetId);
  return db.peak_tracks;
}

export function createPeakTrack(track: Omit<PeakTrack, 'id' | 'created_at'>): PeakTrack {
  const db = ensureDB();
  const newTrack: PeakTrack = {
    ...track,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.peak_tracks.push(newTrack);
  saveDB(db);
  return newTrack;
}

export function deletePeakTracksByDataset(datasetId: string): number {
  const db = ensureDB();
  const before = db.peak_tracks.length;
  db.peak_tracks = db.peak_tracks.filter(p => p.dataset_id !== datasetId);
  saveDB(db);
  return before - db.peak_tracks.length;
}

// External Data
export function getExternalDataList(): ExternalData[] {
  return ensureDB().external_data;
}

export function getExternalDataItem(id: string): ExternalData | undefined {
  return ensureDB().external_data.find(e => e.id === id);
}

export function createExternalData(data: Omit<ExternalData, 'id' | 'created_at'>): ExternalData {
  const db = ensureDB();
  const newData: ExternalData = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.external_data.push(newData);
  saveDB(db);
  return newData;
}

export function deleteExternalData(id: string): boolean {
  const db = ensureDB();
  const idx = db.external_data.findIndex(e => e.id === id);
  if (idx === -1) return false;
  db.external_data.splice(idx, 1);
  saveDB(db);
  return true;
}

// Stats
export function getStats() {
  const db = ensureDB();
  return {
    totalDatasets: db.datasets.length,
    totalSpectra: db.spectra.length,
    totalFittings: db.fitting_results.length,
    byTechnique: db.datasets.reduce((acc, d) => {
      acc[d.technique] = (acc[d.technique] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byResearcher: db.datasets.reduce((acc, d) => {
      acc[d.researcher] = (acc[d.researcher] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    spectraByDataset: db.datasets.map(d => ({
      id: d.id,
      name: d.name,
      researcher: d.researcher,
      technique: d.technique,
      material: d.material,
      count: db.spectra.filter(s => s.dataset_id === d.id).length,
    })),
  };
}

// Reset
export function resetDB() {
  const empty: DB = { datasets: [], spectra: [], fitting_results: [], peak_tracks: [], external_data: [] };
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
}
