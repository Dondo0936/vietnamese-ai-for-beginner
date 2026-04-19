"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Activity,
  Stethoscope,
  HeartPulse,
  Pill,
  RotateCcw,
  Hourglass,
  AlertCircle,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  StepReveal,
  LessonSection,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";

/* ════════════════════════════════════════════════════════════════════
 * METADATA
 * ════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "knn-in-symptom-checker",
  title: "KNN in Symptom Checkers",
  titleVi: "k-NN trong kiểm tra triệu chứng",
  description:
    "App chatbot hỏi bạn vài triệu chứng → so với hàng ngàn ca bệnh cũ → gợi ý bệnh gần nhất. Cốt lõi chính là k-NN.",
  category: "classic-ml",
  tags: ["classification", "healthcare", "knn", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["knn"],
  vizType: "interactive",
  applicationOf: "knn",
  featuredApp: {
    name: "Buoy Health",
    productFeature: "AI Symptom Checker",
    company: "Buoy Health, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "KNN-Based Disease Detection from Clinical Data with Distance Metrics",
      publisher: "Nature Scientific Reports",
      url: "https://www.nature.com/articles/s41598-023-40459-8",
      date: "2023-08",
      kind: "paper",
    },
    {
      title: "Optimized KNN Classification for Stroke Prediction Using Medical Records",
      publisher: "Frontiers in Artificial Intelligence",
      url: "https://www.frontiersin.org/articles/10.3389/frai.2023.1229190",
      date: "2023-09",
      kind: "paper",
    },
    {
      title: "An Epidemiological Analysis of Buoy Health's AI Symptom Checker",
      publisher: "Buoy Health",
      url: "https://www.buoyhealth.com/research",
      date: "2022-06",
      kind: "documentation",
    },
    {
      title: "Machine Learning Approaches for Disease Prediction from Symptoms: A Review",
      publisher: "PMC — International Journal of Environmental Research and Public Health",
      url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9518091/",
      date: "2022-09",
      kind: "paper",
    },
    {
      title: "The Promise and Peril of Online Symptom Checkers",
      publisher: "Nature npj Digital Medicine",
      url: "https://www.nature.com/articles/s41746-019-0113-1",
      date: "2019-05",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "App nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "visualization", labelVi: "Thử nhập triệu chứng" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ════════════════════════════════════════════════════════════════════
 * DỮ LIỆU GIẢ LẬP — 24 ca bệnh đã được chẩn đoán
 * 8 triệu chứng. Vector 8 chiều; hiển thị qua chiếu 2D (cosine simil).
 * ════════════════════════════════════════════════════════════════════ */
type SymptomKey =
  | "fever"
  | "cough"
  | "fatigue"
  | "headache"
  | "soreThroat"
  | "runnyNose"
  | "muscleAche"
  | "nausea";

interface Symptom {
  key: SymptomKey;
  label: string;
  icon: typeof Thermometer;
  color: string;
}

const SYMPTOMS: Symptom[] = [
  { key: "fever", label: "Sốt", icon: Thermometer, color: "#ef4444" },
  { key: "cough", label: "Ho", icon: Activity, color: "#f97316" },
  { key: "fatigue", label: "Mệt mỏi", icon: Hourglass, color: "#eab308" },
  { key: "headache", label: "Đau đầu", icon: AlertCircle, color: "#a855f7" },
  { key: "soreThroat", label: "Đau họng", icon: Stethoscope, color: "#14b8a6" },
  { key: "runnyNose", label: "Chảy mũi", icon: Pill, color: "#0ea5e9" },
  { key: "muscleAche", label: "Đau cơ", icon: HeartPulse, color: "#f43f5e" },
  { key: "nausea", label: "Buồn nôn", icon: AlertCircle, color: "#22c55e" },
];

type DiseaseKey =
  | "cold"
  | "flu"
  | "covid"
  | "strep"
  | "allergy"
  | "migraine"
  | "foodPoisoning"
  | "tension";

interface Case {
  id: number;
  vec: Record<SymptomKey, 0 | 1>;
  disease: DiseaseKey;
  advice: "self-care" | "appointment" | "urgent";
}

const DISEASE_LABEL: Record<DiseaseKey, string> = {
  cold: "Cảm lạnh thông thường",
  flu: "Cúm mùa",
  covid: "COVID / cúm nặng",
  strep: "Viêm họng do liên cầu",
  allergy: "Viêm mũi dị ứng",
  migraine: "Đau nửa đầu (migraine)",
  foodPoisoning: "Ngộ độc thực phẩm nhẹ",
  tension: "Đau đầu do căng thẳng",
};

