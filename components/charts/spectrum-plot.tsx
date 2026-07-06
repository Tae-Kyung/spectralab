'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Spectrum } from '@/lib/types/spectrum';
import { generateCoolwarmPalette, generateColorPalette } from '@/lib/constants';

const Plot = dynamic(() => import('./plotly-plot'), { ssr: false });

interface OverlayTrace {
  x: number[];
  y: number[];
  name: string;
  color?: string;
  dash?: string;
}

interface SpectrumPlotProps {
  spectra: Spectrum[];
  roiMin?: number | null;
  roiMax?: number | null;
  overlayTraces?: OverlayTrace[];
  colorMode?: 'coolwarm' | 'hue';
  height?: number;
  xLabel?: string;
  yLabel?: string;
  onRelayout?: (event: Record<string, unknown>) => void;
}

export function SpectrumPlot({
  spectra,
  roiMin,
  roiMax,
  overlayTraces = [],
  colorMode = 'coolwarm',
  height = 500,
  xLabel,
  yLabel,
  onRelayout,
}: SpectrumPlotProps) {
  const colors = useMemo(() => {
    return colorMode === 'coolwarm'
      ? generateCoolwarmPalette(spectra.length)
      : generateColorPalette(spectra.length);
  }, [spectra.length, colorMode]);

  const traces = useMemo(() => {
    const result: Plotly.Data[] = [];

    spectra.forEach((s, i) => {
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

      result.push({
        x: xData,
        y: yData,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: s.label,
        line: { color: colors[i], width: 1.5 },
        hovertemplate: `${s.label}<br>%{x:.1f} ${s.x_unit}<br>%{y:.0f}<extra></extra>`,
      });
    });

    overlayTraces.forEach(t => {
      result.push({
        x: t.x,
        y: t.y,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: t.name,
        line: { color: t.color || '#ff0', width: 2, dash: (t.dash || 'solid') as Plotly.Dash },
      });
    });

    return result;
  }, [spectra, roiMin, roiMax, colors, overlayTraces]);

  if (spectra.length === 0 && overlayTraces.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        스펙트럼을 선택하세요
      </div>
    );
  }

  return (
    <div className="plotly-chart" style={{ height }}>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#ccc', size: 12 },
          margin: { l: 60, r: 20, t: 10, b: 50 },
          xaxis: {
            title: xLabel || (spectra[0]?.x_unit ? `Raman Shift (${spectra[0].x_unit})` : 'X'),
            gridcolor: 'rgba(255,255,255,0.1)',
            zerolinecolor: 'rgba(255,255,255,0.2)',
          },
          yaxis: {
            title: yLabel || 'Intensity',
            gridcolor: 'rgba(255,255,255,0.1)',
            zerolinecolor: 'rgba(255,255,255,0.2)',
          },
          legend: { bgcolor: 'rgba(0,0,0,0)', font: { size: 10, color: '#aaa' } },
          dragmode: 'zoom' as const,
          hovermode: 'closest' as const,
          height,
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'] as Plotly.ModeBarDefaultButtons[],
          toImageButtonOptions: { format: 'svg' as const, filename: 'spectralab-plot' },
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
        onRelayout={onRelayout}
      />
    </div>
  );
}
