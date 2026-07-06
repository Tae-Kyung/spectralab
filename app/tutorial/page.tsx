'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Target, Baseline, FlaskConical, TrendingUp,
  Layers, Calculator, ArrowRight, MousePointerClick,
  ChevronDown, Info
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ActionStep {
  action: string;
  detail?: string;
}

interface TutorialStep {
  number: number;
  title: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  why: string;
  whyEn: string;
  actions: ActionStep[];
  actionsEn: ActionStep[];
  tips?: string[];
  tipsEn?: string[];
  paperRef: string;
  navAction?: { label: string; href: string };
}

const steps: TutorialStep[] = [
  {
    number: 1,
    title: '데이터 업로드',
    titleEn: 'Upload Data',
    icon: Upload,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    why: 'Fathiya의 YIG 박막 Raman 데이터(Excel)를 시스템에 불러옵니다. 3개 시트에 총 35개 스펙트럼이 포함되어 있습니다.',
    whyEn: 'Load Fathiya\'s YIG thin film Raman data (Excel) into the system. It contains 35 spectra across 3 sheets.',
    actions: [
      { action: '사이드바에서 "데이터 업로드" 클릭', detail: '왼쪽 메뉴의 Upload 아이콘' },
      { action: '파일 선택 영역에 Excel 파일을 드래그 & 드롭', detail: '또는 클릭하여 파일 탐색기에서 "Raman Data (YIG Film).xlsx" 선택' },
      { action: '파싱 결과 확인', detail: '3개 시트 탭(LL Temp, RL Temp, LL Field)이 표시되고, 각 스펙트럼의 온도/자기장/편광 메타데이터가 자동 추출됩니다' },
      { action: '연구자/물질 정보 확인', detail: '"연구자" 필드에 Fathiya, "물질" 필드에 YIG가 자동 입력됩니다. 필요시 수정하세요' },
      { action: '"저장 후 분석 시작" 버튼 클릭', detail: '각 시트가 별도 데이터셋으로 저장되고, 마지막 시트의 워크벤치로 자동 이동합니다' },
    ],
    actionsEn: [
      { action: 'Click "데이터 업로드" in the sidebar', detail: 'Upload icon in the left menu' },
      { action: 'Drag & drop the Excel file onto the upload area', detail: 'Or click to browse and select "Raman Data (YIG Film).xlsx"' },
      { action: 'Review parsed results', detail: '3 sheet tabs appear (LL Temp, RL Temp, LL Field) with auto-extracted temperature/field/polarization metadata' },
      { action: 'Verify researcher/material info', detail: 'Researcher = Fathiya, Material = YIG are auto-filled. Edit if needed' },
      { action: 'Click "저장 후 분석 시작" button', detail: 'Each sheet is saved as a separate dataset, then navigates to the last sheet\'s workbench' },
    ],
    tips: [
      '지원 형식: .xlsx, .xls',
      '시트별로 별도 데이터셋이 생성되므로, 나중에 "데이터 탐색"에서 원하는 시트를 골라 분석할 수 있습니다',
    ],
    tipsEn: [
      'Supported formats: .xlsx, .xls',
      'Each sheet becomes a separate dataset — you can pick any sheet later from "데이터 탐색" (Explorer)',
    ],
    paperRef: 'Fig. 1(c) — Full Raman spectrum',
    navAction: { label: '업로드 페이지로', href: '/upload' },
  },
  {
    number: 2,
    title: '분석할 데이터셋 선택',
    titleEn: 'Select Dataset for Analysis',
    icon: Target,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    why: '업로드된 3개 데이터셋 중 분석할 것을 고릅니다. 온도 의존성 분석은 "LL Temp" 시트부터 시작하는 것을 추천합니다.',
    whyEn: 'Choose which of the 3 uploaded datasets to analyze. We recommend starting with "LL Temp" for temperature dependence analysis.',
    actions: [
      { action: '사이드바에서 "데이터 탐색" 클릭' },
      { action: '"LL Temp" 데이터셋의 "분석" 버튼 클릭', detail: '16개 스펙트럼이 포함된 온도 의존성 데이터입니다 (5K ~ 150K)' },
      { action: '워크벤치 화면으로 이동 확인', detail: '왼쪽에 차트, 오른쪽에 컨트롤 패널(선택/BL/피팅/기타 탭)이 표시됩니다' },
    ],
    actionsEn: [
      { action: 'Click "데이터 탐색" in the sidebar' },
      { action: 'Click the "분석" button on "LL Temp" dataset', detail: 'This contains 16 temperature-dependent spectra (5K to 150K)' },
      { action: 'Verify workbench screen loads', detail: 'Chart on the left, control panel (선택/BL/피팅/기타 tabs) on the right' },
    ],
    tips: [
      '추천 분석 순서: LL Temp (온도) → LL Field (자기장) → RL Temp (대조군)',
      '각 데이터셋은 독립적으로 분석됩니다',
    ],
    tipsEn: [
      'Recommended order: LL Temp (temperature) → LL Field (field) → RL Temp (control)',
      'Each dataset is analyzed independently',
    ],
    paperRef: 'Fig. 1(c)-(d) — Dataset selection',
    navAction: { label: '탐색 페이지로', href: '/explorer' },
  },
  {
    number: 3,
    title: 'ROI 설정 + 스펙트럼 선택',
    titleEn: 'Set ROI + Select Spectra',
    icon: Target,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    why: '전체 스펙트럼(99~1245 cm\u207B\u00B9) 중 magnon peak가 있는 225~285 cm\u207B\u00B9 영역만 잘라냅니다. 이 영역에 T\u2082g phonon 2개(238, 274 cm\u207B\u00B9)와 magnon (~260 cm\u207B\u00B9) 총 3개 피크가 있습니다.',
    whyEn: 'Crop the full spectrum (99-1245 cm\u207B\u00B9) to the 225-285 cm\u207B\u00B9 region containing the magnon peak. This region has 3 peaks: T\u2082g phonons (238, 274 cm\u207B\u00B9) and magnon (~260 cm\u207B\u00B9).',
    actions: [
      { action: '오른쪽 패널에서 "선택" 탭 확인', detail: '워크벤치 진입 시 기본으로 선택되어 있습니다' },
      { action: '"Magnon ROI" 버튼 클릭', detail: 'ROI가 자동으로 225 ~ 285 cm\u207B\u00B9로 설정되고, 차트가 해당 영역만 표시합니다' },
      { action: '스펙트럼 목록에서 분석 대상 확인', detail: '기본적으로 전체 선택(16/16)되어 있습니다. 특정 온도만 보려면 체크박스를 해제하세요' },
      { action: '(선택) "오버레이" vs "워터폴" 뷰 전환', detail: '상단의 뷰 버튼으로 겹쳐보기/분리보기를 전환합니다' },
    ],
    actionsEn: [
      { action: 'Confirm "선택" tab is active in the right panel', detail: 'This is the default tab when entering the workbench' },
      { action: 'Click "Magnon ROI" button', detail: 'ROI auto-sets to 225-285 cm\u207B\u00B9; chart zooms to this region' },
      { action: 'Review spectrum checklist', detail: 'All 16 spectra are selected by default. Uncheck to exclude specific temperatures' },
      { action: '(Optional) Toggle "오버레이" vs "워터폴" view', detail: 'Use the view buttons at the top to switch between overlay and waterfall display' },
    ],
    tips: [
      '"전체" 버튼을 클릭하면 ROI를 해제하고 전체 범위로 돌아갑니다',
      'ROI 수동 입력도 가능: Min/Max 필드에 직접 숫자 입력',
    ],
    tipsEn: [
      'Click "전체" button to clear ROI and show full range',
      'You can also manually type ROI values in the Min/Max fields',
    ],
    paperRef: 'Fig. 1(d) — Magnified 225-285 cm\u207B\u00B9 region',
  },
  {
    number: 4,
    title: 'Baseline Correction',
    titleEn: 'Baseline Correction',
    icon: Baseline,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    why: '배경 형광 신호를 제거하여 피크만 깨끗하게 남깁니다. 이 과정이 없으면 피팅이 부정확합니다.',
    whyEn: 'Remove background fluorescence to isolate clean peaks. Without this, peak fitting will be inaccurate.',
    actions: [
      { action: '오른쪽 패널에서 "BL" 탭 클릭' },
      { action: '알고리즘 선택: "ALS" 유지 (기본값)', detail: 'ALS가 가장 범용적입니다. SNIP이나 Polynomial도 시도해 볼 수 있습니다' },
      { action: '파라미터 조절', detail: 'Lambda = 10^6 (기본값), Asymmetry p = 0.010 (기본값). 보통 기본값으로 충분합니다' },
      { action: '"배치 적용 (16개)" 버튼 클릭', detail: '선택된 모든 스펙트럼에 동일 파라미터로 일괄 보정됩니다' },
      { action: '"16개 스펙트럼 보정 완료" 메시지 확인', detail: '차트에서 baseline이 제거된 스펙트럼을 확인합니다' },
    ],
    actionsEn: [
      { action: 'Click "BL" tab in the right panel' },
      { action: 'Keep algorithm as "ALS" (default)', detail: 'ALS is the most versatile. You can also try SNIP or Polynomial' },
      { action: 'Adjust parameters', detail: 'Lambda = 10^6 (default), Asymmetry p = 0.010 (default). Defaults usually work well' },
      { action: 'Click "배치 적용 (16개)" button', detail: 'Applies identical parameters to all selected spectra at once' },
      { action: 'Confirm "16개 스펙트럼 보정 완료" message', detail: 'Check that baselines are removed in the chart' },
    ],
    tips: [
      'baseline이 과하게 제거되면(피크가 잘림) Lambda를 높이세요 (10^7 이상)',
      'baseline이 덜 제거되면 Lambda를 낮추거나 p를 높이세요',
      '반드시 ROI 설정(Step 3) 후에 수행하세요 — ROI 범위 내에서만 보정됩니다',
    ],
    tipsEn: [
      'If baseline over-corrects (peaks clipped), increase Lambda (10^7 or higher)',
      'If under-corrected, decrease Lambda or increase p',
      'Always set ROI (Step 3) before baseline — correction only applies within ROI range',
    ],
    paperRef: 'Preprocessing step (implicit in paper)',
  },
  {
    number: 5,
    title: 'Voigt Peak Fitting (배치)',
    titleEn: 'Voigt Peak Fitting (Batch)',
    icon: FlaskConical,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    why: 'Voigt 함수로 3개 피크(T\u2082g 238, magnon ~260, T\u2082g 274)의 정확한 위치를 추출합니다. "초기값 전파" 방식으로 16개 스펙트럼을 자동 연속 피팅합니다.',
    whyEn: 'Extract precise positions of 3 peaks (T\u2082g 238, magnon ~260, T\u2082g 274) using Voigt functions. "Initial value propagation" auto-fits all 16 spectra sequentially.',
    actions: [
      { action: '오른쪽 패널에서 "피팅" 탭 클릭' },
      { action: '모델 선택: "Voigt" 유지 (기본값)', detail: '논문에서 사용한 모델입니다. Lorentzian/Gaussian도 선택 가능' },
      { action: 'Prominence 조절: 100 (기본값)', detail: '피크 검출 민감도입니다. 피크가 3개 미만으로 잡히면 값을 낮추세요 (예: 50)' },
      { action: '"배치 피팅 (16개, 초기값 전파)" 버튼 클릭', detail: '첫 번째 스펙트럼의 피팅 결과가 다음 스펙트럼의 초기값으로 자동 전파됩니다' },
      { action: '결과 확인', detail: '차트에 노란 점선(피팅 곡선)이 나타나고, 하단에 피팅 결과 테이블이 생성됩니다' },
      { action: '피팅 결과 테이블에서 magnon 피크 확인', detail: 'Center ~260 cm\u207B\u00B9 근처의 피크가 magnon입니다. 온도에 따라 위치가 변합니다' },
      { action: '(선택) "저장" 버튼 클릭', detail: '피팅 결과를 DB에 저장합니다' },
    ],
    actionsEn: [
      { action: 'Click "피팅" tab in the right panel' },
      { action: 'Keep model as "Voigt" (default)', detail: 'This is the model used in the paper. Lorentzian/Gaussian also available' },
      { action: 'Adjust Prominence: 100 (default)', detail: 'Peak detection sensitivity. Lower it (e.g., 50) if fewer than 3 peaks are found' },
      { action: 'Click "배치 피팅 (16개, 초기값 전파)" button', detail: 'First spectrum\'s fit result propagates as initial values for the next' },
      { action: 'Check results', detail: 'Yellow dashed lines (fit curves) appear on chart; fitting results table shows below' },
      { action: 'Identify magnon peak in the results table', detail: 'The peak near Center ~260 cm\u207B\u00B9 is the magnon. Its position shifts with temperature' },
      { action: '(Optional) Click "저장" button', detail: 'Saves fitting results to the database' },
    ],
    tips: [
      '피크가 3개 안 잡히면: Prominence를 50이나 30으로 낮추세요',
      'R\u00B2 값이 0.99 이상이면 좋은 피팅입니다',
      'Baseline Correction(Step 4)을 먼저 수행하면 피팅 품질이 크게 향상됩니다',
    ],
    tipsEn: [
      'If fewer than 3 peaks detected: lower Prominence to 50 or 30',
      'R\u00B2 above 0.99 indicates a good fit',
      'Performing Baseline Correction (Step 4) first greatly improves fitting quality',
    ],
    paperRef: 'Fig. 3(a), 7(a) — Voigt fitting at selected temperatures',
  },
  {
    number: 6,
    title: '피크 추적 (자동)',
    titleEn: 'Peak Tracking (Automatic)',
    icon: TrendingUp,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    why: '배치 피팅이 완료되면 magnon 피크 위치의 온도/자기장 의존성 트렌드가 자동 생성됩니다. 이것이 논문의 핵심 결과입니다.',
    whyEn: 'After batch fitting, the magnon peak position trend vs temperature/field is auto-generated. This is the paper\'s key result.',
    actions: [
      { action: '피팅 완료 후 차트 영역 아래쪽 확인', detail: '"피크 추적" 차트가 자동으로 나타납니다' },
      { action: '트렌드 그래프 확인', detail: 'X축: 온도(K), Y축: 피크 위치(cm\u207B\u00B9). Peak별로 색이 다릅니다' },
      { action: 'magnon peak (Peak 2, ~260 cm\u207B\u00B9) 트렌드 관찰', detail: '온도 증가 \u2192 magnon peak이 redshift(낮은 에너지로 이동)하는 것을 확인합니다' },
    ],
    actionsEn: [
      { action: 'After fitting, scroll down in the chart area', detail: '"피크 추적" chart appears automatically' },
      { action: 'Review the trend graph', detail: 'X-axis: Temperature (K), Y-axis: Peak position (cm\u207B\u00B9). Each peak has a different color' },
      { action: 'Observe magnon peak (Peak 2, ~260 cm\u207B\u00B9) trend', detail: 'Temperature increase \u2192 magnon peak redshifts (moves to lower energy)' },
    ],
    tips: [
      '이 차트는 별도의 버튼 없이 피팅 완료 시 자동으로 표시됩니다',
      'T\u2082g phonon 피크(238, 274)는 온도에 따라 거의 변하지 않고 magnon만 shift합니다',
      'LL Field 데이터셋에서는 자기장 증가 \u2192 blueshift(높은 에너지) 트렌드를 확인할 수 있습니다',
    ],
    tipsEn: [
      'This chart appears automatically after fitting — no extra button needed',
      'T\u2082g phonon peaks (238, 274) barely shift; only the magnon peak moves',
      'In LL Field dataset, field increase \u2192 blueshift (higher energy) trend is observed',
    ],
    paperRef: 'Fig. 3(b), 7(b) — Peak position vs condition',
  },
  {
    number: 7,
    title: 'VSM 데이터 오버레이 비교',
    titleEn: 'VSM Data Overlay Comparison',
    icon: Layers,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/30',
    why: 'VSM 자화 데이터를 업로드하여 Raman shift와 dual-axis로 비교합니다. magnon shift \u221D M(T) 비례 관계가 논문의 핵심 발견입니다.',
    whyEn: 'Upload VSM magnetization data for dual-axis comparison with Raman shift. The proportionality magnon shift \u221D M(T) is the paper\'s key finding.',
    actions: [
      { action: '오른쪽 패널에서 "기타" 탭 클릭' },
      { action: '"외부 데이터 업로드" 영역에서 VSM 파일 선택', detail: 'M(T) 또는 M(H) 데이터가 포함된 Excel/CSV 파일' },
      { action: '업로드 완료 후, 피크 추적 차트로 스크롤', detail: '피크 추적 차트 우상단에 "외부 데이터 오버레이" 드롭다운이 나타납니다' },
      { action: '드롭다운에서 업로드한 VSM 데이터 선택', detail: 'dual-axis 그래프에서 왼쪽 Y축: Raman shift, 오른쪽 Y축: 자화(emu/g)가 표시됩니다' },
      { action: '비례 관계 확인', detail: 'magnon peak shift와 자화 곡선이 동일한 트렌드를 보이는지 확인합니다' },
    ],
    actionsEn: [
      { action: 'Click "기타" tab in the right panel' },
      { action: 'Select VSM file in the "외부 데이터 업로드" area', detail: 'Excel/CSV file containing M(T) or M(H) data' },
      { action: 'After upload, scroll to the peak tracking chart', detail: '"외부 데이터 오버레이" dropdown appears at the top-right of the tracking chart' },
      { action: 'Select uploaded VSM data from the dropdown', detail: 'Dual-axis graph shows Left Y: Raman shift, Right Y: Magnetization (emu/g)' },
      { action: 'Verify proportionality', detail: 'Check if magnon peak shift and magnetization curve follow the same trend' },
    ],
    tips: [
      'VSM 파일 형식: 1열 = 조건(온도 or 자기장), 2열 = 자화값',
      '이 비교를 통해 optical magnon 주파수가 순자화에 비례한다는 Kaplan-Kittel 이론을 실험적으로 확인합니다',
    ],
    tipsEn: [
      'VSM file format: column 1 = condition (temperature or field), column 2 = magnetization',
      'This comparison experimentally confirms the Kaplan-Kittel theory: optical magnon frequency \u221D net magnetization',
    ],
    paperRef: 'Fig. 3(b), 7(b) — Raman shift + VSM overlay',
  },
  {
    number: 8,
    title: '결과 내보내기',
    titleEn: 'Export Results',
    icon: Calculator,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    why: '피팅 결과를 CSV로 다운로드하여 추가 분석(교환 상수 계산, 논문 Figure 작성 등)에 활용합니다.',
    whyEn: 'Download fitting results as CSV for further analysis (exchange parameter calculation, paper figure creation, etc.).',
    actions: [
      { action: '피팅 결과 테이블 우측의 "CSV" 버튼 클릭', detail: '또는 "기타" 탭 > "피팅 결과 CSV 다운로드" 버튼' },
      { action: 'CSV 파일 확인', detail: '각 스펙트럼별 피크의 Center, Height, FWHM, Area, R\u00B2가 포함됩니다' },
      { action: '(심화) 교환 상수 계산', detail: 'magnon peak 위치에서: |Jad| = \u03C9\u208A / 10. 5K에서 261 cm\u207B\u00B9 \u2192 |Jad| \u2248 37.5 K' },
    ],
    actionsEn: [
      { action: 'Click "CSV" button in the fitting results table', detail: 'Or use "기타" tab > "피팅 결과 CSV 다운로드" button' },
      { action: 'Check the CSV file', detail: 'Contains Center, Height, FWHM, Area, R\u00B2 for each spectrum\'s peaks' },
      { action: '(Advanced) Calculate exchange parameter', detail: 'From magnon peak position: |Jad| = \u03C9\u208A / 10. At 5K: 261 cm\u207B\u00B9 \u2192 |Jad| \u2248 37.5 K' },
    ],
    tips: [
      '논문 결과: Jad \u2248 -37.5 K (Raman), 참고문헌: Jad \u2248 -39.8 K (INS)',
      'LL Field 데이터셋에서도 동일 워크플로우(Step 3~8)를 반복하면 자기장 의존성을 분석할 수 있습니다',
    ],
    tipsEn: [
      'Paper result: Jad \u2248 -37.5 K (Raman), Reference: Jad \u2248 -39.8 K (INS)',
      'Repeat the same workflow (Steps 3-8) with LL Field dataset to analyze field dependence',
    ],
    paperRef: 'Table II — Jad comparison across techniques',
  },
];