const DISEASE_COLOR: Record<DiseaseKey, string> = {
  cold: "#0ea5e9",
  flu: "#2563eb",
  covid: "#dc2626",
  strep: "#ec4899",
  allergy: "#10b981",
  migraine: "#a855f7",
  foodPoisoning: "#f97316",
  tension: "#64748b",
};

const ADVICE_LABEL: Record<Case["advice"], string> = {
  "self-care": "Tự chăm sóc tại nhà",
  appointment: "Đặt lịch khám bác sĩ",
  urgent: "Nên đến cơ sở y tế sớm",
};

const ADVICE_COLOR: Record<Case["advice"], string> = {
  "self-care": "#10b981",
  appointment: "#f59e0b",
  urgent: "#dc2626",
};

/* Giả lập 24 ca — vector triệu chứng, disease, advice */
function mkVec(vals: Partial<Record<SymptomKey, 1>>): Record<SymptomKey, 0 | 1> {
  const out: Record<SymptomKey, 0 | 1> = {
    fever: 0,
    cough: 0,
    fatigue: 0,
    headache: 0,
    soreThroat: 0,
    runnyNose: 0,
    muscleAche: 0,
    nausea: 0,
  };
  Object.keys(vals).forEach((k) => {
    out[k as SymptomKey] = 1;
  });
  return out;
}

const CASES: Case[] = [
  /* Cảm lạnh — chảy mũi, đau họng nhẹ, không sốt cao */
  { id: 1, vec: mkVec({ runnyNose: 1, soreThroat: 1, cough: 1 }), disease: "cold", advice: "self-care" },
  { id: 2, vec: mkVec({ runnyNose: 1, cough: 1 }), disease: "cold", advice: "self-care" },
  { id: 3, vec: mkVec({ runnyNose: 1, soreThroat: 1 }), disease: "cold", advice: "self-care" },
  { id: 4, vec: mkVec({ cough: 1, soreThroat: 1, fatigue: 1 }), disease: "cold", advice: "self-care" },
  /* Cúm — sốt + mệt + đau cơ */
  { id: 5, vec: mkVec({ fever: 1, muscleAche: 1, fatigue: 1, cough: 1 }), disease: "flu", advice: "appointment" },
  { id: 6, vec: mkVec({ fever: 1, fatigue: 1, muscleAche: 1, headache: 1 }), disease: "flu", advice: "appointment" },
  { id: 7, vec: mkVec({ fever: 1, cough: 1, muscleAche: 1 }), disease: "flu", advice: "appointment" },
  { id: 8, vec: mkVec({ fever: 1, fatigue: 1, cough: 1, headache: 1 }), disease: "flu", advice: "appointment" },
  /* COVID / cúm nặng — sốt + ho + mệt nặng + khó thở (giả lập bằng muscleAche+fever+fatigue tất cả) */
  { id: 9, vec: mkVec({ fever: 1, cough: 1, fatigue: 1, muscleAche: 1, headache: 1 }), disease: "covid", advice: "urgent" },
  { id: 10, vec: mkVec({ fever: 1, cough: 1, fatigue: 1, muscleAche: 1, soreThroat: 1 }), disease: "covid", advice: "urgent" },
  { id: 11, vec: mkVec({ fever: 1, cough: 1, fatigue: 1, headache: 1, muscleAche: 1 }), disease: "covid", advice: "urgent" },
  /* Viêm họng liên cầu — sốt + đau họng dữ dội, không ho/chảy mũi */
  { id: 12, vec: mkVec({ fever: 1, soreThroat: 1, headache: 1 }), disease: "strep", advice: "appointment" },
  { id: 13, vec: mkVec({ fever: 1, soreThroat: 1 }), disease: "strep", advice: "appointment" },
  { id: 14, vec: mkVec({ fever: 1, soreThroat: 1, nausea: 1 }), disease: "strep", advice: "appointment" },
  /* Dị ứng — chảy mũi + đau họng không sốt */
  { id: 15, vec: mkVec({ runnyNose: 1 }), disease: "allergy", advice: "self-care" },
  { id: 16, vec: mkVec({ runnyNose: 1, cough: 1, headache: 1 }), disease: "allergy", advice: "self-care" },
  { id: 17, vec: mkVec({ runnyNose: 1, soreThroat: 1, fatigue: 1 }), disease: "allergy", advice: "self-care" },
  /* Migraine — đau đầu + buồn nôn, không sốt */
  { id: 18, vec: mkVec({ headache: 1, nausea: 1 }), disease: "migraine", advice: "appointment" },
  { id: 19, vec: mkVec({ headache: 1, nausea: 1, fatigue: 1 }), disease: "migraine", advice: "appointment" },
  /* Ngộ độc thực phẩm — buồn nôn + mệt, không sốt cao */
  { id: 20, vec: mkVec({ nausea: 1, fatigue: 1 }), disease: "foodPoisoning", advice: "self-care" },
  { id: 21, vec: mkVec({ nausea: 1, fatigue: 1, muscleAche: 1 }), disease: "foodPoisoning", advice: "appointment" },
  { id: 22, vec: mkVec({ nausea: 1 }), disease: "foodPoisoning", advice: "self-care" },
  /* Đau đầu căng thẳng — chỉ đau đầu + mệt */
  { id: 23, vec: mkVec({ headache: 1 }), disease: "tension", advice: "self-care" },
  { id: 24, vec: mkVec({ headache: 1, fatigue: 1 }), disease: "tension", advice: "self-care" },
];

