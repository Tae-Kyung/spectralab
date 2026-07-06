'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Spectrum } from '@/lib/types/spectrum';
import { generateCoolwarmPalette } from '@/lib/constants';

const Plot = dynamic(() => import('./plotly-plot'), { ssr: false });

interface WaterfallPlotProps {
  spectra: Spectrum[];
  offset?: number;
  roiMin?: number | null;
  roiMax?: number | null;
  height?: number;
}

export function WaterfallPlot({ spectra, offset = 0, roiMin, roiMax, height = 500 }: WaterfallPlotProps) {
  const colors = useMemo(() => generateCoolwarmPalette(spectra.length), [spectra.length]);

  const traces = useMemo(() => {
    if (spectra.length === 0) return [] as Plotly.Data[];

    let effectiveOffset = offset;
    if (offset === 0 && spectra.length > 1) {
      const ranges = spectra.map(s => {
        let yData = s.y_data;
        if (roiMin != null && roiMax != null) {
          yData = s.x_data.reduce<number[]>((acc, x, i) => {
            if (x >= roiMin && x <= roiMax) acc.push(s.y_data[i]);
            return acc;
          }, []);
        }
        return Math.max(...yData) - Math.min(...yData);
      });
      effectiveOffset = Math.max(...ranges) * 0.5;
    }

    return spectra.map((s, i) => {
      let xData = s.x_data;
      let yData = s.y_data;
      if (roiMin != null && roiMax != null) {
        const indices: number[] = [];
        for (let idx = 0; idx < xData.length; idx++) {
          if (xData[idx] >= roiMin && xData[idx] <= roiMax) indices.push(idx);
        }
        xData = indices.map(idx => s.x_data[idx]);
        yData = indices.map(idx => s.y_data[idx]);
      }
      return {
        x: xData,
        y: yData.map(y => y + i * effectiveOffset),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: s.label,
        line: { color: colors[i], width: 1.5 },
      } as Plotly.Data;
    });
  }, [spectra, offset, roiMin, roiMax, colors]);

  if (spectra.length === 0) {
    return <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>스펙트럼을 선택하세요</div>;
  }

  return (
    <div className="plotly-chart" style={{ height }}>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#ccc', size: 12 },
          margin: { l: 60, r: 20, t: 10, b: 50 },
          xaxis: { title: `Raman Shift (${spectra[0]?.x_unit || 'cm⁻¹'})`, gridcolor: 'rgba(255,255,255,0.1)' },
          yaxis: { title: 'Intensity (offset)', gridcolor: 'rgba(255,255,255,0.1)' },
          legend: { bgcolor: 'rgba(0,0,0,0)', font: { size: 10, color: '#aaa' } },
          height,
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
