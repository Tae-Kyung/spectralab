'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Upload, FlaskConical, Database, BarChart3 } from 'lucide-react';

interface Stats {
  totalDatasets: number;
  totalSpectra: number;
  totalFittings: number;
  byResearcher: Record<string, number>;
  spectraByDataset: Array<{ id: string; name: string; researcher: string; technique: string; material: string | null; count: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/data/stats')
      .then(r => r.json())
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SpectraLab</h1>
        <p className="text-muted-foreground">Magneto-Raman Spectroscopy Analysis Platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalDatasets || 0}</p>
              <p className="text-sm text-muted-foreground">데이터셋</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalSpectra || 0}</p>
              <p className="text-sm text-muted-foreground">스펙트럼</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalFittings || 0}</p>
              <p className="text-sm text-muted-foreground">피팅 결과</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/upload">
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" />데이터 업로드</Button>
        </Link>
        <Link href="/explorer">
          <Button variant="outline"><FlaskConical className="mr-2 h-4 w-4" />데이터 탐색</Button>
        </Link>
      </div>

      {/* Datasets List */}
      {stats && stats.spectraByDataset.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">데이터셋 목록</h2>
          <div className="space-y-2">
            {stats.spectraByDataset.map(d => (
              <Link key={d.id} href={`/workbench/${d.id}`} className="block">
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.researcher} / {d.material}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{d.technique}</Badge>
                    <Badge variant="outline">{d.count}개 스펙트럼</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {stats && stats.totalDatasets === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">아직 업로드된 데이터가 없습니다.</p>
          <Link href="/upload">
            <Button><Upload className="mr-2 h-4 w-4" />데이터 업로드하기</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
