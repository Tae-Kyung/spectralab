'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Play, Download, Layers, BarChart3, TrendingUp } from 'lucide-react';
import type { Dataset, Spectrum, FittingResult, ExternalData, Peak } from '@/lib/types/spectrum';
import { SpectrumPlot } from '@/components/charts/spectrum-plot';
import { WaterfallPlot } from '@/components/charts/waterfall-plot';
import { PeakTrendPlot } from '@/components/charts/peak-trend-plot';
import { BASELINE_METHODS, FITTING_MODELS } from '@/lib/constants';
import { alsBaseline, snipBaseline, polyBaseline } from '@/lib/analysis/baseline';
import { findPeaks, fitPeaks, type FitResult, type DetectedPeak } from '@/lib/analysis/fitting';

export default function WorkbenchPage() {
  const params = useParams();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [spectra, setSpectra] = useState<Spectrum[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // ROI
  const [roiMin, setRoiMin] = useState<number | null>(null);
  const [roiMax, setRoiMax] = useState<number | null>(null);

  // View
  const [viewMode, setViewMode] = useState<'overlay' | 'waterfall'>('overlay');

  // Baseline
  const [blMethod, setBlMethod] = useState('als');
  const [blLam, setBlLam] = useState(6); // log10 scale
  const [blP, setBlP] = useState(0.01);
  const [blIter, setBlIter] = useState(40);
  const [blDegree, setBlDegree] = useState(3);
  const [blResults, setBlResults] = useState<Map<string, { baseline: number[]; corrected: number[] }>>(new Map());

  // Fitting
  const [fitModel, setFitModel] = useState<'voigt' | 'lorentzian' | 'gaussian'>('voigt');
  const [fitProminence, setFitProminence] = useState(100);
  const [fitResults, setFitResults] = useState<Map<string, FitResult>>(new Map());
  const [fittingInProgress, setFittingInProgress] = useState(false);
  const [savedResults, setSavedResults] = useState<FittingResult[]>([]);

  // Tracking
  const [externalDataList, setExternalDataList] = useState<ExternalData[]>([]);
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dsRes, spRes, fitRes, extRes] = await Promise.all([
          fetch(`/api/data/datasets`),
          fetch(`/api/data/spectra?dataset_id=${datasetId}`),
          fetch(`/api/data/fitting?dataset_id=${datasetId}`),
          fetch(`/api/data/external`),
        ]);
        const { data: datasets } = await dsRes.json();
        const { data: sp } = await spRes.json();
        const { data: fits } = await fitRes.json();
        const { data: ext } = await extRes.json();

        const ds = (datasets || []).find((d: Dataset) => d.id === datasetId);
        setDataset(ds || null);
        setSpectra(sp || []);
        setSelectedIds(new Set((sp || []).map((s: Spectrum) => s.id)));
        setSavedResults(fits || []);
        setExternalDataList(ext || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [datasetId]);

  // Selected spectra
  const selectedSpectra = useMemo(
    () => spectra.filter(s => selectedIds.has(s.id)),
    [spectra, selectedIds]
  );

  // Detect condition type
  const conditionType = useMemo(() => {
    if (spectra.some(s => s.metadata.temperature != null)) return 'temperature';
    if (spectra.some(s => s.metadata.field != null)) return 'field';
    return null;
  }, [spectra]);

  // Helper: get data within ROI for a spectrum
  const getROIData = useCallback((s: Spectrum) => {
    if (roiMin == null || roiMax == null) return { x: s.x_data, y: s.y_data };
    const indices: number[] = [];
    for (let i = 0; i < s.x_data.length; i++) {
      if (s.x_data[i] >= roiMin && s.x_data[i] <= roiMax) indices.push(i);
    }
    return {
      x: indices.map(i => s.x_data[i]),
      y: indices.map(i => s.y_data[i]),
    };
  }, [roiMin, roiMax]);

  // Baseline correction
  const handleBaseline = () => {
    const results = new Map<string, { baseline: number[]; corrected: number[] }>();
    for (const s of selectedSpectra) {
      const { x, y } = getROIData(s);
      let baseline: number[];
      if (blMethod === 'als') {
        baseline = alsBaseline(y, Math.pow(10, blLam), blP, 20);
      } else if (blMethod === 'snip') {
        baseline = snipBaseline(y, blIter);
      } else {
        baseline = polyBaseline(x, y, blDegree);
      }
      const corrected = y.map((v, i) => v - baseline[i]);
      results.set(s.id, { baseline, corrected });
    }
    setBlResults(results);
  };

  // Peak fitting
  const handleFitting = () => {
    setFittingInProgress(true);
    setTimeout(() => {
      const results = new Map<string, FitResult>();
      let prevPeaks: DetectedPeak[] | null = null;

      for (const s of selectedSpectra) {
        const { x, y } = getROIData(s);
        const blr = blResults.get(s.id);
        const dataY = blr ? blr.corrected : y;

        let initialPeaks: DetectedPeak[];
        if (prevPeaks && prevPeaks.length > 0) {
          // Propagate from previous result
          initialPeaks = prevPeaks;
        } else {
          initialPeaks = findPeaks(x, dataY, fitProminence);
        }

        if (initialPeaks.length === 0) continue;

        const result = fitPeaks(x, dataY, initialPeaks, fitModel);
        results.set(s.id, result);

        // Propagate: use fitted peaks as next initial (including wL/wG for Voigt)
        prevPeaks = result.peaks.map((p, i) => ({
          index: initialPeaks[i]?.index || 0,
          center: p.center,
          height: p.height,
          fwhm: p.fwhm,
          area: p.area,
          wL: p.wL,
          wG: p.wG,
        }));
      }
      setFitResults(results);
      setFittingInProgress(false);
    }, 50);
  };

  // Save fitting results
  const handleSaveFitting = async () => {
    const results = Array.from(fitResults.entries()).map(([spectrumId, result]) => ({
      spectrum_id: spectrumId,
      roi_min: roiMin,
      roi_max: roiMax,
      model: fitModel,
      peaks: result.peaks.map(p => ({
        center: p.center,
        height: p.height,
        fwhm: p.fwhm,
        area: p.area,
        centerErr: p.centerErr,
      })) as Peak[],
      fitted_curve_x: null as number[] | null,
      fitted_curve_y: null as number[] | null,
      residual_rms: result.chi2,
      r_squared: result.rSquared,
    }));

    const res = await fetch('/api/data/fitting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    });
    const { data } = await res.json();
    setSavedResults(prev => [...prev, ...(data || [])]);
  };

  // Peak tracking data
  const trackingData = useMemo(() => {
    if (!conditionType || fitResults.size === 0) return [];

    // Group peaks by index
    const nPeaks = Math.max(...Array.from(fitResults.values()).map(r => r.peaks.length), 0);
    const tracks: Array<{ label: string; conditionValues: number[]; peakPositions: number[] }> = [];

    for (let pi = 0; pi < nPeaks; pi++) {
      const conditions: number[] = [];
      const positions: number[] = [];

      for (const s of selectedSpectra) {
        const fr = fitResults.get(s.id);
        if (!fr || !fr.peaks[pi]) continue;
        const condVal = s.metadata[conditionType] as number | undefined;
        if (condVal == null) continue;
        conditions.push(condVal);
        positions.push(fr.peaks[pi].center);
      }

      if (conditions.length > 1) {
        // Sort by condition value
        const sorted = conditions.map((c, i) => ({ c, p: positions[i] })).sort((a, b) => a.c - b.c);
        tracks.push({
          label: `Peak ${pi + 1} (~${positions[0]?.toFixed(0)} cm⁻¹)`,
          conditionValues: sorted.map(s => s.c),
          peakPositions: sorted.map(s => s.p),
        });
      }
    }

    return tracks;
  }, [fitResults, selectedSpectra, conditionType]);

  // Build overlay traces for fitting curves
  const fittingOverlayTraces = useMemo(() => {
    if (fitResults.size === 0) return [];
    const traces: Array<{ x: number[]; y: number[]; name: string; color: string; dash: string }> = [];

    selectedSpectra.forEach(s => {
      const fr = fitResults.get(s.id);
      if (!fr) return;
      const { x } = getROIData(s);
      const blr = blResults.get(s.id);

      // Add fitted curve with offset for baseline
      const baseOffset = blr ? blr.baseline : new Array(x.length).fill(0);
      traces.push({
        x,
        y: fr.fittedCurve.map((v, i) => v + (blr ? 0 : 0)),
        name: `Fit: ${s.label}`,
        color: '#ff0',
        dash: 'dash',
      });
    });

    return traces;
  }, [fitResults, selectedSpectra, getROIData, blResults]);

  const selectedExternal = externalDataList.find(e => e.id === selectedExternalId) || null;

  // Export CSV
  const handleExportCSV = () => {
    if (fitResults.size === 0) return;
    const isVoigtExport = fitModel === 'voigt';
    const header = isVoigtExport
      ? 'Spectrum,Peak,Center(cm-1),Height,wL(cm-1),wG(cm-1),FWHM_Voigt,Area,R2'
      : 'Spectrum,Peak,Center(cm-1),Height,FWHM,Area,R2';
    const lines = [header];
    for (const s of selectedSpectra) {
      const fr = fitResults.get(s.id);
      if (!fr) continue;
      fr.peaks.forEach((p, i) => {
        if (isVoigtExport) {
          lines.push(`"${s.label}",${i + 1},${p.center.toFixed(2)},${p.height.toFixed(1)},${p.wL?.toFixed(2) ?? ''},${p.wG?.toFixed(2) ?? ''},${p.fwhm.toFixed(2)},${p.area.toFixed(1)},${fr.rSquared.toFixed(4)}`);
        } else {
          lines.push(`"${s.label}",${i + 1},${p.center.toFixed(2)},${p.height.toFixed(1)},${p.fwhm.toFixed(2)},${p.area.toFixed(1)},${fr.rSquared.toFixed(4)}`);
        }
      });
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitting_results_${dataset?.name || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 로딩 중...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Chart Area */}
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{dataset?.name || '분석 워크벤치'}</h1>
            <p className="text-sm text-muted-foreground">{dataset?.researcher} / {dataset?.material} / {selectedIds.size}개 선택</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'overlay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overlay')}
            >
              <Layers className="mr-1 h-3 w-3" />오버레이
            </Button>
            <Button
              variant={viewMode === 'waterfall' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('waterfall')}
            >
              <BarChart3 className="mr-1 h-3 w-3" />워터폴
            </Button>
          </div>
        </div>

        {/* Main Chart */}
        {viewMode === 'overlay' ? (
          <SpectrumPlot
            spectra={selectedSpectra}
            roiMin={roiMin}
            roiMax={roiMax}
            overlayTraces={fittingOverlayTraces}
            height={400}
          />
        ) : (
          <WaterfallPlot spectra={selectedSpectra} roiMin={roiMin} roiMax={roiMax} height={400} />
        )}

        {/* Peak Tracking Chart */}
        {trackingData.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> 피크 추적
              </h3>
              {externalDataList.length > 0 && (
                <Select value={selectedExternalId || 'none'} onValueChange={v => setSelectedExternalId(v === 'none' ? null : v)}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="외부 데이터 오버레이" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {externalDataList.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <PeakTrendPlot
              trends={trackingData}
              conditionLabel={conditionType === 'temperature' ? 'Temperature' : 'Field'}
              conditionUnit={conditionType === 'temperature' ? 'K' : 'Oe'}
              externalData={selectedExternal}
              height={300}
            />
          </Card>
        )}

        {/* Fitting Results Table */}
        {fitResults.size > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">피팅 결과</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-1 h-3 w-3" />CSV
                </Button>
                <Button size="sm" onClick={handleSaveFitting}>저장</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2">스펙트럼</th>
                    <th className="text-left p-2">피크</th>
                    <th className="text-right p-2">Center (cm⁻¹)</th>
                    <th className="text-right p-2">Height</th>
                    {fitModel === 'voigt' ? (
                      <>
                        <th className="text-right p-2">wL (cm⁻¹)</th>
                        <th className="text-right p-2">wG (cm⁻¹)</th>
                      </>
                    ) : (
                      <th className="text-right p-2">FWHM</th>
                    )}
                    <th className="text-right p-2">FWHM(V)</th>
                    <th className="text-right p-2">Area</th>
                    <th className="text-right p-2">R²</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSpectra.map(s => {
                    const fr = fitResults.get(s.id);
                    if (!fr) return null;
                    return fr.peaks.map((p, pi) => (
                      <tr key={`${s.id}-${pi}`} className="border-b border-border/50">
                        {pi === 0 && <td className="p-2 font-mono" rowSpan={fr.peaks.length}>{s.label}</td>}
                        <td className="p-2">{pi + 1}</td>
                        <td className="p-2 text-right font-mono">{p.center.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{p.height.toFixed(0)}</td>
                        {fitModel === 'voigt' ? (
                          <>
                            <td className="p-2 text-right font-mono">{p.wL?.toFixed(2) ?? '-'}</td>
                            <td className="p-2 text-right font-mono">{p.wG?.toFixed(2) ?? '-'}</td>
                          </>
                        ) : (
                          <td className="p-2 text-right font-mono">{p.fwhm.toFixed(2)}</td>
                        )}
                        <td className="p-2 text-right font-mono">{p.fwhm.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{p.area.toFixed(0)}</td>
                        {pi === 0 && <td className="p-2 text-right font-mono" rowSpan={fr.peaks.length}>{fr.rSquared.toFixed(4)}</td>}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-80 border-l border-border p-4 overflow-auto bg-card">
        <Tabs defaultValue="spectra">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="spectra" className="text-xs">선택</TabsTrigger>
            <TabsTrigger value="baseline" className="text-xs">BL</TabsTrigger>
            <TabsTrigger value="fitting" className="text-xs">피팅</TabsTrigger>
            <TabsTrigger value="export" className="text-xs">기타</TabsTrigger>
          </TabsList>

          {/* Spectrum Selection Tab */}
          <TabsContent value="spectra" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">ROI (관심 영역)</h3>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={roiMin ?? ''}
                  onChange={e => setRoiMin(e.target.value ? Number(e.target.value) : null)}
                  className="w-24 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">~</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={roiMax ?? ''}
                  onChange={e => setRoiMax(e.target.value ? Number(e.target.value) : null)}
                  className="w-24 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">cm⁻¹</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setRoiMin(225); setRoiMax(285); }}>
                  Magnon ROI
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setRoiMin(null); setRoiMax(null); }}>
                  전체
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">스펙트럼 ({selectedIds.size}/{spectra.length})</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setSelectedIds(new Set(spectra.map(s => s.id)))}>전체</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setSelectedIds(new Set())}>없음</Button>
                </div>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {spectra.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-accent p-1 rounded">
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          return next;
                        });
                      }}
                    />
                    <span className="truncate">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Baseline Tab */}
          <TabsContent value="baseline" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Baseline Correction</h3>
              <Select value={blMethod} onValueChange={(v) => { if (v) setBlMethod(v); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASELINE_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {blMethod === 'als' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">Lambda (10^{blLam.toFixed(0)})</label>
                  <Slider value={[blLam]} onValueChange={(v) => setBlLam(Array.isArray(v) ? v[0] : v)} min={3} max={9} step={0.5} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Asymmetry p ({blP.toFixed(3)})</label>
                  <Slider value={[blP]} onValueChange={(v) => setBlP(Array.isArray(v) ? v[0] : v)} min={0.001} max={0.1} step={0.001} />
                </div>
              </>
            )}
            {blMethod === 'snip' && (
              <div>
                <label className="text-xs text-muted-foreground">Iterations ({blIter})</label>
                <Slider value={[blIter]} onValueChange={(v) => setBlIter(Array.isArray(v) ? v[0] : v)} min={10} max={100} step={5} />
              </div>
            )}
            {blMethod === 'poly' && (
              <div>
                <label className="text-xs text-muted-foreground">Degree ({blDegree})</label>
                <Slider value={[blDegree]} onValueChange={(v) => setBlDegree(Array.isArray(v) ? v[0] : v)} min={1} max={10} step={1} />
              </div>
            )}

            <Button onClick={handleBaseline} className="w-full" size="sm">
              <Play className="mr-1 h-3 w-3" />배치 적용 ({selectedIds.size}개)
            </Button>

            {blResults.size > 0 && (
              <p className="text-xs text-green-400">{blResults.size}개 스펙트럼 보정 완료</p>
            )}
          </TabsContent>

          {/* Fitting Tab */}
          <TabsContent value="fitting" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Peak Fitting</h3>
              <Select value={fitModel} onValueChange={(v) => { if (v) setFitModel(v as typeof fitModel); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FITTING_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Prominence ({fitProminence})</label>
              <Slider value={[fitProminence]} onValueChange={(v) => setFitProminence(Array.isArray(v) ? v[0] : v)} min={10} max={500} step={10} />
            </div>

            <Button onClick={handleFitting} className="w-full" size="sm" disabled={fittingInProgress}>
              {fittingInProgress ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
              배치 피팅 ({selectedIds.size}개, 초기값 전파)
            </Button>

            {fitResults.size > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-green-400">{fitResults.size}개 피팅 완료</p>
                {/* Summary of first result */}
                {(() => {
                  const first = fitResults.values().next().value as FitResult | undefined;
                  if (!first) return null;
                  return (
                    <div className="text-xs text-muted-foreground">
                      피크 {first.peaks.length}개 탐지, R²={first.rSquared.toFixed(4)}
                    </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">외부 데이터 업로드</h3>
              <p className="text-xs text-muted-foreground mb-2">VSM M(T), M(H) 등을 업로드하여 dual-axis 비교</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="text-xs"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('name', file.name.replace(/\.\w+$/, ''));
                  const res = await fetch('/api/data/external', { method: 'POST', body: formData });
                  const { data } = await res.json();
                  if (data) {
                    setExternalDataList(prev => [...prev, data]);
                    setSelectedExternalId(data.id);
                  }
                }}
              />
            </div>

            {externalDataList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">외부 데이터 목록</h3>
                {externalDataList.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs p-1">
                    <span>{e.name}</span>
                    <Badge variant="outline">{e.x_data.length}pts</Badge>
                  </div>
                ))}
              </div>
            )}

            <hr className="border-border" />

            <div>
              <h3 className="text-sm font-semibold mb-2">내보내기</h3>
              <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={fitResults.size === 0} className="w-full">
                <Download className="mr-1 h-3 w-3" />피팅 결과 CSV 다운로드
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
