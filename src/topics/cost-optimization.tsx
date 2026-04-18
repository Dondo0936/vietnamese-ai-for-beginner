"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "cost-optimization",
  title: "Cost Optimization",
  titleVi: "Tối ưu chi phí — AI không đốt tiền",
  description:
    "Chiến lược giảm chi phí vận hành hệ thống AI mà không hy sinh chất lượng, từ chọn mô hình đến caching, routing, nén context và batch API.",
  category: "infrastructure",
  tags: ["cost", "optimization", "budget", "efficiency", "llm-ops"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "model-serving", "gpu-optimization"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// DỮ LIỆU GIÁ MODEL (USD / 1K tokens) — cập nhật theo bảng giá phổ biến 2025
// Đây là giá tham khảo dùng cho calculator. Khi triển khai thật, hãy đồng bộ
// với bảng giá hiện hành trên trang chính thức của nhà cung cấp.
// ---------------------------------------------------------------------------

interface ModelPricing {
  id: string;
  label: string;
  vendor: string;
  /** Giá input — USD mỗi 1,000 token */
  inputPer1K: number;
  /** Giá output — USD mỗi 1,000 token */
  outputPer1K: number;
  /** Cấp độ chất lượng (dùng để gợi ý routing) */
  tier: "flagship" | "mid" | "small";
  /** Ghi chú ngắn về khi nào nên dùng model này */
  hint: string;
}

const MODEL_CATALOG: ModelPricing[] = [
  {
    id: "gpt-4o",
    label: "GPT-4o",
    vendor: "OpenAI",
    inputPer1K: 0.005,
    outputPer1K: 0.015,
    tier: "flagship",
    hint: "Đa năng, mạnh về code + suy luận dài.",
  },
  {
    id: "claude-3-5-sonnet",
    label: "Claude 3.5 Sonnet",
    vendor: "Anthropic",
    inputPer1K: 0.003,
    outputPer1K: 0.015,
    tier: "flagship",
    hint: "Viết lách tự nhiên, phân tích tài liệu dài.",
  },
  {
    id: "claude-haiku",
    label: "Claude 3 Haiku",
    vendor: "Anthropic",
    inputPer1K: 0.00025,
    outputPer1K: 0.00125,
    tier: "small",
    hint: "Nhanh, rẻ, phù hợp tác vụ phân loại + tóm tắt ngắn.",
  },
  {
    id: "gemini-flash",
    label: "Gemini 1.5 Flash",
    vendor: "Google",
    inputPer1K: 0.000075,
    outputPer1K: 0.0003,
    tier: "small",
    hint: "Rẻ bậc nhất thị trường, tốt cho workload khối lượng lớn.",
  },
];

// ---------------------------------------------------------------------------
// CÁC HỆ SỐ TỐI ƯU — mỗi toggle sẽ nhân vào chi phí gốc
// ---------------------------------------------------------------------------

interface OptimizationToggles {
  caching: boolean;
  smallRouting: boolean;
  contextCompression: boolean;
  batchAPI: boolean;
}

const DEFAULT_TOGGLES: OptimizationToggles = {
  caching: false,
  smallRouting: false,
  contextCompression: false,
  batchAPI: false,
};

/**
 * Các hệ số giảm chi phí mang tính minh họa, dựa trên các con số phổ biến
 * trong báo cáo sản xuất của các team LLM-Ops:
 *  - Prompt caching (OpenAI / Anthropic) giảm ~50% tiền input cho prefix chung.
 *  - Semantic caching (embedding similarity) giảm 30-45% tổng chi phí tuỳ workload.
 *  - Router nhỏ cho 70% request đơn giản giảm ~60% input+output cho phần đó.
 *  - Context compression (RAG re-ranking, LLMLingua) giảm ~35% token input.
 *  - Batch API (OpenAI batch, Anthropic batch) giảm 50% giá cho request không
 *    cần real-time.
 */
const SAVINGS = {
  caching: 0.4, // -40%
  smallRouting: 0.6, // -60% cho phần route sang model nhỏ
  smallRoutingShare: 0.7, // 70% request route sang model nhỏ
  contextCompression: 0.35, // -35% token input
  batchAPI: 0.5, // -50% nếu dùng batch
  batchAPIShare: 0.5, // chỉ 50% workload phù hợp batch
};

// ---------------------------------------------------------------------------
// HÀM TÍNH CHI PHÍ
// ---------------------------------------------------------------------------

interface CalcInput {
  requestsPerDay: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  modelId: string;
  routeSmallModelId: string;
  toggles: OptimizationToggles;
}

interface CalcOutput {
  /** Chi phí gốc (không toggle nào) — USD/tháng */
  baselineMonthly: number;
  /** Chi phí sau khi áp dụng toggle — USD/tháng */
  optimizedMonthly: number;
  /** Tỉ lệ giảm */
  savingsRatio: number;
  /** Chi tiết từng lớp tối ưu để người học nhìn thấy "tiết kiệm ở đâu" */
  breakdown: Array<{
    label: string;
    saved: number;
    active: boolean;
  }>;
}

function costOfOne(
  inputTokens: number,
  outputTokens: number,
  model: ModelPricing,
): number {
  return (
    (inputTokens / 1000) * model.inputPer1K +
    (outputTokens / 1000) * model.outputPer1K
  );
}

function computeCost(input: CalcInput): CalcOutput {
  const big = MODEL_CATALOG.find((m) => m.id === input.modelId) ?? MODEL_CATALOG[0];
  const small =
    MODEL_CATALOG.find((m) => m.id === input.routeSmallModelId) ??
    MODEL_CATALOG[2];

  const reqPerMonth = input.requestsPerDay * 30;

  // Baseline: toàn bộ request qua model chính, không caching, không nén.
  const costPerReqBaseline = costOfOne(
    input.avgInputTokens,
    input.avgOutputTokens,
    big,
  );
  const baselineMonthly = reqPerMonth * costPerReqBaseline;

  // Áp dụng tối ưu theo thứ tự (các hệ số nhân với nhau).
  let effectiveMonthly = baselineMonthly;
  const breakdown: CalcOutput["breakdown"] = [];

  // 1) Context compression — giảm input token trước khi tính.
  let effectiveInput = input.avgInputTokens;
  if (input.toggles.contextCompression) {
    effectiveInput = input.avgInputTokens * (1 - SAVINGS.contextCompression);
  }

  // Tính lại chi phí mỗi request sau nén context.
  const costAfterCompression =
    reqPerMonth * costOfOne(effectiveInput, input.avgOutputTokens, big);
  const savedByCompression = effectiveMonthly - costAfterCompression;
  breakdown.push({
    label: "Nén context (LLMLingua / re-rank)",
    saved: input.toggles.contextCompression ? savedByCompression : 0,
    active: input.toggles.contextCompression,
  });
  effectiveMonthly = costAfterCompression;

  // 2) Small model routing — một phần request chạy model nhỏ.
  if (input.toggles.smallRouting) {
    const costSmall = costOfOne(effectiveInput, input.avgOutputTokens, small);
    const costBig = costOfOne(effectiveInput, input.avgOutputTokens, big);
    const blended =
      SAVINGS.smallRoutingShare * costSmall +
      (1 - SAVINGS.smallRoutingShare) * costBig;
    const newMonthly = reqPerMonth * blended;
    breakdown.push({
      label: `Routing ${Math.round(SAVINGS.smallRoutingShare * 100)}% → ${small.label}`,
      saved: effectiveMonthly - newMonthly,
      active: true,
    });
    effectiveMonthly = newMonthly;
  } else {
    breakdown.push({
      label: "Routing sang model nhỏ",
      saved: 0,
      active: false,
    });
  }

  // 3) Caching — giảm một tỉ lệ toàn bộ chi phí còn lại.
  if (input.toggles.caching) {
    const saved = effectiveMonthly * SAVINGS.caching;
    breakdown.push({
      label: "Prompt / Semantic caching",
      saved,
      active: true,
    });
    effectiveMonthly -= saved;
  } else {
    breakdown.push({
      label: "Prompt / Semantic caching",
      saved: 0,
      active: false,
    });
  }

  // 4) Batch API — một phần workload đổi thành batch, giảm 50% cho phần đó.
  if (input.toggles.batchAPI) {
    const savedBatch =
      effectiveMonthly * SAVINGS.batchAPIShare * SAVINGS.batchAPI;
    breakdown.push({
      label: "Batch API (ưu tiên thấp, trả kết quả sau)",
      saved: savedBatch,
      active: true,
    });
    effectiveMonthly -= savedBatch;
  } else {
    breakdown.push({
      label: "Batch API",
      saved: 0,
      active: false,
    });
  }

  const savingsRatio = 1 - effectiveMonthly / baselineMonthly;

  return {
    baselineMonthly,
    optimizedMonthly: effectiveMonthly,
    savingsRatio,
    breakdown,
  };
}

function formatUSD(value: number): string {
  if (!isFinite(value)) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `$${Math.round(value).toLocaleString()}`;
  if (value >= 100) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// QUIZ QUESTIONS
// ---------------------------------------------------------------------------

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "Startup chạy 200K request/ngày qua GPT-4o. Trước khi đổi model, bạn nên làm gì đầu tiên để giảm chi phí?",
    options: [
      "Tắt hết service trong 1 tuần để 'nghỉ' server",
      "Đo profiling: 80% request là câu hỏi FAQ ngắn, có thể route sang model nhỏ và bật cache",
      "Chuyển toàn bộ sang GPU on-premise ngay lập tức",
      "Chặn user dùng nhiều nhất",
    ],
    correct: 1,
    explanation:
      "Trước khi tối ưu, phải ĐO. Hầu hết workload LLM tuân theo 80/20: đa số request là mẫu lặp lại, đơn giản, phù hợp model nhỏ + cache. Không có số liệu thì tối ưu sai chỗ.",
  },
  {
    question:
      "Prompt caching (prefix caching) của OpenAI/Anthropic giảm chi phí như thế nào?",
    options: [
      "Giảm 100% chi phí input cho lần gọi kế tiếp",
      "Giảm ~50% chi phí input cho các token prefix giống hệt nhau (system prompt, instructions dài)",
      "Giảm output token miễn phí",
      "Chỉ hoạt động với image input",
    ],
    correct: 1,
    explanation:
      "Prompt caching nhận diện prefix giống hệt (system prompt, tài liệu RAG chung). Phần đó tính ~50% giá input. Output vẫn tính đủ. Tiết kiệm nhất với system prompt dài và traffic cao.",
  },
  {
    question:
      "Semantic caching khác prompt/prefix caching ở điểm nào?",
    options: [
      "Chỉ hoạt động với Redis",
      "Cache kết quả cho câu hỏi TƯƠNG TỰ (dùng embedding similarity), không cần khớp chính xác từng ký tự",
      "Lưu cache trên SSD thay vì RAM",
      "Chỉ cache kết quả cho người dùng đã đăng nhập",
    ],
    correct: 1,
    explanation:
      "Prompt/prefix caching yêu cầu ký tự giống hệt. Semantic caching encode câu hỏi thành vector, tìm cache entry có cosine similarity > 0.95. Hit rate tăng từ 5-15% lên 30-50% cho chatbot FAQ.",
  },
  {
    question:
      "Model routing (router nhỏ → classifier) quyết định gọi GPT-4o hay Haiku. Tiêu chí nào hợp lý nhất?",
    options: [
      "Random cho đều",
      "Luôn dùng flagship để bảo đảm chất lượng",
      "Classifier phân loại độ phức tạp: câu ngắn/FAQ → model nhỏ, câu dài/cần suy luận → model lớn",
      "Theo thứ tự bảng chữ cái của câu hỏi",
    ],
    correct: 2,
    explanation:
      "Router thực dụng: train classifier (logistic regression hoặc embedding + kNN) phân loại độ khó. 70% request đơn giản chạy Haiku/Flash ($0.0003/1K out), 30% phức tạp mới dùng GPT-4o. Giảm 60-80% chi phí, chất lượng giảm không đáng kể.",
  },
  {
    question:
      "Batch API (OpenAI batch, Anthropic batch) có đặc điểm nào?",
    options: [
      "Nhanh hơn real-time API",
      "Giảm ~50% giá nhưng kết quả trả về trong vòng 24 giờ, không dùng được cho chatbot real-time",
      "Chỉ hỗ trợ image",
      "Miễn phí hoàn toàn",
    ],
    correct: 1,
    explanation:
      "Batch API phù hợp workload offline: sinh embedding tài liệu, phân loại hàng loạt, gán nhãn dataset. Giá giảm ~50%. Không dùng cho chatbot hay agent cần phản hồi nhanh.",
  },
  {
    question:
      "Context compression (LLMLingua, re-rank top-k) hoạt động như thế nào?",
    options: [
      "Nén file zip trước khi gửi",
      "Xoá bớt câu/token ít quan trọng trong prompt (giữ ý chính), giảm input token ~30-40% mà chất lượng gần như không đổi",
      "Chỉ gửi tiêu đề, không gửi nội dung",
      "Chuyển sang ngôn ngữ ít từ hơn",
    ],
    correct: 1,
    explanation:
      "LLMLingua dùng LM nhỏ chấm điểm từng token và giữ lại token quan trọng. Re-rank RAG: chọn top-3 chunk thay vì top-10. Cả hai giảm input token, giảm cả tiền và latency.",
  },
  {
    question:
      "Khi nào self-host model (Llama-3 8B trên GPU) RẺ HƠN API?",
    options: [
      "Traffic thấp, không đều (< 10K request/ngày)",
      "Traffic cao và ổn định (hàng triệu request/ngày), team có kinh nghiệm DevOps/MLOps",
      "Luôn rẻ hơn bất kể traffic",
      "Chỉ khi chạy trên laptop",
    ],
    correct: 1,
    explanation:
      "Break-even point của self-host nằm ở khoảng 1-5M request/ngày. Traffic thấp: API rẻ hơn vì không phải trả GPU idle. Traffic cao + team đủ năng lực vận hành: self-host giảm 5-15x chi phí.",
  },
  {
    question:
      "Công ty quyết định giảm output token trung bình từ 500 xuống 200 bằng cách yêu cầu 'trả lời ngắn gọn'. Đây là tối ưu gì?",
    options: [
      "Không ảnh hưởng chi phí",
      "Tối ưu prompt — output token thường đắt gấp 3 lần input, giảm output = giảm chi phí + giảm latency",
      "Chỉ là trick giao diện",
      "Làm giảm chất lượng 50%",
    ],
    correct: 1,
    explanation:
      "Với GPT-4o, output $0.015/1K vs input $0.005/1K — gấp 3 lần. Cắt output dài thừa (dùng JSON schema chặt, max_tokens, system prompt 'ngắn gọn') vừa giảm tiền vừa tăng tốc độ phản hồi.",
  },
];

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function CostOptimizationTopic() {
  // --- State: input calculator ---
  const [requestsPerDay, setRequestsPerDay] = useState(100_000);
  const [avgInputTokens, setAvgInputTokens] = useState(800);
  const [avgOutputTokens, setAvgOutputTokens] = useState(300);
  const [modelId, setModelId] = useState<string>("gpt-4o");
  const [smallModelId, setSmallModelId] = useState<string>("claude-haiku");
  const [toggles, setToggles] = useState<OptimizationToggles>(DEFAULT_TOGGLES);

  const toggleKey = useCallback(
    (key: keyof OptimizationToggles) => {
      setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [],
  );

  // --- Tính chi phí ---
  const result = useMemo(
    () =>
      computeCost({
        requestsPerDay,
        avgInputTokens,
        avgOutputTokens,
        modelId,
        routeSmallModelId: smallModelId,
        toggles,
      }),
    [
      requestsPerDay,
      avgInputTokens,
      avgOutputTokens,
      modelId,
      smallModelId,
      toggles,
    ],
  );

  // --- Tham chiếu model đang chọn ---
  const chosenModel =
    MODEL_CATALOG.find((m) => m.id === modelId) ?? MODEL_CATALOG[0];
  const chosenSmall =
    MODEL_CATALOG.find((m) => m.id === smallModelId) ?? MODEL_CATALOG[2];

  const savingPct = Math.round(result.savingsRatio * 100);
  const activeOptimizations = Object.values(toggles).filter(Boolean).length;

  return (
    <>
      {/* ===================================================================
          BƯỚC 1 — DỰ ĐOÁN
          ================================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />

        <PredictionGate
          question="Startup Việt Nam chạy chatbot GPT-4o, 100K request/ngày, hoá đơn $90K/tháng. CEO yêu cầu giảm còn $20K mà không hy sinh chất lượng rõ rệt. Khả thi không?"
          options={[
            "Không — muốn rẻ thì phải cắt tính năng hoặc hạn chế user",
            "Có — kết hợp routing, caching, compression và batch có thể giảm 70-80%",
            "Chỉ giảm được 10-20% bằng cách viết prompt ngắn hơn",
            "Phải đợi OpenAI giảm giá chính thức",
          ]}
          correct={1}
          explanation="Hoàn toàn khả thi. 70% request thường ngày chỉ cần Haiku/Flash (gấp 10-50 lần rẻ hơn). 40% lưu lượng lặp lại có thể cache. Context nén giảm thêm ~30%. Kết quả thực tế: $90K → $18K/tháng, chất lượng giảm dưới 2%."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Mục tiêu của bài hôm nay: trao cho bạn một{" "}
            <strong className="text-foreground">bộ công cụ hệ thống</strong> để
            cắt chi phí AI một cách có phương pháp — không phải đoán mò, không
            phải cắt tính năng.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 2 — ẨN DỤ + VISUALIZATION
          ================================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="leading-relaxed">
          Hãy tưởng tượng hệ thống AI của bạn giống một{" "}
          <strong>nhà hàng cao cấp</strong>. Mỗi request đến là một bàn đặt
          món. Đầu bếp chính (GPT-4o) làm được mọi món nhưng đắt — lương cao,
          quầy đặc biệt. Phụ bếp (Haiku/Flash) làm được 70% món đơn giản (salad,
          mì gói, bánh mì) với chi phí chỉ bằng 1/20.
        </p>
        <p className="leading-relaxed">
          Câu hỏi không phải là "sa thải đầu bếp chính". Câu hỏi đúng là:{" "}
          <strong>ai làm món nào?</strong> Khi nào nên dùng món cũ trong tủ
          lạnh (cache)? Khi nào nên chuẩn bị trước hàng loạt (batch) để giảm
          thao tác riêng lẻ? Có cần đọc hết cuốn menu 100 trang mỗi lần không
          (context compression)?
        </p>

        <p className="mb-4 text-sm text-muted leading-relaxed">
          Thử ngay với máy tính dưới đây. Kéo thanh trượt, chọn model, và bật
          tắt từng tối ưu để thấy hoá đơn thay đổi theo thời gian thực.
        </p>

        <VisualizationSection>
          <div className="space-y-6">
            {/* --- Row 1: input parameters --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted">
                  Requests / ngày
                </label>
                <input
                  type="range"
                  min={1000}
                  max={2_000_000}
                  step={1000}
                  value={requestsPerDay}
                  onChange={(e) => setRequestsPerDay(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="text-sm font-semibold text-foreground">
                  {requestsPerDay.toLocaleString()} req
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">
                  Input tokens / request
                </label>
                <input
                  type="range"
                  min={100}
                  max={8000}
                  step={50}
                  value={avgInputTokens}
                  onChange={(e) => setAvgInputTokens(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="text-sm font-semibold text-foreground">
                  {avgInputTokens.toLocaleString()} token
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">
                  Output tokens / request
                </label>
                <input
                  type="range"
                  min={50}
                  max={4000}
                  step={50}
                  value={avgOutputTokens}
                  onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="text-sm font-semibold text-foreground">
                  {avgOutputTokens.toLocaleString()} token
                </div>
              </div>
            </div>

            {/* --- Row 2: model dropdowns --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted">
                  Model chính (flagship)
                </label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                >
                  {MODEL_CATALOG.filter((m) => m.tier !== "small").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.vendor}) — $
                      {m.inputPer1K.toFixed(4)}/1K in · $
                      {m.outputPer1K.toFixed(4)}/1K out
                    </option>
                  ))}
                  {MODEL_CATALOG.filter((m) => m.tier === "small").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.vendor}) — $
                      {m.inputPer1K.toFixed(4)}/1K in · $
                      {m.outputPer1K.toFixed(4)}/1K out
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">{chosenModel.hint}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">
                  Model nhỏ (dùng khi bật routing)
                </label>
                <select
                  value={smallModelId}
                  onChange={(e) => setSmallModelId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                >
                  {MODEL_CATALOG.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.vendor}) — $
                      {m.inputPer1K.toFixed(4)}/1K in · $
                      {m.outputPer1K.toFixed(4)}/1K out
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">{chosenSmall.hint}</p>
              </div>
            </div>

            {/* --- Row 3: toggles --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  {
                    key: "caching" as const,
                    label: "Caching",
                    desc: "Prompt + semantic cache (~-40%)",
                  },
                  {
                    key: "smallRouting" as const,
                    label: "Small routing",
                    desc: "70% req sang model nhỏ",
                  },
                  {
                    key: "contextCompression" as const,
                    label: "Context nén",
                    desc: "LLMLingua / re-rank (~-35% input)",
                  },
                  {
                    key: "batchAPI" as const,
                    label: "Batch API",
                    desc: "50% workload offline (-50%)",
                  },
                ] as const
              ).map((t) => {
                const active = toggles[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleKey(t.key)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border bg-card text-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          active ? "bg-accent" : "bg-muted/40"
                        }`}
                      />
                      <span className="text-sm font-semibold">{t.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{t.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* --- Row 4: kết quả --- */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Chi phí tháng (baseline)
                  </div>
                  <div className="text-2xl font-bold text-foreground line-through decoration-red-500/70">
                    {formatUSD(result.baselineMonthly)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Sau tối ưu ({activeOptimizations}/4 bật)
                  </div>
                  <motion.div
                    key={result.optimizedMonthly.toFixed(0)}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-3xl font-bold text-accent"
                  >
                    {formatUSD(result.optimizedMonthly)}
                  </motion.div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Tiết kiệm
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {savingPct}%
                  </div>
                </div>
              </div>

              {/* Bar breakdown */}
              <div className="mt-4 space-y-2">
                {result.breakdown.map((b, i) => {
                  const ratio =
                    result.baselineMonthly > 0
                      ? b.saved / result.baselineMonthly
                      : 0;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className={`flex-shrink-0 w-40 ${
                          b.active
                            ? "text-foreground font-medium"
                            : "text-muted/70"
                        }`}
                      >
                        {b.label}
                      </div>
                      <div className="relative h-2 flex-1 overflow-hidden rounded bg-surface">
                        <motion.div
                          animate={{
                            width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                          }}
                          transition={{ duration: 0.3 }}
                          className={`absolute inset-y-0 left-0 ${
                            b.active ? "bg-accent" : "bg-muted/20"
                          }`}
                        />
                      </div>
                      <div className="w-20 text-right font-mono tabular-nums text-muted">
                        {b.active ? `-${formatUSD(b.saved)}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-muted">
                Lưu ý: các hệ số tối ưu là trung bình ngành. Thực tế dao động
                theo workload, tỉ lệ cache hit và phân bố độ khó request.
              </p>
            </div>

            {/* Hint box */}
            <Callout variant="tip" title="Mẹo khám phá">
              Thử tắt tất cả toggle → bật dần từng cái. Toggle nào đóng góp
              nhiều nhất cho workload của bạn? Gợi ý: khi request ngắn (&lt; 500
              input token), caching &amp; routing thắng; khi request dài,
              compression thắng.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 3 — AHA
          ================================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Tối ưu chi phí LLM</strong> không phải là "tìm model rẻ
            nhất" — mà là một <strong>cascade nhiều lớp</strong>: đầu tiên{" "}
            <em>đừng hỏi những gì có thể cache lại</em>, kế đến{" "}
            <em>hỏi model nhỏ trước, model lớn sau nếu cần</em>, và cuối cùng{" "}
            <em>khi phải gọi — hãy gọi với ít token nhất có thể</em>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 4 — THÁCH THỨC 1
          ================================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Workload A: 500K request/ngày, mỗi request 200 input token + 50 output token (phân loại intent). Workload B: 5K request/ngày, mỗi request 6K input token + 1K output token (tóm tắt báo cáo dài). Workload nào hưởng lợi NHIỀU NHẤT từ context compression?"
          options={[
            "Workload A — vì số request lớn",
            "Workload B — input token lớn, nén 35% giảm hàng ngàn token/request",
            "Cả hai bằng nhau",
            "Không workload nào",
          ]}
          correct={1}
          explanation="Compression giảm % input token. Workload B có 6K input token × 35% = 2.1K token tiết kiệm / request. Workload A chỉ có 70 token tiết kiệm / request. Nên ưu tiên compression cho workload context dài."
        />

        <InlineChallenge
          question="Team của bạn đang cache HTTP response 1 giờ cho /chat endpoint. User report: 'Chatbot trả lời sai thông tin sản phẩm mới'. Nguyên nhân gì?"
          options={[
            "Model bị hỏng",
            "Cache giữ response cũ, dữ liệu product đã đổi — cần invalidate cache theo sự kiện (thay vì chỉ TTL)",
            "Cần tăng TTL lên 24 giờ",
            "Phải bỏ cache vĩnh viễn",
          ]}
          correct={1}
          explanation="Cache có hai chiến lược: TTL (time-to-live) + invalidation theo sự kiện. Chỉ TTL thì dữ liệu cũ vẫn tồn tại cho đến hết giờ. Với dữ liệu động (giá, tồn kho, tin tức) phải invalidate khi nguồn thay đổi — hoặc không cache."
        />
      </LessonSection>

      {/* ===================================================================
          BƯỚC 5 — EXPLANATION
          ================================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tối ưu chi phí LLM</strong> là tập hợp các kỹ thuật{" "}
            <em>giảm chi tiêu</em> trên một hệ thống AI mà{" "}
            <em>vẫn duy trì chất lượng</em> (đo bằng các metric nội dung — accuracy,
            user rating, task success rate — chứ không chỉ bằng latency).
          </p>

          <p>
            <strong>Công thức chi phí tổng:</strong>
          </p>
          <LaTeX block>
            {
              "\\text{Cost}_{\\text{total}} = \\underbrace{N_{\\text{req}} \\times C_{\\text{per\\_req}}}_{\\text{Inference}} + \\underbrace{N_{\\text{GPU}} \\times T \\times P_{\\text{GPU}}}_{\\text{Infrastructure}} + \\underbrace{C_{\\text{ops}}}_{\\text{Operations}}"
            }
          </LaTeX>

          <p>
            Với API LLM, trọng tâm là{" "}
            <em>C</em>
            <sub>per_req</sub>:
          </p>
          <LaTeX block>
            {
              "C_{\\text{per\\_req}} = \\frac{\\text{input}_{\\text{tokens}} \\cdot P_{\\text{in}} + \\text{output}_{\\text{tokens}} \\cdot P_{\\text{out}}}{1000}"
            }
          </LaTeX>

          <p>
            Trong đó P<sub>in</sub>, P<sub>out</sub> là giá mỗi 1K token của
            model tương ứng.
          </p>

          <p>
            <strong>5 chiến lược cốt lõi:</strong>
          </p>

          <p>
            <strong>1. Caching —</strong> đừng gọi LLM nếu câu hỏi đã được trả
            lời. Hai loại:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              <strong>Prompt / prefix caching</strong> — giảm giá input cho
              phần prefix trùng khớp chính xác. Hỗ trợ native bởi OpenAI,
              Anthropic, Gemini.
            </li>
            <li>
              <strong>Semantic caching</strong> — encode câu hỏi thành
              embedding, tìm entry gần nhất trong vector DB. Hit khi similarity
              vượt ngưỡng (thường 0.92–0.97).
            </li>
          </ul>
          <LaTeX block>
            {
              "\\text{Cost}_{\\text{cached}} = (1 - \\text{hit\\_rate}) \\cdot \\text{Cost}_{\\text{original}}"
            }
          </LaTeX>

          <p>
            <strong>2. Model routing —</strong> một classifier/router chọn
            model phù hợp:
          </p>
          <LaTeX block>
            {
              "\\text{Cost}_{\\text{routed}} = p_{\\text{simple}} \\cdot C_{\\text{small}} + (1 - p_{\\text{simple}}) \\cdot C_{\\text{large}}"
            }
          </LaTeX>
          <p>
            Với p<sub>simple</sub> ≈ 0.7 (phân bố 80/20 trong thực tế) và C
            <sub>small</sub> / C<sub>large</sub> ≈ 0.05 (Haiku vs GPT-4o), chi
            phí giảm hơn một nửa mà chất lượng giảm chưa tới 2%.
          </p>

          <p>
            <strong>3. Context compression —</strong> giảm số input token trước
            khi gửi:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              <strong>LLMLingua</strong> — LM nhỏ chấm điểm mỗi token, cắt
              token có perplexity thấp.
            </li>
            <li>
              <strong>Re-rank top-k</strong> — RAG truy xuất 20 chunk, re-rank,
              chỉ nhét 3 chunk vào prompt.
            </li>
            <li>
              <strong>Summarize then generate</strong> — model nhỏ tóm tắt
              history dài, model lớn đọc tóm tắt.
            </li>
          </ul>

          <p>
            <strong>4. Batch API —</strong> OpenAI Batch, Anthropic Batch,
            Gemini Batch đều giảm 50% giá. Đánh đổi: kết quả trả về trong
            24h, không phù hợp real-time.
          </p>

          <p>
            <strong>5. Prompt / output engineering —</strong> output token đắt
            gấp 2-4 lần input. Mỗi lần cắt 100 output token = tiết kiệm trực
            tiếp. Kỹ thuật:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              JSON schema strict → model không xả text thừa.
            </li>
            <li>max_tokens = số thực tế cần, không để mặc định 4096.</li>
            <li>Stop sequences để dừng sớm.</li>
            <li>System prompt "ngắn gọn, không giải thích lại câu hỏi".</li>
          </ul>

          <Callout variant="tip" title="Thứ tự áp dụng tối ưu">
            Theo kinh nghiệm thực tế, thứ tự ROI cao → thấp:{" "}
            <strong>caching → routing → prompt engineering → compression →
            batch</strong>. Bắt đầu từ cái đơn giản nhất (caching — chỉ cần
            Redis) trước khi đụng đến routing (cần classifier).
          </Callout>

          <Callout variant="warning" title="Đo trước khi tối ưu">
            Không có log thì không thể tối ưu. Tối thiểu cần track:{" "}
            <code>request_id</code>, <code>model</code>, <code>input_tokens</code>
            , <code>output_tokens</code>, <code>latency_ms</code>,{" "}
            <code>cost_usd</code>, <code>user_id</code>. Dashboard hằng ngày
            theo model + theo endpoint.
          </Callout>

          <p>
            <strong>Code mẫu 1 — đếm token và ước lượng chi phí trước khi
            gọi:</strong>
          </p>

          <CodeBlock
            language="python"
            title="token_counter.py — ước lượng chi phí trước khi gọi API"
          >
            {`"""Đếm token và ước lượng chi phí trước khi gọi LLM API.

Chức năng:
  - Đếm token chính xác bằng tokenizer chính thức (tiktoken cho OpenAI).
  - Ước lượng chi phí USD theo bảng giá cập nhật.
  - Từ chối request nếu vượt budget/request hoặc budget/ngày.
  - Ghi log để dashboard chi phí phân tích sau.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, asdict
from typing import Iterable

import tiktoken  # pip install tiktoken


# Bảng giá USD / 1K token — đồng bộ với bảng chính thức trước khi dùng prod.
MODEL_PRICES = {
    "gpt-4o":          {"in": 0.005,    "out": 0.015},
    "gpt-4o-mini":     {"in": 0.00015,  "out": 0.00060},
    "claude-3-5-sonnet": {"in": 0.003,  "out": 0.015},
    "claude-3-haiku":  {"in": 0.00025,  "out": 0.00125},
    "gemini-1.5-flash": {"in": 0.000075,"out": 0.0003},
}


@dataclass
class TokenEstimate:
    model: str
    input_tokens: int
    estimated_output_tokens: int
    cost_input_usd: float
    cost_output_usd: float
    total_usd: float

    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False)


def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Đếm token chính xác bằng tokenizer của model tương ứng."""
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


def estimate_cost(
    prompt: str,
    model: str = "gpt-4o",
    expected_output_tokens: int = 300,
) -> TokenEstimate:
    """Ước lượng chi phí dựa trên prompt và số output dự kiến."""
    if model not in MODEL_PRICES:
        raise ValueError(f"Unknown model: {model}")

    price = MODEL_PRICES[model]
    input_tokens = count_tokens(prompt, model)

    cost_in = input_tokens / 1000 * price["in"]
    cost_out = expected_output_tokens / 1000 * price["out"]
    total = cost_in + cost_out

    return TokenEstimate(
        model=model,
        input_tokens=input_tokens,
        estimated_output_tokens=expected_output_tokens,
        cost_input_usd=round(cost_in, 6),
        cost_output_usd=round(cost_out, 6),
        total_usd=round(total, 6),
    )


class BudgetGuard:
    """Từ chối request nếu vượt budget/request hoặc budget/ngày."""

    def __init__(
        self,
        max_per_request_usd: float = 0.50,
        max_per_day_usd: float = 500.0,
    ) -> None:
        self.max_per_request = max_per_request_usd
        self.max_per_day = max_per_day_usd
        self._spent_today_usd = 0.0
        self._day_start = time.time()

    def _reset_if_new_day(self) -> None:
        if time.time() - self._day_start > 86400:
            self._spent_today_usd = 0.0
            self._day_start = time.time()

    def check(self, estimate: TokenEstimate) -> None:
        self._reset_if_new_day()
        if estimate.total_usd > self.max_per_request:
            raise RuntimeError(
                f"Request cost $"
                f"{estimate.total_usd:.4f} > limit $"
                f"{self.max_per_request:.2f}"
            )
        if self._spent_today_usd + estimate.total_usd > self.max_per_day:
            raise RuntimeError(
                f"Daily budget exceeded: $"
                f"{self._spent_today_usd + estimate.total_usd:.2f} > $"
                f"{self.max_per_day:.2f}"
            )

    def record(self, estimate: TokenEstimate) -> None:
        self._spent_today_usd += estimate.total_usd


# --- Ví dụ sử dụng ---
if __name__ == "__main__":
    prompt = "Tóm tắt báo cáo Q3 này thành 5 gạch đầu dòng: ..."
    est = estimate_cost(prompt, model="gpt-4o", expected_output_tokens=200)
    print(est.to_json())

    guard = BudgetGuard(max_per_request_usd=0.10, max_per_day_usd=100.0)
    try:
        guard.check(est)
        # ... gọi LLM thật ở đây ...
        guard.record(est)
    except RuntimeError as e:
        print("Rejected:", e)
`}
          </CodeBlock>

          <p>
            <strong>Code mẫu 2 — semantic cache + model router đơn giản:</strong>
          </p>

          <CodeBlock language="python" title="router_cache.py — cache + routing">
            {`"""Pipeline tối ưu chi phí cho chatbot:
    1) Semantic cache (Redis + embedding).
    2) Classifier định tuyến small vs flagship model.
    3) Ghi log chi phí để dashboard phân tích.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Literal, Optional

import numpy as np
import redis
from sentence_transformers import SentenceTransformer


EMBEDDER = SentenceTransformer("all-MiniLM-L6-v2")
CACHE = redis.Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
SIMILARITY_THRESHOLD = 0.95


def _embed(text: str) -> np.ndarray:
    return EMBEDDER.encode(text, normalize_embeddings=True)


def _cache_key(prefix: str, text: str) -> str:
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{digest}"


def semantic_cache_lookup(query: str) -> Optional[str]:
    """Tìm câu trả lời gần nhất trong cache. Trả None nếu miss."""
    query_emb = _embed(query).astype(np.float32)

    # Quét tối đa 200 entry gần nhất — production nên dùng FAISS / pgvector.
    for key in CACHE.scan_iter(match="cache:*", count=200):
        raw = CACHE.get(key)
        if raw is None:
            continue
        entry = json.loads(raw)
        cached_emb = np.asarray(entry["embedding"], dtype=np.float32)
        similarity = float(np.dot(query_emb, cached_emb))
        if similarity >= SIMILARITY_THRESHOLD:
            return entry["response"]
    return None


def semantic_cache_store(query: str, response: str, ttl: int = 3600) -> None:
    key = _cache_key("cache", query)
    payload = {
        "embedding": _embed(query).astype(np.float32).tolist(),
        "response": response,
        "stored_at": time.time(),
    }
    CACHE.setex(key, ttl, json.dumps(payload))


# ---------------------------------------------------------------------------
# Classifier định tuyến — trong thực tế có thể là logistic regression, small
# LM, hoặc gọi một API rẻ (Haiku). Ở đây mô phỏng bằng heuristic độ dài.
# ---------------------------------------------------------------------------

def classify_complexity(query: str) -> Literal["simple", "complex"]:
    word_count = len(query.split())
    has_code_hint = any(k in query.lower() for k in ["code", "python", "sql"])
    if word_count < 40 and not has_code_hint:
        return "simple"
    return "complex"


def call_small_model(query: str) -> str:
    # ... gọi Haiku / Flash / Llama-8B self-host ...
    return f"[small] Trả lời cho: {query[:40]}..."


def call_flagship_model(query: str) -> str:
    # ... gọi GPT-4o / Claude Sonnet ...
    return f"[flagship] Trả lời cho: {query[:40]}..."


def chat(query: str) -> dict:
    """Pipeline chính."""
    # 1. Thử cache.
    cached = semantic_cache_lookup(query)
    if cached:
        return {"response": cached, "source": "cache", "model": None}

    # 2. Route theo độ phức tạp.
    complexity = classify_complexity(query)
    if complexity == "simple":
        answer = call_small_model(query)
        model = "claude-haiku"
    else:
        answer = call_flagship_model(query)
        model = "gpt-4o"

    # 3. Lưu cache để lần sau khỏi gọi nữa.
    semantic_cache_store(query, answer)
    return {"response": answer, "source": "llm", "model": model}


if __name__ == "__main__":
    for q in [
        "Hà Nội hôm nay thời tiết thế nào?",
        "Thời tiết ở Hà Nội hôm nay ra sao?",
        "Viết Python function tính fibonacci bằng DP bottom-up",
    ]:
        r = chat(q)
        print(q, "->", r["source"], r["model"])
`}
          </CodeBlock>

          <Callout variant="info" title="Thực tế tại startup Việt Nam">
            Mẫu phổ biến: self-host một model nhỏ (Llama-3-8B, Qwen2-7B) trên
            FPT Cloud / Zadark / VNG Cloud cho 70-80% request, fallback GPT-4o
            hoặc Claude Sonnet cho 20-30% phức tạp. Kết hợp semantic cache trên
            Redis. Từ $50K → $5-7K/tháng mà chất lượng giảm dưới 3%.
          </Callout>

          <CollapsibleDetail title="Chi tiết kỹ thuật — prompt caching OpenAI vs Anthropic">
            <p>
              Hai nhà cung cấp có cơ chế khác nhau mặc dù ý tưởng giống nhau:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
              <li>
                <strong>OpenAI prompt caching</strong> — tự động, không cần
                đánh dấu. Yêu cầu prompt tối thiểu 1024 token. Hit thì phần
                cache giảm 50% giá input. TTL 5-10 phút.
              </li>
              <li>
                <strong>Anthropic prompt caching</strong> — bạn phải đánh dấu
                các block (<code>cache_control: ephemeral</code>). Hit giảm 90%
                giá input nhưng lần đầu write cache đắt hơn 25%. TTL 5 phút
                (hoặc 1 giờ với tier trả thêm).
              </li>
              <li>
                <strong>Gemini context caching</strong> — bạn upload một đối
                tượng cache, nhận token ID, rồi reference trong request. Tính
                giá theo dung lượng lưu trữ × thời gian.
              </li>
            </ul>
            <p className="mt-2 text-sm">
              Hệ quả: với Claude, đáng để gom system prompt dài thành 1 block
              cacheable. Với OpenAI, cứ viết bình thường, hệ thống tự nhận
              prefix trùng.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào KHÔNG nên tối ưu chi phí">
            <p>
              Tối ưu sớm có thể hại nhiều hơn lợi:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
              <li>
                <strong>Giai đoạn PMF</strong> — chưa biết sản phẩm có bám
                được không, cứ dùng model mạnh nhất để có trải nghiệm tốt
                nhất. Chi phí lúc này nhỏ so với rủi ro mất khách.
              </li>
              <li>
                <strong>Workload chưa đo</strong> — không có số liệu thì đang
                tối ưu trong bóng tối. Install logging + dashboard trước.
              </li>
              <li>
                <strong>Pipeline có ràng buộc an toàn</strong> — y tế, pháp
                lý, tài chính cần chất lượng cao nhất. Dùng router nhỏ dễ rủi
                ro hallucination trên câu hỏi khó.
              </li>
              <li>
                <strong>Tính năng đang A/B test</strong> — thay model giữa lúc
                test sẽ làm sai lệch kết quả. Đóng băng model khi đo.
              </li>
            </ul>
            <p className="mt-2 text-sm">
              Quy tắc cũ của Donald Knuth vẫn đúng: "Premature optimization is
              the root of all evil" — ngay cả với LLM.
            </p>
          </CollapsibleDetail>

          <p>
            <strong>Trong thực tế</strong>, hãy thiết lập một pipeline tối
            giản: (1) mọi request đều đi qua layer budget-guard,{" "}
            (2) layer cache, (3) layer router, (4) layer model call. Log mỗi
            bước. Sau 2 tuần có dữ liệu, xem dashboard để biết layer nào đang
            ăn tiền nhiều nhất và tối ưu đúng chỗ đó.
          </p>

          <p>
            Các chủ đề liên quan bạn có thể xem sau:{" "}
            <TopicLink slug="inference-optimization">
              tối ưu inference
            </TopicLink>
            ,{" "}
            <TopicLink slug="gpu-optimization">tối ưu GPU</TopicLink>
            ,{" "}
            <TopicLink slug="model-serving">triển khai model</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ===================================================================
          BƯỚC 6 — MINI SUMMARY
          ================================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về tối ưu chi phí LLM"
          points={[
            "Output token đắt hơn input token 2-4 lần — cắt output bằng JSON schema và max_tokens là ROI cao nhất / công sức thấp nhất.",
            "Caching là layer tối ưu đầu tiên: prompt caching giảm 50% input cho prefix chung, semantic caching bắt cả câu hỏi tương tự.",
            "Model routing 70/30 (nhỏ/lớn) dựa trên classifier giảm 60-80% chi phí với chất lượng giảm chưa tới 2% trên workload điển hình.",
            "Context compression (LLMLingua, re-rank top-k) giảm 30-40% input token — thắng lớn trên RAG và tài liệu dài.",
            "Batch API giảm 50% giá cho workload offline (embedding, phân loại hàng loạt, gán nhãn dataset).",
            "Đo trước khi tối ưu: log request_id, model, tokens, latency, cost, user_id. Không có dashboard thì đang tối ưu trong bóng tối.",
          ]}
        />
      </LessonSection>

      {/* ===================================================================
          BƯỚC 7 — QUIZ
          ================================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