/* ════════════════════════════════════════════════════════════════════
 * PROJECTION 2D — MDS đơn giản qua hai trục chính
 *  trục x = 1 - similarity với "cold" trung tâm (điểm nhiều dị ứng/cảm)
 *  trục y = 1 - similarity với "flu" trung tâm (điểm nhiều cúm/covid)
 * Đây là chiếu deterministic để dễ hiển thị; thực tế Buoy dùng embeddings.
 * ════════════════════════════════════════════════════════════════════ */
function hamming(a: Record<SymptomKey, 0 | 1>, b: Record<SymptomKey, 0 | 1>): number {
  let d = 0;
  (Object.keys(a) as SymptomKey[]).forEach((k) => {
    if (a[k] !== b[k]) d += 1;
  });
  return d;
}

const AXIS_X_REF = mkVec({ runnyNose: 1, soreThroat: 1 }); // prototype "cold"
const AXIS_Y_REF = mkVec({ fever: 1, muscleAche: 1, fatigue: 1 }); // prototype "flu"

function project(vec: Record<SymptomKey, 0 | 1>): { x: number; y: number } {
  const dx = hamming(vec, AXIS_X_REF);
  const dy = hamming(vec, AXIS_Y_REF);
  return { x: dx, y: dy };
}

const PROJ_W = 380;
const PROJ_H = 320;
const PROJ_PAD_L = 40;
const PROJ_PAD_R = 16;
const PROJ_PAD_T = 20;
const PROJ_PAD_B = 36;
const PROJ_MAX = 8;

function projX(v: number) {
  return (
    PROJ_PAD_L + (v / PROJ_MAX) * (PROJ_W - PROJ_PAD_L - PROJ_PAD_R)
  );
}
function projY(v: number) {
  return PROJ_H - PROJ_PAD_B - (v / PROJ_MAX) * (PROJ_H - PROJ_PAD_T - PROJ_PAD_B);
}

/* ════════════════════════════════════════════════════════════════════
 * k-NN — predict disease + advice from feature vec
 * ════════════════════════════════════════════════════════════════════ */
function predictDisease(
  vec: Record<SymptomKey, 0 | 1>,
  k: number,
): {
  top: { case_: Case; d: number }[];
  disease: DiseaseKey | null;
  advice: Case["advice"] | null;
  voteDisease: Record<DiseaseKey, number>;
  voteAdvice: Record<Case["advice"], number>;
} {
  const scored = CASES.map((c) => ({ case_: c, d: hamming(c.vec, vec) })).sort(
    (a, b) => a.d - b.d,
  );
  const top = scored.slice(0, k);
  const voteD: Record<DiseaseKey, number> = {
    cold: 0,
    flu: 0,
    covid: 0,
    strep: 0,
    allergy: 0,
    migraine: 0,
    foodPoisoning: 0,
    tension: 0,
  };
  const voteA: Record<Case["advice"], number> = {
    "self-care": 0,
    appointment: 0,
    urgent: 0,
  };
  top.forEach((t) => {
    voteD[t.case_.disease] += 1;
    voteA[t.case_.advice] += 1;
  });
  let bestD: DiseaseKey | null = null;
  let bestDC = -1;
  (Object.keys(voteD) as DiseaseKey[]).forEach((d) => {
    if (voteD[d] > bestDC) {
      bestDC = voteD[d];
      bestD = d;
    }
  });
  let bestA: Case["advice"] | null = null;
  let bestAC = -1;
  (Object.keys(voteA) as Case["advice"][]).forEach((a) => {
    if (voteA[a] > bestAC) {
      bestAC = voteA[a];
      bestA = a;
    }
  });
  /* Nếu không có triệu chứng nào → đừng gợi ý gì */
  const total = (Object.values(vec) as number[]).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { top, disease: null, advice: null, voteDisease: voteD, voteAdvice: voteA };
  }
  return { top, disease: bestD, advice: bestA, voteDisease: voteD, voteAdvice: voteA };
}

