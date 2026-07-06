/**
 * 통합 데이터 레이어
 * - NEXT_PUBLIC_SUPABASE_URL이 placeholder가 아니면 → Supabase 사용 (테이블명: acc_*)
 * - 그 외 → 로컬 JSON DB fallback
 */

import type { Dataset, Spectrum, FittingResult, PeakTrack, ExternalData } from '@/lib/types/spectrum';

function useSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.length > 0 && !url.includes('placeholder');
}

// ============ Supabase 테이블명 (acc_ 접두사) ============
const T = {
  datasets: 'acc_datasets',
  spectra: 'acc_spectra',
  fitting_results: 'acc_fitting_results',
  peak_tracks: 'acc_peak_tracks',
  external_data: 'acc_external_data',
} as const;

async function supabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const supa = {
  // Datasets
  async getDatasets(): Promise<Dataset[]> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.datasets).select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async getDataset(id: string): Promise<Dataset | null> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.datasets).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  async createDataset(dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>): Promise<Dataset> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.datasets).insert(dataset).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async deleteDataset(id: string): Promise<boolean> {
    const sb = await supabaseClient();
    const { error } = await sb.from(T.datasets).delete().eq('id', id);
    return !error;
  },

  // Spectra
  async getSpectra(datasetId?: string): Promise<Spectrum[]> {
    const sb = await supabaseClient();
    let query = sb.from(T.spectra).select('*');
    if (datasetId) query = query.eq('dataset_id', datasetId);
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async getSpectrum(id: string): Promise<Spectrum | null> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.spectra).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  async createManySpectra(spectra: Omit<Spectrum, 'id' | 'created_at'>[]): Promise<Spectrum[]> {
    const sb = await supabaseClient();
    const results: Spectrum[] = [];
    for (let i = 0; i < spectra.length; i += 50) {
      const chunk = spectra.slice(i, i + 50);
      const { data, error } = await sb.from(T.spectra).insert(chunk).select();
      if (error) throw new Error(error.message);
      results.push(...(data || []));
    }
    return results;
  },

  // Fitting Results
  async getFittingResults(spectrumId?: string): Promise<FittingResult[]> {
    const sb = await supabaseClient();
    let query = sb.from(T.fitting_results).select('*');
    if (spectrumId) query = query.eq('spectrum_id', spectrumId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async getFittingResultsByDataset(datasetId: string): Promise<FittingResult[]> {
    const sb = await supabaseClient();
    const { data: spectra } = await sb.from(T.spectra).select('id').eq('dataset_id', datasetId);
    if (!spectra || spectra.length === 0) return [];
    const ids = spectra.map(s => s.id);
    const { data, error } = await sb.from(T.fitting_results).select('*').in('spectrum_id', ids);
    if (error) throw new Error(error.message);
    return data || [];
  },
  async createFittingResult(result: Omit<FittingResult, 'id' | 'created_at'>): Promise<FittingResult> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.fitting_results).insert(result).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async createManyFittingResults(results: Omit<FittingResult, 'id' | 'created_at'>[]): Promise<FittingResult[]> {
    const sb = await supabaseClient();
    const created: FittingResult[] = [];
    for (let i = 0; i < results.length; i += 50) {
      const chunk = results.slice(i, i + 50);
      const { data, error } = await sb.from(T.fitting_results).insert(chunk).select();
      if (error) throw new Error(error.message);
      created.push(...(data || []));
    }
    return created;
  },
  async deleteFittingResultsByDataset(datasetId: string): Promise<number> {
    const sb = await supabaseClient();
    const { data: spectra } = await sb.from(T.spectra).select('id').eq('dataset_id', datasetId);
    if (!spectra || spectra.length === 0) return 0;
    const ids = spectra.map(s => s.id);
    const { data } = await sb.from(T.fitting_results).delete().in('spectrum_id', ids).select();
    return data?.length || 0;
  },

  // Peak Tracks
  async getPeakTracks(datasetId?: string): Promise<PeakTrack[]> {
    const sb = await supabaseClient();
    let query = sb.from(T.peak_tracks).select('*');
    if (datasetId) query = query.eq('dataset_id', datasetId);
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async createPeakTrack(track: Omit<PeakTrack, 'id' | 'created_at'>): Promise<PeakTrack> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.peak_tracks).insert(track).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async deletePeakTracksByDataset(datasetId: string): Promise<number> {
    const sb = await supabaseClient();
    const { data } = await sb.from(T.peak_tracks).delete().eq('dataset_id', datasetId).select();
    return data?.length || 0;
  },

  // External Data
  async getExternalDataList(): Promise<ExternalData[]> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.external_data).select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async getExternalDataItem(id: string): Promise<ExternalData | null> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.external_data).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  async createExternalData(d: Omit<ExternalData, 'id' | 'created_at'>): Promise<ExternalData> {
    const sb = await supabaseClient();
    const { data, error } = await sb.from(T.external_data).insert(d).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async deleteExternalData(id: string): Promise<boolean> {
    const sb = await supabaseClient();
    const { error } = await sb.from(T.external_data).delete().eq('id', id);
    return !error;
  },

  // Stats
  async getStats() {
    const sb = await supabaseClient();
    const { data: datasets } = await sb.from(T.datasets).select('id, name, researcher, technique, material');
    const { count: spectraCount } = await sb.from(T.spectra).select('*', { count: 'exact', head: true });
    const { count: fittingCount } = await sb.from(T.fitting_results).select('*', { count: 'exact', head: true });

    const ds = datasets || [];
    const byTechnique: Record<string, number> = {};
    const byResearcher: Record<string, number> = {};
    ds.forEach(d => {
      byTechnique[d.technique] = (byTechnique[d.technique] || 0) + 1;
      byResearcher[d.researcher] = (byResearcher[d.researcher] || 0) + 1;
    });

    const spectraByDataset = await Promise.all(
      ds.map(async (d) => {
        const { count } = await sb.from(T.spectra).select('*', { count: 'exact', head: true }).eq('dataset_id', d.id);
        return { id: d.id, name: d.name, researcher: d.researcher, technique: d.technique, material: d.material, count: count || 0 };
      })
    );

    return {
      totalDatasets: ds.length,
      totalSpectra: spectraCount || 0,
      totalFittings: fittingCount || 0,
      byTechnique,
      byResearcher,
      spectraByDataset,
    };
  },
};

