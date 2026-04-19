"use client";
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Activity,
  FlaskConical,
  FileText,
  HeartPulse,
  CheckCircle2,
  Eye,
  EyeOff,
  Hospital,
  Microscope,
  Building2,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  ToggleCompare,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-healthcare",
  title: "AI in Healthcare",
  titleVi: "AI trong Y tế",
  description:
    "AI trong chẩn đoán hình ảnh, phân loại cấp cứu và phát triển thuốc — góc nhìn thực tế cho nhân viên y tế Việt Nam",
  category: "applied-ai",
  tags: ["medical-imaging", "drug-discovery", "clinical-ai", "healthcare"],
  difficulty: "beginner",
  relatedSlugs: ["ai-in-finance", "ai-in-education", "ai-coding-assistants"],
  vizType: "interactive",
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// DEMO 1 — Đọc X-quang có và không có AI
// ---------------------------------------------------------------------------

const GRID_ROWS = 12;
const GRID_COLS = 18;

type LungPixel = {
  row: number;
  col: number;
  intensity: number; // độ sáng X-quang mô phỏng (0..1)
  isAbnormal: boolean; // ground truth — có tổn thương hay không
  aiScore: number; // AI predicted probability
};

function buildLungScan(): LungPixel[] {
  const pixels: LungPixel[] = [];
  // Mô phỏng tổn thương ở hai vùng: một vùng thùy trên phải, một vùng thùy dưới trái
  const lesions = [
    { r: 3, c: 5, radius: 2.4 },
    { r: 8, c: 12, radius: 1.9 },
  ];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      // Nền phổi — sáng hơn ở vùng giữa, tối hơn ở rìa
      const centerDist = Math.sqrt(
        Math.pow(r - GRID_ROWS / 2, 2) + Math.pow(c - GRID_COLS / 2, 2),
      );
      let intensity = 0.25 + 0.35 * Math.max(0, 1 - centerDist / 10);
      let isAbnormal = false;
      let aiScore = 0.15 + 0.15 * Math.random();

      for (const lesion of lesions) {
        const dist = Math.sqrt(
          Math.pow(r - lesion.r, 2) + Math.pow(c - lesion.c, 2),
        );
        if (dist < lesion.radius) {
          isAbnormal = true;
          const closeness = 1 - dist / lesion.radius;
          intensity = Math.min(1, intensity + 0.35 * closeness);
          aiScore = Math.min(1, 0.55 + 0.4 * closeness);
        }
      }
      pixels.push({ row: r, col: c, intensity, isAbnormal, aiScore });
    }
  }
  return pixels;
}

