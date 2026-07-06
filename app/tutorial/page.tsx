'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Target, Baseline, FlaskConical, TrendingUp,
  Layers, Calculator, ArrowRight, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: 1,
    title: '데이터 업로드',
    titleEn: 'Upload Multi-condition Raman Spectra',
    icon: Upload,
    color: 'text-cyan-400',
    description: `Fathiya의 YIG 박막 Raman 데이터(Excel)를 업로드합니다.
이 데이터는 다음 조건에서 측정되었습니다:
• LL 편광, 온도 의존성: 5K ~ 150K (16개 스펙트럼)
• RL 편광, 온도 의존성: 5K, 50K, 100K, 150K (4개, 대조군)
• LL 편광, 자기장 의존성: 0 ~ 300 Oe (15개 스펙트럼)

시스템이 자동으로 시트 구조를 인식하고, 열 헤더에서 온도(K), 자기장(Oe), 편광(LL/RL)을 추출합니다.`,
    descriptionEn: `Upload Fathiya's YIG thin film Raman data (Excel). The data contains spectra measured under:
• LL polarization, temperature dependence: 5K to 150K (16 spectra)
• RL polarization, temperature dependence: 5K, 50K, 100K, 150K (4 spectra, control)
• LL polarization, field dependence: 0 to 300 Oe (15 spectra)

The system automatically recognizes sheet structure and extracts temperature (K), field (Oe), and polarization (LL/RL) from column headers.`,
    paperRef: 'Fig. 1(c) — Full Raman spectrum',
    action: { label: '업로드 페이지로', href: '/upload' },
  },
  {
    number: 2,
    title: 'ROI (관심 영역) 추출',
    titleEn: 'Region of Interest Selection',
    icon: Target,
    color: 'text-green-400',
    description: `전체 스펙트럼(99~1245 cm⁻¹) 중 magnon peak가 존재하는 225~285 cm⁻¹ 구간을 선택합니다.

이 영역에는 3개의 주요 피크가 있습니다:
• 238 cm⁻¹: T₂g phonon (자기장/온도 무관, 고정)
• ~260 cm⁻¹: magnon (교환 공명, 조건에 따라 shift)
• 274 cm⁻¹: T₂g phonon (고정)

워크벤치의 "Magnon ROI" 버튼으로 즉시 설정 가능합니다.`,
    descriptionEn: `Select the 225-285 cm⁻¹ region from the full spectrum (99-1245 cm⁻¹) where the magnon peak exists.

Three major peaks in this region:
• 238 cm⁻¹: T₂g phonon (field/temperature independent, fixed)
• ~260 cm⁻¹: magnon (exchange resonance, shifts with conditions)
• 274 cm⁻¹: T₂g phonon (fixed)

Use the "Magnon ROI" button in the Workbench for instant setup.`,
    paperRef: 'Fig. 1(d) — Magnified 225-285 cm⁻¹ region',
  },
  {
    number: 3,
    title: 'Baseline Correction',
    titleEn: 'Baseline Correction',
    icon: Baseline,
    color: 'text-yellow-400',
    description: `배경 신호를 제거하여 피크를 깨끗하게 추출합니다.

제공되는 알고리즘:
• ALS (Asymmetric Least Squares): 가장 범용적. Lambda와 p 파라미터 조절.
• SNIP (Peak Clipping): Raman에 특화. Iteration 횟수 조절.
• Polynomial: 다항식 피팅. 차수 선택.

"배치 적용" 버튼으로 선택된 모든 스펙트럼에 동일 파라미터를 일괄 적용합니다.`,
    descriptionEn: `Remove background signal to cleanly extract peaks.

Available algorithms:
• ALS (Asymmetric Least Squares): Most versatile. Adjust Lambda and p.
• SNIP (Peak Clipping): Specialized for Raman. Adjust iteration count.
• Polynomial: Polynomial fitting. Choose degree.

Use "Batch Apply" to apply identical parameters to all selected spectra at once.`,
    paperRef: 'Preprocessing step (implicit in paper)',
  },
  {
    number: 4,
    title: 'Voigt Peak Fitting',
    titleEn: 'Voigt Peak Fitting → Magnon Peak Position',
    icon: FlaskConical,
    color: 'text-purple-400',
    description: `Voigt 함수(Lorentzian + Gaussian 혼합)로 피크를 피팅하여 정밀한 위치를 추출합니다.

논문에서 보고된 피팅 파라미터:
• 80K: Lorentzian 폭(wL) ≈ 2.5 cm⁻¹, Gaussian 폭(wG) ≈ 1.0 cm⁻¹
• 5K: wL ≈ 5.0 cm⁻¹, wG ≈ 3.0 cm⁻¹ (broadening 관찰)

"배치 피팅" 기능: 첫 스펙트럼의 피팅 결과를 다음 스펙트럼의 초기값으로 자동 전파합니다.
이를 통해 16개 온도 스펙트럼을 일괄 처리하면서 피크 위치 변화를 정확히 추적합니다.`,
    descriptionEn: `Fit peaks with Voigt function (Lorentzian + Gaussian mixture) to extract precise positions.

Fitting parameters reported in the paper:
• 80K: Lorentzian width (wL) ≈ 2.5 cm⁻¹, Gaussian width (wG) ≈ 1.0 cm⁻¹
• 5K: wL ≈ 5.0 cm⁻¹, wG ≈ 3.0 cm⁻¹ (broadening observed)

"Batch Fitting": Automatically propagates the first spectrum's fit result as initial values for the next.
This enables processing all 16 temperature spectra at once while tracking peak position changes.`,
    paperRef: 'Fig. 3(a), 7(a) — Voigt fitting at selected temperatures',
  },
  {
    number: 5,
    title: '조건별 Peak Tracking',
    titleEn: 'Peak Position vs Temperature/Field Trend',
    icon: TrendingUp,
    color: 'text-orange-400',
    description: `배치 피팅 결과에서 magnon peak 위치를 조건(온도/자기장)별로 자동 추적합니다.

관찰되는 트렌드:
• 온도 증가 → magnon peak "redshift" (낮은 에너지로 이동)
• 자기장 증가 → magnon peak "blueshift" (높은 에너지로 이동, 350 Oe 이상에서 포화)

단위 변환: 1 cm⁻¹ = 0.02998 THz = 0.12398 meV
• 260 cm⁻¹ = 7.8 THz = 32.2 meV`,
    descriptionEn: `Automatically track magnon peak position across conditions (temperature/field) from batch fitting results.

Observed trends:
• Temperature increase → magnon peak "redshift" (shifts to lower energy)
• Field increase → magnon peak "blueshift" (shifts to higher energy, saturates above 350 Oe)

Unit conversion: 1 cm⁻¹ = 0.02998 THz = 0.12398 meV
• 260 cm⁻¹ = 7.8 THz = 32.2 meV`,
    paperRef: 'Fig. 3(b), 7(b) — Peak position vs condition',
  },
  {
    number: 6,
    title: 'VSM 데이터 오버레이',
    titleEn: 'External Data (VSM) Dual-axis Overlay',
    icon: Layers,
    color: 'text-pink-400',
    description: `VSM(Vibrating Sample Magnetometer)으로 측정한 자화 데이터를 업로드하여
Raman shift와 dual-axis로 비교합니다.

논문의 핵심 발견:
• 자기장 의존성: magnon peak shift ∝ M(H) — 자화 곡선과 정확히 일치
• 온도 의존성: magnon peak shift ∝ M(T) — 온도별 자화와 정확히 일치

이는 optical magnon 주파수가 순자화(net magnetization)에 비례한다는
Kaplan-Kittel 교환 공명 이론을 실험적으로 증명합니다.

워크벤치의 "기타" 탭에서 Excel/CSV 파일로 외부 데이터를 업로드할 수 있습니다.`,
    descriptionEn: `Upload VSM (Vibrating Sample Magnetometer) magnetization data and compare with Raman shift on a dual-axis plot.

Key findings from the paper:
• Field dependence: magnon peak shift ∝ M(H) — exactly matches magnetization curve
• Temperature dependence: magnon peak shift ∝ M(T) — exactly matches temperature-dependent magnetization

This experimentally proves that the optical magnon frequency is proportional to the net magnetization, confirming the Kaplan-Kittel exchange resonance theory.

Upload external data (Excel/CSV) from the "Export" tab in the Workbench.`,
    paperRef: 'Fig. 3(b), 7(b) — Raman shift + VSM overlay',
  },
  {
    number: 7,
    title: '물리 파라미터 계산',
    titleEn: 'Physical Parameter Extraction (Jad)',
    icon: Calculator,
    color: 'text-red-400',
    description: `피팅된 magnon peak 위치에서 교환 상수(exchange parameter)를 계산합니다.

Holstein-Primakoff 변환에 의한 optical magnon 주파수:
  ω₊ = 10|Jad|

여기서:
• ω₊ = optical magnon frequency (피팅으로 추출)
• Jad = inter-sublattice exchange parameter (a-site ↔ d-site)
• YIG에서 Sa = Sd = 5/2 (Fe³⁺ 이온)

5K에서 magnon peak ≈ 261 cm⁻¹ = 7.8 THz인 경우:
  |Jad| = ω₊ / 10 ≈ 37.5 K

논문 결과: Jad ≈ -37.5 K (Raman)
참고 문헌: Jad ≈ -39.8 K (INS, Cherepanov 1993)`,
    descriptionEn: `Calculate exchange parameter from fitted magnon peak position.

Optical magnon frequency from Holstein-Primakoff transformation:
  ω₊ = 10|Jad|

Where:
• ω₊ = optical magnon frequency (extracted from fitting)
• Jad = inter-sublattice exchange parameter (a-site ↔ d-site)
• In YIG, Sa = Sd = 5/2 (Fe³⁺ ions)

For magnon peak ≈ 261 cm⁻¹ = 7.8 THz at 5K:
  |Jad| = ω₊ / 10 ≈ 37.5 K

Paper result: Jad ≈ -37.5 K (Raman)
Reference: Jad ≈ -39.8 K (INS, Cherepanov 1993)`,
    paperRef: 'Table II — Jad comparison across techniques',
  },
];

