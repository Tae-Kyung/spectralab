'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FlaskConical, Trash2, Loader2 } from 'lucide-react';
import type { Dataset } from '@/lib/types/spectrum';

export default function ExplorerPage() {
  const [datasets, setDatasets] = useState<(Dataset & { spectra_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dsRes, statsRes] = await Promise.all([
        fetch('/api/data/datasets'),
        fetch('/api/data/stats'),
      ]);
      const { data: ds } = await dsRes.json();
      const { data: stats } = await statsRes.json();

      const withCounts = (ds || []).map((d: Dataset) => ({
        ...d,
        spectra_count: stats?.spectraByDataset?.find((s: { id: string }) => s.id === d.id)?.count || 0,
      }));
      setDatasets(withCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 데이터셋을 삭제하시겠습니까?')) return;
    await fetch(`/api/data/datasets?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> 로딩 중...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">데이터 탐색</h1>
        <p className="text-muted-foreground">업로드된 데이터셋을 선택하여 분석을 시작하세요</p>
      </div>

      {datasets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">업로드된 데이터가 없습니다.</p>
          <Link href="/upload"><Button>데이터 업로드</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {datasets.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{d.name}</h3>
                    <Badge variant="secondary">{d.technique}</Badge>
                    {d.is_published && <Badge className="bg-green-500/20 text-green-400">Published</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {d.researcher} / {d.material} / {d.spectra_count}개 스펙트럼
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/workbench/${d.id}`}>
                    <Button size="sm"><FlaskConical className="mr-2 h-4 w-4" />분석</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