function LungScanDemo() {
  const pixels = useMemo(() => buildLungScan(), []);
  const [showTruth, setShowTruth] = useState(false);

  const CELL = 20;
  const W = GRID_COLS * CELL;
  const H = GRID_ROWS * CELL;

  const readerOnly = (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[400px] rounded-lg border border-border bg-slate-950"
      >
        {pixels.map((p) => {
          const v = Math.round(40 + p.intensity * 180);
          const color = `rgb(${v}, ${v}, ${Math.min(255, v + 8)})`;
          return (
            <rect
              key={`${p.row}-${p.col}`}
              x={p.col * CELL}
              y={p.row * CELL}
              width={CELL - 1}
              height={CELL - 1}
              rx={2}
              fill={color}
            />
          );
        })}
      </svg>
      <div className="text-xs text-muted">
        Bác sĩ xem X-quang theo cách cổ điển — không có trợ giúp AI
      </div>
    </div>
  );

  const withAI = (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[400px] rounded-lg border border-accent/40 bg-slate-950"
      >
        {pixels.map((p) => {
          const v = Math.round(40 + p.intensity * 180);
          const base = `rgb(${v}, ${v}, ${Math.min(255, v + 8)})`;
          const highlight = p.aiScore >= 0.55;
          return (
            <g key={`${p.row}-${p.col}`}>
              <rect
                x={p.col * CELL}
                y={p.row * CELL}
                width={CELL - 1}
                height={CELL - 1}
                rx={2}
                fill={base}
              />
              {highlight && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.45 }}
                  transition={{ duration: 0.4 }}
                  x={p.col * CELL}
                  y={p.row * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  rx={2}
                  fill="#f97316"
                />
              )}
            </g>
          );
        })}
        {showTruth &&
          pixels
            .filter((p) => p.isAbnormal)
            .map((p) => (
              <rect
                key={`truth-${p.row}-${p.col}`}
                x={p.col * CELL}
                y={p.row * CELL}
                width={CELL - 1}
                height={CELL - 1}
                rx={2}
                fill="none"
                stroke="#22c55e"
                strokeWidth={1.5}
              />
            ))}
      </svg>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTruth((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover"
        >
          {showTruth ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {showTruth ? "Ẩn vùng bệnh thật" : "Hiện vùng bệnh thật"}
        </button>
      </div>
      <div className="text-xs text-muted">
        AI tô cam các vùng nghi ngờ cho bác sĩ xem xét kỹ. Bật viền xanh để
        đối chiếu vùng bệnh thật do chuyên gia đã đánh nhãn.
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Demo 1 — Đọc X-quang phổi có và không có AI
        </h3>
        <p className="text-sm text-muted">
          Cùng một phim X-quang. Bấm chuyển giữa "bác sĩ đọc một mình" và
          "bác sĩ + AI" để thấy AI tô cam vùng nghi ngờ — giúp bác sĩ tập
          trung vào khu vực quan trọng thay vì phải quét toàn bộ phim.
        </p>
      </div>
      <ToggleCompare
        labelA="Bác sĩ đọc một mình"
        labelB="Bác sĩ + AI"
        childA={readerOnly}
        childB={withAI}
        description="AI không đưa ra chẩn đoán cuối cùng — nó chỉ gợi ý vùng cần chú ý."
      />
      <Callout variant="tip" title="Cách đọc visualization">
        Vùng tô cam là nơi AI nghĩ "có thể có tổn thương". Viền xanh lá là
        vùng tổn thương thật do chuyên gia X-quang đã đánh nhãn khi train
        mô hình. AI tốt là khi vùng cam trùng gần hết với viền xanh. Khi
        chúng không trùng — bác sĩ là người quyết định tin ai.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO 2 — Phân loại cấp cứu
// ---------------------------------------------------------------------------

type TriageCase = {
  id: number;
  name: string;
  age: number;
  symptoms: string;
  vitals: string;
  aiUrgency: number; // 1 = nguy kịch, 5 = nhẹ
  aiReason: string;
  correctOrder: number; // 1..5
};

const TRIAGE_CASES: TriageCase[] = [
  {
    id: 1,
    name: "Bác Nam, 62 tuổi",
    age: 62,
    symptoms: "Đau ngực trái dữ dội 30 phút, vã mồ hôi, khó thở",
    vitals: "HA 160/95, Nhịp 120, SpO₂ 92%",
    aiUrgency: 1,
    aiReason: "Nghi nhồi máu cơ tim cấp — cửa sổ can thiệp vàng chỉ vài giờ",
    correctOrder: 1,
  },
  {
    id: 2,
    name: "Chị Hạnh, 35 tuổi",
    age: 35,
    symptoms: "Đau bụng âm ỉ bên phải 2 ngày, sốt nhẹ 38°C",
    vitals: "HA 110/70, Nhịp 88, SpO₂ 98%",
    aiUrgency: 3,
    aiReason: "Nghi viêm ruột thừa — cần siêu âm và xét nghiệm sớm",
    correctOrder: 3,
  },
  {
    id: 3,
    name: "Bé An, 5 tuổi",
    age: 5,
    symptoms: "Sốt cao 39.5°C, co giật 2 phút, lừ đừ sau cơn",
    vitals: "HA 90/60, Nhịp 140, SpO₂ 96%",
    aiUrgency: 2,
    aiReason: "Co giật do sốt ở trẻ em — cần theo dõi thần kinh và hạ sốt ngay",
    correctOrder: 2,
  },
  {
    id: 4,
    name: "Anh Tùng, 28 tuổi",
    age: 28,
    symptoms: "Cổ tay sưng đau sau va chạm xe máy, không biến dạng rõ",
    vitals: "HA 125/80, Nhịp 78, SpO₂ 99%",
    aiUrgency: 4,
    aiReason: "Nghi chấn thương phần mềm hoặc gãy xương kín — chờ X-quang",
    correctOrder: 4,
  },
  {
    id: 5,
    name: "Cô Lan, 42 tuổi",
    age: 42,
    symptoms: "Viêm họng, ho khan 3 ngày, không sốt",
    vitals: "HA 118/75, Nhịp 72, SpO₂ 99%",
    aiUrgency: 5,
    aiReason: "Viêm họng thông thường — có thể chờ phòng khám ngoại trú",
    correctOrder: 5,
  },
];

function TriageDemo() {
  const [userOrder, setUserOrder] = useState<number[]>([]);
  const [showAI, setShowAI] = useState(false);

  const handlePick = useCallback(
    (id: number) => {
      setUserOrder((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= TRIAGE_CASES.length) return prev;
        return [...prev, id];
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setUserOrder([]);
    setShowAI(false);
  }, []);

  const allPicked = userOrder.length === TRIAGE_CASES.length;
  const aiOrder = [...TRIAGE_CASES]
    .sort((a, b) => a.aiUrgency - b.aiUrgency)
    .map((c) => c.id);

  const matches = allPicked
    ? userOrder.filter((id, i) => id === aiOrder[i]).length
    : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Demo 2 — Phân loại cấp cứu (triage) có AI hỗ trợ
        </h3>
        <p className="text-sm text-muted">
          Năm bệnh nhân vừa vào phòng cấp cứu cùng lúc. Bác sĩ chỉ có thể
          khám từng người. Hãy xếp thứ tự ưu tiên trước (bấm theo thứ tự
          bạn sẽ gọi vào), rồi so sánh với AI và với đáp án chuẩn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {TRIAGE_CASES.map((c) => {
          const rank = userOrder.indexOf(c.id);
          const picked = rank !== -1;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              className={`group flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-colors ${
                picked
                  ? "border-accent bg-accent-light"
                  : "border-border bg-surface/60 hover:border-accent/50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="text-xs font-medium text-muted">
                  Ca số {c.id}
                </div>
                {picked && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {rank + 1}
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {c.name}
              </div>
              <div className="text-xs text-muted">{c.symptoms}</div>
              <div className="font-mono text-[11px] text-muted">{c.vitals}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!allPicked}
          onClick={() => setShowAI(true)}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:enabled:opacity-90"
        >
          So sánh với AI
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-muted hover:bg-surface-hover"
        >
          Làm lại
        </button>
        {allPicked && showAI && (
          <div className="text-sm">
            <span className="text-muted">Bạn trùng với AI:</span>{" "}
            <span className="font-mono font-semibold text-foreground">
              {matches}/5
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-border"
          >
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Hạng</th>
                  <th className="px-3 py-2 text-left">Ca bệnh</th>
                  <th className="px-3 py-2 text-left">Lý do AI đánh giá</th>
                  <th className="px-3 py-2 text-center">Cấp độ</th>
                </tr>
              </thead>
              <tbody>
                {aiOrder.map((id, idx) => {
                  const c = TRIAGE_CASES.find((x) => x.id === id)!;
                  const urgency = c.aiUrgency;
                  const tone =
                    urgency === 1
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : urgency === 2
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        : urgency === 3
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : urgency === 4
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
                  return (
                    <tr key={id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono font-semibold text-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-foreground">{c.name}</td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {c.aiReason}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
                        >
                          Cấp {urgency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      <Callout variant="insight" title="AI không thay bác sĩ — AI mua thời gian">
        Trong phòng cấp cứu quá tải, phân loại sai thứ tự có thể làm mất
        vàng — ví dụ bỏ sót nhồi máu cơ tim sớm. AI phân loại nhanh trong
        vài giây dựa trên dấu hiệu sinh tồn và triệu chứng. Bác sĩ xác
        nhận hoặc đảo lại thứ tự khi có thông tin thêm. Các bệnh viện
        lớn tại VN (Bạch Mai, Chợ Rẫy) đang thử nghiệm các hệ thống
        tương tự.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO 3 — Timeline phát triển thuốc
// ---------------------------------------------------------------------------

type DrugStage = {
  name: string;
  traditionalYears: number;
  aiYears: number;
  description: string;
};

const DRUG_STAGES: DrugStage[] = [
  {
    name: "Tìm target (đích tác dụng)",
    traditionalYears: 2,
    aiYears: 0.5,
    description:
      "Xác định protein/gen nào liên quan đến bệnh. AI quét hàng triệu bài báo và cơ sở dữ liệu để gợi ý target tiềm năng.",
  },
  {
    name: "Thiết kế phân tử",
    traditionalYears: 2.5,
    aiYears: 0.7,
    description:
      "Thiết kế các phân tử có thể bám vào target. AI sinh phân tử ảo và dự đoán hiệu quả qua AlphaFold, Boltz, generative chemistry.",
  },
  {
    name: "Thử nghiệm trong ống nghiệm",
    traditionalYears: 2,
    aiYears: 0.6,
    description:
      "Kiểm tra phản ứng trên tế bào. AI giúp rút gọn danh sách ứng viên cần tổng hợp và thử nghiệm thực tế.",
  },
  {
    name: "Thử nghiệm trên động vật",
    traditionalYears: 1.5,
    aiYears: 0.4,
    description:
      "AI dự đoán độc tính sớm, giảm số lượng thử nghiệm động vật không cần thiết.",
  },
  {
    name: "Thử nghiệm lâm sàng pha 1–3",
    traditionalYears: 7,
    aiYears: 5,
    description:
      "Đây là giai đoạn AI chưa rút ngắn nhiều — vì vẫn phải theo dõi bệnh nhân thật theo thời gian thật. AI giúp tuyển chọn bệnh nhân phù hợp nhanh hơn.",
  },
];

function DrugDiscoveryTimeline() {
  const [phase, setPhase] = useState(0);

  const cumulativeTrad = useMemo(() => {
    return DRUG_STAGES.reduce(
      (acc, s, i) => {
        acc.push((acc[i - 1] ?? 0) + s.traditionalYears);
        return acc;
      },
      [] as number[],
    );
  }, []);

  const cumulativeAI = useMemo(() => {
    return DRUG_STAGES.reduce(
      (acc, s, i) => {
        acc.push((acc[i - 1] ?? 0) + s.aiYears);
        return acc;
      },
      [] as number[],
    );
  }, []);

  const totalTrad = cumulativeTrad[cumulativeTrad.length - 1] ?? 0;
  const totalAI = cumulativeAI[cumulativeAI.length - 1] ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Demo 3 — Tốc độ phát triển thuốc trước và sau AI
        </h3>
        <p className="text-sm text-muted">
          Một loại thuốc mới cần khoảng 15 năm và hơn 1 tỷ USD để ra thị
          trường. AI (đặc biệt từ 2020 trở đi với AlphaFold và các mô hình
          sinh phân tử) đang rút ngắn phần lớn các giai đoạn đầu — dù giai
          đoạn thử nghiệm trên người vẫn phải theo nhịp thời gian thật.
          Bấm qua các giai đoạn để so sánh.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DRUG_STAGES.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPhase(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              phase === i
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-surface-hover"
            }`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-3 text-sm font-semibold text-foreground">
              {DRUG_STAGES[phase]!.name}
            </div>
            <p className="mb-4 text-sm text-muted">
              {DRUG_STAGES[phase]!.description}
            </p>

            <div className="space-y-3">
              <TimelineBar
                label="Cách truyền thống"
                years={DRUG_STAGES[phase]!.traditionalYears}
                maxYears={7}
                color="bg-slate-400"
              />
              <TimelineBar
                label="Có AI hỗ trợ"
                years={DRUG_STAGES[phase]!.aiYears}
                maxYears={7}
                color="bg-accent"
              />
            </div>

            <div className="mt-4 text-xs text-muted">
              Tiết kiệm:{" "}
              <span className="font-semibold text-emerald-600">
                {(
                  DRUG_STAGES[phase]!.traditionalYears -
                  DRUG_STAGES[phase]!.aiYears
                ).toFixed(1)}{" "}
                năm
              </span>{" "}
              ở riêng giai đoạn này
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Tổng thời gian truyền thống
          </div>
          <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
            ~{totalTrad.toFixed(1)} năm
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Chưa kể pha 4 (post-marketing)
          </div>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent-light p-4">
          <div className="text-xs uppercase tracking-wide text-accent">
            Tổng với AI hỗ trợ
          </div>
          <div className="mt-1 text-3xl font-bold text-accent-dark">
            ~{totalAI.toFixed(1)} năm
          </div>
          <div className="mt-1 text-xs text-accent-dark/80">
            Tiết kiệm ~{(totalTrad - totalAI).toFixed(1)} năm tổng cộng
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineBar({
  label,
  years,
  maxYears,
  color,
}: {
  label: string;
  years: number;
  maxYears: number;
  color: string;
}) {
  const pct = (years / maxYears) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-semibold text-foreground">
          {years} năm
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trang chính
// ---------------------------------------------------------------------------

export default function AIInHealthcareTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Vai trò đúng nhất của AI đọc X-quang hiện nay tại bệnh viện Việt Nam là gì?",
        options: [
          "Thay thế bác sĩ X-quang vì AI chính xác hơn",
          "Gợi ý vùng nghi ngờ để bác sĩ tập trung kiểm tra kỹ — bác sĩ vẫn ký kết luận cuối cùng",
          "Chỉ dùng cho bệnh nhân không mua bảo hiểm",
        ],
        correct: 1,
        explanation:
          "AI tốt nhất ở phát hiện pattern trong ảnh, nhanh, nhất quán, không mệt. Bác sĩ tốt nhất ở kết nối hình ảnh với bệnh sử, triệu chứng, kết quả xét nghiệm khác, và hiểu context bệnh nhân. VinAI (VinBrain DrAid), FPT AI Medical tại Việt Nam đều triển khai theo mô hình 'AI gợi ý — bác sĩ quyết định'. Cả FDA Mỹ và Bộ Y tế VN đều yêu cầu mô hình này cho thiết bị y tế dùng AI.",
      },
      {
        question:
          "Bệnh nhân tổn thương da vào khám. AI đưa kết luận 'ung thư hắc tố 95%'. Bác sĩ cần làm gì trước khi báo cho bệnh nhân?",
        options: [
          "Nói ngay với bệnh nhân để không lãng phí thời gian",
          "Kiểm tra liệu AI có được train trên tông da tương tự bệnh nhân không — nhiều AI da liễu hiện nay train chủ yếu trên da sáng, có thể sai khi gặp da tối",
          "Chuyển luôn sang hóa trị",
        ],
        correct: 1,
        explanation:
          "Bias dữ liệu là một trong những vấn đề lớn nhất của AI y tế. Nghiên cứu Adamson & Smith 2018 cho thấy AI ung thư da train chủ yếu trên da sáng có độ nhạy tụt nghiêm trọng với da tối. Một kết quả 'chắc chắn 95%' trên domain chưa được validate là không đáng tin. Bác sĩ luôn phải kiểm tra mô hình có phù hợp với nhóm bệnh nhân trước mặt mình hay không.",
      },
      {
        question:
          "VinBrain DrAid là một trong những sản phẩm AI y tế nổi bật nhất Việt Nam. DrAid chủ yếu làm gì?",
        options: [
          "Thay thế toàn bộ hồ sơ bệnh án điện tử",
          "Hỗ trợ đọc X-quang phổi và các hình ảnh chẩn đoán, đã triển khai tại hàng chục bệnh viện VN",
          "Kê đơn thuốc tự động",
        ],
        correct: 1,
        explanation:
          "DrAid (VinBrain thuộc VinGroup) tập trung vào chẩn đoán hình ảnh: X-quang ngực, CT sọ não, nhũ ảnh. Đã được Bộ Y tế cấp phép và triển khai tại nhiều bệnh viện lớn. Vai trò: lọc nhanh, phát hiện sớm các bất thường để bác sĩ X-quang tập trung vào những ca phức tạp. Đây là điển hình cho định hướng 'AI hỗ trợ, bác sĩ quyết' tại Việt Nam.",
      },
      {
        question:
          "Trong phòng cấp cứu đông người, AI phân loại mức độ ưu tiên dựa trên triệu chứng và dấu hiệu sinh tồn. Giá trị lớn nhất là gì?",
        options: [
          "Thay thế điều dưỡng phân loại",
          "Phát hiện sớm các ca nguy kịch có thể bị che lấp trong đám đông — ví dụ nhồi máu cơ tim ở bệnh nhân trẻ, đột quỵ giai đoạn sớm",
          "Tăng doanh thu bệnh viện",
        ],
        correct: 1,
        explanation:
          "Trong giờ cao điểm, điều dưỡng phân loại có thể xếp nhầm thứ tự, đặc biệt khi ca nguy kịch không có dấu hiệu 'ồn ào' rõ rệt. AI quét nhanh dấu hiệu sinh tồn, so với chuẩn, gợi ý 'ưu tiên ca này ngay'. Các bệnh viện Mỹ và châu Âu đã giảm thời gian cửa-đến-điều-trị đáng kể với AI triage. Tại VN, các bệnh viện lớn như Bạch Mai, Chợ Rẫy đang triển khai thử nghiệm.",
      },
      {
        question:
          "AlphaFold (DeepMind, 2020+) giải quyết vấn đề gì trong y tế?",
        options: [
          "Chẩn đoán bệnh qua hình ảnh",
          "Dự đoán cấu trúc 3D của protein — giúp các nhà khoa học hiểu cách thiết kế thuốc bám vào đúng protein mục tiêu",
          "Tự động kê đơn thuốc",
        ],
        correct: 1,
        explanation:
          "Thuốc hoạt động bằng cách gắn vào một protein nào đó trong cơ thể (như chìa khóa vào ổ khóa). Để thiết kế chìa khóa đúng, cần biết hình dạng ổ khóa. Trước AlphaFold, xác định cấu trúc một protein mất 1-3 năm phòng thí nghiệm. Bây giờ vài giây máy tính. AlphaFold đã công bố cấu trúc của hơn 200 triệu protein — một đóng góp khổng lồ cho ngành dược.",
      },
      {
        question:
          "Bệnh viện A train mô hình AI đọc X-quang trên dữ liệu bệnh viện mình, rất chính xác. Khi chuyển sang bệnh viện B, độ chính xác tụt 15%. Nguyên nhân thường gặp nhất?",
        options: [
          "Bác sĩ bệnh viện B kém hơn",
          "Phân phối dữ liệu khác: máy chụp khác hãng, protocol chụp khác, đặc điểm bệnh nhân khác — mô hình không generalize",
          "AI không thích bệnh viện B",
        ],
        correct: 1,
        explanation:
          "'Domain shift' là bài toán kinh điển của AI y tế. Máy X-quang Siemens cho ảnh khác GE, độ phơi sáng khác, tư thế chụp khác, dân số bệnh khác. Đây là lý do các sản phẩm AI y tế nghiêm túc phải validate trên nhiều bệnh viện, nhiều loại máy, trước khi được cấp phép. Bộ Y tế Việt Nam và FDA Mỹ đều yêu cầu 'real-world evidence' từ nhiều cơ sở.",
      },
      {
        question:
          "Bệnh án điện tử của chị Hoa có mô tả 'đau đầu thường xuyên'. AI tóm tắt thành 'đau nửa đầu migraine'. Vấn đề gì đang xảy ra?",
        options: [
          "Không có vấn đề — AI tiết kiệm thời gian",
          "AI 'bịa' chẩn đoán không có trong bệnh án gốc (hallucination) — cực kỳ nguy hiểm trong y tế nếu không kiểm tra",
          "Bác sĩ viết bệnh án sai",
        ],
        correct: 1,
        explanation:
          "Hallucination là khi LLM tự chế thông tin nghe có vẻ hợp lý. 'Đau đầu thường xuyên' không có nghĩa là migraine — đó là chẩn đoán cần bác sĩ khám kỹ. AI tóm tắt bệnh án là công cụ hữu ích NHƯNG phải có lớp review con người. Các đợt thử nghiệm tại bệnh viện Hà Nội và các bệnh viện TP.HCM đều giữ nguyên tắc bác sĩ xác nhận mọi bản tóm tắt AI trước khi ghi vào hồ sơ chính thức.",
      },
      {
        type: "fill-blank",
        question:
          "Năm ứng dụng chính của AI trong y tế: đọc ảnh {blank}, phân loại {blank} trong cấp cứu, phát triển {blank}, tóm tắt bệnh án và {blank} lâm sàng.",
        blanks: [
          {
            answer: "y khoa",
            accept: ["X-quang", "y te", "imaging", "hình ảnh", "y tế"],
          },
          {
            answer: "ưu tiên",
            accept: ["triage", "cap cuu", "cấp cứu", "uu tien"],
          },
          {
            answer: "thuốc",
            accept: ["drug", "thuoc", "dược phẩm"],
          },
          {
            answer: "hỗ trợ",
            accept: ["ho tro", "quyết định", "decision support"],
          },
        ],
        explanation:
          "Năm trụ cột AI y tế: chẩn đoán hình ảnh (VinBrain DrAid, FPT AI Medical), phân loại cấp cứu (triage), phát triển thuốc (AlphaFold, Isomorphic Labs), tóm tắt bệnh án (dùng LLM với kiểm soát), và hỗ trợ quyết định lâm sàng (clinical decision support — gợi ý cho bác sĩ, không thay quyết định).",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bệnh viện có 1 bác sĩ X-quang, 500 phim cần đọc mỗi ngày, mỗi phim trung bình 5 phút. Giải pháp hợp lý nhất với AI hiện tại là gì?"
          options={[
            "Thuê thêm 4 bác sĩ X-quang",
            "Cho AI thay bác sĩ đọc toàn bộ 500 phim",
            "Để bệnh nhân tự đọc phim của mình",
            "AI lọc trước: 80% phim bình thường được AI xác nhận nhanh, 20% phim nghi ngờ bác sĩ đọc kỹ — bác sĩ ký kết luận cuối",
          ]}
          correct={3}
          explanation="Mô hình 'AI-assisted reading' là cách triển khai chuẩn tại các bệnh viện Việt Nam hiện nay (Bạch Mai, Chợ Rẫy, 108, Vinmec, các BV tuyến tỉnh sử dụng DrAid). AI không thay bác sĩ — nó lọc ca dễ để bác sĩ dành thời gian cho ca khó. Kết quả: bác sĩ đọc kỹ hơn, sai sót giảm, thời gian trả kết quả nhanh hơn. FDA Mỹ và Bộ Y tế VN đều cấp phép AI y tế theo mô hình hỗ trợ này, không phải thay thế."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Phép ẩn dụ">
            <p>
              Hãy hình dung bác sĩ giống như một người lái xe đường dài trong
              đêm. Mắt họ cảnh giác, nhưng sau 10 giờ làm việc, ánh mắt bắt
              đầu mỏi, các chi tiết nhỏ dễ bị bỏ qua. Một chiếc xe hiện đại
              lắp cảm biến cảnh báo va chạm — nó không lái thay người, nhưng
              khi phát hiện vật thể lạ ở điểm mù, nó{" "}
              <strong>nháy đèn và kêu chuông</strong> để tài xế nhìn lại.
            </p>
            <p>
              AI trong y tế làm đúng việc của chiếc cảm biến đó. Bác sĩ X-quang
              đọc 500 phim một ngày, đến phim thứ 400 mắt đã mỏi rã. AI quét
              qua từng phim trong vài giây, <em>tô cam</em> vùng có thể là
              tổn thương. Bác sĩ không bắt buộc phải tin AI — nhưng nếu AI tô
              cam một điểm và bác sĩ nhìn kỹ lại, có thêm một con mắt không
              mệt mỏi đứng bên cạnh.
            </p>
            <p>
              Cái hay của phép ẩn dụ này là nó cũng lộ ra{" "}
              <em>giới hạn</em>: cảm biến có thể báo động nhầm (con mèo băng
              qua đường), có thể bỏ sót (sương mù dày). Tài xế vẫn phải là
              người lái, người chịu trách nhiệm. AI y tế cũng vậy: nó là một
              cặp mắt phụ, không phải một bác sĩ độc lập — và ở Việt Nam cũng
              như nhiều nước, luật pháp yêu cầu đúng như thế.
            </p>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug={metadata.slug}>
              <div className="flex flex-col gap-8">
                <LungScanDemo />
                <TriageDemo />
                <DrugDiscoveryTimeline />
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AI trong y tế không thay thế bác sĩ — nó làm{" "}
                <strong>bác sĩ mạnh hơn</strong>. Bác sĩ một mình không mệt
                mỏi có thể đọc 100 phim chính xác. Cộng AI đứng cạnh gợi ý,
                có thể đọc 500 phim với độ chính xác tương đương mà còn phát
                hiện sớm hơn những ca khó mà mắt người mỏi có thể bỏ sót.
              </p>
              <p>
                Điểm sâu hơn:{" "}
                <em>
                  mỗi ngưỡng cảnh báo của AI là một lựa chọn đạo đức
                </em>
                . Đặt ngưỡng thấp, AI báo động nhiều — bác sĩ mệt vì nhiễu.
                Đặt cao, AI im lặng — có thể bỏ sót ca ung thư sớm. Không có
                con số "đúng" chung cho mọi bệnh viện. Cùng một mô hình, một
                bệnh viện cấp cứu và một phòng sàng lọc cộng đồng sẽ đặt
                ngưỡng khác nhau. Đây là lý do AI y tế luôn là cuộc hợp tác
                giữa kỹ sư, bác sĩ, và đạo đức y học.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Một hệ thống AI sàng lọc ung thư vú đạt độ nhạy 98% và độ đặc hiệu 90%. Bệnh viện sàng lọc 10.000 phụ nữ, trong đó 50 có ung thư thật. Ước lượng có bao nhiêu người dương tính giả?"
              options={[
                "Rất ít vì AI chính xác 95%",
                "Khoảng 995 người — vì 9.950 người khỏe × 10% dương tính giả ≈ 995, trong khi chỉ ~49 ca ung thư thật được phát hiện đúng",
                "0 — AI không sai bao giờ",
              ]}
              correct={1}
              explanation="Đây là 'base rate problem' — một trong những bẫy nhận thức lớn nhất trong y tế. Với bệnh hiếm, ngay cả mô hình độ đặc hiệu 90% cũng tạo ra hàng trăm dương tính giả cho mỗi vài chục ca đúng. Hệ quả: sàng lọc KHÔNG BAO GIỜ được đứng một mình — luôn cần một bước xác minh thứ hai (nhũ ảnh chuyên sâu, sinh thiết) trước khi nói với bệnh nhân 'bạn có ung thư'."
            />
            <InlineChallenge
              question="AI da liễu được train chủ yếu trên da sáng. Bạn là bác sĩ tại VN, nhiều bệnh nhân có tông da trung bình đến tối. Bạn nên làm gì?"
              options={[
                "Dùng AI y như hướng dẫn nhà sản xuất",
                "Yêu cầu nhà cung cấp cho thấy dữ liệu validation trên tông da tương tự bệnh nhân VN — nếu không có, dùng AI một cách thận trọng và luôn đối chiếu với khám lâm sàng",
                "Bỏ AI, quay về chỉ khám bằng mắt",
              ]}
              correct={1}
              explanation="Bias dữ liệu không phải lỗi kỹ thuật mờ mịt — nó là câu hỏi lâm sàng trực tiếp. Nghiên cứu Adamson & Smith (2018) cho thấy AI da liễu train trên ISIC (chủ yếu da sáng) có độ nhạy giảm mạnh với da tối. Bác sĩ có quyền và nghĩa vụ hỏi nhà cung cấp: 'Mô hình đã validate trên nhóm bệnh nhân nào?' Thiếu thông tin này = không thể dùng AI cho quyết định nặng nề."
            />
            <InlineChallenge
              question="Bệnh viện muốn triển khai AI chẩn đoán mới. Ngoài độ chính xác, nhân viên tuân thủ cần kiểm tra điều gì trước khi ký hợp đồng?"
              options={[
                "Chỉ cần giá rẻ",
                "Giấy phép của Bộ Y tế VN (nếu đăng ký là thiết bị y tế), validation độc lập, khả năng giải thích quyết định, quy trình xử lý khi AI sai, và bảo mật dữ liệu theo Nghị định 13/2023",
                "Chỉ cần AI chạy trên cloud lớn",
              ]}
              correct={1}
              explanation="AI y tế tại VN đang được quản lý như thiết bị y tế. Bộ Y tế đã cấp phép cho một số sản phẩm (DrAid của VinBrain). Hợp đồng phải cover: chứng nhận, validation, explainability (Grad-CAM hoặc tương đương), trách nhiệm khi sai, và bảo mật dữ liệu (Nghị định 13/2023 về dữ liệu cá nhân, áp dụng cho hồ sơ y tế). Bỏ qua bất kỳ mục nào = rủi ro pháp lý và y khoa."
            />
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
            <ExplanationSection topicSlug={metadata.slug}>
              <p>
                Năm mảng lớn của AI trong y tế đều đã có sản phẩm thực tế
                tại Việt Nam hoặc đang trong giai đoạn thử nghiệm lâm sàng.
                Mỗi mảng có một bài toán riêng và giới hạn riêng — hiểu đúng
                cả hai giúp nhân viên y tế phối hợp với AI đúng cách thay
                vì kỳ vọng thái quá hoặc từ chối cứng.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Callout variant="info" title="1. Chẩn đoán hình ảnh">
                  <p className="flex items-start gap-2">
                    <Microscope className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI đọc X-quang, CT, MRI, nhũ ảnh, nội soi. Tô cam vùng
                      nghi ngờ, đo kích thước tổn thương, so sánh với phim
                      cũ. <strong>Ví dụ VN:</strong> VinBrain DrAid (X-quang
                      phổi, CT sọ, nhũ ảnh) đã triển khai tại nhiều bệnh
                      viện VN và được Bộ Y tế cấp phép; FPT AI Medical hỗ
                      trợ các bệnh viện tuyến tỉnh.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="2. Phân loại cấp cứu">
                  <p className="flex items-start gap-2">
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI phân loại mức độ ưu tiên (triage) dựa trên triệu
                      chứng, dấu hiệu sinh tồn, và cảnh báo sớm các ca nguy
                      kịch. Đặc biệt hữu ích với nhồi máu cơ tim, đột quỵ,
                      nhiễm trùng huyết — nơi "thời gian là não" hoặc "thời
                      gian là cơ tim".
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="3. Phát triển thuốc">
                  <p className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AlphaFold (DeepMind) dự đoán cấu trúc hơn 200 triệu
                      protein — cung cấp "ổ khóa" để các công ty dược thiết
                      kế "chìa khóa". Isomorphic Labs, Recursion, Insilico
                      Medicine đã có thuốc ứng viên vào thử nghiệm lâm sàng
                      chỉ sau 2-3 năm thay vì 7-10.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="4. Tóm tắt bệnh án">
                  <p className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      LLM tóm tắt ghi chú khám, dịch thuật ngữ chuyên môn,
                      soạn thư giới thiệu giữa các khoa. Giảm tải hành chính
                      cho bác sĩ. <strong>Lưu ý quan trọng:</strong> luôn
                      cần bác sĩ xác nhận trước khi ghi vào hồ sơ chính
                      thức — hallucination là rủi ro thực.
                    </span>
                  </p>
                </Callout>

                <Callout
                  variant="info"
                  title="5. Hỗ trợ quyết định lâm sàng"
                >
                  <p className="flex items-start gap-2">
                    <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI gợi ý chẩn đoán phân biệt, cảnh báo tương tác
                      thuốc, nhắc tuân thủ phác đồ. Vai trò phải là{" "}
                      <em>gợi ý</em>, không phải ra quyết định. Bác sĩ luôn
                      là người ký và chịu trách nhiệm pháp lý.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="Bên cạnh 5 mảng trên">
                  <p className="flex items-start gap-2">
                    <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI còn được dùng cho theo dõi bệnh nhân từ xa (home
                      monitoring), phân tích dữ liệu di truyền, dự đoán
                      nguy cơ tái nhập viện, và tối ưu lịch mổ/giường bệnh.
                      Các bệnh viện tư nhân lớn (Vinmec, Tâm Anh, Hoàn Mỹ)
                      đang thử nghiệm nhiều mảng này.
                    </span>
                  </p>
                </Callout>
              </div>

              <h3>AI y tế tại Việt Nam: ba cái tên cần biết</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StoryCard
                  name="VinBrain / DrAid"
                  sector="VinGroup"
                  body="Sản phẩm AI y tế đầu tiên của VN được Bộ Y tế cấp phép. DrAid hỗ trợ đọc X-quang ngực, CT sọ não, nhũ ảnh. Đã triển khai tại nhiều bệnh viện tuyến trung ương và tuyến tỉnh."
                  icon={Hospital}
                />
                <StoryCard
                  name="FPT AI Medical"
                  sector="Tập đoàn FPT"
                  body="Nền tảng AI cho bệnh viện VN — từ chatbot y tế đến hỗ trợ chẩn đoán hình ảnh. Hợp tác với các bệnh viện công và tư để triển khai AI tuân thủ quy định VN."
                  icon={Building2}
                />
                <StoryCard
                  name="Bệnh viện FV & Hanoi French Hospital"
                  sector="Bệnh viện tư đa quốc gia"
                  body="Các bệnh viện tư đa quốc gia tại VN là nơi sớm thử nghiệm AI y tế theo chuẩn quốc tế — đặc biệt cho chẩn đoán hình ảnh và hỗ trợ quyết định lâm sàng."
                  icon={HeartPulse}
                />
              </div>

              <h3>Bối cảnh pháp lý & đạo đức</h3>
              <TabView
                tabs={[
                  {
                    label: "Quy định Việt Nam",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>Luật Khám bệnh, chữa bệnh 2023</strong> —
                          khung pháp lý chung cho hoạt động y tế, bao gồm
                          trách nhiệm khi dùng công nghệ hỗ trợ.
                        </li>
                        <li>
                          <strong>Nghị định 98/2021/NĐ-CP</strong> về quản
                          lý trang thiết bị y tế — AI y tế được phân loại
                          như trang thiết bị y tế, phải đăng ký và cấp phép
                          với Bộ Y tế.
                        </li>
                        <li>
                          <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo
                          vệ dữ liệu cá nhân — áp dụng đặc biệt nghiêm ngặt
                          cho dữ liệu y tế (thuộc nhóm nhạy cảm).
                        </li>
                        <li>
                          <strong>Hội đồng đạo đức y học (IRB)</strong> —
                          bắt buộc cho mọi nghiên cứu dùng dữ liệu bệnh
                          nhân, kể cả khi chỉ để train AI.
                        </li>
                      </ul>
                    ),
                  },
                  {
                    label: "Chuẩn quốc tế tham chiếu",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>FDA SaMD</strong> (Software as a Medical
                          Device) — phân loại AI y tế theo mức rủi ro,
                          quyết định quy trình cấp phép.
                        </li>
                        <li>
                          <strong>CE Marking (EU MDR)</strong> — chuẩn châu
                          Âu cho thiết bị y tế, nhiều sản phẩm AI y tế vào
                          VN qua hồ sơ CE.
                        </li>
                        <li>
                          <strong>IEC 62304</strong> — chu trình phát triển
                          phần mềm y tế.
                        </li>
                        <li>
                          <strong>
                            Good Machine Learning Practice (GMLP)
                          </strong>{" "}
                          — hướng dẫn liên ngành của FDA, Health Canada, và
                          MHRA về phát triển AI y tế có trách nhiệm.
                        </li>
                      </ul>
                    ),
                  },
                  {
                    label: "Câu hỏi đạo đức",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>Ai chịu trách nhiệm khi AI sai?</strong>{" "}
                          Hiện tại: bác sĩ ký kết luận — vì vậy bác sĩ có
                          quyền override AI và phải explainable để quyết
                          định có cơ sở.
                        </li>
                        <li>
                          <strong>
                            AI có nên báo tin xấu cho bệnh nhân trước bác
                            sĩ?
                          </strong>{" "}
                          Đa số hệ thống y tế: không. Thông tin y tế cần
                          được truyền đạt với context và đồng cảm.
                        </li>
                        <li>
                          <strong>Công bằng giữa các nhóm bệnh nhân:</strong>{" "}
                          nếu mô hình hoạt động tốt với nhóm A nhưng kém
                          với nhóm B, đó không chỉ là vấn đề kỹ thuật mà
                          là vấn đề đạo đức y tế.
                        </li>
                      </ul>
                    ),
                  },
                ]}
              />

              <CollapsibleDetail title="Những cái bẫy thường gặp của AI y tế">
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  <li>
                    <strong>Bias dữ liệu train:</strong> Nghiên cứu nổi
                    tiếng cho thấy AI da liễu train chủ yếu trên da sáng
                    có độ nhạy tụt mạnh với da tối. Nhiều dataset y tế
                    không đại diện cho đa dạng dân số — điều này đặc biệt
                    quan trọng với nhân viên y tế Việt Nam khi đánh giá
                    sản phẩm nước ngoài.
                  </li>
                  <li>
                    <strong>Hallucination trong tóm tắt bệnh án:</strong>{" "}
                    LLM có thể "bịa" chẩn đoán hoặc triệu chứng nghe có
                    vẻ hợp lý nhưng không có trong ghi chú gốc. Luôn cần
                    bác sĩ review — không bao giờ để AI ghi thẳng vào hồ
                    sơ chính thức.
                  </li>
                  <li>
                    <strong>Domain shift giữa các bệnh viện:</strong> Máy
                    X-quang khác hãng, protocol chụp khác, dân số khác —
                    mô hình tốt ở bệnh viện A có thể tụt accuracy 10–20%
                    tại bệnh viện B. Vì vậy cần validation trên từng cơ
                    sở trước triển khai.
                  </li>
                  <li>
                    <strong>Automation bias:</strong> bác sĩ tin AI quá
                    mức → không kiểm tra kỹ khi AI đồng ý với ấn tượng ban
                    đầu. Một số bệnh viện yêu cầu bác sĩ ký kết luận
                    trước khi xem gợi ý AI để tránh bias này (two-step
                    read).
                  </li>
                  <li>
                    <strong>Rủi ro pháp lý khi không có giấy phép:</strong>{" "}
                    AI y tế chưa đăng ký với Bộ Y tế mà dùng cho quyết
                    định lâm sàng = rủi ro pháp lý nghiêm trọng. Luôn kiểm
                    tra giấy phép trước khi triển khai.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Phối hợp giữa bác sĩ và AI: ba nguyên tắc">
                <p>
                  Với nhân viên y tế muốn phối hợp tốt với AI trong công việc
                  hàng ngày:
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  <li>
                    <strong>Giữ nguyên kỹ năng lâm sàng.</strong> AI tô cam
                    vùng nghi ngờ, nhưng nếu bác sĩ mất dần thói quen quét
                    toàn phim, ca mà AI bỏ sót sẽ không ai bắt được. Giữ
                    "đọc một mình" là bài tập kỹ năng định kỳ.
                  </li>
                  <li>
                    <strong>Luôn hỏi: mô hình đã validate trên nhóm nào?</strong>{" "}
                    Trước khi tin một kết luận AI, cần biết nó đã được
                    validate trên dân số tương tự bệnh nhân trước mặt hay
                    chưa. Câu hỏi này cần đặt với nhà cung cấp, không chỉ
                    tin vào tờ rơi.
                  </li>
                  <li>
                    <strong>Logging đầy đủ mọi quyết định dùng AI.</strong>{" "}
                    Ghi rõ: AI gợi ý gì, bác sĩ quyết gì, tại sao. Nếu có
                    khiếu nại sau này, bệnh viện có thể tái hiện và bảo vệ
                    quyết định lâm sàng.
                  </li>
                </ol>
              </CollapsibleDetail>

              <CollapsibleDetail title="AI y tế sẽ phát triển ra sao 2025–2030?">
                <p>
                  Các xu hướng đáng chú ý:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  <li>
                    <strong>Mô hình đa phương thức</strong> — kết hợp ảnh,
                    văn bản, số liệu xét nghiệm, thậm chí giọng nói bệnh
                    nhân để đưa ra gợi ý tổng hợp. Đã có các foundation
                    model y tế như BiomedGPT, Med-PaLM, MedSAM.
                  </li>
                  <li>
                    <strong>Federated learning giữa các bệnh viện</strong> —
                    cho phép bệnh viện train mô hình chung mà không cần
                    chuyển dữ liệu bệnh nhân ra ngoài. Giải pháp quan trọng
                    cho bảo mật.
                  </li>
                  <li>
                    <strong>AI chăm sóc từ xa cho dân số nông thôn</strong>{" "}
                    — một cơ hội lớn cho VN: dùng AI giúp trạm y tế xã đánh
                    giá ca bệnh, chuyển tuyến kịp thời.
                  </li>
                  <li>
                    <strong>Khung pháp lý chuẩn hóa</strong> — Bộ Y tế VN
                    dự kiến ban hành thêm hướng dẫn cho AI y tế trong các
                    năm tới, theo hướng hài hòa với FDA SaMD và EU AI Act.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p className="text-sm text-muted">
                Khi bạn đã nắm năm trụ cột và khung pháp lý, hầu hết tin tức
                về "AI mới trong y tế" sẽ rơi vào một trong các ô có sẵn —
                và bạn sẽ biết đặt câu hỏi phù hợp: mô hình train trên ai,
                validate thế nào, ai ký quyết định cuối.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những điều cần nhớ"
              points={[
                "Năm mảng AI y tế chính: chẩn đoán hình ảnh, phân loại cấp cứu, phát triển thuốc, tóm tắt bệnh án, hỗ trợ quyết định lâm sàng.",
                "Nguyên tắc vàng: AI hỗ trợ, bác sĩ quyết định và ký tên. FDA, Bộ Y tế VN đều cấp phép AI y tế theo mô hình này.",
                "Tại Việt Nam: VinBrain DrAid đã được Bộ Y tế cấp phép cho đọc X-quang phổi, CT sọ, nhũ ảnh; FPT AI Medical hợp tác nhiều bệnh viện; các BV đa quốc gia như FV, Hanoi French Hospital thử nghiệm sớm theo chuẩn quốc tế.",
                "Bias dữ liệu là rủi ro lớn: mô hình train chủ yếu trên một nhóm dân số có thể sai khi gặp nhóm khác — luôn kiểm tra validation trên nhóm bệnh nhân của mình.",
                "Khung pháp lý VN: Luật Khám chữa bệnh 2023, Nghị định 98/2021 (thiết bị y tế), Nghị định 13/2023 (dữ liệu cá nhân), đạo đức IRB. Chuẩn quốc tế: FDA SaMD, CE, GMLP.",
                "AlphaFold (2020+) đã rút ngắn đáng kể giai đoạn đầu của phát triển thuốc; giai đoạn thử nghiệm lâm sàng trên người vẫn phải theo thời gian thật.",
              ]}
            />
          </LessonSection>

          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}

function StoryCard({
  name,
  sector,
  body,
  icon: Icon,
}: {
  name: string;
  sector: string;
  body: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface/60 p-4"
    >
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-accent-light p-2">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          <Building2 className="h-3 w-3" />
          {sector}
        </div>
      </div>
      <div className="text-sm font-semibold text-foreground">{name}</div>
      <div className="text-xs text-muted">{body}</div>
    </motion.div>
  );
}
