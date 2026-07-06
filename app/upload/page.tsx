'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, Check, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Compact format from parse API (xData at sheet level)
interface ParsedSpectrumCompact {
  label: string;
  yData: number[];
  yUnit: string;
  dataType: 'raw' | 'baseline_corrected';
  metadata: Record<string, unknown>;
}

interface ParsedSheetCompact {
  sheetName: string;
  xData: number[];
  xUnit: string;
  spectra: ParsedSpectrumCompact[];
}

interface ParseResultCompact {
  filename: string;
  sheets: ParsedSheetCompact[];
  suggestedDataset: {
    name?: string;
    researcher?: string;
    material?: string;
    technique?: string;
    is_published?: boolean;
  };
}

export default function UploadPage() {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<ParseResultCompact | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState('');
  const [researcher, setResearcher] = useState('');
  const [material, setMaterial] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setParseResult(null);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Parse failed: ${res.status}`);
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (json.data) {
        setParseResult(json.data);
        setResearcher(json.data.suggestedDataset.researcher || '');
        setMaterial(json.data.suggestedDataset.material || '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
  });

  const handleSave = async () => {
    if (!parseResult) return;
    setSaving(true);
    setError(null);
    let lastDatasetId = '';

    try {
      for (let si = 0; si < parseResult.sheets.length; si++) {
        const sheet = parseResult.sheets[si];
        setSaveProgress(`시트 ${si + 1}/${parseResult.sheets.length}: ${sheet.sheetName} 저장 중...`);

        // Create dataset per sheet
        const dsRes = await fetch('/api/data/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sheet.sheetName,
            researcher,
            material,
            technique: parseResult.suggestedDataset.technique || 'Raman',
            is_published: parseResult.suggestedDataset.is_published || false,
            description: null,
            file_storage_path: null,
            original_filename: parseResult.filename,
          }),
        });

        if (!dsRes.ok) {
          const err = await dsRes.json().catch(() => ({}));
          throw new Error(`Dataset 생성 실패: ${(err as { error?: string }).error || dsRes.status}`);
        }
        const { data: dataset } = await dsRes.json();
        lastDatasetId = dataset.id;

        // Send spectra one at a time to stay under body size limit
        for (let i = 0; i < sheet.spectra.length; i++) {
          const s = sheet.spectra[i];
          setSaveProgress(`시트 ${si + 1}/${parseResult.sheets.length}: 스펙트럼 ${i + 1}/${sheet.spectra.length}`);

          const specRes = await fetch('/api/data/spectra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              spectra: [{
                dataset_id: dataset.id,
                label: s.label,
                sheet_name: sheet.sheetName,
                x_unit: sheet.xUnit,
                y_unit: s.yUnit,
                x_data: sheet.xData,
                y_data: s.yData,
                data_type: s.dataType,
                metadata: s.metadata,
              }],
            }),
          });

          if (!specRes.ok) {
            const err = await specRes.json().catch(() => ({}));
            throw new Error(`스펙트럼 저장 실패 (${s.label}): ${(err as { error?: string }).error || specRes.status}`);
          }
        }
      }

      setSaveProgress('완료! 워크벤치로 이동합니다...');
      router.push(`/workbench/${lastDatasetId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
      setSaveProgress('');
    }
  };

  const totalSpectra = parseResult?.sheets.reduce((sum, s) => sum + s.spectra.length, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">데이터 업로드</h1>
        <p className="text-muted-foreground">Excel 파일을 업로드하면 자동으로 스펙트럼을 파싱합니다</p>
      </div>

      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}

      <Card
        {...getRootProps()}
        className={`p-12 border-2 border-dashed text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-border hover:border-cyan-400/50'
        }`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
            <p className="text-muted-foreground">파싱 중...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isDragActive ? '파일을 드롭하세요' : 'Excel 파일을 드래그하거나 클릭하여 선택'}
            </p>
            <p className="text-xs text-muted-foreground">.xlsx, .xls 지원</p>
          </div>
        )}
      </Card>

      {parseResult && (
        <>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold">{parseResult.filename}</h2>
              <Badge variant="secondary">{parseResult.sheets.length}개 시트</Badge>
              <Badge variant="outline">{totalSpectra}개 스펙트럼</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">연구자</label>
                <Input value={researcher} onChange={e => setResearcher(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">물질</label>
                <Input value={material} onChange={e => setMaterial(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">각 시트가 별도 데이터셋으로 저장됩니다.</p>
          </Card>

          <Tabs defaultValue={parseResult.sheets[0]?.sheetName}>
            <TabsList>
              {parseResult.sheets.map(sheet => (
                <TabsTrigger key={sheet.sheetName} value={sheet.sheetName}>
                  {sheet.sheetName} ({sheet.spectra.length})
                </TabsTrigger>
              ))}
            </TabsList>
            {parseResult.sheets.map(sheet => (
              <TabsContent key={sheet.sheetName} value={sheet.sheetName}>
                <Card className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2">라벨</th>
                        <th className="text-left p-2">X 범위</th>
                        <th className="text-left p-2">포인트</th>
                        <th className="text-left p-2">메타데이터</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.spectra.map((s, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-2 font-mono text-xs">{s.label}</td>
                          <td className="p-2 text-xs">{sheet.xData[0]?.toFixed(0)} ~ {sheet.xData[sheet.xData.length - 1]?.toFixed(0)} {sheet.xUnit}</td>
                          <td className="p-2 text-xs">{sheet.xData.length}</td>
                          <td className="p-2">
                            <div className="flex gap-1 flex-wrap">
                              {s.metadata.temperature != null && <Badge variant="outline" className="text-xs">{String(s.metadata.temperature)}K</Badge>}
                              {s.metadata.field != null && <Badge variant="outline" className="text-xs">{String(s.metadata.field)} {String(s.metadata.field_unit || '')}</Badge>}
                              {s.metadata.polarization != null && <Badge variant="outline" className="text-xs">{String(s.metadata.polarization)}</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex items-center justify-between">
            {saveProgress && <span className="text-sm text-cyan-400">{saveProgress}</span>}
            <div className="ml-auto">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                저장 후 분석 시작 ({totalSpectra}개 스펙트럼)
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