/* ════════════════════════════════════════════════════════════════════
 * PLAYGROUND
 * ════════════════════════════════════════════════════════════════════ */
function SymptomPlayground() {
  const [vec, setVec] = useState<Record<SymptomKey, 0 | 1>>(mkVec({}));
  const [k, setK] = useState<number>(5);

  const result = useMemo(() => predictDisease(vec, k), [vec, k]);
  const qp = project(vec);

  function toggle(key: SymptomKey) {
    setVec((p) => ({ ...p, [key]: p[key] === 1 ? 0 : 1 }));
  }
  function reset() {
    setVec(mkVec({}));
    setK(5);
  }

  const activeCount = (Object.values(vec) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trái: form triệu chứng */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Chọn các triệu chứng bạn đang có
            </span>
            <span className="ml-auto text-[10px] text-tertiary">
              {activeCount}/{SYMPTOMS.length} triệu chứng
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => {
              const on = vec[s.key] === 1;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all ${
                    on
                      ? "bg-accent-light border-accent shadow-sm"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                  aria-pressed={on}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: on ? s.color : "transparent",
                      color: on ? "#fff" : s.color,
                      border: on ? "none" : `1px solid ${s.color}`,
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span
                    className={`flex-1 font-medium ${
                      on ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      on ? "bg-accent" : "bg-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-foreground">
                Số ca tham chiếu (k) ={" "}
                <span className="font-mono text-accent">{k}</span>
              </span>
              <input
                type="range"
                min={1}
                max={11}
                step={2}
                value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-full cursor-pointer accent-accent"
                aria-label="Số ca tham chiếu"
              />
            </div>
            <p className="text-[10px] text-tertiary leading-relaxed">
              k lẻ để tránh hoà phiếu. Quá nhỏ → nhạy với nhiễu, quá lớn → bỏ qua bệnh
              hiếm.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:text-foreground"
            >
              <RotateCcw size={11} className="inline mr-1" /> Xoá hết
            </button>
          </div>
        </div>

        {/* Phải: 2D projection + danh sách ca gần */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HeartPulse size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Không gian bệnh nhân — ca của bạn so với 24 ca có sẵn
            </span>
          </div>
          <svg
            viewBox={`0 0 ${PROJ_W} ${PROJ_H}`}
            className="w-full"
            role="img"
            aria-label="2D projection của bệnh nhân và 24 ca có sẵn"
          >
            {/* trục */}
            <line
              x1={PROJ_PAD_L}
              y1={PROJ_H - PROJ_PAD_B}
              x2={PROJ_W - PROJ_PAD_R}
              y2={PROJ_H - PROJ_PAD_B}
              stroke="currentColor"
              className="text-border"
            />
            <line
              x1={PROJ_PAD_L}
              y1={PROJ_PAD_T}
              x2={PROJ_PAD_L}
              y2={PROJ_H - PROJ_PAD_B}
              stroke="currentColor"
              className="text-border"
            />
            <text
              x={PROJ_W / 2}
              y={PROJ_H - 6}
              fontSize={9.5}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted"
            >
              Khác biệt so với mẫu &ldquo;cảm lạnh&rdquo;
            </text>
            <text
              x={12}
              y={PROJ_H / 2}
              fontSize={9.5}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted"
              transform={`rotate(-90 12 ${PROJ_H / 2})`}
            >
              Khác biệt so với mẫu &ldquo;cúm&rdquo;
            </text>

            {/* đường nối query → top k */}
            {activeCount > 0 &&
              result.top.map((t, i) => {
                const p = project(t.case_.vec);
                return (
                  <motion.line
                    key={i}
                    x1={projX(qp.x)}
                    y1={projY(qp.y)}
                    x2={projX(p.x)}
                    y2={projY(p.y)}
                    stroke={DISEASE_COLOR[t.case_.disease]}
                    strokeOpacity={0.55}
                    strokeWidth={1.6}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}

            {/* Các ca có sẵn */}
            {CASES.map((c) => {
              const p = project(c.vec);
              const isTop =
                activeCount > 0 && result.top.some((t) => t.case_.id === c.id);
              return (
                <circle
                  key={c.id}
                  cx={projX(p.x)}
                  cy={projY(p.y)}
                  r={isTop ? 7 : 4.5}
                  fill={DISEASE_COLOR[c.disease]}
                  stroke={isTop ? "#fff" : "none"}
                  strokeWidth={isTop ? 2 : 0}
                  opacity={isTop ? 1 : activeCount > 0 ? 0.35 : 0.85}
                />
              );
            })}

            {/* Ca của bạn */}
            {activeCount > 0 && (
              <motion.g
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
              >
                <circle
                  cx={projX(qp.x)}
                  cy={projY(qp.y)}
                  r={11}
                  fill={result.disease ? DISEASE_COLOR[result.disease] : "#64748b"}
                  stroke="#fff"
                  strokeWidth={3}
                />
                <circle cx={projX(qp.x)} cy={projY(qp.y)} r={4} fill="#fff" />
              </motion.g>
            )}
          </svg>
          <p className="text-[10px] text-tertiary text-center leading-relaxed">
            Mỗi chấm = một ca cũ đã được bác sĩ chẩn đoán. Ca càng gần ca của bạn trong
            không gian này = triệu chứng càng trùng. Đường nối = k ca gần nhất.
          </p>
        </div>
      </div>

      {/* Kết quả */}
      <AnimatePresence mode="wait">
        {activeCount > 0 && result.disease && result.advice ? (
          <motion.div
            key={`${result.disease}-${result.advice}-${k}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{
              backgroundColor: DISEASE_COLOR[result.disease] + "10",
              borderColor: DISEASE_COLOR[result.disease] + "50",
            }}
          >
            <div>
              <div className="text-[10px] uppercase tracking-wide text-tertiary">
                Bệnh gần nhất với các ca tham chiếu
              </div>
              <div
                className="text-base font-bold mt-1"
                style={{ color: DISEASE_COLOR[result.disease] }}
              >
                {DISEASE_LABEL[result.disease]}
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {(Object.entries(result.voteDisease) as [DiseaseKey, number][])
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([d, v]) => (
                    <span
                      key={d}
                      className="px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: DISEASE_COLOR[d] + "22",
                        color: DISEASE_COLOR[d],
                      }}
                    >
                      {DISEASE_LABEL[d]}: {v}
                    </span>
                  ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-tertiary">
                Khuyến nghị hành động (triage)
              </div>
              <div
                className="text-base font-bold mt-1"
                style={{ color: ADVICE_COLOR[result.advice] }}
              >
                {ADVICE_LABEL[result.advice]}
              </div>
              <p className="text-[10px] text-foreground/85 mt-2 leading-relaxed">
                Quyết định này dựa trên đa số trong {k} ca có triệu chứng giống bạn nhất.{" "}
                <strong>Đây không phải lời khuyên y khoa</strong> — nếu có triệu chứng
                nặng, liên hệ bác sĩ hoặc cơ sở y tế gần nhất.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-border bg-surface/40 p-4 text-xs text-muted text-center"
          >
            Chọn ít nhất một triệu chứng ở phía trên để xem app gợi ý.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-k chi tiết */}
      {activeCount > 0 && (
        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <div className="text-[11px] font-semibold text-foreground mb-2">
            {k} ca tham chiếu gần nhất (khoảng cách Hamming)
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {result.top.map((t, i) => {
              const c = t.case_;
              const matched: string[] = [];
              const extra: string[] = [];
              (Object.keys(vec) as SymptomKey[]).forEach((k2) => {
                if (vec[k2] === 1 && c.vec[k2] === 1) {
                  matched.push(SYMPTOMS.find((s) => s.key === k2)?.label ?? k2);
                }
                if (vec[k2] === 0 && c.vec[k2] === 1) {
                  extra.push(SYMPTOMS.find((s) => s.key === k2)?.label ?? k2);
                }
              });
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px]"
                >
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: DISEASE_COLOR[c.disease] }}
                      />
                      <span
                        className="font-semibold"
                        style={{ color: DISEASE_COLOR[c.disease] }}
                      >
                        {DISEASE_LABEL[c.disease]}
                      </span>
                      <span className="text-muted ml-auto">d = {t.d}</span>
                    </div>
                    <div className="text-tertiary mt-0.5 leading-snug">
                      Trùng: {matched.length > 0 ? matched.join(", ") : "(không)"}
                      {extra.length > 0 && ` · Thêm: ${extra.join(", ")}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * SCENARIO — 1 ca thực tế, đi qua 3 bước
 * ════════════════════════════════════════════════════════════════════ */
function ScenarioWalkthrough() {
  const example = mkVec({
    fever: 1,
    fatigue: 1,
    muscleAche: 1,
    cough: 1,
  });
  const res = predictDisease(example, 5);
  const present = (Object.keys(example) as SymptomKey[])
    .filter((k) => example[k] === 1)
    .map((k) => SYMPTOMS.find((s) => s.key === k)?.label ?? k);

  return (
    <StepReveal
      labels={[
        "1 · Nhập triệu chứng",
        "2 · Tính khoảng cách",
        "3 · Bỏ phiếu + gợi ý",
      ]}
    >
      {[
        <div key="s1" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
          <div className="text-xs font-semibold text-foreground">
            Minh đang cảm thấy:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {present.map((p) => (
              <span
                key={p}
                className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Minh, 24 tuổi, mở app Buoy Health lúc 10 giờ đêm. Các triệu chứng: sốt, ho,
            mệt mỏi, đau cơ. App biến bộ triệu chứng này thành một{" "}
            <strong>vector 8 chiều</strong> — mỗi chiều là một triệu chứng, giá trị 1 (có)
            hoặc 0 (không).
          </p>
        </div>,
        <div key="s2" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
          <div className="text-xs font-semibold text-foreground">
            App so vector của Minh với 24 ca đã có:
          </div>
          <ol className="space-y-1">
            {res.top.map((t, i) => (
              <li key={i} className="text-[11px] flex items-center gap-2">
                <span className="h-5 w-5 rounded-full flex items-center justify-center bg-accent/15 text-accent font-bold">
                  {i + 1}
                </span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DISEASE_COLOR[t.case_.disease] }}
                />
                <span className="text-foreground">
                  Ca #{t.case_.id} — {DISEASE_LABEL[t.case_.disease]}
                </span>
                <span className="text-muted ml-auto">khoảng cách d = {t.d}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Khoảng cách Hamming = số triệu chứng KHÁC biệt. d = 1 nghĩa là ca tham chiếu
            có 7/8 triệu chứng giống hệt Minh. k = 5 ca gần nhất sẽ được dùng để bỏ phiếu.
          </p>
        </div>,
        <div key="s3" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
          <div className="text-xs font-semibold text-foreground">
            Đa số trong 5 ca gần nhất →
          </div>
          <div
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: DISEASE_COLOR[res.disease!] + "10",
              borderColor: DISEASE_COLOR[res.disease!] + "60",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-base font-bold"
                style={{ color: DISEASE_COLOR[res.disease!] }}
              >
                {DISEASE_LABEL[res.disease!]}
              </span>
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: ADVICE_COLOR[res.advice!] + "22",
                  color: ADVICE_COLOR[res.advice!],
                }}
              >
                {ADVICE_LABEL[res.advice!]}
              </span>
            </div>
            <p className="text-[11px] text-foreground/85 mt-2 leading-relaxed">
              App gợi ý Minh nên đặt lịch khám bác sĩ trong vòng 1–2 ngày, uống nhiều nước
              và nghỉ ngơi. Nếu sốt trên 39 °C hoặc khó thở → cấp cứu.
            </p>
          </div>
          <p className="text-[10px] text-tertiary leading-relaxed">
            Đằng sau 3 bước đó là chính là k-NN. Không có &ldquo;AI thần kỳ&rdquo; — chỉ
            có đo khoảng cách và bỏ phiếu.
          </p>
        </div>,
      ]}
    </StepReveal>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * COMPONENT CHÍNH
 * ════════════════════════════════════════════════════════════════════ */
export default function KnnInSymptomChecker() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="k láng giềng gần nhất"
    >
      <ApplicationHero
        parentTitleVi="k láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <p>
          Nửa đêm, bạn đau đầu kèm sốt nhẹ. Thay vì gõ Google rồi tự doạ mình với kết quả
          u não, bạn mở app kiểm tra triệu chứng như Buoy Health. Chatbot hỏi vài câu:
          &ldquo;Bạn có sốt không?&rdquo;, &ldquo;Bạn có ho không?&rdquo;. Sau 30 giây,
          app gợi ý: nhiều khả năng là cảm cúm thường, nghỉ ngơi và uống nước; đến bác sĩ
          nếu triệu chứng kéo dài quá 3 ngày.
        </p>
        <p>
          Đằng sau phần &ldquo;gợi ý&rdquo; đó chính là k-NN. App biến bộ triệu chứng của
          bạn thành một vector số, so với hàng ngàn ca bệnh đã được bác sĩ chẩn đoán,
          chọn các ca gần nhất và gợi ý bệnh phổ biến trong các ca đó. Phần tiếp theo sẽ
          cho bạn thử chính quy trình ấy — chỉ việc bật/tắt các nút triệu chứng.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="knn-in-symptom-checker">
        <p>
          Hàng trăm triệu lượt tìm kiếm triệu chứng bệnh trên internet mỗi tháng — riêng
          WebMD có hơn 95 triệu lượt truy cập/tháng. Nhưng tìm kiếm thông thường trả về
          kết quả gây hoang mang: một cơn đau đầu có thể là cảm, cũng có thể là u não.
          Người dùng cần một công cụ đưa ra <em>gợi ý có trọng tâm</em>, không phải danh
          sách mọi bệnh có thể.
        </p>
        <p>
          Vấn đề cốt lõi: từ một bộ triệu chứng (tất cả đều rời rạc có/không), chọn ra
          một vài bệnh khả năng cao nhất và phân loại mức độ khẩn cấp (triage). Phải đủ
          nhanh để trả lời trong 1–2 giây, đủ chính xác để không bỏ sót cấp cứu, và đủ
          đơn giản để cập nhật liên tục khi có ca mới.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="k láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <Beat step={1}>
          <p>
            <strong>Biến triệu chứng thành vector số.</strong> Mỗi triệu chứng (sốt, ho,
            mệt mỏi, đau đầu...) là một chiều. Bệnh nhân trả lời có/không, hệ thống ghi
            lại 1 hoặc 0. Nếu theo dõi 200 triệu chứng, mỗi người là một vector 200 chiều.
            Với mức độ nghiêm trọng có thể dùng số liên tục (ví dụ &ldquo;sốt 38.5°C&rdquo;
            thay vì chỉ 0/1).
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Tính khoảng cách với các ca đã có.</strong> Hệ thống so vector mới
            với mọi ca trong cơ sở dữ liệu bằng khoảng cách phù hợp: <em>Hamming</em> (đếm
            số chiều khác nhau — phù hợp với dữ liệu 0/1 như triệu chứng có/không),{" "}
            <em>Euclid</em> (khi chiều liên tục), hoặc <em>Cosine</em> (khi quan trọng
            tỉ lệ chứ không phải giá trị tuyệt đối). Ca nào có vector &ldquo;gần&rdquo; bạn
            nhất = có triệu chứng giống bạn nhất.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Chọn k ca gần nhất.</strong> Lấy k ca (thường 5, 7 hoặc 11 — số lẻ để
            tránh hoà phiếu). k quá nhỏ → nhạy với ca cá biệt; k quá lớn → bỏ qua bệnh
            hiếm. Trong y tế, k được tinh chỉnh qua cross-validation trên dữ liệu ca đã
            biết.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Bỏ phiếu đa số.</strong> Trong k ca gần nhất, bệnh nào xuất hiện nhiều
            nhất được chọn. Có thể dùng weighted voting — ca gần hơn thì phiếu nặng hơn.
            Ví dụ: 5/7 ca là cúm, 2/7 là viêm họng → app gợi ý cúm với độ tin cậy ~71%.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Phân loại mức độ khẩn cấp (triage).</strong> Kết hợp kết quả k-NN với
            luật y khoa đơn giản: nếu có một số tổ hợp triệu chứng &ldquo;đèn đỏ&rdquo;
            (đau ngực, khó thở, sốt rất cao), luôn ưu tiên đi cấp cứu — bất kể k-NN gợi ý
            gì. Đây là lớp an toàn để tránh bỏ sót ca nặng.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ═══ TRỰC QUAN HÓA ═══ */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Thử nhập triệu chứng — xem k-NN chạy" step={1}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Bật/tắt các nút triệu chứng bên trái. Bên phải bạn sẽ thấy ca của mình xuất
            hiện trong &ldquo;không gian bệnh nhân&rdquo; — càng gần một cụm màu, bệnh
            càng có khả năng cao. Các đường nối là k ca gần nhất đang được bỏ phiếu.
          </p>
          <SymptomPlayground />
        </LessonSection>

        <LessonSection label="Đi qua một ca cụ thể" step={2}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Minh, 24 tuổi, đang sốt và ho. Theo dõi từng bước app xử lý dữ liệu.
          </p>
          <ScenarioWalkthrough />
        </LessonSection>

        <LessonSection label="Thử thách — Điểm yếu của k-NN khi dữ liệu lớn" step={3}>
          <InlineChallenge
            question="Tại sao app kiểm tra triệu chứng không nhanh khi database có hàng triệu ca?"
            options={[
              "Vì model k-NN phải được huấn luyện lại mỗi ngày",
              "Vì k-NN không có bước train — mỗi query phải đo khoảng cách với TẤT CẢ ca, chi phí O(N · d) tăng tuyến tính với N",
              "Vì Hamming là công thức rất chậm",
              "Vì bác sĩ phải kiểm tra thủ công từng gợi ý",
            ]}
            correct={1}
            explanation="Cái giá cho việc 'không cần train' là lúc dự đoán cực đắt. Với N = 1 triệu ca và d = 200 triệu chứng, mỗi query = 200 triệu phép so sánh. Giải pháp thực tế: KD-tree / Ball-tree (khi d nhỏ), hoặc approximate NN như HNSW và FAISS (chính Buoy dùng cấu trúc tương tự) để giảm xuống O(log N)."
          />
          <div className="mt-4">
            <Callout variant="warning" title="App gợi ý ≠ bác sĩ">
              App triệu chứng giúp bạn <em>quyết định có nên đi khám hay không</em> — chứ
              không thay bác sĩ chẩn đoán. Nghiên cứu cho thấy các công cụ này đúng trong
              top-3 gợi ý khoảng 51% các ca — tốt cho định hướng, không đủ cho kết luận.
              Luôn đi khám nếu triệu chứng nặng lên, hoặc nếu app đưa ra khuyến nghị cấp
              cứu.
            </Callout>
          </div>
        </LessonSection>
      </VisualizationSection>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="knn-in-symptom-checker"
      >
        <Metric
          value="k-NN đạt 91.29% độ chính xác trong phát hiện bệnh từ dữ liệu lâm sàng"
          sourceRef={1}
        />
        <Metric
          value="k-NN tối ưu đạt 97.18% độ chính xác trong dự đoán đột quỵ"
          sourceRef={2}
        />
        <Metric
          value="Hơn 95 triệu lượt truy cập WebMD mỗi tháng — nhu cầu kiểm tra triệu chứng rất lớn"
          sourceRef={5}
        />
        <Metric
          value="Công cụ kiểm tra triệu chứng đưa đúng chẩn đoán vào top-3 gợi ý trong 51% trường hợp"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="k láng giềng gần nhất"
        topicSlug="knn-in-symptom-checker"
      >
        <p>
          Không có k-NN, app kiểm tra triệu chứng sẽ phải quay về hai cách cũ: (1){" "}
          <em>expert system</em> — bác sĩ viết hàng ngàn luật &ldquo;nếu có A và B thì có
          thể là C&rdquo;, rất tốn công và khó cập nhật; hoặc (2) mô hình phức tạp (neural
          net) — chính xác hơn nhưng không giải thích được vì sao chọn chẩn đoán cụ thể,
          gây khó cho việc điều chỉnh và kiểm toán y khoa.
        </p>
        <p>
          k-NN đơn giản đến mức dễ giải thích: &ldquo;gợi ý cúm vì 4/5 ca có triệu chứng
          giống bạn nhất đều được chẩn đoán cúm&rdquo;. Điều đó giúp bác sĩ kiểm tra
          nhanh, và giúp người dùng tin vào app. Khi có ca mới → chỉ cần thêm vào database,
          không cần huấn luyện lại. Sự đơn giản đó chính là lý do k-NN xuất hiện ở nền
          của nhiều công cụ triage — trước khi hệ thống được nâng cấp với embedding deep
          learning và approximate nearest neighbor để chạy được trên triệu ca.
        </p>
        <div className="mt-4">
          <MiniSummary
            title="Bài học từ app triệu chứng"
            points={[
              "App biến triệu chứng thành vector, rồi so khoảng cách Hamming/Euclid với mọi ca cũ — đó là k-NN.",
              "k lẻ, thường 5–11, chọn bằng cross-validation. Quyết định triage có thêm lớp luật y khoa 'đèn đỏ'.",
              "k-NN đơn giản, dễ giải thích — nhưng chậm khi N lớn. Giải pháp: KD-tree hoặc approximate NN (HNSW, FAISS).",
              "App gợi ý ≠ chẩn đoán của bác sĩ. Chính xác top-3 ~51% — đủ để định hướng, không đủ để thay bác sĩ.",
            ]}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed">
          Muốn hiểu kỹ phần thuật toán đứng sau — k là gì, chọn k thế nào, các thước đo
          khoảng cách — xem bài lý thuyết:{" "}
          <TopicLink slug="knn">k láng giềng gần nhất (k-NN)</TopicLink>.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
