'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Spectrum } from '@/lib/types/spectrum';

const Plot = dynamic(() => import('./plotly-plot'), { ssr: false });

interface HeatmapPlotProps {
  spectra: Spectrum[];
  conditionKey: 'temperature' | 'field';
  roiMin?: number | null;
  roiMax?: number | null;
  colorscale?: string;
  height?: number;
}

export function HeatmapPlot({ spectra, conditionKey, roiMin, roiMax, colorscale = 'Viridis', height = 400 }: HeatmapPlotProps) {
  const { x, y, z } = useMemo(() => {
    const sorted = [...spectra]
      .filter(s => s.metadata[conditionKey] != null)
      .sort((a, b) => (a.metadata[conditionKey] as number) - (b.metadata[conditionKey] as number));
    if (sorted.length === 0) return { x: [] as number[], y: [] as number[], z: [] as number[][] };

    let xData = sorted[0].x_data;
    let si = 0, ei = xData.length;
    if (roiMin != null && roiMax != null) {
      si = xData.findIndex(x => x >= roiMin);
      ei = xData.findIndex(x => x > roiMax);
      if (si < 0) si = 0;
      if (ei < 0) ei = xData.length;
      xData = xData.slice(si, ei);
    }
    return {
      x: xData,
      y: sorted.map(s => s.metadata[conditionKey] as number),
      z: sorted.map(s => s.y_data.slice(si, ei)),
    };
  }, [spectra, conditionKey, roiMin, roiMax]);

  if (x.length === 0) return <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>히트맵 데이터 없음</div>;

  const unit = conditionKey === 'temperature' ? 'K' : spectra[0]?.metadata.field_unit || 'Oe';

  return (
    <div className="plotly-chart" style={{ height }}>
      <Plot
        data={[{
          x, y, z,
          type: 'heatmap' as const,
          colorscale,
          colorbar: { title: 'Intensity', titlefont: { color: '#aaa' }, tickfont: { color: '#aaa' } },
        }]}
        layout={{
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#ccc', size: 12 },
          margin: { l: 70, r: 20, t: 10, b: 50 },
          xaxis: { title: `Raman Shift (${spectra[0]?.x_unit || 'cm⁻¹'})` },
          yaxis: { title: `${conditionKey === 'temperature' ? 'Temperature' : 'Field'} (${unit})` },
          height,
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
