'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Atom, Upload, FlaskConical, TrendingUp, BarChart3, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-cyan-500/10 rounded-2xl">
            <Atom className="h-16 w-16 text-cyan-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-4">
          SpectraLab
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Magneto-Raman Spectroscopy Analysis Platform
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          자기-라만 분광 데이터 분석 플랫폼
        </p>

        <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          SpectraLab은 magneto-Raman spectroscopy 실험 데이터를 웹에서 분석할 수 있는 플랫폼입니다.
          다조건 스펙트럼 시각화, baseline correction, Voigt peak fitting, 조건별 peak tracking,
          그리고 외부 데이터(VSM 등)와의 비교 분석을 하나의 워크플로우로 제공합니다.
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed text-sm">
          SpectraLab is a web-based platform for analyzing magneto-Raman spectroscopy data.
          It provides multi-condition spectrum visualization, baseline correction, Voigt peak fitting,
          condition-dependent peak tracking, and dual-axis comparison with external measurement data (e.g., VSM)
          — all within a single integrated workflow.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/upload">
            <Button size="lg">
              <Upload className="mr-2 h-5 w-5" />시작하기 / Get Started
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline">
              대시보드 / Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">주요 기능 / Key Features</h2>
        <p className="text-center text-muted-foreground mb-12">
          논문 수준의 분석을 웹에서 재현합니다
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <Layers className="h-8 w-8 text-cyan-400 mb-4" />
            <h3 className="font-semibold mb-2">다조건 시각화</h3>
            <p className="text-sm text-muted-foreground mb-2">
              온도/자기장/편광별 스펙트럼을 오버레이 또는 워터폴로 시각화합니다.
              ROI 선택으로 관심 영역을 즉시 확대할 수 있습니다.
            </p>
            <p className="text-xs text-muted-foreground">
              Visualize spectra across temperature, field, and polarization conditions
              with overlay or waterfall plots and interactive ROI selection.
            </p>
          </Card>

          <Card className="p-6">
            <FlaskConical className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="font-semibold mb-2">피크 피팅</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Voigt/Lorentzian/Gaussian 모델로 다중 피크를 동시에 피팅합니다.
              배치 모드로 수십 개 스펙트럼을 초기값 전파 방식으로 일괄 처리합니다.
            </p>
            <p className="text-xs text-muted-foreground">
              Multi-peak fitting with Voigt/Lorentzian/Gaussian models.
              Batch fitting with initial value propagation across series.
            </p>
          </Card>

          <Card className="p-6">
            <TrendingUp className="h-8 w-8 text-green-400 mb-4" />
            <h3 className="font-semibold mb-2">피크 추적 & 비교</h3>
            <p className="text-sm text-muted-foreground mb-2">
              조건별 피크 위치 변화를 자동으로 추적합니다.
              VSM 자화 데이터와 dual-axis로 비교하여 물리적 상관관계를 확인합니다.
            </p>
            <p className="text-xs text-muted-foreground">
              Automatic peak position tracking across conditions.
              Dual-axis comparison with external VSM magnetization data.
            </p>
          </Card>
        </div>
      </div>

      {/* Target Use Case */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Card className="p-8 bg-cyan-500/5 border-cyan-500/20">
          <h2 className="text-xl font-bold mb-4">연구 사례 / Research Application</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            본 플랫폼은 YIG(Yttrium Iron Garnet) 박막의 THz magnon 연구를 위해 개발되었습니다.
            JALCOM 2026에 게재된 &ldquo;Direct observation of THz magnons in yttrium-iron garnet film
            via magneto-Raman spectroscopy&rdquo; 논문의 분석 파이프라인을 자동화합니다.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform was developed for THz magnon research in YIG thin films.
            It automates the analysis pipeline from the JALCOM 2026 paper:
            &ldquo;Direct observation of THz magnons in yttrium-iron garnet film
            via magneto-Raman spectroscopy.&rdquo;
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs">Magneto-Raman</span>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs">Voigt Fitting</span>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">Peak Tracking</span>
            <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs">THz Magnon</span>
            <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full text-xs">YIG Film</span>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>SpectraLab &copy; 2026 | 충북대학교 물리학과 & AI융합 연구실</p>
        <p className="text-xs mt-1">Chungbuk National University — Physics & AI Convergence Lab</p>
      </div>
    </div>
  );
}
