'use client';

import { create } from 'zustand';
import type { Spectrum, FittingResult, Peak } from '@/lib/types/spectrum';
import type { FitResult } from '@/lib/analysis/fitting';

interface WorkbenchState {
  // Dataset & spectra
  datasetId: string | null;
  spectra: Spectrum[];
  selectedSpectrumIds: Set<string>;

  // ROI
  roiMin: number | null;
  roiMax: number | null;

  // Baseline
  baselineMethod: string;
  baselineParams: Record<string, number>;
  baselineResults: Map<string, { baseline: number[]; corrected: number[] }>;

  // Fitting
  fittingModel: 'voigt' | 'lorentzian' | 'gaussian';
  fittingResults: Map<string, FitResult>;
  savedFittingResults: FittingResult[];

  // View
  viewMode: 'overlay' | 'waterfall';
  showBaseline: boolean;
  showFitting: boolean;

  // Actions
  setDatasetId: (id: string) => void;
  setSpectra: (spectra: Spectrum[]) => void;
  toggleSpectrum: (id: string) => void;
  selectAllSpectra: () => void;
  deselectAllSpectra: () => void;
  setROI: (min: number | null, max: number | null) => void;
  setBaselineMethod: (method: string) => void;
  setBaselineParam: (key: string, value: number) => void;
  setBaselineResult: (spectrumId: string, result: { baseline: number[]; corrected: number[] }) => void;
  clearBaselineResults: () => void;
  setFittingModel: (model: 'voigt' | 'lorentzian' | 'gaussian') => void;
  setFittingResult: (spectrumId: string, result: FitResult) => void;
  clearFittingResults: () => void;
  setSavedFittingResults: (results: FittingResult[]) => void;
  setViewMode: (mode: 'overlay' | 'waterfall') => void;
  setShowBaseline: (show: boolean) => void;
  setShowFitting: (show: boolean) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  datasetId: null,
  spectra: [],
  selectedSpectrumIds: new Set<string>(),
  roiMin: null,
  roiMax: null,
  baselineMethod: 'als',
  baselineParams: { lam: 1e6, p: 0.01, niter: 20, iterations: 40, degree: 3 },
  baselineResults: new Map(),
  fittingModel: 'voigt',
  fittingResults: new Map(),
  savedFittingResults: [],
  viewMode: 'overlay',
  showBaseline: false,
  showFitting: false,

  setDatasetId: (id) => set({ datasetId: id }),
  setSpectra: (spectra) => set({
    spectra,
    selectedSpectrumIds: new Set(spectra.map(s => s.id)),
  }),
  toggleSpectrum: (id) => set((state) => {
    const next = new Set(state.selectedSpectrumIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedSpectrumIds: next };
  }),
  selectAllSpectra: () => set((state) => ({
    selectedSpectrumIds: new Set(state.spectra.map(s => s.id)),
  })),
  deselectAllSpectra: () => set({ selectedSpectrumIds: new Set() }),
  setROI: (min, max) => set({ roiMin: min, roiMax: max }),
  setBaselineMethod: (method) => set({ baselineMethod: method }),
  setBaselineParam: (key, value) => set((state) => ({
    baselineParams: { ...state.baselineParams, [key]: value },
  })),
  setBaselineResult: (spectrumId, result) => set((state) => {
    const next = new Map(state.baselineResults);
    next.set(spectrumId, result);
    return { baselineResults: next };
  }),
  clearBaselineResults: () => set({ baselineResults: new Map() }),
  setFittingModel: (model) => set({ fittingModel: model }),
  setFittingResult: (spectrumId, result) => set((state) => {
    const next = new Map(state.fittingResults);
    next.set(spectrumId, result);
    return { fittingResults: next };
  }),
  clearFittingResults: () => set({ fittingResults: new Map() }),
  setSavedFittingResults: (results) => set({ savedFittingResults: results }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowBaseline: (show) => set({ showBaseline: show }),
  setShowFitting: (show) => set({ showFitting: show }),
}));
