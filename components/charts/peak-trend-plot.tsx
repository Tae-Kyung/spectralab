'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { ExternalData } from '@/lib/types/spectrum';

const Plot = dynamic(() => import('./plotly-plot'), { ssr: false });

interface TrendData {
  label: string;
  conditionValues: number[];
  peakPositions: number[];
  color?: string;
}

interface PeakTrendPlotProps {
  trends: TrendData[];
  conditionLabel: string;
  conditionUnit: string;
  positionUnit?: string;
  externalData?: ExternalData | null;
  height?: number;
}

export function PeakTrendPlot({ trends, conditionLabel, conditionUnit, positionUnit = 'cm⁻¹', externalData, height = 350 }: PeakTrendPlotProps) {
  const traces = useMemo(() => {
    const result: Plotly.Data[] = [];
    const colors = ['#00d2ff', '#ff6b6b', '#4ecb71', '#ffd93d', '#c084fc'];

    trends.forEach((t, i) => {
      result.push({
        x: t.conditionValues, y: t.peakPositions,
        type: 'scatter' as const, mode: 'lines+markers' as const,
        name: `Peak: ${t.label}`,
        line: { color: t.color || colors[i % colors.length], width: 2 },
        marker: { size: 6 },
      });
    });

    if (externalData) {
      result.push({
        x: externalData.x_data, y: externalData.y_data,
        type: 'scatter' as const, mode: 'lines+markers' as const,
        name: externalData.name,
        line: { color: '#ffa500', width: 2, dash: 'dash' },
        marker: { size: 4, symbol: 'diamond' },
        yaxis: 'y2',
      });
    }

    return result;
  }, [trends, externalData]);

  if (trends.length === 0) return <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>피크 추적 데이터 없음</div>;

  return (
    <div className="plotly-chart" style={{ height }}>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#ccc', size: 12 },
          margin: { l: 60, r: externalData ? 60 : 20, t: 10, b: 50 },
          xaxis: { title: `${conditionLabel} (${conditionUnit})`, gridcolor: 'rgba(255,255,255,0.1)' },
          yaxis: { title: `Peak Position (${positionUnit})`, gridcolor: 'rgba(255,255,255,0.1)' },
          ...(externalData && {
            yaxis2: {
              title: externalData.y_label || externalData.name,
              overlaying: 'y' as const, side: 'right' as const,
              titlefont: { color: '#ffa500' }, tickfont: { color: '#ffa500' },
            },
          }),
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
