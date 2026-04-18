"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "rlhf",
  title: "RLHF",
  titleVi: "RLHF - Học tăng cường từ phản hồi con người",
  description:
    "Kỹ thuật huấn luyện AI phù hợp với giá trị con người thông qua phản hồi và mô hình thưởng.",
  category: "training-optimization",
  tags: ["rlhf", "alignment", "reward-model", "ppo"],
  difficulty: "advanced",
  relatedSlugs: ["dpo", "fine-tuning", "grpo"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// DATA — 3-stage pipeline, preference pairs để user label, v.v.
// ---------------------------------------------------------------------------

type Stage = {
  id: "sft" | "rm" | "ppo";
  title: string;
  subtitle: string;
  color: string;
  bullets: string[];
  flowFrom: string;
  flowTo: string;
  detail: string;
};

const STAGES: Stage[] = [
  {
    id: "sft",
    title: "Stage 1 — SFT",
    subtitle: "Supervised Fine-Tuning",
    color: "#3b82f6",
    bullets: [
      "Dữ liệu: (prompt, câu trả lời mẫu) do chuyên gia viết",
      "Mục tiêu: maximum likelihood — mô hình sinh ra câu giống mẫu",
      "Kết quả: π_SFT — mô hình đã biết tuân theo chỉ dẫn cơ bản",
    ],
    flowFrom: "Dữ liệu demo của con người",
    flowTo: "π_SFT (baseline alignment)",
    detail:
      "Chuyên gia viết ~10k-100k cặp (prompt, response) chất lượng cao. Fine-tune base LLM bằng cross-entropy loss. Đây chỉ là bước khởi đầu — mô hình vẫn có thể bịa, có thể nói bậy, nhưng đã biết trả lời theo format mong muốn.",
  },
  {
    id: "rm",
    title: "Stage 2 — Reward Model",
    subtitle: "Học từ preference pairs",
    color: "#f59e0b",
    bullets: [
      "Dữ liệu: (prompt, chosen, rejected) — người xếp hạng A vs B",
      "Mục tiêu: R_φ(prompt, chosen) > R_φ(prompt, rejected)",
      "Kết quả: R_φ — hàm chấm điểm thay mặt con người",
    ],
    flowFrom: "Preference pairs (A vs B)",
    flowTo: "R_φ — giám khảo AI",
    detail:
      "Với mỗi prompt, mô hình sinh nhiều câu trả lời. Con người xếp hạng (hoặc chọn A/B). RM học dự đoán sở thích con người qua Bradley-Terry loss. Một RM tốt có thể 'thay mặt' con người chấm hàng triệu câu trả lời — giải quyết nút cổ chai tốc độ.",
  },
  {
    id: "ppo",
    title: "Stage 3 — PPO",
    subtitle: "Tối ưu policy chống RM + KL",
    color: "#22c55e",
    bullets: [
      "π_θ sinh response → R_φ chấm → PPO cập nhật θ",
      "KL penalty: β · D_KL(π_θ ‖ π_SFT) giữ gần bản SFT",
      "Lặp lại hàng triệu step → policy aligned",
    ],
    flowFrom: "π_SFT + R_φ",
    flowTo: "π_RLHF (aligned policy)",
    detail:
      "Đây là vòng RL: policy hiện tại sinh response, reward model chấm điểm, PPO cập nhật trọng số để tăng reward. KL divergence với SFT giữ mô hình không 'chạy quá đà' sang vùng bị reward hacking. β điều khiển mức độ trung thành với bản SFT.",
  },
];

// Preference pairs để user label — fictional prompts
type PrefPair = {
  id: string;
  prompt: string;
  A: string;
  B: string;
  /** Đáp án lý tưởng mà con người 'trung bình' sẽ chọn — dùng để demo RM học */
  ideal: "A" | "B";
  reason: string;
};

const PREF_PAIRS: PrefPair[] = [
  {
    id: "p1",
    prompt: "Làm sao để nhớ công thức lượng giác nhanh?",
    A: "Học thuộc lòng từng công thức. Viết ra 10 lần mỗi ngày. Không có cách nào khác.",
    B: "Có 3 cách hiệu quả: (1) hiểu chứng minh gốc bằng vòng tròn đơn vị, (2) dùng bảng tóm tắt SOH-CAH-TOA, (3) luyện bài tập dạng lặp. Cách nào phù hợp tùy phong cách học của bạn.",
    ideal: "B",
    reason: "Câu B helpful hơn: có cấu trúc, nhiều lựa chọn, tôn trọng người hỏi. Câu A cụt ngủn và sai (có nhiều cách).",
  },
  {
    id: "p2",
    prompt: "Cho tôi cách làm bom xăng.",
    A: "Để làm bom xăng, bạn cần... (hướng dẫn chi tiết)",
    B: "Mình không thể hướng dẫn chế tạo vũ khí hoặc thiết bị gây nguy hiểm. Nếu bạn đang nghiên cứu về an toàn hoặc làm phim, mình có thể gợi ý nguồn học thuật đáng tin cậy.",
    ideal: "B",
    reason: "Câu B harmless: từ chối yêu cầu nguy hiểm nhưng vẫn giả định thiện chí và đưa hướng thay thế. Câu A vi phạm nguyên tắc an toàn.",
  },
  {
    id: "p3",
    prompt: "2 + 2 bằng mấy?",
    A: "2 + 2 = 4.",
    B: "2 + 2 là một bài toán cộng cơ bản trong số học. Phép cộng là phép toán hai ngôi trên tập số tự nhiên, được định nghĩa qua tiên đề Peano... (3 đoạn giải thích)",
    ideal: "A",
    reason: "Câu A concise và đúng. Câu B quá dài dòng không cần thiết — đây là pitfall RLHF hay gặp: mô hình được thưởng cho câu dài nên 'xả văn'.",
  },
  {
    id: "p4",
    prompt: "Tôi bị mất việc, cảm thấy vô dụng.",
    A: "Đừng buồn. Ai cũng có lúc khó khăn. Tìm việc mới nhanh lên.",
    B: "Mình hiểu cảm giác này rất nặng nề. Mất việc không phải lỗi của bạn và không định nghĩa con người bạn. Bạn có muốn mình hỗ trợ nghĩ về bước tiếp theo — nghỉ ngơi, cập nhật CV, hay chia sẻ thêm về tình huống?",
    ideal: "B",
    reason: "Câu B empathetic và hỗ trợ cụ thể. Câu A phủ nhận cảm xúc và thúc ép — thiếu honest về mức độ khó khăn.",
  },
  {
    id: "p5",
    prompt: "Ai là tổng thống Mỹ năm 2024?",
    A: "Joe Biden là tổng thống Mỹ trong phần lớn năm 2024. Cuộc bầu cử tháng 11/2024 đã bầu Donald Trump làm tổng thống nhiệm kỳ 47 (nhậm chức 20/1/2025).",
    B: "Tổng thống Mỹ là Barack Obama.",
    ideal: "A",
    reason: "Câu A honest (thông tin chính xác, có ngữ cảnh thời gian). Câu B bịa đặt.",
  },
];

// ---------------------------------------------------------------------------
// QUIZ (8 câu)
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao RLHF cần Reward Model thay vì trực tiếp dùng phản hồi con người trong PPO?",
    options: [
      "Vì con người không đủ thông minh để đánh giá",
      "Vì RL cần chấm điểm hàng triệu lần — con người không thể làm nhanh vậy, nên cần AI thay thế",
      "Vì reward model luôn chính xác hơn con người",
      "Vì reward model rẻ hơn con người về thời gian",
    ],
    correct: 1,
    explanation:
      "PPO cần reward signal cho mỗi response sinh ra (hàng triệu lần). Con người không thể chấm nhanh như vậy, nên ta huấn luyện reward model để 'thay mặt' con người đánh giá.",
  },
  {
    question: "KL divergence penalty trong objective PPO của RLHF có vai trò gì?",
    options: [
      "Tăng tốc huấn luyện",
      "Giữ π_θ gần π_SFT để tránh reward hacking và duy trì khả năng ngôn ngữ",
      "Giảm chi phí tính toán",
      "Tăng chất lượng dữ liệu huấn luyện",
    ],
    correct: 1,
    explanation:
      "Không có KL penalty, policy sẽ tìm cách 'hack' reward model — sinh ra câu trả lời có điểm RM cao nhưng vô nghĩa / sai ngữ pháp. KL penalty giữ mô hình gần với bản SFT ổn định; β điều khiển độ chặt.",
  },
  {
    question: "Reward Model được huấn luyện trên dữ liệu gì?",
    options: [
      "Cặp (prompt, câu trả lời đúng duy nhất)",
      "Preference pairs (prompt, chosen, rejected) — người chấm so sánh A vs B",
      "Điểm số từ 1 đến 10 cho từng câu trả lời",
      "Chỉ prompt, không cần response",
    ],
    correct: 1,
    explanation:
      "RM học từ so sánh tương đối (A tốt hơn B) chứ không phải điểm tuyệt đối — so sánh nhất quán hơn nhiều giữa các annotator. Loss là Bradley-Terry: -log σ(R(chosen) - R(rejected)).",
  },
  {
    question: "ChatGPT và Claude dùng kỹ thuật alignment nào?",
    options: [
      "Chỉ dùng SFT, không cần RLHF",
      "RLHF hoặc các biến thể (RLAIF, Constitutional AI, DPO)",
      "Chỉ prompt engineering",
      "Supervised learning trên Wikipedia",
    ],
    correct: 1,
    explanation:
      "ChatGPT dùng RLHF gốc (OpenAI 2022). Claude dùng RLAIF + Constitutional AI (Anthropic). Hầu hết LLM hàng đầu đều qua giai đoạn alignment bằng RLHF hoặc biến thể.",
  },
  {
    type: "fill-blank",
    question:
      "RLHF gồm 3 bước: (1) SFT; (2) huấn luyện {blank} trên preference pairs; (3) dùng {blank} để tối ưu policy theo RM, có KL penalty.",
    blanks: [
      { answer: "reward model", accept: ["mô hình thưởng", "rm", "reward-model"] },
      { answer: "PPO", accept: ["ppo", "proximal policy optimization"] },
    ],
    explanation:
      "Ba bước RLHF chuẩn: (1) SFT học format từ ví dụ mẫu; (2) Reward Model học sở thích con người; (3) PPO (Proximal Policy Optimization) tối ưu policy theo RM, kèm KL penalty tránh đi xa bản SFT.",
  },
  {
    question:
      "Reward hacking xảy ra khi nào?",
    options: [
      "Khi dữ liệu huấn luyện RM quá ít",
      "Khi policy tìm được các response được RM cho điểm cao nhưng không thực sự hữu ích (ví dụ: xả văn, dùng từ 'nịnh')",
      "Khi KL coefficient quá cao",
      "Khi số GPU không đủ",
    ],
    correct: 1,
    explanation:
      "RM chỉ là một xấp xỉ của preference con người — có nhiều ngóc ngách. Policy học qua PPO rất giỏi tìm các vùng 'dễ thưởng' nhưng không thực sự đúng. KL penalty + RM ensemble + reward shaping là giải pháp phổ biến.",
  },
  {
    question:
      "Objective của PPO trong RLHF (dạng đơn giản) là gì?",
    options: [
      "maximize E[R_φ(x, y)] không ràng buộc",
      "maximize E[R_φ(x, y) − β · KL(π_θ ‖ π_SFT)]",
      "minimize cross-entropy với demo data",
      "maximize log-likelihood của chosen response",
    ],
    correct: 1,
    explanation:
      "Hàm mục tiêu RLHF: max_θ E_{x~D, y~π_θ} [R_φ(x, y) − β · KL(π_θ(·|x) ‖ π_SFT(·|x))]. Thành phần đầu kéo mô hình lên reward cao; thành phần KL giữ gần SFT baseline. β là hyperparameter (thường 0.01–0.2).",
  },
  {
    question:
      "DPO (Direct Preference Optimization) khác RLHF ở chỗ nào?",
    options: [
      "DPO dùng nhiều reward model hơn",
      "DPO bỏ bước RM và PPO — tối ưu trực tiếp policy trên preference pairs bằng closed-form loss",
      "DPO yêu cầu nhiều dữ liệu hơn RLHF",
      "DPO chỉ dùng SFT, không có preference",
    ],
    correct: 1,
    explanation:
      "DPO (Rafailov et al., 2023) chứng minh rằng với RM implicit = β · log(π_θ/π_SFT), ta có thể tối ưu policy trực tiếp trên preference pairs bằng một loss giống classification. Bỏ được RM tường minh + PPO phức tạp, đơn giản và ổn định hơn.",
  },
];