// ============ 로컬 JSON 구현 ============

async function localDB() {
  return await import('@/lib/local-db');
}

const local = {
  async getDatasets() { return (await localDB()).getDatasets(); },
  async getDataset(id: string) { return (await localDB()).getDataset(id) || null; },
  async createDataset(d: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>) { return (await localDB()).createDataset(d); },
  async deleteDataset(id: string) { return (await localDB()).deleteDataset(id); },
  async getSpectra(datasetId?: string) { return (await localDB()).getSpectra(datasetId); },
  async getSpectrum(id: string) { return (await localDB()).getSpectrum(id) || null; },
  async createManySpectra(s: Omit<Spectrum, 'id' | 'created_at'>[]) { return (await localDB()).createManySpectra(s); },
  async getFittingResults(spectrumId?: string) { return (await localDB()).getFittingResults(spectrumId); },
  async getFittingResultsByDataset(datasetId: string) { return (await localDB()).getFittingResultsByDataset(datasetId); },
  async createFittingResult(r: Omit<FittingResult, 'id' | 'created_at'>) { return (await localDB()).createFittingResult(r); },
  async createManyFittingResults(rs: Omit<FittingResult, 'id' | 'created_at'>[]) { return (await localDB()).createManyFittingResults(rs); },
  async deleteFittingResultsByDataset(datasetId: string) { return (await localDB()).deleteFittingResultsByDataset(datasetId); },
  async getPeakTracks(datasetId?: string) { return (await localDB()).getPeakTracks(datasetId); },
  async createPeakTrack(t: Omit<PeakTrack, 'id' | 'created_at'>) { return (await localDB()).createPeakTrack(t); },
  async deletePeakTracksByDataset(datasetId: string) { return (await localDB()).deletePeakTracksByDataset(datasetId); },
  async getExternalDataList() { return (await localDB()).getExternalDataList(); },
  async getExternalDataItem(id: string) { return (await localDB()).getExternalDataItem(id) || null; },
  async createExternalData(d: Omit<ExternalData, 'id' | 'created_at'>) { return (await localDB()).createExternalData(d); },
  async deleteExternalData(id: string) { return (await localDB()).deleteExternalData(id); },
  async getStats() { return (await localDB()).getStats(); },
  async resetDB() { return (await localDB()).resetDB(); },
};