export default function TutorialPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">분석 튜토리얼</h1>
        <p className="text-muted-foreground">
          YIG 박막 THz magnon 연구의 분석 워크플로우를 단계별로 따라합니다.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Step-by-step hands-on guide to reproduce the YIG THz magnon analysis from the JALCOM 2026 paper.
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

      {/* Quick Overview */}
      <Card className="p-4 bg-accent/50">
        <h3 className="font-semibold text-sm mb-2">전체 흐름 요약</h3>
        <div className="flex items-center gap-1 flex-wrap text-xs">
          {['업로드', '데이터셋 선택', 'ROI 설정', 'Baseline', '피팅', '피크 추적', 'VSM 비교', '내보내기'].map((label, i) => (
            <span key={i} className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">{i + 1}. {label}</Badge>
              {i < 7 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          사용할 데이터: <code className="bg-background px-1 rounded">Raman Data (YIG Film).xlsx</code> (dataset/ 폴더)
        </p>
        <p className="text-xs text-muted-foreground">
          분석 대상 시트: <strong>LL Temp</strong> (16개 스펙트럼, 5K~150K) 부터 시작
        </p>
      </Card>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className={`p-6 ${step.bgColor}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center ${step.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs font-bold">Step {step.number}</Badge>
                      <h2 className="font-semibold">{step.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.titleEn}</p>
                  </div>
                  {step.navAction && (
                    <Link href={step.navAction.href}>
                      <Button size="sm" variant="outline">
                        {step.navAction.label} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Why */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm">{step.why}</div>
                  <div className="text-xs text-muted-foreground">{step.whyEn}</div>
                </div>

                {/* Actions - Korean */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" /> 조작 순서
                    </h4>
                    <ol className="space-y-2">
                      {step.actions.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold ${step.color}`}>
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-medium">{a.action}</span>
                            {a.detail && (
                              <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                      <MousePointerClick className="h-3 w-3" /> Actions (EN)
                    </h4>
                    <ol className="space-y-2">
                      {step.actionsEn.map((a, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-medium">{a.action}</span>
                            {a.detail && (
                              <p className="text-[11px] mt-0.5">{a.detail}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Tips */}
                {step.tips && step.tips.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold flex items-center gap-1">
                        <Info className="h-3 w-3" /> 팁
                      </h4>
                      {step.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-muted-foreground pl-4">• {tip}</p>
                      ))}
                    </div>
                    {step.tipsEn && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                          <Info className="h-3 w-3" /> Tips
                        </h4>
                        {step.tipsEn.map((tip, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground pl-4">• {tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Paper Ref */}
                <div className="pt-1">
                  <Badge variant="secondary" className="text-xs">
                    {step.paperRef}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-purple-500/5 border-purple-500/20">
        <h3 className="font-semibold mb-3">요약 / Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2 text-muted-foreground">
            <p>이 워크플로우를 완료하면:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>THz 영역의 optical magnon을 Raman으로 관측</li>
              <li>magnon peak의 자기장/온도 의존성을 정량적으로 추적</li>
              <li>VSM 자화 데이터와의 비례 관계를 확인</li>
              <li>교환 상수 Jad ≈ -37.5 K를 추출</li>
            </ul>
            <p className="text-xs pt-2 border-t border-border/50">
              <strong>다음 단계:</strong> "LL Field" 데이터셋으로 자기장 의존성 분석을 반복하고,
              "RL Temp" 대조군과 비교하세요.
            </p>
          </div>
          <div className="space-y-2 text-muted-foreground">
            <p>After completing this workflow:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Observe THz optical magnon via Raman spectroscopy</li>
              <li>Quantitatively track magnon peak field/temperature dependence</li>
              <li>Confirm proportionality with VSM magnetization data</li>
              <li>Extract exchange parameter Jad ≈ -37.5 K</li>
            </ul>
            <p className="text-xs pt-2 border-t border-border/50">
              <strong>Next:</strong> Repeat with &ldquo;LL Field&rdquo; dataset for field dependence,
              then compare with &ldquo;RL Temp&rdquo; control group.
            </p>
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