export default function TutorialPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">분석 튜토리얼</h1>
        <p className="text-muted-foreground">
          YIG 박막 THz magnon 연구(JALCOM 2026)의 데이터 분석 워크플로우를 단계별로 따라합니다.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Step-by-step guide to reproduce the YIG THz magnon analysis workflow from the JALCOM 2026 paper.
        </p>
      </div>

      {/* Paper Reference */}
      <Card className="p-4 bg-cyan-500/5 border-cyan-500/20">
        <h3 className="font-semibold text-sm mb-1">Reference Paper</h3>
        <p className="text-sm text-muted-foreground">
          F. Rahmani et al., &ldquo;Direct observation of THz magnons in yttrium-iron garnet film via magneto-Raman spectroscopy,&rdquo;
          <em> Journal of Alloys and Compounds</em> <strong>1064</strong>, 187784 (2026).
        </p>
      </Card>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center ${step.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Step {step.number}</Badge>
                    <h2 className="font-semibold">{step.title}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.titleEn}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {step.description}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {step.descriptionEn}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {step.paperRef}
                    </Badge>
                    {step.action && (
                      <Link href={step.action.href}>
                        <Button size="sm" variant="outline">
                          {step.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center mt-4">
                  <div className="w-px h-4 bg-border" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-purple-500/5 border-purple-500/20">
        <h3 className="font-semibold mb-3">요약 / Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2 text-muted-foreground">
            <p>이 워크플로우를 통해:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>THz 영역의 optical magnon을 Raman으로 관측</li>
              <li>magnon peak의 자기장/온도 의존성을 정량적으로 추적</li>
              <li>VSM 자화 데이터와의 비례 관계를 확인</li>
              <li>교환 상수 Jad ≈ -37.5 K를 추출</li>
            </ul>
          </div>
          <div className="space-y-2 text-muted-foreground">
            <p>Through this workflow:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Observe THz optical magnon via Raman spectroscopy</li>
              <li>Quantitatively track magnon peak field/temperature dependence</li>
              <li>Confirm proportionality with VSM magnetization data</li>
              <li>Extract exchange parameter Jad ≈ -37.5 K</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/upload">
          <Button size="lg">
            <Upload className="mr-2 h-5 w-5" />지금 시작하기 / Start Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
