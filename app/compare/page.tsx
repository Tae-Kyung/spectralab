'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Dataset, Spectrum } from '@/lib/types/spectrum';
import { SpectrumPlot } from '@/components/charts/spectrum-plot';
import { HeatmapPlot } from '@/components/charts/heatmap-plot';

export default function ComparePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [spectraMap, setSpectraMap] = useState<Record<string, Spectrum[]>>({});
  const [conditionKey, setConditionKey] = useState<'temperature' | 'field'>('temperature');

  useEffect(() => {
    fetch('/api/data/datasets').then(r => r.json()).then(r => setDatasets(r.data || []));
  }, []);

  useEffect(() => {
    selectedIds.forEach(id => {
      if (!spectraMap[id]) {
        fetch(`/api/data/spectra?dataset_id=${id}`)
          .then(r => r.json())
          .then(r => setSpectraMap(prev => ({ ...prev, [id]: r.data || [] })));
      }
    });
  }, [selectedIds]);

  const allSpectra = selectedIds.flatMap(id => spectraMap[id] || []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">비교 뷰</h1>
        <p className="text-muted-foreground">여러 데이터셋의 스펙트럼을 비교합니다</p>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">데이터셋 선택</h3>
        <div className="space-y-2">
          {datasets.map(d => (
            <label key={d.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedIds.includes(d.id)}
                onCheckedChange={(checked) => {
                  setSelectedIds(prev =>
                    checked ? [...prev, d.id] : prev.filter(id => id !== d.id)
                  );
                }}
              />
              <span className="text-sm">{d.name}</span>
              <Badge variant="outline" className="text-xs">{d.researcher}</Badge>
            </label>
          ))}
        </div>
      </Card>

      {allSpectra.length > 0 && (
        <Tabs defaultValue="overlay">
          <TabsList>
            <TabsTrigger value="overlay">오버레이</TabsTrigger>
            <TabsTrigger value="heatmap">히트맵</TabsTrigger>
          </TabsList>

          <TabsContent value="overlay">
            <Card className="p-4">
              <SpectrumPlot spectra={allSpectra} colorMode="hue" height={500} />
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card className="p-4">
              <div className="mb-4">
                <Select value={conditionKey} onValueChange={(v) => setConditionKey(v as 'temperature' | 'field')}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">온도 (K)</SelectItem>
                    <SelectItem value="field">자기장 (Oe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <HeatmapPlot spectra={allSpectra} conditionKey={conditionKey} height={400} />
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
