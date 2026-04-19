"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  SliderGroup,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên để không phá liên kết nội bộ
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "scaling-laws",
  title: "Scaling Laws",
  titleVi: "Định luật tỷ lệ",
  description:
    "Quy luật toán học dự đoán hiệu suất mô hình dựa trên kích thước tham số, dữ liệu và compute.",
  category: "llm-concepts",
  tags: ["scaling", "compute", "chinchilla", "training"],
  difficulty: "advanced",
  relatedSlugs: ["llm-overview", "cost-optimization", "gpu-optimization"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// HẰNG SỐ VÀ HÀM TOÁN HỌC
// ---------------------------------------------------------------------------
// Hai họ công thức chính:
//   1. Kaplan et al. 2020:    L(N) ≈ (N_c / N)^α_N
//   2. Hoffmann et al. 2022 (Chinchilla):
//        L(N, D) = E + A/N^α + B/D^β
// Ở đây ta dùng các tham số lấy từ paper Chinchilla.

const CHINCHILLA = {
  E: 1.69, // Irreducible loss — giới hạn dưới lý thuyết
  A: 406.4,
  B: 410.7,
  alpha: 0.34,
  beta: 0.28,
};

// Compute budget tính theo công thức xấp xỉ C ≈ 6 · N · D
// (6 FLOPs cho mỗi cặp tham số × token trong huấn luyện Transformer).
function computeFlops(paramsB: number, tokensB: number): number {
  const N = paramsB * 1e9;
  const D = tokensB * 1e9;
  return 6 * N * D;
}

function chinchillaLoss(paramsB: number, tokensB: number): number {
  const N = paramsB * 1e9;
  const D = tokensB * 1e9;
  return (
    CHINCHILLA.E +
    CHINCHILLA.A / Math.pow(N, CHINCHILLA.alpha) +
    CHINCHILLA.B / Math.pow(D, CHINCHILLA.beta)
  );
}

// Với compute budget C, Chinchilla rule cho N* và D* tối ưu.
// Các hệ số a, b lấy từ bảng 3 của paper (xấp xỉ):
//   N_opt = a · C^0.5   ,  D_opt = b · C^0.5
// Trong đó a ≈ 0.6 · 1e9^(-0.5), b ≈ 0.2 · 1e9^(-0.5) được điều chỉnh
// để kết quả khớp với các mốc thực nghiệm. Ta đơn giản hoá bằng tỷ lệ
// D* / N* ≈ 20 (rule of thumb được nhiều team công bố).
function optimalN_D(flops: number): { N: number; D: number } {
  // N_opt · D_opt = C / 6 ; D_opt / N_opt ≈ 20
  // → N_opt = sqrt(C / 120) , D_opt = 20 · N_opt
  const N = Math.sqrt(flops / 120);
  const D = 20 * N;
  return { N, D };
}

// ---------------------------------------------------------------------------
// CÁC MÔ HÌNH LỊCH SỬ (ĐỂ VẼ LÊN BIỂU ĐỒ CHINCHILLA)
// ---------------------------------------------------------------------------
// Dữ liệu params / tokens / loss được rút gọn từ các báo cáo chính thức.
// Mục đích minh họa, không yêu cầu chính xác số thập phân tuyệt đối.

type ModelPoint = {
  name: string;
  paramsB: number; // N (tỷ tham số)
  tokensB: number; // D (tỷ token)
  year: string;
  tag: "overtrained" | "balanced" | "undertrained";
  note: string;
  color: string;
};

const MODELS: ModelPoint[] = [
  {
    name: "GPT-3 (2020)",
    paramsB: 175,
    tokensB: 300,
    year: "2020",
    tag: "undertrained",
    note: "Ratio D/N ≈ 1.7 — quá ít data so với model lớn.",
    color: "#ef4444",
  },
  {
    name: "Gopher (DeepMind, 2021)",
    paramsB: 280,
    tokensB: 300,
    year: "2021",
    tag: "undertrained",
    note: "Giống GPT-3: model lớn, data chưa đủ. D/N ≈ 1.",
    color: "#f97316",
  },
  {
    name: "Chinchilla (2022)",
    paramsB: 70,
    tokensB: 1400,
    year: "2022",
    tag: "balanced",
    note: "D/N ≈ 20 — cân bằng theo rule Hoffmann. Thắng Gopher dù nhỏ hơn 4×.",
    color: "#22c55e",
  },
  {
    name: "LLaMA 1 65B (2023)",
    paramsB: 65,
    tokensB: 1400,
    year: "2023",
    tag: "balanced",
    note: "Tương tự Chinchilla — nhưng open, khởi đầu làn sóng LLM mở.",
    color: "#22c55e",
  },
  {
    name: "LLaMA 2 70B (2023)",
    paramsB: 70,
    tokensB: 2000,
    year: "2023",
    tag: "overtrained",
    note: "D/N ≈ 28 — 'overtrained' CÓ CHỦ Ý: đổi compute lấy inference rẻ.",
    color: "#3b82f6",
  },
  {
    name: "LLaMA 3 8B (2024)",
    paramsB: 8,
    tokensB: 15000,
    year: "2024",
    tag: "overtrained",
    note: "D/N ≈ 1875 — cực kỳ overtrained để có model nhỏ mà chất lượng cao.",
    color: "#3b82f6",
  },
  {
    name: "LLaMA 3 70B (2024)",
    paramsB: 70,
    tokensB: 15000,
    year: "2024",
    tag: "overtrained",
    note: "D/N ≈ 214 — vẫn là chiến lược overtrain cho inference tiết kiệm.",
    color: "#3b82f6",
  },
];

// ---------------------------------------------------------------------------
// QUIZ — 8 câu theo yêu cầu
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Theo scaling laws của Kaplan et al., gấp đôi số tham số N (giữ nguyên data và compute phân bổ) sẽ giảm loss bao nhiêu?",
    options: [
      "Giảm 50% — tỷ lệ nghịch với N.",
      "Giảm khoảng 5–7% — đây là power law với α ≈ 0.076, diminishing returns.",
      "Giảm 100% — loss về 0.",
      "Không giảm — loss chỉ phụ thuộc dữ liệu.",
    ],
    correct: 1,
    explanation:
      "Kaplan scaling law: L ∝ N^(-0.076). Gấp đôi N → loss nhân với 2^(-0.076) ≈ 0.95. Tức là giảm ~5%. Đây là diminishing returns kinh điển — mỗi lần gấp đôi ngày càng ít giá trị.",
  },
  {
    question: "Chinchilla paper (Hoffmann et al., 2022) đã chỉ ra điều gì quan trọng?",
    options: [
      "Model càng lớn càng tốt, không cần quan tâm lượng data.",
      "Với cùng budget compute, nên cân bằng N và D theo tỷ lệ D ≈ 20·N.",
      "Dữ liệu là tất cả, không cần tăng tham số.",
      "Scaling laws là sai, LLM không thể dự đoán được.",
    ],
    correct: 1,
    explanation:
      "Chinchilla chứng minh rằng GPT-3, Gopher và các model đương thời là 'undertrained' — có compute đủ để huấn luyện N tham số nhưng không có đủ data. Tỷ lệ compute-optimal là D* ≈ 20 · N*. Chinchilla 70B vượt Gopher 280B dù nhỏ hơn 4× vì được train trên 1.4T token thay vì 300B.",
  },
  {
    question:
      "Bạn có budget compute C cố định. Theo Chinchilla, nên phân bổ thế nào?",
    options: [
      "Dồn hết vào model càng lớn càng tốt.",
      "Dồn hết vào data càng nhiều càng tốt.",
      "Phân bổ sao cho N* ≈ √(C/120) và D* ≈ 20·N*.",
      "Chia đều 50/50 giữa tham số và data.",
    ],
    correct: 2,
    explanation:
      "Chinchilla compute-optimal: với C cố định, loss là tối thiểu khi N* ∝ C^0.5 và D* ∝ C^0.5, với tỷ lệ D*/N* ≈ 20. Chọn quá lệch phía N hay D đều lãng phí compute — loss cao hơn mức tối ưu.",
  },
  {
    question:
      "Tại sao LLaMA 3 8B được train trên 15T token, dù Chinchilla rule chỉ yêu cầu 160B token?",
    options: [
      "Meta không biết Chinchilla rule.",
      "Chinchilla chỉ tối ưu cho chi phí HUẤN LUYỆN; khi dùng model hàng tỷ lần, người ta cố tình overtrain để có model nhỏ — rẻ khi inference.",
      "Vì data miễn phí nên cứ đổ vào.",
      "Vì LLaMA 3 không phải là LLM.",
    ],
    correct: 1,
    explanation:
      "Chinchilla là compute-optimal cho training. Trong thực tế sản xuất, chi phí inference (chạy model để phục vụ user) thường lớn hơn chi phí training. Overtrain một model nhỏ trên rất nhiều data → model nhỏ chất lượng cao → inference rẻ hơn hẳn. Đây là chiến lược 'inference-aware scaling'.",
  },
  {
    question:
      "Công thức L(N, D) = E + A/N^α + B/D^β có ba số hạng. 'E' là gì?",
    options: [
      "Sai số đo lường khi đánh giá.",
      "Irreducible loss — giới hạn dưới lý thuyết, tương ứng entropy của ngôn ngữ tự nhiên.",
      "Kích thước embedding.",
      "Hằng số Euler trong tối ưu.",
    ],
    correct: 1,
    explanation:
      "E (~1.69 theo Chinchilla) là loss không thể giảm được dù có vô hạn tham số và vô hạn data. Nó tương ứng với entropy Shannon của phân phối văn bản — giới hạn lý thuyết. A/N^α và B/D^β là hai thành phần có thể giảm bằng cách tăng N hoặc D.",
  },
  {
    question:
      "Theo xấp xỉ C ≈ 6·N·D, huấn luyện LLaMA 3 70B trên 15T token tốn bao nhiêu FLOPs?",
    options: [
      "~6.3 · 10^22 FLOPs.",
      "~6.3 · 10^24 FLOPs.",
      "~6.3 · 10^27 FLOPs.",
      "~6.3 · 10^19 FLOPs.",
    ],
    correct: 1,
    explanation:
      "C = 6 · 70e9 · 15e12 = 6.3 · 10^24 FLOPs. Để so sánh: một H100 cho ~10^15 FLOPs/giây ở FP16. Dù 16.000 H100 chạy full-util, vẫn cần khoảng 5 ngày — chưa tính overhead giao tiếp.",
  },
  {
    question:
      "Emergent abilities (khả năng 'đột nhiên xuất hiện' ở quy mô lớn) thách thức gì cho scaling laws?",
    options: [
      "Chúng chứng minh scaling laws là giả.",
      "Chúng cho thấy loss (perplexity) có thể smooth nhưng hiệu suất trên bài toán cụ thể lại có bước nhảy — một số người lập luận đây là ảo giác do metric.",
      "Chúng cho phép model nhỏ mạnh hơn model lớn.",
      "Chúng không liên quan đến scaling laws.",
    ],
    correct: 1,
    explanation:
      "Scaling laws mô tả perplexity/loss — đại lượng smooth. Nhưng trên bài toán cụ thể (vd cộng số nhiều chữ số) ta thấy bước nhảy đột ngột ở quy mô nhất định. Schaeffer et al. (2023) lập luận 'emergence' phần lớn do chọn metric gián đoạn (accuracy đúng/sai) — nếu đổi sang metric liên tục thì vẫn smooth. Dù vậy, quan điểm chưa thống nhất.",
  },
  {
    type: "fill-blank",
    question:
      "Kaplan và Chinchilla mô tả mối quan hệ giữa loss với ba yếu tố: số {blank} (N), lượng {blank} (D), và {blank} huấn luyện (C) theo quy luật power law. Chinchilla rule: D ≈ {blank} · N cho compute-optimal.",
    blanks: [
      {
        answer: "tham số",
        accept: ["parameters", "params", "parameter", "số tham số"],
      },
      {
        answer: "dữ liệu",
        accept: ["data", "tokens", "token", "dữ liệu huấn luyện"],
      },
      { answer: "compute", accept: ["tính toán", "flops", "compute budget"] },
      { answer: "20", accept: ["hai mươi"] },
    ],
    explanation:
      "Ba yếu tố: N (parameters), D (data), C (compute). Chinchilla rule: D* ≈ 20 · N* là quy tắc thực nghiệm cho compute-optimal training. Các chiến lược 'overtrained' dùng D/N cao hơn nhiều để đổi lấy inference rẻ.",
  },
];

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function ScalingLawsTopic() {
  // Model được chọn trong biểu đồ log-log.
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  // View mode cho biểu đồ: N vs C hoặc D vs C.
  const [viewAxis, setViewAxis] = useState<"N" | "D">("N");

  const TOTAL_STEPS = 8;

  // Hàm render visualization cho SliderGroup — người dùng chọn C, nhận N*, D*.
  const budgetViz = useCallback((values: Record<string, number>) => {
    const log10C = values.compute; // slider theo log
    const C = Math.pow(10, log10C);
    const { N, D } = optimalN_D(C);
    const paramsB = N / 1e9;
    const tokensB = D / 1e9;
    const loss = chinchillaLoss(paramsB, tokensB);

    // Tìm model gần nhất để so sánh
    const nearest = MODELS.reduce((acc, m) => {
      const cm = computeFlops(m.paramsB, m.tokensB);
      const diff = Math.abs(Math.log10(cm) - log10C);
      return diff < acc.diff ? { model: m, diff } : acc;
    }, { model: MODELS[0], diff: Infinity }).model;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-surface p-3">
            <div className="text-sm font-bold text-foreground">
              10^{log10C.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted">FLOPs (C)</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-sm font-bold text-accent">
              {paramsB < 1
                ? `${(paramsB * 1000).toFixed(0)}M`
                : `${paramsB.toFixed(1)}B`}
            </div>
            <div className="text-[10px] text-muted">N* (tham số)</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-sm font-bold text-accent">
              {tokensB < 1000
                ? `${tokensB.toFixed(0)}B`
                : `${(tokensB / 1000).toFixed(1)}T`}
            </div>
            <div className="text-[10px] text-muted">D* (token)</div>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <div className="text-sm font-bold text-foreground">
              {loss.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted">Loss dự đoán</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-3 text-xs">
          <p className="text-foreground">
            <strong>Model lịch sử gần nhất:</strong> {nearest.name}
          </p>
          <p className="text-muted mt-1">{nearest.note}</p>
        </div>

        <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3 text-xs">
          <p className="text-accent font-medium">
            Tỷ lệ D*/N* = {(tokensB / paramsB).toFixed(1)} (Chinchilla rule: ~20)
          </p>
          <p className="text-muted mt-1">
            Nếu bạn chọn D/N &lt; 20 → model đói data (undertrained). Nếu
            D/N &gt; 20 → overtrained — vẫn ổn nếu bạn tối ưu cho inference.
          </p>
        </div>
      </div>
    );
  }, []);

  // Danh sách các tick log trên biểu đồ log-log
  const axisTicks = useMemo(() => {
    return [
      { value: 1, label: "1B" },
      { value: 10, label: "10B" },
      { value: 100, label: "100B" },
      { value: 1000, label: "1T" },
      { value: 10000, label: "10T" },
      { value: 100000, label: "100T" },
    ];
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — DỰ ĐOÁN
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={
            "GPT-3 có 175 tỷ tham số. GPT-4 có ~1.700 tỷ (gấp 10 lần). GPT-4 giỏi hơn GPT-3 bao nhiêu lần (theo loss)?"
          }
          options={[
            "Giỏi hơn 10 lần — tỷ lệ thuận với số tham số.",
            "Giỏi hơn khoảng 30–50% — loss giảm theo power law, diminishing returns.",
            "Giống nhau — số tham số không quan trọng.",
            "Giỏi hơn 100 lần nhờ hiệu ứng emergent.",
          ]}
          correct={1}
          explanation={
            "Gấp 10× tham số KHÔNG cho gấp 10× hiệu suất! Scaling laws là power law: với α ≈ 0.076 (Kaplan) hoặc α ≈ 0.34 (Chinchilla sau khi đã trừ data term), gấp 10× N → loss giảm vài chục phần trăm — không phải 10×. Hiểu quy luật này giúp các lab AI quyết định đầu tư compute một cách thông minh, không đơn thuần 'xây model to hơn'."
          }
        >
          <p className="text-sm text-muted mt-4">
            Trong bài này, bạn sẽ nhìn thấy biểu đồ log-log kinh điển của
            Chinchilla, tự chọn compute budget và xem N*, D* tối ưu là bao
            nhiêu.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — ẨN DỤ + VISUALIZATION CHÍNH (Chinchilla plot)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá — Biểu đồ Chinchilla">
        <p className="text-sm text-foreground leading-relaxed mb-2">
          Hãy tưởng tượng bạn có <strong>một ngân sách xây nhà</strong>.
          Bạn có thể dồn tiền vào diện tích (rộng nhưng sơ sài), hoặc vào
          nội thất (nhỏ nhưng sang trọng). Với cùng ngân sách, luôn có một{" "}
          <em>điểm cân bằng</em> cho chất lượng sống cao nhất.
        </p>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Trong LLM, "diện tích" là <strong>số tham số N</strong>, "nội
          thất" là <strong>lượng dữ liệu D</strong>, và "ngân sách" là{" "}
          <strong>compute C ≈ 6·N·D</strong>. Chinchilla (Hoffmann et al.,
          2022) đã tìm ra điểm cân bằng đó: D* ≈ 20 · N*. Dưới đây là biểu
          đồ log-log cho bạn thấy các model thực tế nằm ở đâu so với đường
          compute-optimal.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            {/* Chuyển trục N hoặc D theo C */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Trục Y hiển thị:</span>
              <button
                type="button"
                onClick={() => setViewAxis("N")}
                className={`rounded-lg px-3 py-1 border transition-colors ${
                  viewAxis === "N"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
              >
                N (tham số)
              </button>
              <button
                type="button"
                onClick={() => setViewAxis("D")}
                className={`rounded-lg px-3 py-1 border transition-colors ${
                  viewAxis === "D"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
              >
                D (token)
              </button>
            </div>

            {/* === SVG biểu đồ log-log === */}
            <svg
              viewBox="0 0 620 360"
              className="w-full max-w-2xl mx-auto rounded-lg border border-border bg-background"
            >
              {/* Tiêu đề */}
              <text x={310} y={22} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-foreground">
                Biểu đồ Chinchilla — compute vs {viewAxis === "N" ? "model size" : "training tokens"}
              </text>

              {/* Khu vực vẽ: x trong [80, 580], y trong [40, 310] */}
              {/* Trục x (log compute) */}
              <line x1={80} y1={310} x2={580} y2={310} stroke="currentColor" className="text-muted/40" strokeWidth={1} />
              {/* Trục y (log N hoặc D) */}
              <line x1={80} y1={310} x2={80} y2={40} stroke="currentColor" className="text-muted/40" strokeWidth={1} />

              {/* X-axis labels: compute từ 10^20 đến 10^26 */}
              {[20, 21, 22, 23, 24, 25, 26].map((exp) => {
                const x = 80 + ((exp - 20) / 6) * 500;
                return (
                  <g key={exp}>
                    <line x1={x} y1={310} x2={x} y2={314} stroke="currentColor" className="text-muted/60" />
                    <text x={x} y={328} textAnchor="middle" fontSize={9} className="fill-muted">
                      10^{exp}
                    </text>
                  </g>
                );
              })}
              <text x={330} y={348} textAnchor="middle" fontSize={11} className="fill-muted">
                Compute budget C (FLOPs)
              </text>

              {/* Y-axis labels cho N hoặc D */}
              {axisTicks.map((tick) => {
                // N từ 1B đến 10T (log); D từ 10B đến 100T
                const range = viewAxis === "N" ? [0, 5] : [1, 5];
                const logV = Math.log10(tick.value);
                if (logV < range[0] || logV > range[1]) return null;
                const y = 310 - ((logV - range[0]) / (range[1] - range[0])) * 270;
                return (
                  <g key={tick.value}>
                    <line x1={76} y1={y} x2={80} y2={y} stroke="currentColor" className="text-muted/60" />
                    <text x={72} y={y + 3} textAnchor="end" fontSize={9} className="fill-muted">
                      {tick.label}
                    </text>
                  </g>
                );
              })}
              <text
                x={28}
                y={180}
                textAnchor="middle"
                fontSize={11}
                className="fill-muted"
                transform="rotate(-90,28,180)"
              >
                {viewAxis === "N" ? "Số tham số N (log)" : "Số token D (log)"}
              </text>

              {/* Đường compute-optimal: N* = sqrt(C/120), D* = 20·N* */}
              {Array.from({ length: 60 }, (_, i) => {
                const exp = 20 + (i / 59) * 6;
                const C = Math.pow(10, exp);
                const { N, D } = optimalN_D(C);
                const v = viewAxis === "N" ? N / 1e9 : D / 1e9;
                const range = viewAxis === "N" ? [0, 5] : [1, 5];
                const logV = Math.log10(Math.max(0.1, v));
                if (logV < range[0] || logV > range[1]) return null;
                const x = 80 + ((exp - 20) / 6) * 500;
                const y = 310 - ((logV - range[0]) / (range[1] - range[0])) * 270;
                return { x, y, i };
              })
                .filter((p): p is { x: number; y: number; i: number } => p !== null)
                .map((p, idx, arr) => {
                  if (idx === 0) return null;
                  const prev = arr[idx - 1];
                  return (
                    <line
                      key={p.i}
                      x1={prev.x}
                      y1={prev.y}
                      x2={p.x}
                      y2={p.y}
                      stroke="#22c55e"
                      strokeWidth={2}
                      opacity={0.7}
                      strokeDasharray="0"
                    />
                  );
                })}

              {/* Chú thích đường */}
              <text x={520} y={80} fontSize={9} fill="#22c55e" fontWeight={600}>
                Compute-optimal
              </text>
              <text x={520} y={92} fontSize={8} className="fill-muted">
                (Chinchilla rule)
              </text>

              {/* Các điểm model */}
              {MODELS.map((m, i) => {
                const C = computeFlops(m.paramsB, m.tokensB);
                const logC = Math.log10(C);
                const v = viewAxis === "N" ? m.paramsB : m.tokensB;
                const range = viewAxis === "N" ? [0, 5] : [1, 5];
                const logV = Math.log10(Math.max(0.1, v));
                const x = 80 + ((logC - 20) / 6) * 500;
                const y = 310 - ((logV - range[0]) / (range[1] - range[0])) * 270;
                const isSelected = selectedModel === i;

                return (
                  <g
                    key={m.name}
                    onClick={() => setSelectedModel(isSelected ? null : i)}
                    style={{ cursor: "pointer" }}
                  >
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 9 : 6}
                      fill={m.color}
                      stroke="#0f172a"
                      strokeWidth={2}
                      animate={{ r: isSelected ? 9 : 6 }}
                    />
                    <text
                      x={x + 10}
                      y={y + 3}
                      fontSize={9}
                      fontWeight={isSelected ? 700 : 500}
                      className="fill-foreground"
                    >
                      {m.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}

              {/* Panel info khi chọn */}
              {selectedModel !== null && (
                <g>
                  <rect x={90} y={40} width={280} height={88} rx={8} fill="#0f172a" fillOpacity={0.9} stroke={MODELS[selectedModel].color} />
                  <text x={100} y={58} fontSize={11} fontWeight={700} fill="white">
                    {MODELS[selectedModel].name}
                  </text>
                  <text x={100} y={75} fontSize={9} fill="#cbd5e1">
                    N = {MODELS[selectedModel].paramsB}B; D = {MODELS[selectedModel].tokensB}B
                  </text>
                  <text x={100} y={89} fontSize={9} fill="#cbd5e1">
                    D/N = {(MODELS[selectedModel].tokensB / MODELS[selectedModel].paramsB).toFixed(1)}
                  </text>
                  <text x={100} y={108} fontSize={9} fill="#cbd5e1">
                    {MODELS[selectedModel].note.slice(0, 60)}
                  </text>
                  <text x={100} y={120} fontSize={9} fill="#cbd5e1">
                    {MODELS[selectedModel].note.slice(60, 120)}
                  </text>
                </g>
              )}
            </svg>

            {/* Chú thích màu */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444]" />
                Undertrained (GPT-3, Gopher)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e]" />
                Balanced (Chinchilla, LLaMA 1)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[#3b82f6]" />
                Overtrained có chủ đích (LLaMA 2/3)
              </span>
            </div>

            <Callout variant="tip" title="Cách đọc biểu đồ">
              Điểm nằm <em>đúng trên đường xanh</em> là compute-optimal.
              Điểm nằm <em>trên đường</em> khi xem theo trục N: model đã
              dùng nhiều tham số hơn mức tối ưu → có thể là undertrained
              (nếu D không đủ) hoặc chọn trade-off khác. Điểm nằm{" "}
              <em>dưới đường</em> khi xem theo trục D: model thiếu data.
            </Callout>
          </div>
        </VisualizationSection>

        {/* === Slider tương tác: chọn compute budget === */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Tự chọn compute budget của bạn
          </h4>
          <p className="text-sm text-muted mb-3">
            Kéo thanh trượt theo log10(C) — từ 10^20 FLOPs (model đồ chơi)
            đến 10^26 FLOPs (siêu cluster). Xem N*, D* tối ưu.
          </p>
          <SliderGroup
            sliders={[
              {
                key: "compute",
                label: "log₁₀(Compute FLOPs)",
                min: 20,
                max: 26,
                step: 0.1,
                defaultValue: 23,
                unit: "",
              },
            ]}
            visualization={budgetViz}
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — AHA MOMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Hiệu suất của LLM <strong>không phải là nghệ thuật huyền
            bí</strong> — nó tuân theo một công thức toán học mà bạn có thể
            viết lên bảng. Biết công thức này, các lab AI có thể{" "}
            <em>tính trước</em> loss cho model trị giá nhiều triệu đô{" "}
            <strong>trước khi</strong> bỏ một đồng đầu tư.
          </p>
          <p className="text-sm text-muted mt-2">
            Chinchilla đã đảo ngược niềm tin "càng to càng tốt": với cùng
            ngân sách compute, model 70B train trên 1.4T token đánh bại
            model 280B train trên 300B token. Cân bằng &gt; to đùng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — INLINE CHALLENGE #1 (Chinchilla vs GPT-3)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="Thử thách #1 — Cân bằng đánh bại khổng lồ"
      >
        <InlineChallenge
          question="Chinchilla (70B tham số, 1.4T token) vs GPT-3 (175B tham số, 300B token). Ai có loss thấp hơn trên benchmark chung?"
          options={[
            "GPT-3 — lớn hơn 2.5× nên đương nhiên giỏi hơn.",
            "Chinchilla — nhỏ hơn nhưng train trên gần 5× data, cân bằng tốt hơn.",
            "Hòa — khác model khác data nên không so sánh được.",
            "GPT-3 — ra trước nên đã được tinh chỉnh kỹ hơn.",
          ]}
          correct={1}
          explanation={
            "Chinchilla thắng rõ rệt trên hầu hết benchmark. Lý do: với ~5.76 · 10^23 FLOPs compute chung, GPT-3 dùng compute để tăng N (175B) nhưng thiếu data (300B, D/N ≈ 1.7 — undertrained); Chinchilla dùng compute để cân bằng N (70B) với D (1.4T, D/N ≈ 20). Kết quả: loss Chinchilla thấp hơn, knowledge broader hơn."
          }
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — INLINE CHALLENGE #2 (Overtrain cho inference)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection
        step={5}
        totalSteps={TOTAL_STEPS}
        label="Thử thách #2 — Tại sao overtrain?"
      >
        <InlineChallenge
          question="Meta train LLaMA 3 8B trên 15T token — tỷ lệ D/N ~1875, cao hơn nhiều mức Chinchilla 20. Tại sao họ lại 'lãng phí' compute như vậy?"
          options={[
            "Họ không biết Chinchilla rule.",
            "Họ muốn inference rẻ hơn — model nhỏ + data nhiều = chất lượng cao mà phục vụ user tiết kiệm.",
            "Vì GPU quá rẻ.",
            "Vì 15T token là yêu cầu pháp lý.",
          ]}
          correct={1}
          explanation={
            "Chinchilla tối ưu cho chi phí HUẤN LUYỆN. Nhưng khi một model phục vụ hàng tỷ request, chi phí inference áp đảo. Overtrain model nhỏ → chất lượng cao như model lớn + inference rẻ hơn hẳn. Đây là 'inference-aware scaling' — một hướng đi mới sau Chinchilla, được Meta, Mistral, Anthropic áp dụng rộng rãi từ 2024."
          }
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 6 — GIẢI THÍCH CHI TIẾT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          {/* -------- Định nghĩa chính thức -------- */}
          <p>
            <strong>Scaling laws</strong> là tập hợp các quy luật toán học,
            xác định bằng thực nghiệm, mô tả cách loss của LLM thay đổi khi
            ta thay đổi <em>số tham số N</em>, <em>lượng dữ liệu D</em>, và{" "}
            <em>compute C</em>. Kết quả chính: loss giảm theo power law
            (lũy thừa âm) đối với cả N và D, có một thành phần{" "}
            <em>irreducible loss</em> không thể giảm được.
          </p>

          {/* -------- Công thức Chinchilla -------- */}
          <p>Công thức Chinchilla (Hoffmann et al., 2022):</p>
          <LaTeX block>
            {String.raw`L(N, D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}`}
          </LaTeX>
          <p className="text-sm text-muted">
            Với các hằng số thực nghiệm: E ≈ 1.69, A ≈ 406.4, B ≈ 410.7,
            α ≈ 0.34, β ≈ 0.28. Ba số hạng có ý nghĩa riêng biệt:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>E — irreducible loss:</strong> giới hạn dưới lý
              thuyết, tương ứng entropy Shannon của văn bản tự nhiên. Dù
              có vô hạn N và D, bạn không giảm loss xuống dưới E được.
            </li>
            <li>
              <strong>A/N^α — model-size term:</strong> giảm khi tăng N.
              Với α ≈ 0.34, gấp đôi N giảm term này ~22%.
            </li>
            <li>
              <strong>B/D^β — data-size term:</strong> giảm khi tăng D.
              Với β ≈ 0.28, gấp đôi D giảm term này ~18%.
            </li>
          </ul>

          {/* -------- Công thức compute -------- */}
          <p>
            Compute budget xấp xỉ bằng <LaTeX>{"C \\approx 6 \\cdot N \\cdot D"}</LaTeX>{" "}
            FLOPs — hằng số 6 đến từ: 2 FLOPs/param cho forward × 3 (forward
            + backward qua Transformer tiêu chuẩn). Đây là công thức giúp
            ta biến bài toán tối ưu <em>L(N, D)</em> với ràng buộc C thành
            một bài toán Lagrange đơn giản.
          </p>

          {/* -------- Công thức Kaplan -------- */}
          <Callout variant="insight" title="Phiên bản Kaplan (2020) — đơn giản hơn">
            <LaTeX block>
              {String.raw`L(N) \approx \left(\frac{N_c}{N}\right)^{\alpha_N}, \quad \alpha_N \approx 0.076`}
            </LaTeX>
            <p className="text-sm mt-2">
              Kaplan et al. (OpenAI) phát hiện ra scaling laws trước
              Chinchilla 2 năm. Công thức đơn giản hơn vì chỉ xét N, giả
              định D luôn dồi dào. Tuy nhiên kết luận của Kaplan — "tăng N
              quan trọng hơn tăng D" — đã bị Chinchilla chứng minh là sai
              ở chế độ compute hữu hạn.
            </p>
          </Callout>

          {/* -------- Compute-optimal -------- */}
          <Callout variant="tip" title="Chinchilla rule — D* ≈ 20 · N*">
            <LaTeX block>
              {String.raw`N^*(C) \propto C^{\frac{\beta}{\alpha + \beta}}, \quad D^*(C) \propto C^{\frac{\alpha}{\alpha + \beta}}`}
            </LaTeX>
            <p className="text-sm mt-2">
              Với α ≈ 0.34 và β ≈ 0.28, hai số mũ gần bằng nhau → cả N*
              và D* đều ∝ C^0.5. Hệ số tỷ lệ cho ra ratio D*/N* ≈ 20 —
              đây chính là "Chinchilla rule" được lặp lại khắp mọi bài
              blog về LLM.
            </p>
          </Callout>

          {/* -------- Code 1: scaling-law fitting -------- */}
          <p>
            Cách các lab AI xác định các hằng số E, A, B, α, β: họ train
            hàng chục model với (N, D) khác nhau, đo loss, và fit
            least-squares vào công thức. Dưới đây là code thực tế:
          </p>

          <CodeBlock
            language="python"
            title="fit_scaling_law.py — fit Chinchilla L(N,D) từ data thực nghiệm"
          >
{`"""
Fit hàm L(N, D) = E + A/N^alpha + B/D^beta vào các điểm thực nghiệm.
Dữ liệu thực tế thường có dạng:
    runs = [
        (N_params_in_billions, D_tokens_in_billions, final_loss),
        ...
    ]
Mỗi điểm là một lần huấn luyện riêng biệt — rất tốn kém, nên các lab
thường chỉ fit với 30–100 điểm trải trên vài quy mô.
"""
import numpy as np
from scipy.optimize import curve_fit


def chinchilla_loss(X, E, A, B, alpha, beta):
    """
    X: mảng (2, n) với hàng đầu là N (tham số), hàng sau là D (tokens).
    Trả về loss dự đoán.
    """
    N, D = X
    return E + A / np.power(N, alpha) + B / np.power(D, beta)


def fit_scaling_law(runs):
    """
    runs: list of (N_in_billions, D_in_billions, loss)
    Trả về các hệ số đã fit.
    """
    # Chuyển về đơn vị tuyệt đối (N và D tính theo 'đơn vị' — ở đây là B).
    N_arr = np.array([r[0] for r in runs], dtype=float)
    D_arr = np.array([r[1] for r in runs], dtype=float)
    L_arr = np.array([r[2] for r in runs], dtype=float)

    X = np.vstack([N_arr, D_arr])

    # Khởi tạo gần đúng (lấy từ Chinchilla paper)
    p0 = [1.69, 406.4, 410.7, 0.34, 0.28]

    # curve_fit dùng Levenberg-Marquardt theo mặc định — ổn với
    # bài toán này vì Jacobian tính được analytical.
    popt, pcov = curve_fit(
        chinchilla_loss, X, L_arr, p0=p0, maxfev=10000
    )
    E, A, B, alpha, beta = popt
    return {
        "E": E, "A": A, "B": B, "alpha": alpha, "beta": beta,
        "covariance": pcov,
    }


def optimal_N_D_for_compute(C_flops, alpha=0.34, beta=0.28):
    """
    Given compute budget C (FLOPs), return compute-optimal N, D.
    Giả sử C ≈ 6 * N * D.
    """
    # Tỷ lệ tối ưu: N ∝ C^(beta/(alpha+beta)), D ∝ C^(alpha/(alpha+beta))
    ratio_N = beta / (alpha + beta)
    ratio_D = alpha / (alpha + beta)

    # Chuẩn hóa sao cho N * D = C / 6
    # → dùng hệ số từ paper; ở đây rút gọn bằng sqrt khi alpha ≈ beta.
    N = (C_flops / 6) ** ratio_N
    D = (C_flops / 6) ** ratio_D

    # Áp rule thực nghiệm D ≈ 20 * N
    return N, D


if __name__ == "__main__":
    # Ví dụ giả lập 5 điểm dữ liệu
    runs_demo = [
        (1,    5,    3.10),   # model nhỏ, data ít
        (1,    50,   2.60),   # model nhỏ, nhiều data
        (10,   50,   2.30),
        (10,   500,  1.95),
        (70,   1400, 1.75),   # giống Chinchilla
    ]
    fit = fit_scaling_law(runs_demo)
    print("Fitted coefficients:", fit)

    # Dự đoán loss cho model mới
    N_new, D_new = 100, 2000  # 100B params, 2T tokens
    pred = chinchilla_loss(
        np.array([[N_new], [D_new]]),
        fit["E"], fit["A"], fit["B"], fit["alpha"], fit["beta"],
    )
    print(f"Predicted loss for 100B/2T: {pred[0]:.3f}")
`}
          </CodeBlock>

          {/* -------- Code 2: allocate compute budget -------- */}
          <p>
            Khi đã fit được L(N, D), ta có thể <em>phân bổ compute budget</em>{" "}
            một cách tối ưu. Dưới đây là hàm chọn N*, D* để loss thấp nhất
            với ràng buộc C:
          </p>

          <CodeBlock
            language="python"
            title="allocate_compute.py — phân bổ compute tối ưu theo Chinchilla"
          >
{`"""
Cho compute budget C (FLOPs) và ràng buộc C = 6·N·D,
tìm (N*, D*) cực tiểu L(N, D) = E + A/N^alpha + B/D^beta.

Dùng Lagrange multiplier:
    ∂L/∂N + λ · 6 · D = 0
    ∂L/∂D + λ · 6 · N = 0
Giải ra: A·alpha / N^(alpha+1) = B·beta / D^(beta+1) · (N/D)
         → tỷ lệ D/N phụ thuộc (A, B, alpha, beta) nhưng gần 20 với
         hằng số Chinchilla.
"""
import numpy as np
from scipy.optimize import minimize

# Hằng số Chinchilla
E, A, B = 1.69, 406.4, 410.7
alpha, beta = 0.34, 0.28


def loss_at(N, D):
    return E + A / N ** alpha + B / D ** beta


def optimal_allocation(compute_flops):
    """
    Trả về (N*, D*) tối ưu cho compute budget C.
    Ràng buộc: 6 * N * D = C → D = C / (6 * N).
    Tối ưu trên một biến (N).
    """
    C = compute_flops

    def neg_objective(logN):
        N = np.exp(logN)
        D = C / (6 * N)
        return loss_at(N, D)

    # Khởi tạo tại N ≈ sqrt(C/120)
    N0 = np.sqrt(C / 120)
    res = minimize(
        neg_objective,
        x0=[np.log(N0)],
        method="Nelder-Mead",
        options={"xatol": 1e-6, "fatol": 1e-8},
    )
    N_opt = np.exp(res.x[0])
    D_opt = C / (6 * N_opt)
    return N_opt, D_opt, loss_at(N_opt, D_opt)


def compare_allocations(compute_flops, tried=None):
    """
    So sánh cách phân bổ khác nhau với cùng compute budget.
    """
    N_opt, D_opt, L_opt = optimal_allocation(compute_flops)
    print(f"Compute: {compute_flops:.2e} FLOPs")
    print(f"  Compute-optimal: N={N_opt/1e9:.1f}B, D={D_opt/1e9:.1f}B, L={L_opt:.3f}")

    if tried:
        for name, N, D in tried:
            L = loss_at(N, D)
            overhead_pct = (L - L_opt) / L_opt * 100
            print(f"  {name}: N={N/1e9:.1f}B, D={D/1e9:.1f}B, L={L:.3f} (+{overhead_pct:.1f}%)")


if __name__ == "__main__":
    # Budget giống Chinchilla paper
    C = 5.76e23
    compare_allocations(C, tried=[
        ("GPT-3-like",       175e9, 300e9),
        ("Chinchilla",        70e9, 1.4e12),
        ("LLaMA 3 8B-like",    8e9, 15e12),
    ])
`}
          </CodeBlock>

          {/* -------- Callout: emergent abilities -------- */}
          <Callout variant="info" title="Emergent abilities và tranh cãi">
            <p>
              Một số bài báo (Wei et al. 2022) cho rằng ở quy mô đủ lớn
              (thường &gt; 10^23 FLOPs), LLM "đột nhiên" có khả năng
              chain-of-thought, few-shot, cộng số nhiều chữ số — gọi là{" "}
              <strong>emergent abilities</strong>. Nhưng Schaeffer et al.
              (2023) phản biện: "emergence" chủ yếu là ảo giác do chọn
              metric gián đoạn (accuracy); đổi sang metric liên tục thì
              scaling vẫn smooth. Dù tranh cãi, hiện tượng khả năng phi
              tuyến khi tăng quy mô vẫn là một lý do quan trọng để scale.
            </p>
          </Callout>

          {/* -------- Callout: giới hạn scaling laws -------- */}
          <Callout variant="warning" title="Giới hạn của scaling laws hiện tại">
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                Chinchilla chỉ tối ưu cho <strong>training cost</strong>.
                Với inference lớn, overtrain là lựa chọn tốt hơn.
              </li>
              <li>
                Các hằng số E, A, B phụ thuộc vào{" "}
                <strong>kiến trúc</strong> (dense vs MoE vs SSM),{" "}
                <strong>dữ liệu</strong> (code vs web vs textbook), và{" "}
                <strong>tokenizer</strong>. Không có "universal" law.
              </li>
              <li>
                Dữ liệu chất lượng cao có thể{" "}
                <em>chạm giới hạn</em> trong vài năm tới (Villalobos et
                al. 2022). Khi đó scaling bằng D thuần không còn hoạt động.
              </li>
              <li>
                Các <TopicLink slug="moe">Mixture of Experts</TopicLink>{" "}
                thay đổi phương trình: số tham số "active" ≠ số tham số
                tổng. Cần scaling laws riêng.
              </li>
            </ul>
          </Callout>

          {/* -------- Callout: inference-aware scaling -------- */}
          <Callout variant="tip" title="Inference-aware scaling (2024+)">
            <p>
              Khi model được phục vụ N_requests lần, tổng chi phí là:
            </p>
            <LaTeX block>
              {String.raw`C_{\text{total}} = C_{\text{train}} + N_{\text{req}} \cdot C_{\text{inf per req}}`}
            </LaTeX>
            <p className="text-sm mt-2">
              Với N_req rất lớn (tỷ request), term thứ hai chiếm ưu thế.
              Tối ưu Ctotal → chọn model nhỏ hơn (inference rẻ) + train
              lâu hơn. Đây là lý do LLaMA 3, Mistral 7B, Phi-3 mini ra đời
              với tỷ lệ D/N cực cao.
            </p>
          </Callout>

          {/* -------- Collapsible: fit thực tế -------- */}
          <CollapsibleDetail title="Chi tiết: các lab AI thực sự fit scaling laws thế nào (nâng cao)">
            <p className="text-sm">
              Để fit L(N, D) đáng tin cậy, các lab cần:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-sm mt-2">
              <li>
                Train 30–100 model nhỏ (10M–1B params) với (N, D) đa dạng
                — trải N từ 10⁷ đến 10⁹, D từ 10⁸ đến 10¹¹.
              </li>
              <li>
                Chạy đủ lâu để loss bão hòa — không được early-stop trong
                pha huấn luyện training runs for fitting.
              </li>
              <li>
                Fit bằng weighted least-squares trong không gian log, để
                các điểm loss nhỏ (model lớn) không bị trọng số quá ít.
              </li>
              <li>
                Kiểm tra <em>extrapolation</em>: chia dữ liệu thành train
                và hold-out theo (N, D). Scaling law tốt phải dự đoán
                chính xác loss cho hold-out nằm <strong>ngoài</strong>{" "}
                range đã fit.
              </li>
              <li>
                Lặp lại quá trình cho mỗi kiến trúc mới — MoE, SSM, mixed
                precision... đều cho các hằng số khác.
              </li>
            </ol>
            <p className="text-sm mt-3">
              Chi phí tổng cho việc "fit một scaling law" có thể lên đến{" "}
              hàng triệu đô chỉ để chạy các model nhỏ. Tuy vậy, tiết kiệm
              được hàng chục triệu khi train model cuối cùng nên vẫn đáng.
            </p>
          </CollapsibleDetail>

          {/* -------- Collapsible: Lagrange derivation -------- */}
          <CollapsibleDetail title="Chứng minh Chinchilla rule từ Lagrange multiplier (nâng cao)">
            <p className="text-sm">
              Bài toán: cực tiểu{" "}
              <LaTeX>{"L(N, D) = E + A/N^{\\alpha} + B/D^{\\beta}"}</LaTeX>{" "}
              với ràng buộc{" "}
              <LaTeX>{"C = 6 N D"}</LaTeX>.
            </p>
            <p className="text-sm mt-2">Lagrangian:</p>
            <LaTeX block>
              {String.raw`\mathcal{L} = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta} + \lambda (6ND - C)`}
            </LaTeX>
            <p className="text-sm">Điều kiện cực trị:</p>
            <LaTeX block>
              {String.raw`\frac{\partial \mathcal{L}}{\partial N} = -\frac{\alpha A}{N^{\alpha+1}} + 6 \lambda D = 0`}
            </LaTeX>
            <LaTeX block>
              {String.raw`\frac{\partial \mathcal{L}}{\partial D} = -\frac{\beta B}{D^{\beta+1}} + 6 \lambda N = 0`}
            </LaTeX>
            <p className="text-sm mt-2">Chia hai phương trình:</p>
            <LaTeX block>
              {String.raw`\frac{\alpha A}{N^{\alpha+1}} \cdot \frac{D^{\beta+1}}{\beta B} = \frac{D}{N}`}
            </LaTeX>
            <p className="text-sm">
              Rút gọn, kết hợp với C = 6ND, ta được công thức đóng:
            </p>
            <LaTeX block>
              {String.raw`N^* = \left( \frac{\alpha A}{\beta B} \right)^{\frac{1}{\alpha+\beta}} \cdot \left( \frac{C}{6} \right)^{\frac{\beta}{\alpha+\beta}}`}
            </LaTeX>
            <LaTeX block>
              {String.raw`D^* = \left( \frac{\beta B}{\alpha A} \right)^{\frac{1}{\alpha+\beta}} \cdot \left( \frac{C}{6} \right)^{\frac{\alpha}{\alpha+\beta}}`}
            </LaTeX>
            <p className="text-sm mt-2">
              Thay α = 0.34, β = 0.28, A = 406.4, B = 410.7 → tỷ lệ D*/N*
              ≈ 20. Đó là "Chinchilla rule" dưới dạng công thức đóng.
            </p>
          </CollapsibleDetail>

          {/* -------- So sánh ba chế độ -------- */}
          <p>
            <strong>Ba chế độ scaling bạn sẽ gặp trong thực tế:</strong>
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface">
                <tr>
                  <th className="px-3 py-2 text-left">Chế độ</th>
                  <th className="px-3 py-2 text-left">Tỷ lệ D/N</th>
                  <th className="px-3 py-2 text-left">Tối ưu cho</th>
                  <th className="px-3 py-2 text-left">Ví dụ model</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    Undertrained
                  </td>
                  <td className="px-3 py-2 text-muted">&lt; 10</td>
                  <td className="px-3 py-2 text-muted">
                    (Lịch sử) — hạn chế data
                  </td>
                  <td className="px-3 py-2 text-muted">
                    GPT-3 (1.7), Gopher (1.1)
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    Balanced (Chinchilla)
                  </td>
                  <td className="px-3 py-2 text-muted">~20</td>
                  <td className="px-3 py-2 text-muted">
                    Chi phí training thấp nhất
                  </td>
                  <td className="px-3 py-2 text-muted">
                    Chinchilla (20), LLaMA 1 (21)
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    Overtrained
                  </td>
                  <td className="px-3 py-2 text-muted">&gt; 30</td>
                  <td className="px-3 py-2 text-muted">
                    Chi phí inference thấp
                  </td>
                  <td className="px-3 py-2 text-muted">
                    LLaMA 3 8B (1875), Phi-3 (≫100)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* -------- Pitfalls thực chiến -------- */}
          <p>
            <strong>Các sai lầm thường gặp khi áp dụng scaling laws:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Dùng hằng số Chinchilla cho mọi kiến trúc</strong>:
              MoE, SSM (Mamba), state-space hybrid đều có α, β khác.
              Không ngoại suy mù quáng.
            </li>
            <li>
              <strong>Bỏ qua chất lượng data</strong>: scaling law giả
              định data phân phối đều. Filter data kém → A/N^α term bị
              lệch. Model training on "nguyên liệu tốt" vượt xa model
              training on data thô cùng D.
            </li>
            <li>
              <strong>Quên overhead giao tiếp</strong> khi scale lên cluster
              10.000+ GPU: C thực tế &lt; 6·N·D một đáng kể do all-reduce,
              gradient sync.
            </li>
            <li>
              <strong>Fit scaling law chỉ trên 3–5 điểm</strong>: quá ít
              để tin cậy. Nên &gt; 30 điểm trải trên 3+ bậc N, D.
            </li>
            <li>
              <strong>Áp Chinchilla khi chi phí inference đáng kể</strong>:
              với product phục vụ hàng tỷ request, dùng inference-aware
              allocation thay vì Chinchilla thuần.
            </li>
          </ul>

          {/* -------- Ứng dụng -------- */}
          <p>
            <strong>Ứng dụng thực tế của scaling laws:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Quyết định compute budget trước khi đầu tư</strong>:
              Anthropic, OpenAI dùng scaling laws để ước lượng loss của
              GPT-4, Claude 3 trước khi chi hàng trăm triệu đô.
            </li>
            <li>
              <strong>Thiết kế kiến trúc mới</strong>: khi ra MoE, người
              ta fit scaling law để chứng minh tiết kiệm compute so với
              dense.
            </li>
            <li>
              <strong>Báo cáo tiến bộ học thuật</strong>: paper LLM mới
              thường báo cáo "scaling law của chúng tôi có alpha tốt hơn"
              — kiểu đo lường chuẩn mực.
            </li>
            <li>
              <strong>Định giá compute</strong>: AWS/GCP dựa vào scaling
              laws để dự báo nhu cầu GPU cho năm tới.
            </li>
            <li>
              <strong>Lựa chọn model để fine-tune</strong>: với budget
              fine-tune cố định, bạn nên chọn base model ở đúng điểm{" "}
              <em>compute-optimal</em> thay vì model lớn hơn bạn cần.
            </li>
          </ul>

          {/* -------- Chuyển tiếp -------- */}
          <p className="text-sm text-muted">
            Scaling laws kết nối với nhiều chủ đề khác:{" "}
            <TopicLink slug="llm-overview">LLM overview</TopicLink> để hiểu
            mô hình mà scaling laws mô tả;{" "}
            <TopicLink slug="cost-optimization">cost optimization</TopicLink>{" "}
            để áp dụng scaling laws vào quyết định ngân sách thực tế;{" "}
            <TopicLink slug="gpu-optimization">training
            optimization</TopicLink> để giảm hằng số C thực tế (FlashAttention,
            ZeRO, activation checkpointing).
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 7 — MINI SUMMARY (6 điểm)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điều cần nhớ về Scaling Laws"
          points={[
            "Scaling laws là power law: L(N, D) = E + A/N^α + B/D^β. Loss giảm dự đoán được khi tăng N, D, C.",
            "Diminishing returns: gấp 10× tham số chỉ giảm loss vài chục phần trăm — không bao giờ là 10×.",
            "Chinchilla rule: D* ≈ 20 · N* cho compute-optimal. GPT-3 và Gopher là undertrained vì D/N quá thấp.",
            "C ≈ 6·N·D là công thức vàng để biến tối ưu hai biến thành một biến duy nhất.",
            "LLaMA 3 và xu hướng hiện đại: overtrain có chủ đích để tiết kiệm inference — đánh đổi training cost lấy serving cost.",
            "Scaling laws không phải định luật vật lý: hằng số phụ thuộc kiến trúc, data, tokenizer. Kiểm chứng bằng thực nghiệm.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 8 — QUIZ (8 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra cuối bài">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

      {/* ===================================================================
          Sandbox bổ sung — so sánh hai model A/B với cùng compute budget
          =================================================================== */}
      <details className="mt-10 rounded-xl border border-border bg-card/30 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Sandbox bổ sung — so sánh hai chiến lược phân bổ compute
        </summary>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted">
            Hai model dưới đây dùng chung compute (~5.76 · 10²³ FLOPs —
            cỡ Chinchilla paper). Phía trái là "kiểu GPT-3", phía phải là
            "kiểu Chinchilla". Xem sự khác biệt về loss.
          </p>
          <ToggleCompare
            labelA="GPT-3 style (N to, D nhỏ)"
            labelB="Chinchilla style (N vừa, D lớn)"
            childA={
              <div className="space-y-1 text-xs">
                <p>
                  <strong>N = 175B</strong>, D = 300B (D/N ≈ 1.7)
                </p>
                <p>
                  <strong>Loss dự đoán:</strong>{" "}
                  {chinchillaLoss(175, 300).toFixed(3)}
                </p>
                <p>
                  <strong>Compute:</strong>{" "}
                  {(computeFlops(175, 300) / 1e23).toFixed(2)} · 10²³ FLOPs
                </p>
                <p className="text-muted">
                  → Undertrained. Data term B/D^β rất lớn.
                </p>
              </div>
            }
            childB={
              <div className="space-y-1 text-xs">
                <p>
                  <strong>N = 70B</strong>, D = 1400B (D/N = 20)
                </p>
                <p>
                  <strong>Loss dự đoán:</strong>{" "}
                  {chinchillaLoss(70, 1400).toFixed(3)}
                </p>
                <p>
                  <strong>Compute:</strong>{" "}
                  {(computeFlops(70, 1400) / 1e23).toFixed(2)} · 10²³ FLOPs
                </p>
                <p className="text-muted">
                  → Balanced. Hai term cân đối, loss thấp hơn.
                </p>
              </div>
            }
          />
          <p className="text-xs text-muted">
            Chênh lệch loss nhỏ về mặt số học nhưng đáng kể về chất lượng
            downstream: Chinchilla vượt Gopher 280B trên hầu hết benchmark.
          </p>
        </div>
      </details>
    </>
  );
}