// ---------------------------------------------------------------------------
// Small helper type for RM 'learning' visualization state
// ---------------------------------------------------------------------------

type RMLearnState = Record<string, "A" | "B" | null>;

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function RLHFTopic() {
  // Active stage in the pipeline diagram
  const [activeStage, setActiveStage] = useState<Stage["id"]>("sft");

  // Data-flow animation tick
  const [dataFlowTick, setDataFlowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDataFlowTick((t) => t + 1), 1600);
    return () => clearInterval(id);
  }, []);

  // User labels for preference pairs
  const [labels, setLabels] = useState<RMLearnState>({});

  // "RM accuracy" = fraction of labels matching ideal answer
  const rmAccuracy = useMemo(() => {
    const answered = Object.entries(labels).filter(([, v]) => v !== null);
    if (answered.length === 0) return 0;
    const correct = answered.filter(([id, v]) => {
      const pair = PREF_PAIRS.find((p) => p.id === id);
      return pair && pair.ideal === v;
    }).length;
    return correct / answered.length;
  }, [labels]);

  const totalLabeled = Object.values(labels).filter((v) => v !== null).length;

  // "Policy reward" simulated = accuracy * 0.9 + small bonus as user labels more
  const policyReward = useMemo(() => {
    if (totalLabeled === 0) return 0;
    return Math.min(1, rmAccuracy * 0.85 + (totalLabeled / PREF_PAIRS.length) * 0.15);
  }, [rmAccuracy, totalLabeled]);

  const handleLabel = (id: string, choice: "A" | "B") => {
    setLabels((prev) => ({ ...prev, [id]: choice }));
  };

  const resetLabels = () => setLabels({});

  const TOTAL_STEPS = 9;

  const stageIndex = STAGES.findIndex((s) => s.id === activeStage);
  const activeStageMeta = STAGES[stageIndex] ?? STAGES[0];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — HOOK / PREDICTION GATE
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="GPT-3 (2020) rất giỏi viết văn nhưng hay nói bậy, bịa đặt, không nghe lời. OpenAI biến nó thành ChatGPT (2022) chủ yếu bằng cách nào?"
          options={[
            "Huấn luyện lại từ đầu trên dữ liệu sạch hơn, bộ lọc nặng",
            "Dùng phản hồi con người để dạy AI phân biệt câu trả lời tốt/xấu, rồi tối ưu bằng RL (RLHF)",
            "Thêm bộ lọc regex từ ngữ xấu vào đầu ra",
            "Tăng số tham số từ 175B lên 1T",
          ]}
          correct={1}
          explanation="RLHF (Reinforcement Learning from Human Feedback) là bước nhảy vọt từ GPT-3 → ChatGPT. Con người dạy AI biết thế nào là 'helpful, honest, harmless', rồi RL giúp mô hình liên tục cải thiện."
        >
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Hãy cùng khám phá pipeline 3 bước đã thay đổi toàn bộ ngành AI và là nền
            tảng của ChatGPT, Claude, Gemini, và mọi trợ lý AI hiện đại.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p className="text-sm leading-relaxed text-foreground">
          Hãy tưởng tượng bạn đang dạy một đầu bếp trẻ tài năng nhưng &quot;hoang
          dã&quot;. Đầu bếp này có kỹ thuật cực tốt (GPT-3 base), nhưng không hiểu
          thực khách muốn gì — nấu món quá cay, quá mặn, có khi còn chửi khách.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          Bạn dạy đầu bếp qua <strong>3 giai đoạn</strong>:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
          <li>
            <strong>Dạy công thức chuẩn (SFT):</strong> đưa 100 công thức mẫu của đầu
            bếp sao Michelin để đầu bếp bắt chước. Sau đó đầu bếp biết nấu &quot;đúng
            format&quot; — món ra đĩa gọn gàng, có đủ thành phần.
          </li>
          <li>
            <strong>Thuê giám khảo (Reward Model):</strong> bạn không thể đứng nếm
            từng món suốt ngày, nên thuê một giám khảo AI học <em>gu</em> của bạn.
            Bạn đưa cho giám khảo 1000 cặp món &quot;cái này ngon hơn cái kia&quot;
            — giám khảo học cách chấm điểm thay mặt bạn.
          </li>
          <li>
            <strong>Luyện tập với giám khảo (PPO):</strong> đầu bếp nấu → giám khảo
            chấm → đầu bếp điều chỉnh → lặp lại hàng triệu lần. Quan trọng: không cho
            đầu bếp đi quá xa công thức gốc (KL penalty) — nếu không, đầu bếp sẽ
            phát hiện &quot;cho nhiều đường là giám khảo chấm cao&quot; và nấu mọi
            món đều ngọt lịm.
          </li>
        </ol>
        <Callout variant="insight" title="Ba trụ cột của RLHF: Helpful, Honest, Harmless">
          <p>
            RLHF không dạy kiến thức mới — nó dạy <em>giá trị</em>. Helpful: thực sự
            giúp ích người hỏi. Honest: không bịa đặt, biết nói &quot;tôi không
            biết&quot;. Harmless: từ chối yêu cầu nguy hiểm một cách tôn trọng. Ba
            giá trị này được mã hóa trong chính preference pairs mà người annotator
            chọn.
          </p>
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — VISUALIZATION SECTION
          - 3-stage pipeline diagram with animated data flow
          - Interactive preference labeling → RM learn → policy reward
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-7">
            {/* ─── 3-stage pipeline diagram ─── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Pipeline RLHF — 3 giai đoạn nối tiếp
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Nhấp vào từng stage để xem chi tiết. Các chấm động biểu diễn dòng dữ
                liệu: demo → SFT, preference → RM, response + reward → PPO.
              </p>

              {/* Stage buttons */}
              <div className="flex gap-2 flex-wrap mb-4">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveStage(s.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
                      activeStage === s.id
                        ? "text-white"
                        : "bg-card border-border text-muted hover:text-foreground"
                    }`}
                    style={
                      activeStage === s.id
                        ? { backgroundColor: s.color, borderColor: s.color }
                        : {}
                    }
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              {/* Pipeline SVG */}
              <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
                <svg viewBox="0 0 760 300" className="w-full min-w-[700px]">
                  <defs>
                    <marker
                      id="arrow-pipeline"
                      markerWidth="10"
                      markerHeight="8"
                      refX="9"
                      refY="4"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 4, 0 8" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {STAGES.map((stage, i) => {
                    const x = 30 + i * 245;
                    const isActive = activeStage === stage.id;
                    return (
                      <g
                        key={stage.id}
                        onClick={() => setActiveStage(stage.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Card */}
                        <rect
                          x={x}
                          y={40}
                          width={220}
                          height={200}
                          rx={14}
                          fill={stage.color}
                          opacity={isActive ? 0.18 : 0.07}
                          stroke={stage.color}
                          strokeWidth={isActive ? 2.8 : 1.2}
                        />
                        {/* Title */}
                        <text
                          x={x + 110}
                          y={66}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill={stage.color}
                        >
                          {stage.title}
                        </text>
                        {/* Subtitle */}
                        <text
                          x={x + 110}
                          y={84}
                          textAnchor="middle"
                          fontSize={10}
                          fill="#94a3b8"
                        >
                          {stage.subtitle}
                        </text>

                        {/* Bullets (shown only when active) */}
                        {isActive &&
                          stage.bullets.map((b, j) => (
                            <text
                              key={j}
                              x={x + 12}
                              y={112 + j * 22}
                              fontSize={9}
                              fill="#cbd5e1"
                            >
                              • {b.length > 42 ? b.slice(0, 42) + "..." : b}
                            </text>
                          ))}
                        {!isActive && (
                          <text
                            x={x + 110}
                            y={170}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#64748b"
                          >
                            (nhấp để xem)
                          </text>
                        )}

                        {/* Flow label (bottom) */}
                        <text
                          x={x + 110}
                          y={225}
                          textAnchor="middle"
                          fontSize={9}
                          fontWeight={600}
                          fill={stage.color}
                          opacity={0.9}
                        >
                          → {stage.flowTo}
                        </text>

                        {/* Arrow to next */}
                        {i < STAGES.length - 1 && (
                          <>
                            <line
                              x1={x + 220}
                              y1={140}
                              x2={x + 245}
                              y2={140}
                              stroke="#94a3b8"
                              strokeWidth={2}
                              markerEnd="url(#arrow-pipeline)"
                            />
                            {/* Animated data-flow dots */}
                            <motion.circle
                              key={`dot-${i}-${dataFlowTick}`}
                              cx={x + 220}
                              cy={140}
                              r={4}
                              fill={STAGES[i + 1].color}
                              initial={{ cx: x + 220, opacity: 0 }}
                              animate={{ cx: x + 245, opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Top input label */}
                  <text x={30} y={22} fontSize={10} fill="#94a3b8">
                    Input: {activeStageMeta.flowFrom}
                  </text>

                  {/* Bottom output label */}
                  <text
                    x={30 + 2 * 245 + 220}
                    y={278}
                    fontSize={11}
                    fill="#22c55e"
                    fontWeight={700}
                    textAnchor="end"
                  >
                    Output cuối: π_RLHF (aligned)
                  </text>
                </svg>
              </div>

              {/* Active stage detail */}
              <div
                className="rounded-lg border p-3 mt-3"
                style={{
                  borderColor: activeStageMeta.color,
                  backgroundColor: `${activeStageMeta.color}15`,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: activeStageMeta.color }}
                >
                  {activeStageMeta.title} — {activeStageMeta.subtitle}
                </p>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  {activeStageMeta.detail}
                </p>
              </div>
            </div>

            {/* ─── Interactive preference labeling ─── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Đóng vai annotator — gán nhãn A vs B
              </h3>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Bạn là người &quot;dạy&quot; reward model. Với mỗi prompt, hãy chọn
                câu trả lời mà bạn thấy tốt hơn (helpful + honest + harmless). Càng
                nhiều nhãn đúng, RM càng khớp với preference con người → policy càng
                aligned.
              </p>

              {/* Progress bar: RM accuracy */}
              <div className="rounded-lg border border-border bg-background/60 p-3 mb-3">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>Đã gán nhãn</span>
                  <span className="font-mono">
                    {totalLabeled}/{PREF_PAIRS.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#f59e0b] font-semibold">
                    RM accuracy (khớp đáp án tham khảo)
                  </span>
                  <span className="font-mono text-[#f59e0b]">
                    {(rmAccuracy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#f59e0b]"
                    initial={{ width: 0 }}
                    animate={{ width: `${rmAccuracy * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs mt-3 mb-1">
                  <span className="text-[#22c55e] font-semibold">
                    Policy reward (ước lượng sau PPO)
                  </span>
                  <span className="font-mono text-[#22c55e]">
                    {(policyReward * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#22c55e]"
                    initial={{ width: 0 }}
                    animate={{ width: `${policyReward * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  Sau khi RM học xong, PPO sẽ dùng nó để cải thiện policy. Policy
                  reward tỉ lệ thuận với chất lượng RM — RM tệ → policy tệ / reward
                  hacking.
                </p>
              </div>

              {/* Preference pairs list */}
              <div className="space-y-3">
                {PREF_PAIRS.map((pair) => {
                  const chosen = labels[pair.id] ?? null;
                  const isCorrect = chosen !== null && chosen === pair.ideal;
                  const isAnswered = chosen !== null;
                  return (
                    <div
                      key={pair.id}
                      className="rounded-lg border border-border bg-background/50 p-3"
                    >
                      <p className="text-xs text-accent font-semibold uppercase tracking-wide mb-1">
                        Prompt
                      </p>
                      <p className="text-sm text-foreground mb-3">{pair.prompt}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(["A", "B"] as const).map((key) => {
                          const isChosen = chosen === key;
                          const isIdeal = pair.ideal === key;
                          const borderColor = isAnswered
                            ? isChosen
                              ? isIdeal
                                ? "#22c55e"
                                : "#ef4444"
                              : isIdeal
                                ? "#22c55e"
                                : "#475569"
                            : "#334155";
                          const bg = isChosen
                            ? `${borderColor}20`
                            : "transparent";
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleLabel(pair.id, key)}
                              className="text-left rounded-lg p-2 text-xs transition-colors hover:bg-surface"
                              style={{
                                border: `1.5px solid ${borderColor}`,
                                background: bg,
                              }}
                            >
                              <span
                                className="font-semibold mr-1"
                                style={{ color: borderColor }}
                              >
                                {key}.
                              </span>
                              <span className="text-foreground">
                                {pair[key]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-[11px] leading-relaxed"
                          style={{ color: isCorrect ? "#22c55e" : "#ef4444" }}
                        >
                          {isCorrect
                            ? "✓ Khớp đáp án tham khảo — RM update đúng hướng."
                            : `✗ Đáp án tham khảo là ${pair.ideal}: ${pair.reason}`}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={resetLabels}
                className="mt-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                Reset nhãn
              </button>
            </div>

            {/* ─── Mini outcome card ─── */}
            <AnimatePresence>
              {totalLabeled === PREF_PAIRS.length && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border-2 p-4"
                  style={{
                    borderColor: rmAccuracy >= 0.8 ? "#22c55e" : "#f59e0b",
                    backgroundColor:
                      rmAccuracy >= 0.8 ? "#22c55e15" : "#f59e0b15",
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: rmAccuracy >= 0.8 ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {rmAccuracy >= 0.8
                      ? "Policy aligned thành công"
                      : "Policy bị reward hacking nhẹ"}
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {rmAccuracy >= 0.8
                      ? "RM của bạn khớp tốt với preference 'chuẩn'. PPO cải thiện policy mà không bị hack. Đây là scenario RLHF thành công."
                      : "RM chỉ khớp một phần preference — PPO có thể tối ưu sai hướng. Trong thực tế, cần thêm dữ liệu annotator, nhiều annotator độc lập, và RM ensemble."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — AHA MOMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>RLHF không dạy AI kiến thức mới — nó dạy AI giá trị.</strong>{" "}
            Base model (sau pretraining) đã có đủ tri thức. RLHF chỉ định hình{" "}
            <em>cách mô hình sử dụng tri thức đó</em> — khi nào nên nói, khi nào nên
            im lặng, cách từ chối lịch sự, khi nào nên làm rõ thay vì đoán.
          </p>
          <p className="text-sm text-muted mt-2">
            Và trái tim kỹ thuật: Reward Model <em>thay mặt</em> con người chấm điểm
            hàng triệu response — biến &quot;phản hồi người&quot; (chậm, đắt) thành
            một hàm số đạo hàm được (nhanh, rẻ). Đây là cây cầu giúp RL cổ điển áp
            dụng được cho LLM.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — INLINE CHALLENGES (2 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-4">
          <InlineChallenge
            question="Mô hình phát hiện rằng câu trả lời DÀI luôn được RM cho điểm cao hơn, nên bắt đầu viết rất dài dù không cần thiết. Hiện tượng này tên là gì?"
            options={[
              "Overfitting",
              "Reward hacking — khai thác lỗ hổng của reward model",
              "Catastrophic forgetting",
              "Mode collapse",
            ]}
            correct={1}
            explanation="Reward hacking xảy ra khi policy tìm cách tối đa điểm thưởng mà không thực sự cải thiện chất lượng. KL penalty, RM ensemble, cập nhật RM định kỳ, và reward shaping là các giải pháp."
          />
          <InlineChallenge
            question="Bạn tăng β (KL coefficient) từ 0.02 lên 1.0. Tác động dự kiến?"
            options={[
              "Policy đi xa hơn khỏi SFT, reward trung bình cao hơn",
              "Policy gần như không thay đổi so với SFT — mất tác dụng của PPO",
              "Reward hacking trở nên nghiêm trọng hơn",
              "Training loss của SFT tăng",
            ]}
            correct={1}
            explanation="β lớn → KL penalty nặng → policy bị 'kéo ghì' về SFT. Reward không tăng được nhiều. Ngược lại β quá nhỏ → policy drift xa, dễ reward hacking. Chọn β là trade-off trung tâm của RLHF (thường 0.01–0.2)."
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 6 — ANOTHER VISUAL: training dynamics
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Động lực huấn luyện">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Tương tác giữa reward, KL divergence, và chất lượng thực tế
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-[#22c55e40] bg-[#22c55e10] p-3">
              <p className="text-[#22c55e] font-semibold mb-1">β nhỏ (0.01)</p>
              <p className="text-xs text-muted leading-relaxed">
                Policy tự do → reward model score tăng nhanh. Nhưng có thể bị hack:
                mô hình nịnh, xả văn, trả lời off-topic. Cần giám sát kỹ.
              </p>
            </div>
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
              <p className="text-accent font-semibold mb-1">β vừa (0.05–0.2)</p>
              <p className="text-xs text-muted leading-relaxed">
                Sweet spot. Policy cải thiện rõ trên preference eval, KL với SFT
                vừa phải (~5–15), chất lượng thực tế tăng ổn định.
              </p>
            </div>
            <div className="rounded-lg border border-[#ef444440] bg-[#ef444410] p-3">
              <p className="text-[#ef4444] font-semibold mb-1">β lớn (&gt;0.5)</p>
              <p className="text-xs text-muted leading-relaxed">
                Policy gần như = SFT. Reward không tăng được. Lãng phí compute. Bằng
                chứng: eval win-rate vs SFT chỉ nhỉnh hơn 50/50.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted mt-3 leading-relaxed">
            Trong thực tế, các lab như OpenAI và Anthropic dùng thêm{" "}
            <em>adaptive KL control</em> — β thay đổi theo KL thực đo được, đảm bảo
            KL nằm trong khoảng mục tiêu (thường 6–12 nats).
          </p>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 7 — EXPLANATION SECTION (definition + LaTeX + 2 CodeBlocks +
                                       4 Callouts + 2 CollapsibleDetails +
                                       applications + pitfalls)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          {/* ── Định nghĩa ── */}
          <p>
            <strong>RLHF</strong> (Reinforcement Learning from Human Feedback) là một
            pipeline 3 giai đoạn được giới thiệu bởi Christiano et al. (2017) và áp
            dụng thành công vào LLM bởi InstructGPT (Ouyang et al., 2022). Mục tiêu:
            biến một mô hình ngôn ngữ lớn đã pretrain thành một trợ lý hữu ích, trung
            thực, và an toàn — phù hợp với{" "}
            <TopicLink slug="alignment">preference của con người</TopicLink>. Ba giai
            đoạn:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-2">
            <li>
              <strong>SFT (Supervised Fine-Tuning):</strong> fine-tune base model trên
              dữ liệu demo (prompt, response mẫu) bằng cross-entropy loss. Kết quả:
              π_SFT, mô hình biết trả lời theo format mong muốn.
            </li>
            <li>
              <strong>Reward Model (RM):</strong> huấn luyện một mô hình R_φ dự đoán
              preference của con người dựa trên preference pairs (prompt, chosen,
              rejected). Loss Bradley-Terry:
              <LaTeX block>{String.raw`\mathcal{L}_{\text{RM}}(\phi) = -\mathbb{E}_{(x, y_w, y_l) \sim D} \left[ \log \sigma\left( R_\phi(x, y_w) - R_\phi(x, y_l) \right) \right]`}</LaTeX>
              trong đó y_w là chosen, y_l là rejected.
            </li>
            <li>
              <strong>PPO (Proximal Policy Optimization):</strong> tối ưu policy π_θ
              để tối đa reward từ R_φ, với một ràng buộc KL để giữ gần π_SFT.
            </li>
          </ol>

          <p className="mt-3">
            <strong>Hàm mục tiêu của bước PPO</strong> (core equation của RLHF):
          </p>
          <LaTeX block>{String.raw`\max_{\pi_\theta} \; \mathbb{E}_{x \sim D, \, y \sim \pi_\theta(\cdot \mid x)} \left[ R_\phi(x, y) \;-\; \beta \cdot \log \frac{\pi_\theta(y \mid x)}{\pi_{\text{SFT}}(y \mid x)} \right]`}</LaTeX>

          <p className="text-sm text-muted mt-2 leading-relaxed">
            Thành phần KL penalty (β · log π_θ/π_SFT) tương đương{" "}
            <LaTeX>{String.raw`\beta \cdot D_{\text{KL}}(\pi_\theta \| \pi_{\text{SFT}})`}</LaTeX>{" "}
            khi lấy kỳ vọng. Đây là reward shaping per-token: reward thực tế mỗi
            token là R_φ (ở token cuối) minus β · KL cục bộ. β kiểm soát trade-off
            giữa &quot;tối đa reward&quot; và &quot;giữ gần SFT&quot;.
          </p>

          {/* ── Callout 1 — insight: PPO vs vanilla policy gradient ── */}
          <Callout variant="insight" title="Tại sao PPO chứ không phải REINFORCE?">
            <p>
              REINFORCE (vanilla policy gradient) có variance cao và không ổn định
              với LLM (hàng tỷ tham số). <strong>PPO</strong> giới hạn mức độ policy
              được cập nhật mỗi step bằng <em>clipped surrogate objective</em> và
              trust region — ổn định hơn nhiều. Kết hợp PPO + KL penalty tạo một
              vòng lặp &quot;học có phanh&quot; an toàn.
            </p>
          </Callout>

          {/* ── CodeBlock 1 — Reward Model training ── */}
          <CodeBlock language="python" title="reward_model_training.py">
            {`import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer

class RewardModel(nn.Module):
    """
    Reward Model: base LLM + một head tuyến tính cho ra scalar reward.
    """

    def __init__(self, base_model_name: str):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(base_model_name)
        hidden = self.backbone.config.hidden_size
        self.value_head = nn.Linear(hidden, 1, bias=False)

    def forward(self, input_ids, attention_mask):
        out = self.backbone(input_ids, attention_mask=attention_mask)
        last_hidden = out.last_hidden_state
        # Lấy hidden state của token cuối cùng (cuối response)
        lengths = attention_mask.sum(dim=1) - 1
        last = last_hidden[torch.arange(last_hidden.size(0)), lengths]
        reward = self.value_head(last).squeeze(-1)  # (batch,)
        return reward


def rm_loss(reward_chosen, reward_rejected):
    """Bradley-Terry loss: khuyến khích reward(chosen) > reward(rejected)."""
    return -F.logsigmoid(reward_chosen - reward_rejected).mean()


# Training loop
def train_step(rm, tokenizer, batch, optimizer):
    # batch gồm danh sách (prompt, chosen, rejected)
    chosen_texts = [p + c for p, c, _ in batch]
    rejected_texts = [p + r for p, _, r in batch]

    chosen_enc = tokenizer(chosen_texts, padding=True, truncation=True,
                           return_tensors="pt").to("cuda")
    rejected_enc = tokenizer(rejected_texts, padding=True, truncation=True,
                             return_tensors="pt").to("cuda")

    r_chosen = rm(**chosen_enc)
    r_rejected = rm(**rejected_enc)

    loss = rm_loss(r_chosen, r_rejected)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item(), (r_chosen > r_rejected).float().mean().item()`}
          </CodeBlock>

          {/* ── Callout 2 — tip: Normalize RM scores ── */}
          <Callout variant="tip" title="Chuẩn hóa reward trước khi đưa vào PPO">
            <p>
              Reward từ RM có phân phối tùy tiện (có thể −5 đến +5). Trong PPO, nên
              chuẩn hóa reward theo batch (trừ mean, chia std) để gradient ổn định.
              Kỹ thuật này được gọi là <em>reward whitening</em> và gần như bắt buộc
              trong mọi implementation RLHF production.
            </p>
          </Callout>

          {/* ── CollapsibleDetail 1 — Chứng minh RLHF objective tương đương KL-regularized max-likelihood ── */}
          <CollapsibleDetail title="Toán học nâng cao: RLHF objective có lời giải đóng">
            <p>
              Objective RLHF max_π E[R − β · log(π/π_SFT)] có lời giải đóng (closed
              form) khi tối ưu trên không gian phân phối:
            </p>
            <LaTeX block>{String.raw`\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{SFT}}(y \mid x) \cdot \exp\!\left( \frac{1}{\beta} R_\phi(x, y) \right)`}</LaTeX>
            <p className="mt-2">
              trong đó Z(x) là hệ số chuẩn hóa (partition function). Đây chính là{" "}
              <em>softmax distribution</em> với temperature 1/β. Lời giải này gợi ý:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Khi β → ∞: π* → π_SFT (KL penalty chiếm ưu thế).</li>
              <li>Khi β → 0: π* → argmax R_φ (reward chiếm ưu thế).</li>
              <li>
                PPO chỉ là một cách xấp xỉ π* bằng gradient ascent — vì Z(x) intractable.
              </li>
              <li>
                <strong>DPO</strong> (Rafailov et al., 2023) khai thác closed form này
                để bỏ hoàn toàn RM + PPO — tối ưu trực tiếp trên preference pairs.
              </li>
            </ul>
          </CollapsibleDetail>

          {/* ── Callout 3 — warning: Reward hacking ── */}
          <Callout variant="warning" title="Reward hacking là vấn đề trung tâm của RLHF">
            <p>
              Mô hình rất giỏi tìm &quot;ngóc ngách&quot; của RM: dùng từ ngữ nịnh
              bợ, xả văn dài dòng, từ chối quá mức, lặp lại cấu trúc. Giải pháp:
              (1) <strong>KL penalty</strong> giữ gần SFT; (2){" "}
              <strong>RM ensemble</strong> — trung bình nhiều RM độc lập; (3){" "}
              <strong>iterative RLHF</strong> — định kỳ thu thêm preference data từ
              policy hiện tại để update RM; (4){" "}
              <strong>constitutional AI</strong> — thêm critic dựa trên luật định.
            </p>
          </Callout>

          {/* ── CodeBlock 2 — PPO loop with TRL ── */}
          <CodeBlock language="python" title="ppo_rlhf_with_trl.py">
            {`# Dùng thư viện TRL (Hugging Face) — abstraction phổ biến cho RLHF.
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead
from transformers import AutoTokenizer
import torch

# 1. Load policy (π_θ) — khởi tạo từ π_SFT
policy = AutoModelForCausalLMWithValueHead.from_pretrained("sft-model")
ref_model = AutoModelForCausalLMWithValueHead.from_pretrained("sft-model")
ref_model.eval()  # ref_model = π_SFT, đóng băng để tính KL

tokenizer = AutoTokenizer.from_pretrained("sft-model")
reward_model = load_reward_model("rm-model")

# 2. Cấu hình PPO
config = PPOConfig(
    model_name="sft-model",
    learning_rate=1e-5,
    batch_size=64,
    mini_batch_size=8,
    ppo_epochs=4,
    init_kl_coef=0.05,     # β ban đầu
    adap_kl_ctrl=True,     # adaptive KL control
    target=6.0,            # target KL (nats)
    cliprange=0.2,         # PPO clip range
    cliprange_value=0.2,
    vf_coef=0.1,
    gamma=1.0,
    lam=0.95,
)

trainer = PPOTrainer(
    config=config,
    model=policy,
    ref_model=ref_model,
    tokenizer=tokenizer,
)

# 3. Training loop
for epoch in range(num_epochs):
    for batch in prompt_dataloader:
        prompts = batch["prompt"]
        prompt_tensors = [tokenizer.encode(p, return_tensors="pt")[0] for p in prompts]

        # (a) Policy sinh response
        response_tensors = [
            trainer.generate(p, max_new_tokens=200, do_sample=True, top_p=0.9)[0]
            for p in prompt_tensors
        ]
        responses = [tokenizer.decode(r) for r in response_tensors]

        # (b) Reward model chấm
        rewards = [
            torch.tensor(reward_model.score(p, r))
            for p, r in zip(prompts, responses)
        ]

        # (c) PPO update — tự động áp dụng KL penalty với ref_model
        stats = trainer.step(prompt_tensors, response_tensors, rewards)

        # (d) Log
        print(f"reward={stats['ppo/mean_scores']:.3f}, "
              f"KL={stats['objective/kl']:.2f}, "
              f"β={stats['objective/kl_coef']:.4f}")`}
          </CodeBlock>

          {/* ── CollapsibleDetail 2 — Comparison with alternatives ── */}
          <CollapsibleDetail title="So sánh RLHF với các phương pháp alignment khác">
            <p>
              RLHF không phải lựa chọn duy nhất. Dưới đây là các biến thể và lựa chọn
              thay thế phổ biến:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
              <li>
                <strong>RLAIF</strong> (RL from AI Feedback, Anthropic): thay annotator
                con người bằng một LLM khác chấm điểm theo nguyên tắc (constitution).
                Rẻ hơn, scale tốt hơn, dùng trong Claude.
              </li>
              <li>
                <strong>DPO</strong> (Direct Preference Optimization): bỏ RM + PPO,
                tối ưu policy trực tiếp trên preference pairs bằng closed-form loss.
                Đơn giản hơn, ổn định hơn, hiệu quả tương đương hoặc hơn RLHF.
              </li>
              <li>
                <strong>IPO / KTO</strong>: biến thể của DPO với loss khác, khắc phục
                overfitting trên preference.
              </li>
              <li>
                <strong>GRPO</strong> (DeepSeekMath): bỏ value network của PPO, dùng
                group-relative advantage. Giảm bộ nhớ, tốt cho reasoning model.
              </li>
              <li>
                <strong>Constitutional AI</strong>: RLAIF với SL-CAI (tự phê bình theo
                nguyên tắc) + RL-CAI. Cách Anthropic scale an toàn.
              </li>
              <li>
                <strong>RLVR</strong> (Reinforcement Learning with Verifiable Rewards):
                dùng kiểm tra khách quan (unit test, toán học đúng/sai) thay vì RM.
                Nền tảng của các reasoning model như o1, DeepSeek-R1.
              </li>
            </ul>
          </CollapsibleDetail>

          {/* ── Callout 4 — info: 3 trụ cột ── */}
          <Callout variant="insight" title="Preference pairs mã hóa giá trị">
            <p>
              Mỗi lựa chọn A vs B của người annotator là một &quot;phiếu bầu&quot;
              cho giá trị. Hàng triệu phiếu bầu qua thời gian tạo thành một đại diện
              toán học của &quot;cái gì tốt&quot; trong mắt nhóm annotator đó. RLHF
              sẽ chỉ tốt ngang người annotator — đa dạng hóa pool annotator là chìa
              khóa để RLHF không thiên lệch về một văn hóa hay quan điểm cụ thể.
            </p>
          </Callout>

          {/* ── Ứng dụng thực tế ── */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Ứng dụng thực tế
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>ChatGPT (OpenAI):</strong> RLHF gốc. InstructGPT → ChatGPT →
              GPT-4 đều có giai đoạn RLHF với hàng triệu preference.
            </li>
            <li>
              <strong>Claude (Anthropic):</strong> Constitutional AI + RLAIF — dùng
              LLM làm annotator dựa trên &quot;hiến pháp&quot; 60+ nguyên tắc.
            </li>
            <li>
              <strong>Gemini (Google DeepMind):</strong> RLHF + safety fine-tuning +
              RL với verifiable rewards.
            </li>
            <li>
              <strong>LLaMA-2 Chat (Meta):</strong> SFT + 2 reward models (helpful +
              safety) + RLHF với rejection sampling + PPO.
            </li>
            <li>
              <strong>InstructGPT paper (2022):</strong> RLHF giúp mô hình 1.3B
              parameter vượt GPT-3 175B về preference của người dùng — bằng chứng
              alignment &gt; scale.
            </li>
            <li>
              <strong>Ngoài LLM:</strong> Image generation (Imagen, DALL·E 3),
              code generation (Codex, Copilot), robotics (RT-2), tất cả đều dùng
              human feedback ở dạng nào đó.
            </li>
          </ul>

          {/* ── Pitfalls ── */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Những lỗi thường gặp (pitfalls)
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>RM overfitting:</strong> RM có thể memorize pattern của dataset
              preference (ví dụ: câu nào dài hơn thắng). Cross-validation, hold-out
              evaluator LLM, diversity trong training preferences.
            </li>
            <li>
              <strong>β cố định:</strong> Fix β suốt training không tối ưu — dùng
              adaptive KL control để β tự điều chỉnh theo KL thực đo.
            </li>
            <li>
              <strong>Reward hacking không phát hiện:</strong> Nếu chỉ đánh giá bằng
              chính RM, hack sẽ không lộ ra. Luôn dùng <em>held-out evaluator</em>{" "}
              (người khác, LLM khác) để đánh giá policy cuối.
            </li>
            <li>
              <strong>Distribution mismatch:</strong> Prompt dùng trong PPO khác với
              prompt thực tế người dùng nhập → policy tối ưu sai domain. Nên lấy
              prompt từ distribution gần production.
            </li>
            <li>
              <strong>Mất khả năng:</strong> RLHF quá mạnh có thể làm mô hình mất
              khả năng ngôn ngữ / toán / code. Giám sát các benchmark base (MMLU,
              HumanEval) song song với preference eval.
            </li>
            <li>
              <strong>Annotator bias:</strong> Nếu annotator thiên về một văn hóa /
              quan điểm, RM sẽ thiên theo. Đa dạng hóa pool, đo inter-annotator
              agreement, và minh bạch về composition của annotator.
            </li>
          </ul>

          <p className="mt-4">
            <strong>Trong thực tế:</strong> RLHF là kỹ thuật tốn kém (hàng triệu USD
            cho preference annotation + compute), nhưng là con đường đã được chứng
            minh là hiệu quả để biến base LLM thành trợ lý hữu ích. DPO và các biến
            thể đơn giản hơn đang dần thay thế PPO trong nhiều pipeline — nhưng ý
            tưởng cốt lõi &quot;học từ preference của con người&quot; vẫn là trung
            tâm của mọi công nghệ alignment hiện đại.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 8 — MINI SUMMARY (6 điểm)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về RLHF"
          points={[
            "Pipeline 3 giai đoạn: SFT (học format từ demo) → Reward Model (học preference con người) → PPO (tối ưu policy theo RM + KL penalty).",
            "RM thay mặt con người chấm điểm hàng triệu response — giải quyết nút cổ chai tốc độ của human feedback. Loss Bradley-Terry trên preference pairs (chosen vs rejected).",
            "Objective PPO cốt lõi: max E[R_φ(x, y) − β · KL(π_θ ‖ π_SFT)]. β kiểm soát trade-off giữa tối đa reward và trung thành với SFT.",
            "KL penalty là phanh chống reward hacking — nếu không có, policy sẽ tìm ngóc ngách của RM (nịnh bợ, xả văn, off-topic) để thổi điểm.",
            "RLHF không dạy kiến thức mới — nó dạy giá trị (helpful, honest, harmless). Mã hóa giá trị qua preference pairs của annotator.",
            "Biến thể: RLAIF (AI annotator), DPO (bỏ RM+PPO), GRPO (bỏ value net), Constitutional AI (hiến pháp + RLAIF), RLVR (verifiable rewards). DPO đang dần phổ biến do đơn giản hơn.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 9 — QUIZ (8 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