// ============ 통합 인터페이스 ============

export const db = {
  getDatasets: () => useSupabase() ? supa.getDatasets() : local.getDatasets(),
  getDataset: (id: string) => useSupabase() ? supa.getDataset(id) : local.getDataset(id),
  createDataset: (d: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>) => useSupabase() ? supa.createDataset(d) : local.createDataset(d),
  deleteDataset: (id: string) => useSupabase() ? supa.deleteDataset(id) : local.deleteDataset(id),
  getSpectra: (datasetId?: string) => useSupabase() ? supa.getSpectra(datasetId) : local.getSpectra(datasetId),
  getSpectrum: (id: string) => useSupabase() ? supa.getSpectrum(id) : local.getSpectrum(id),
  createManySpectra: (s: Omit<Spectrum, 'id' | 'created_at'>[]) => useSupabase() ? supa.createManySpectra(s) : local.createManySpectra(s),
  getFittingResults: (spectrumId?: string) => useSupabase() ? supa.getFittingResults(spectrumId) : local.getFittingResults(spectrumId),
  getFittingResultsByDataset: (datasetId: string) => useSupabase() ? supa.getFittingResultsByDataset(datasetId) : local.getFittingResultsByDataset(datasetId),
  createFittingResult: (r: Omit<FittingResult, 'id' | 'created_at'>) => useSupabase() ? supa.createFittingResult(r) : local.createFittingResult(r),
  createManyFittingResults: (rs: Omit<FittingResult, 'id' | 'created_at'>[]) => useSupabase() ? supa.createManyFittingResults(rs) : local.createManyFittingResults(rs),
  deleteFittingResultsByDataset: (datasetId: string) => useSupabase() ? supa.deleteFittingResultsByDataset(datasetId) : local.deleteFittingResultsByDataset(datasetId),
  getPeakTracks: (datasetId?: string) => useSupabase() ? supa.getPeakTracks(datasetId) : local.getPeakTracks(datasetId),
  createPeakTrack: (t: Omit<PeakTrack, 'id' | 'created_at'>) => useSupabase() ? supa.createPeakTrack(t) : local.createPeakTrack(t),
  deletePeakTracksByDataset: (datasetId: string) => useSupabase() ? supa.deletePeakTracksByDataset(datasetId) : local.deletePeakTracksByDataset(datasetId),
  getExternalDataList: () => useSupabase() ? supa.getExternalDataList() : local.getExternalDataList(),
  getExternalDataItem: (id: string) => useSupabase() ? supa.getExternalDataItem(id) : local.getExternalDataItem(id),
  createExternalData: (d: Omit<ExternalData, 'id' | 'created_at'>) => useSupabase() ? supa.createExternalData(d) : local.createExternalData(d),
  deleteExternalData: (id: string) => useSupabase() ? supa.deleteExternalData(id) : local.deleteExternalData(id),
  getStats: () => useSupabase() ? supa.getStats() : local.getStats(),
  resetDB: () => local.resetDB(),
  isSupabase: () => useSupabase(),
};
