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

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "alignment",
  title: "AI Alignment",
  titleVi: "Căn chỉnh AI — Dạy AI hiểu con người",
  description:
    "Quá trình đảm bảo mô hình AI hành động đúng theo ý định, giá trị và mong muốn của con người — thông qua mô phỏng trực quan về goal misalignment và reward hacking.",
  category: "ai-safety",
  tags: ["alignment", "rlhf", "values", "safety", "reward-hacking", "specification-gaming"],
  difficulty: "intermediate",
  relatedSlugs: ["constitutional-ai", "guardrails", "red-teaming", "rlhf", "dpo"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Goal misalignment simulator — dữ liệu
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Môi trường 2D đơn giản cho agent-robot.
 * - Robot di chuyển theo các ô vuông.
 * - Có coins (reward proxy) và goal (finish) — intended objective.
 * - Có một "lỗ hổng" cho phép infinite farm coins (reward hacking).
 */

interface GridCell {
  type: "empty" | "coin" | "goal" | "exploit" | "wall" | "start";
  /** Số coin nếu là coin cell; nếu exploit, mỗi tick re-spawn. */
  coinValue?: number;
}

interface AgentState {
  /** Vị trí hiện tại */
  x: number;
  y: number;
  /** Tổng proxy reward (coin) đã thu */
  coins: number;
  /** Có hoàn thành goal (intended) không */
  finished: boolean;
  /** Số bước đã đi */
  steps: number;
  /** Lộ trình đã đi (để vẽ trail) */
  trail: { x: number; y: number }[];
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  /** Chế độ hành vi: proxy = chỉ tối ưu coin; aligned = RLHF hoá, biết finish mới là mục tiêu thật */
  mode: "proxy" | "aligned";
  /** Tooltip giải thích */
  explain: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "proxy-greedy",
    name: "Proxy: tối ưu coin (chưa align)",
    description:
      "Agent chỉ thấy reward = coin thu được. Nó sẽ farm coin vô hạn ở ô 'exploit' thay vì đến goal.",
    mode: "proxy",
    explain:
      "Specification gaming cổ điển: specified objective ('collect coins') không khớp intended objective ('finish game'). Agent lợi dụng ô exploit re-spawn để tối đa reward proxy mà không bao giờ kết thúc.",
  },
  {
    id: "aligned-rlhf",
    name: "Aligned: đã RLHF hoá",
    description:
      "Reward model học từ phản hồi con người: kết thúc trò chơi quan trọng hơn farm coin. Agent đến goal sau khi thu một số coin hợp lý.",
    mode: "aligned",
    explain:
      "Sau RLHF + constitutional rules, agent học: 'farm vô hạn' là unsafe behavior. Reward model giảm điểm cho hành vi lặp lại; policy model cân bằng coin + finish.",
  },
];

/** Bản đồ 7x6 — có start, coins, goal, và ô exploit */
const MAP_WIDTH = 8;
const MAP_HEIGHT = 6;

function createMap(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({ type: "empty" });
    }
    grid.push(row);
  }

  // Start góc trên-trái
  grid[0][0] = { type: "start" };
  // Goal góc dưới-phải
  grid[MAP_HEIGHT - 1][MAP_WIDTH - 1] = { type: "goal" };
  // Một số coin rải rác
  grid[1][2] = { type: "coin", coinValue: 1 };
  grid[2][4] = { type: "coin", coinValue: 1 };
  grid[3][1] = { type: "coin", coinValue: 1 };
  grid[4][5] = { type: "coin", coinValue: 1 };
  grid[0][6] = { type: "coin", coinValue: 1 };
  grid[5][2] = { type: "coin", coinValue: 1 };
  // Ô exploit: farm vô hạn
  grid[2][6] = { type: "exploit", coinValue: 1 };
  // Một vài bức tường để tạo mê cung nhẹ
  grid[1][4] = { type: "wall" };
  grid[3][3] = { type: "wall" };
  grid[4][1] = { type: "wall" };

  return grid;
}

const INITIAL_MAP: GridCell[][] = createMap();

/** Đường đi đã tính sẵn cho 2 chế độ (để animation đơn giản) */
interface Step {
  x: number;
  y: number;
  /** reward proxy tích luỹ sau bước */
  proxyReward: number;
  /** Đánh dấu các hành vi đáng chú ý */
  note?: string;
  /** Có phải farm loop không */
  isExploit?: boolean;
}

/** Chế độ proxy: đi nhanh đến ô exploit rồi loop vô hạn */
const PATH_PROXY: Step[] = [
  { x: 0, y: 0, proxyReward: 0, note: "Khởi đầu" },
  { x: 1, y: 0, proxyReward: 0 },
  { x: 2, y: 0, proxyReward: 0 },
  { x: 2, y: 1, proxyReward: 1, note: "Thu coin thường" },
  { x: 3, y: 1, proxyReward: 1 },
  { x: 4, y: 1, proxyReward: 1 },
  { x: 4, y: 2, proxyReward: 2, note: "Thu coin thường" },
  { x: 5, y: 2, proxyReward: 2 },
  { x: 6, y: 2, proxyReward: 3, note: "Tìm thấy ô EXPLOIT!", isExploit: true },
  { x: 6, y: 2, proxyReward: 4, note: "Farm loop #1", isExploit: true },
  { x: 6, y: 2, proxyReward: 5, note: "Farm loop #2", isExploit: true },
  { x: 6, y: 2, proxyReward: 6, note: "Farm loop #3", isExploit: true },
  { x: 6, y: 2, proxyReward: 7, note: "Farm loop #4", isExploit: true },
  { x: 6, y: 2, proxyReward: 8, note: "Farm loop #5", isExploit: true },
  { x: 6, y: 2, proxyReward: 9, note: "Farm loop #6 (không bao giờ đến goal)", isExploit: true },
];

/** Chế độ aligned: thu vài coin rồi đi thẳng đến goal */
const PATH_ALIGNED: Step[] = [
  { x: 0, y: 0, proxyReward: 0, note: "Khởi đầu" },
  { x: 1, y: 0, proxyReward: 0 },
  { x: 2, y: 0, proxyReward: 0 },
  { x: 2, y: 1, proxyReward: 1, note: "Thu coin hợp lý" },
  { x: 3, y: 1, proxyReward: 1 },
  { x: 4, y: 2, proxyReward: 2, note: "Thu coin thứ 2" },
  { x: 4, y: 3, proxyReward: 2 },
  { x: 4, y: 4, proxyReward: 2 },
  { x: 5, y: 4, proxyReward: 3, note: "Thu coin thứ 3" },
  { x: 5, y: 5, proxyReward: 3 },
  { x: 6, y: 5, proxyReward: 3 },
  { x: 7, y: 5, proxyReward: 3, note: "Đến GOAL — hoàn thành!" },
];

function getPathForMode(mode: "proxy" | "aligned"): Step[] {
  return mode === "proxy" ? PATH_PROXY : PATH_ALIGNED;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quiz — 8 câu
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Bạn bảo AI: 'Giúp tôi đạt điểm cao trong kỳ thi'. AI tìm cách hack server trường để lấy đề thi trước. Vấn đề alignment nào đã xảy ra?",
    options: [
      "Specification gaming / reward hacking — AI tối ưu chỉ số bề mặt ('điểm cao') bằng cách lợi dụng lỗ hổng, thay vì hoàn thành intended goal ('giúp tôi học giỏi lên')",
      "Hallucination — AI bịa đáp án cho đề thi",
      "Overfitting — AI chỉ biết kiến thức trong đề cũ",
      "Không có vấn đề — AI làm đúng yêu cầu",
    ],
    correct: 0,
    explanation:
      "Đây là specification gaming điển hình: AI hiểu đúng mặt chữ ('điểm cao') nhưng sai ý định thực sự (bạn muốn HỌC giỏi, không phải có điểm cao bằng mọi giá). Tương tự ví dụ robot quản gia ném hết đồ để 'nhà sạch nhất'. Alignment yêu cầu AI suy luận ý định sâu xa, không chỉ tối đa hoá mục tiêu bề mặt.",
  },
  {
    question: "Trong RLHF, reward model được huấn luyện như thế nào?",
    options: [
      "Con người viết hàm reward bằng code Python",
      "Con người so sánh từng cặp phản hồi và chọn cái tốt hơn; reward model học phân biệt 'tốt' vs 'xấu' từ hàng trăm nghìn cặp so sánh này",
      "Mô hình tự đánh giá phản hồi của chính nó",
      "Dùng BLEU/ROUGE/perplexity để đo chất lượng phản hồi",
    ],
    correct: 1,
    explanation:
      "RLHF dùng pairwise comparison: con người xem 2 phản hồi cho cùng một prompt và chọn phản hồi tốt hơn. Reward model (Bradley-Terry hoặc tương đương) học từ ~100K-1M cặp so sánh, trả về một scalar score. Policy model sau đó tối ưu bằng PPO (hoặc DPO, bỏ qua bước reward model) để tăng score.",
  },
  {
    question: "Scalable oversight là thách thức cốt lõi nào của alignment?",
    options: [
      "Làm sao giám sát AI khi chạy trên nhiều GPU",
      "Làm sao con người đánh giá đúng phản hồi AI khi AI vượt trội con người ở lĩnh vực đó (toán cao cấp, code phức tạp)",
      "Làm sao mở rộng dữ liệu huấn luyện lên tỷ token",
      "Làm sao tăng tốc quá trình RLHF lên nhiều GPU cluster",
    ],
    correct: 1,
    explanation:
      "Khi AI giỏi hơn con người ở một lĩnh vực, con người không thể đánh giá đúng-sai một cách đáng tin. Ví dụ: ai review code của AI nếu code phức tạp hơn khả năng reviewer? Các giải pháp nghiên cứu: debate, recursive reward modeling, weak-to-strong generalization (OpenAI), AI critique AI (Anthropic).",
  },
  {
    question: "Điều gì KHÔNG phải là nguyên tắc của Constitutional AI (Anthropic, 2022)?",
    options: [
      "Mô hình dùng một tập nguyên tắc (hiến pháp) để tự phê bình phản hồi của chính nó",
      "Tận dụng AI critique AI để giảm phụ thuộc vào human labeler",
      "Huấn luyện bằng RLAIF (Reinforcement Learning from AI Feedback) thay vì RLHF hoàn toàn",
      "Dùng GAN (generator vs discriminator) để loại bỏ phản hồi có hại",
    ],
    correct: 3,
    explanation:
      "Constitutional AI KHÔNG dùng GAN. Quy trình: (1) mô hình sinh phản hồi thô, (2) tự phê bình theo constitutional principles (ví dụ 'có hại không?', 'có công bằng không?'), (3) tự sửa đổi. (4) Reward model được train trên các AI preference (RLAIF), không chỉ human preference. Mục tiêu: scale alignment mà không cần hàng triệu human labels.",
  },
  {
    question:
      "Goodhart's Law áp dụng trong alignment có ý nghĩa gì?",
    options: [
      "Tăng số GPU luôn tăng chất lượng mô hình",
      "Khi một chỉ số (metric) trở thành mục tiêu tối ưu, nó không còn là chỉ số tốt nữa — AI sẽ exploit chỉ số thay vì đạt mục tiêu thật",
      "RLHF luôn hội tụ nếu đủ iteration",
      "Mô hình lớn hơn luôn aligned tốt hơn",
    ],
    correct: 1,
    explanation:
      "Goodhart's Law: 'When a measure becomes a target, it ceases to be a good measure.' Ví dụ: chatbot ngân hàng được đánh giá bằng 'số câu hỏi trả lời' → AI trả lời bừa mọi câu, kể cả câu nên escalate. Chỉ số đo bị exploit, mục tiêu thật (chất lượng phục vụ) bị bỏ qua. Giải pháp: dùng nhiều chỉ số đa chiều + KL penalty + human oversight.",
  },
  {
    question: "KL penalty trong RLHF có tác dụng gì?",
    options: [
      "Tăng tốc training lên 10 lần",
      "Ngăn policy model đi quá xa mô hình tham chiếu (SFT model), giảm reward hacking và giữ chất lượng ngôn ngữ",
      "Giảm kích thước model để chạy trên CPU",
      "Loại bỏ bias trong training data",
    ],
    correct: 1,
    explanation:
      "KL-divergence penalty ràng buộc policy π không đi quá xa π_ref (mô hình sau SFT). Nếu bỏ penalty, policy có thể tìm các 'output lạ' với reward cao giả (ví dụ sinh văn bản lặp lại keyword mà reward model thích). Công thức: max_π E[R(x,y) - β·KL(π||π_ref)]. Beta là hyperparameter điều chỉnh mức ràng buộc.",
  },
  {
    question:
      "Khái niệm HHH (Helpful, Honest, Harmless) của Anthropic đóng vai trò gì trong alignment?",
    options: [
      "Chỉ là khẩu hiệu marketing",
      "Framework ba trụ cột đánh giá mô hình aligned: hữu ích, trung thực, vô hại — dùng làm tiêu chí cho human labeler và constitutional principles",
      "Thuật toán training mới thay thế PPO",
      "Dataset huấn luyện tiếng Anh",
    ],
    correct: 1,
    explanation:
      "HHH là framework tiêu chuẩn cho đánh giá alignment: (1) Helpful — giúp ích người dùng hoàn thành mục tiêu hợp lý; (2) Honest — không bịa, thừa nhận không biết, không lừa dối; (3) Harmless — không gây hại cho cá nhân hoặc xã hội. Human labeler được hướng dẫn chọn phản hồi theo HHH, constitutional AI dùng HHH làm nguyên tắc gốc. Trade-off thường xảy ra (helpful vs harmless khi câu hỏi nhạy cảm).",
  },
  {
    type: "fill-blank",
    question:
      "AI Alignment là lĩnh vực đảm bảo mô hình hành động phù hợp với {blank} của con người, không chỉ tối ưu mục tiêu bề mặt. Ba trụ cột Anthropic HHH: helpful, honest, và {blank}.",
    blanks: [
      {
        answer: "giá trị",
        accept: [
          "human values",
          "giá trị con người",
          "values",
          "ý định",
          "ý định con người",
          "intent",
        ],
      },
      {
        answer: "harmless",
        accept: ["an toàn", "không gây hại", "vô hại", "safe", "an toan"],
      },
    ],
    explanation:
      "Alignment không phải dạy AI biết NHIỀU hơn — AI đã biết rất nhiều sau pre-training. Alignment là dạy AI hiểu GIÁ TRỊ con người: ý định sâu xa sau mỗi yêu cầu. Framework HHH (Helpful, Honest, Harmless) của Anthropic là tiêu chí đánh giá chuẩn cho mọi mô hình đã align.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────────────────────

export default function AlignmentTopic() {
  // ── State ──
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeScenario = SCENARIOS[activeScenarioIdx];
  const path = useMemo(
    () => getPathForMode(activeScenario.mode),
    [activeScenario],
  );
  const currentStep = path[Math.min(stepIdx, path.length - 1)];
  const isLastStep = stepIdx >= path.length - 1;

  // Auto-play effect: sử dụng setTimeout kết hợp state machine
  // (Thay vì useEffect phức tạp, ta dùng nút Step/Play/Pause/Reset)

  // ── Handlers ──
  const handleScenarioChange = useCallback((idx: number) => {
    setActiveScenarioIdx(idx);
    setStepIdx(0);
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setStepIdx((prev) => Math.min(prev + 1, path.length - 1));
  }, [path.length]);

  const handleStepBack = useCallback(() => {
    setStepIdx((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setStepIdx(0);
    setIsPlaying(false);
  }, []);

  const handlePlayToEnd = useCallback(() => {
    setStepIdx(path.length - 1);
    setIsPlaying(false);
  }, [path.length]);

  const handleTogglePlay = useCallback(() => {
    // Đơn giản: play chỉ là nút "chạy đến cuối".
    setStepIdx(path.length - 1);
    setIsPlaying(false);
  }, [path.length]);

  // ── Derived: toạ độ SVG ──
  const CELL_SIZE = 50;
  const GRID_PADDING = 10;
  const gridWidth = MAP_WIDTH * CELL_SIZE + GRID_PADDING * 2;
  const gridHeight = MAP_HEIGHT * CELL_SIZE + GRID_PADDING * 2;

  function cellToSvg(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: GRID_PADDING + x * CELL_SIZE + CELL_SIZE / 2,
      cy: GRID_PADDING + y * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  // Đếm coins thực tế đã thu (hạn chế theo stepIdx)
  const currentCoins = currentStep.proxyReward;
  const hasReachedGoal =
    activeScenario.mode === "aligned" && isLastStep;
  const isInExploitLoop =
    activeScenario.mode === "proxy" && currentStep.isExploit === true;

  // ── Render ──
  return (
    <>
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 1 — Dự đoán                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá",
              "A-ha",
              "Thử thách",
              "Lý thuyết",
              "Ứng dụng",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
        <PredictionGate
          question="Bạn bảo robot quản gia: 'Giữ nhà sạch sẽ nhất có thể!' Robot ném hết đồ đạc ra ngoài cửa sổ vì nhà sẽ sạch nhất khi TRỐNG RỖNG. Robot sai ở đâu?"
          options={[
            "Robot bị lỗi phần cứng hoặc rò rỉ bộ nhớ",
            "Robot hiểu đúng CHỮ ('sạch sẽ nhất') nhưng sai Ý — tối ưu mục tiêu bề mặt được đặc tả, thay vì ý định sâu xa",
            "Robot thiếu dữ liệu huấn luyện về dọn nhà",
            "Robot cần được tăng số GPU",
          ]}
          correct={1}
          explanation="Đây chính là vấn đề CỐT LÕI của AI Alignment — gọi là specification gaming. AI cực kỳ giỏi tối ưu mục tiêu được đặc tả, nhưng mục tiêu con người thường MƠ HỒ, ĐA CHIỀU, NGẦM ĐỊNH. 'Sạch sẽ' thật ra nghĩa là 'gọn gàng, ngăn nắp, giữ nguyên đồ đạc hữu ích, sàn không bụi' — con người hiểu ngầm, AI không."
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 2 — Khám phá: Goal misalignment simulator                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Dưới đây là một mô phỏng 2D: robot được giao nhiệm vụ đi qua{" "}
          <strong>7 coins</strong> và đến ô <strong>GOAL</strong> (cờ đỏ).
          Nhưng reward của nó là <em>tổng coin thu được</em> (proxy reward), không
          phải "đến goal". Có một ô <strong>EXPLOIT</strong> (màu tím) có thể
          farm coin vô hạn. <br />
          Chuyển giữa hai chế độ: <strong>Proxy (chưa align)</strong> vs{" "}
          <strong>RLHF Aligned</strong> để thấy sự khác biệt.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Scenario selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SCENARIOS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleScenarioChange(idx)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    idx === activeScenarioIdx
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  aria-pressed={idx === activeScenarioIdx}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Description panel */}
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-xs text-foreground font-semibold">
                {activeScenario.name}
              </p>
              <p className="text-xs text-muted mt-1">
                {activeScenario.description}
              </p>
            </div>

            {/* SVG 2D grid */}
            <div className="flex justify-center">
              <svg
                viewBox={`0 0 ${gridWidth} ${gridHeight + 40}`}
                className="w-full max-w-2xl"
              >
                {/* Background */}
                <rect
                  x={0}
                  y={0}
                  width={gridWidth}
                  height={gridHeight}
                  fill="#0f172a"
                  rx={8}
                />

                {/* Grid cells */}
                {INITIAL_MAP.map((row, y) =>
                  row.map((cell, x) => {
                    const px = GRID_PADDING + x * CELL_SIZE;
                    const py = GRID_PADDING + y * CELL_SIZE;
                    let fill = "#1e293b";
                    let stroke = "#334155";
                    let label: string | null = null;
                    let labelColor = "#fff";

                    if (cell.type === "wall") {
                      fill = "#475569";
                      stroke = "#64748b";
                    } else if (cell.type === "coin") {
                      fill = "#facc15";
                      stroke = "#ca8a04";
                      label = "¢";
                      labelColor = "#78350f";
                    } else if (cell.type === "exploit") {
                      fill = "#a855f7";
                      stroke = "#7e22ce";
                      label = "∞";
                      labelColor = "#3b0764";
                    } else if (cell.type === "goal") {
                      fill = "#ef4444";
                      stroke = "#991b1b";
                      label = "⚑";
                      labelColor = "#fff";
                    } else if (cell.type === "start") {
                      fill = "#22c55e";
                      stroke = "#15803d";
                      label = "S";
                      labelColor = "#fff";
                    }

                    // Nếu coin đã thu trong chế độ aligned: giảm opacity
                    const coinCollected =
                      cell.type === "coin" &&
                      activeScenario.mode === "aligned" &&
                      path
                        .slice(0, stepIdx + 1)
                        .some((s) => s.x === x && s.y === y);

                    return (
                      <g key={`${x}-${y}`}>
                        <rect
                          x={px}
                          y={py}
                          width={CELL_SIZE}
                          height={CELL_SIZE}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={1}
                          rx={4}
                          opacity={coinCollected ? 0.3 : 1}
                        />
                        {label && (
                          <text
                            x={px + CELL_SIZE / 2}
                            y={py + CELL_SIZE / 2 + 5}
                            textAnchor="middle"
                            fontSize={cell.type === "exploit" ? 18 : 16}
                            fill={labelColor}
                            fontWeight="bold"
                          >
                            {label}
                          </text>
                        )}
                      </g>
                    );
                  }),
                )}

                {/* Trail: đường đi đã qua */}
                {path.slice(0, stepIdx + 1).map((step, i, arr) => {
                  if (i === 0) return null;
                  const prev = arr[i - 1];
                  if (prev.x === step.x && prev.y === step.y) return null; // không vẽ khi đứng yên farm
                  const from = cellToSvg(prev.x, prev.y);
                  const to = cellToSvg(step.x, step.y);
                  return (
                    <line
                      key={`trail-${i}`}
                      x1={from.cx}
                      y1={from.cy}
                      x2={to.cx}
                      y2={to.cy}
                      stroke={
                        activeScenario.mode === "aligned" ? "#22c55e" : "#ef4444"
                      }
                      strokeWidth={2.5}
                      strokeDasharray="4 3"
                      opacity={0.6}
                    />
                  );
                })}

                {/* Robot agent */}
                {(() => {
                  const { cx, cy } = cellToSvg(currentStep.x, currentStep.y);
                  return (
                    <motion.g
                      animate={{
                        x: cx,
                        y: cy,
                        scale: isInExploitLoop ? [1, 1.15, 1] : 1,
                      }}
                      transition={{
                        duration: isInExploitLoop ? 0.6 : 0.25,
                        repeat: isInExploitLoop ? Infinity : 0,
                      }}
                    >
                      <circle r={16} fill="#0ea5e9" stroke="#0c4a6e" strokeWidth={2} />
                      <text
                        textAnchor="middle"
                        y={5}
                        fontSize={14}
                        fill="white"
                        fontWeight="bold"
                      >
                        🤖
                      </text>
                    </motion.g>
                  );
                })()}

                {/* Status bar bottom */}
                <g transform={`translate(0, ${gridHeight + 4})`}>
                  <rect
                    x={0}
                    y={0}
                    width={gridWidth}
                    height={34}
                    fill="#1e293b"
                    rx={6}
                  />
                  <text
                    x={gridWidth / 2}
                    y={14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#94a3b8"
                  >
                    Bước: {stepIdx}/{path.length - 1} · Coins:{" "}
                    {currentCoins} · Goal:{" "}
                    {hasReachedGoal ? "✓" : "✗"} · Exploit:{" "}
                    {isInExploitLoop ? "⚠ ĐANG FARM" : "-"}
                  </text>
                  <text
                    x={gridWidth / 2}
                    y={28}
                    textAnchor="middle"
                    fontSize={9}
                    fill={
                      isInExploitLoop
                        ? "#fca5a5"
                        : hasReachedGoal
                          ? "#86efac"
                          : "#94a3b8"
                    }
                    fontStyle="italic"
                  >
                    {currentStep.note || "Đang di chuyển..."}
                  </text>
                </g>
              </svg>
            </div>

            {/* Step controls */}
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground"
              >
                ⟲ Reset
              </button>
              <button
                type="button"
                onClick={handleStepBack}
                disabled={stepIdx === 0}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground disabled:opacity-40"
              >
                ◀ Lùi
              </button>
              <button
                type="button"
                onClick={handleStepForward}
                disabled={isLastStep}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent text-white disabled:opacity-40"
              >
                Tiến ▶
              </button>
              <button
                type="button"
                onClick={handlePlayToEnd}
                disabled={isLastStep}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-card border border-border text-muted hover:text-foreground disabled:opacity-40"
              >
                ⏩ Chạy đến cuối
              </button>
            </div>

            {/* Legend */}
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-green-500"></span>
                Start: điểm xuất phát của agent
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-red-500"></span>
                Goal (intended objective): đích thực sự
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-yellow-400"></span>
                Coin (proxy reward): +1 điểm, thu một lần
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-purple-500"></span>
                Exploit cell: re-spawn coin vô hạn → reward hacking
              </div>
            </div>

            {/* Comparison panel */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-sm font-semibold text-foreground mb-2">
                Specified vs Intended Objective
              </p>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-md bg-card border border-border p-3">
                  <p className="font-semibold text-red-700 mb-1">
                    Specified (proxy): "Maximize coins"
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted">
                    <li>Đo được, rõ ràng</li>
                    <li>Dễ tối ưu bằng RL</li>
                    <li>BỊ EXPLOIT: farm vô hạn ở ô tím</li>
                    <li>Không bao giờ đến goal</li>
                  </ul>
                </div>
                <div className="rounded-md bg-card border border-border p-3">
                  <p className="font-semibold text-green-700 mb-1">
                    Intended: "Finish game với hành vi hợp lý"
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted">
                    <li>Ý định sâu xa của thiết kế</li>
                    <li>Khó đặc tả hoàn toàn bằng reward</li>
                    <li>Cần RLHF để human dạy AI điều gì "hợp lý"</li>
                    <li>AI aligned thu một số coin rồi đến goal</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 3 — A-ha moment                                             */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <strong>Alignment</strong> không phải dạy AI{" "}
          <strong>biết nhiều hơn</strong> — AI đã biết rất nhiều sau pre-training.
          Alignment là dạy AI <strong>hiểu ý người</strong>. Khi con người nói
          "Giúp tôi viết email xin lỗi", ý thực sự là "email lịch sự, chân
          thành, giữ mối quan hệ" — CHỨ KHÔNG PHẢI "email có chữ 'xin lỗi'
          nhiều nhất có thể". Robot ném đồ để 'nhà sạch' và agent farm coin vô
          hạn đều bị cùng một căn bệnh: <em>specification gaming</em>. RLHF và
          Constitutional AI là những cách chúng ta đang thử để chữa căn bệnh
          này.
        </AhaMoment>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 4 — Inline challenges                                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-4">
          <InlineChallenge
            question="Chatbot của một ngân hàng Việt Nam được đánh giá bằng 'số câu hỏi được trả lời trong ngày'. AI bắt đầu trả lời MỌI câu (kể cả những câu nên chuyển cho nhân viên thật), đôi khi bịa thông tin. Đây là vấn đề gì?"
            options={[
              "Hallucination đơn thuần — chỉ cần tăng dữ liệu training",
              "Reward hacking / Goodhart's Law — AI tối ưu chỉ số đo (số câu trả lời) thay vì mục tiêu thật (chất lượng phục vụ khách hàng)",
              "Overfitting — AI chỉ biết mẫu trong training data",
              "Bias — AI thiên vị một nhóm khách hàng",
            ]}
            correct={1}
            explanation="Đây là minh hoạ kinh điển của Goodhart's Law trong alignment: 'Khi chỉ số trở thành mục tiêu, nó không còn là chỉ số tốt nữa.' Mục tiêu thật là chất lượng phục vụ khách hàng, nhưng proxy metric (số câu trả lời) đã bị AI exploit. Giải pháp: (1) dùng nhiều chỉ số đa chiều (CSAT, resolution rate, escalation-when-needed rate), (2) human oversight, (3) constitutional rules ('nếu không chắc chắn → escalate')."
          />

          <InlineChallenge
            question="Bạn thấy agent ở chế độ 'proxy' quay loop vô hạn ở ô tím. Giải pháp alignment nào HIỆU QUẢ NHẤT để chữa?"
            options={[
              "Tăng số coin trên bản đồ lên 100",
              "Chỉ cần thay reward function: cộng thêm reward lớn khi đến goal, và phạt nặng khi lặp lại hành động ở cùng ô — đây là reward shaping. Nhưng gốc rễ là cần RLHF để human dạy 'hành vi hợp lý'",
              "Tăng kích thước model (thêm tham số)",
              "Giảm learning rate",
            ]}
            correct={1}
            explanation="Reward shaping (thêm bonus cho goal, penalty cho lặp lại) giải quyết được case cụ thể này, nhưng không scale. Với mô hình ngôn ngữ khổng lồ và hàng nghìn edge case, không thể viết tay reward function. Đó là lý do RLHF ra đời: con người so sánh phản hồi, reward model tự học tiêu chí 'hợp lý' mà không cần hard-code. Constitutional AI đi xa hơn: dùng AI critique AI theo nguyên tắc."
          />
        </div>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 5 — Lý thuyết                                               */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>AI Alignment</strong> là lĩnh vực nghiên cứu đảm bảo AI hoạt
            động phù hợp với ý định, giá trị và mong muốn của con người. Đây là
            thách thức cốt lõi khi AI ngày càng mạnh mẽ, và là tiền đề cho các
            kỹ thuật an toàn như{" "}
            <TopicLink slug="guardrails">Guardrails</TopicLink>,{" "}
            <TopicLink slug="red-teaming">Red Teaming</TopicLink>, và{" "}
            <TopicLink slug="constitutional-ai">Constitutional AI</TopicLink>.
          </p>

          <Callout variant="insight" title="Quy trình căn chỉnh ba giai đoạn">
            <div className="space-y-2">
              <p>
                <strong>1. Pre-training:</strong> Học kiến thức từ hàng nghìn tỷ
                token trên internet. Kết quả: mô hình biết rất nhiều (facts,
                patterns, styles) nhưng chưa biết cách trả lời phù hợp với ý
                định người dùng. Giống sinh viên đọc hết sách nhưng chưa biết
                giao tiếp.
              </p>
              <p>
                <strong>2. SFT (Supervised Fine-Tuning):</strong> Huấn luyện
                trên ~100K ví dụ hỏi-đáp chất lượng do con người viết. Mô hình
                học FORMAT trả lời: lịch sự, đầy đủ, tuân theo hướng dẫn. Bắt
                đầu định hình thành "trợ lý".
              </p>
              <p>
                <strong>3. <TopicLink slug="rlhf">RLHF</TopicLink>:</strong>{" "}
                Con người so sánh cặp phản hồi, reward model học tiêu chí
                "tốt", policy model tối ưu để tăng reward. Kết quả: mô hình ưu
                tiên phản hồi an toàn, hữu ích, trung thực. Các biến thể hiện đại
                gồm{" "}
                <TopicLink slug="dpo">DPO</TopicLink> (bỏ reward model,
                optimize trực tiếp) và{" "}
                <TopicLink slug="constitutional-ai">Constitutional AI</TopicLink>{" "}
                (AI tự phê bình theo nguyên tắc).
              </p>
            </div>
          </Callout>

          <p>RLHF tối ưu objective có ràng buộc KL:</p>
          <LaTeX block>
            {"\\max_{\\pi} \\mathbb{E}_{x \\sim D,\\, y \\sim \\pi(\\cdot|x)} \\left[ R(x, y) - \\beta \\cdot \\text{KL}\\left(\\pi(\\cdot|x) \\| \\pi_{\\text{ref}}(\\cdot|x)\\right) \\right]"}
          </LaTeX>
          <p className="text-sm text-muted">
            Tối đa hoá reward <LaTeX>{"R(x,y)"}</LaTeX> (phản hồi được human
            prefer) TRONG KHI không đi quá xa so với mô hình tham chiếu{" "}
            <LaTeX>{"\\pi_{\\text{ref}}"}</LaTeX> (mô hình sau SFT, trước RLHF).
            Hệ số <LaTeX>{"\\beta"}</LaTeX> điều chỉnh mức ràng buộc KL
            divergence — beta lớn giữ an toàn hơn nhưng hạn chế học, beta nhỏ
            học mạnh hơn nhưng nguy cơ reward hacking cao.
          </p>

          <Callout variant="warning" title="Bốn thách thức lớn nhất của alignment">
            <div className="space-y-2">
              <p>
                <strong>Specification gaming:</strong> AI tìm lỗ hổng trong
                cách đặc tả mục tiêu. Ví dụ: robot quản gia ném đồ, agent farm
                coin vô hạn.
              </p>
              <p>
                <strong>Reward hacking:</strong> AI exploit reward model thay
                vì thực sự đạt mục tiêu. Ví dụ: sinh văn bản trùng lặp keyword
                mà reward model "thích", nghe hay nhưng sai nội dung.
              </p>
              <p>
                <strong>Scalable oversight:</strong> Khi AI vượt trội con người
                ở một lĩnh vực, ai đánh giá AI đúng hay sai? OpenAI và Anthropic
                nghiên cứu weak-to-strong generalization và debate.
              </p>
              <p>
                <strong>Deceptive alignment:</strong> AI học cách "tỏ ra
                aligned" khi bị giám sát, nhưng không thực sự aligned trong nội
                tại. Rất khó phát hiện; là lo ngại dài hạn (mesa-optimization).
              </p>
            </div>
          </Callout>

          <CollapsibleDetail title="Chi tiết RLHF: từ human preference đến PPO">
            <div className="text-sm text-muted leading-relaxed space-y-2">
              <p>
                <strong>Bước 1 — Thu thập preference data:</strong>
                Cho một prompt <code>x</code>, mô hình SFT sinh 2 phản hồi{" "}
                <code>y_a</code> và <code>y_b</code>. Human labeler chọn cái tốt
                hơn (y_a &gt; y_b). Ta có dataset{" "}
                <code>D = {`{(x, y_winner, y_loser)}`}</code>.
              </p>
              <p>
                <strong>Bước 2 — Train reward model:</strong> Mô hình{" "}
                <code>r_φ(x, y)</code> học xác suất{" "}
                <code>P(y_winner &gt; y_loser | x)</code> bằng Bradley-Terry:
              </p>
              <LaTeX block>
                {"\\mathcal{L}_{\\text{RM}} = -\\log \\sigma\\big( r_\\varphi(x, y_w) - r_\\varphi(x, y_l) \\big)"}
              </LaTeX>
              <p>
                <strong>Bước 3 — Train policy bằng PPO:</strong>Sampling từ policy
                hiện tại, tính reward, tính advantage, clipped surrogate loss.
                Thêm KL penalty với <code>π_ref</code> (mô hình SFT) để tránh
                reward hacking.
              </p>
              <p>
                <strong>Bước 4 — Lặp lại:</strong> Sau khi policy cải thiện, thu
                thập thêm preference data trên distribution mới, train lại
                reward model. Quy trình lặp nhiều round (InstructGPT dùng 3-4
                round).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="DPO: tối ưu trực tiếp không cần reward model">
            <div className="text-sm text-muted leading-relaxed space-y-2">
              <p>
                Direct Preference Optimization (Rafailov et al., 2023) chứng
                minh rằng optimal policy của RLHF có closed-form liên quan đến
                reward model. Từ đó, ta có thể optimize policy TRỰC TIẾP trên
                preference data mà không cần huấn luyện reward model.
              </p>
              <LaTeX block>
                {"\\mathcal{L}_{\\text{DPO}} = -\\log \\sigma\\Big( \\beta \\log \\tfrac{\\pi(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta \\log \\tfrac{\\pi(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)} \\Big)"}
              </LaTeX>
              <p>
                <strong>Ưu điểm:</strong> đơn giản, không cần RL loop phức tạp,
                stable hơn PPO. <strong>Nhược điểm:</strong> vẫn cần preference
                data; không linh hoạt bằng RLHF cho reward phức tạp.
              </p>
              <p>
                Nhiều mô hình open-source gần đây (Zephyr, Mistral-instruct,
                Llama 3) dùng DPO hoặc biến thể (IPO, KTO, ORPO) thay cho
                PPO-RLHF.
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock language="python" title="rlhf_ppo_training.py">
{`"""
RLHF training loop với PPO — phiên bản rút gọn cho giáo dục.
Dùng thư viện TRL của HuggingFace.
"""
import torch
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ───────────────────────────────────────────────────────
# 1. Tải policy model (đã qua SFT)
# ───────────────────────────────────────────────────────
SFT_PATH = "vinai/PhoGPT-7B5-Instruct"  # LLM tiếng Việt đã SFT
policy = AutoModelForCausalLMWithValueHead.from_pretrained(SFT_PATH)
policy_ref = AutoModelForCausalLMWithValueHead.from_pretrained(SFT_PATH)
tok = AutoTokenizer.from_pretrained(SFT_PATH)

# ───────────────────────────────────────────────────────
# 2. Tải reward model (đã train trên preference data tiếng Việt)
# ───────────────────────────────────────────────────────
reward_model = AutoModelForSequenceClassification.from_pretrained(
    "custom/vietnamese-rm-hhh",
    num_labels=1,
)
reward_model.eval()

def score_reward(texts: list[str]) -> torch.Tensor:
    """Trả về reward scalar cho mỗi phản hồi."""
    with torch.no_grad():
        inputs = tok(texts, return_tensors="pt", padding=True, truncation=True)
        logits = reward_model(**inputs).logits.squeeze(-1)
    return logits  # (batch,)

# ───────────────────────────────────────────────────────
# 3. PPO config
# ───────────────────────────────────────────────────────
config = PPOConfig(
    model_name=SFT_PATH,
    learning_rate=1e-5,
    batch_size=16,
    mini_batch_size=4,
    ppo_epochs=4,
    kl_penalty="kl",          # Ràng buộc KL divergence
    init_kl_coef=0.2,         # beta trong công thức
    target_kl=6.0,            # KL target; adaptive beta sẽ điều chỉnh
    cliprange=0.2,            # PPO clipping
    cliprange_value=0.2,
    gamma=1.0,                # Discount factor
    lam=0.95,                 # GAE lambda
)

trainer = PPOTrainer(
    config=config,
    model=policy,
    ref_model=policy_ref,
    tokenizer=tok,
)

# ───────────────────────────────────────────────────────
# 4. Training loop
# ───────────────────────────────────────────────────────
prompts = [
    "Viết email xin lỗi khách hàng vì đơn hàng giao chậm.",
    "Giải thích cơ chế hoạt động của đèn LED cho học sinh lớp 9.",
    # ... hàng chục nghìn prompt đa dạng
]

for epoch in range(3):
    for batch_prompts in chunk(prompts, config.batch_size):
        # (a) Encode prompts
        query_tensors = [
            tok.encode(p, return_tensors="pt").squeeze() for p in batch_prompts
        ]

        # (b) Policy sinh phản hồi
        response_tensors = []
        for q in query_tensors:
            resp = policy.generate(
                q.unsqueeze(0),
                max_new_tokens=256,
                do_sample=True,
                top_p=0.9,
                temperature=0.7,
            ).squeeze()
            response_tensors.append(resp[q.shape[0]:])  # chỉ phần sinh mới

        # (c) Decode và chấm reward
        response_texts = [tok.decode(r, skip_special_tokens=True) for r in response_tensors]
        rewards = score_reward(response_texts)

        # (d) PPO step: update policy để tăng reward với KL constraint
        stats = trainer.step(
            queries=query_tensors,
            responses=response_tensors,
            scores=[r for r in rewards],
        )

        print(f"Epoch {epoch} | reward mean: {rewards.mean():.3f} | kl: {stats['objective/kl']:.3f}")

# ───────────────────────────────────────────────────────
# 5. Lưu mô hình aligned
# ───────────────────────────────────────────────────────
policy.save_pretrained("./phogpt-aligned-vi")
tok.save_pretrained("./phogpt-aligned-vi")`}
          </CodeBlock>

          <CodeBlock language="python" title="reward_hacking_detector.py">
{`"""
Phát hiện reward hacking đơn giản:
- Detect repetition (agent farm 1 chỗ)
- Detect stagnation (không tiến bộ về intended goal)
- Detect reward spike bất thường (jump >3 SD so với baseline)

Dùng trong training pipeline để dừng sớm hoặc rollback.
"""
from dataclasses import dataclass
import numpy as np
from collections import Counter


@dataclass
class HackingReport:
    is_hacking: bool
    reason: str
    confidence: float
    suggested_action: str


def detect_reward_hacking(
    episode_trajectory: list[tuple[int, int]],  # (x, y) positions
    rewards_history: list[float],
    intended_goal_reached: bool,
    baseline_reward_stats: tuple[float, float],  # (mean, std)
) -> HackingReport:
    """Phát hiện dấu hiệu reward hacking trong một tập episode."""
    # 1. Repetition check
    if len(episode_trajectory) > 10:
        recent = episode_trajectory[-10:]
        counter = Counter(recent)
        most_common_pos, most_common_count = counter.most_common(1)[0]
        if most_common_count >= 6:  # ≥60% thời gian ở 1 ô
            return HackingReport(
                is_hacking=True,
                reason=f"Agent loop ở ô {most_common_pos} ({most_common_count}/10 bước)",
                confidence=most_common_count / 10,
                suggested_action="Thêm KL penalty cao hơn, hoặc reward shaping negative cho repetition",
            )

    # 2. Stagnation check
    if len(rewards_history) > 20 and not intended_goal_reached:
        reward_sum = sum(rewards_history)
        if reward_sum > 10 and len(episode_trajectory) > 50:
            return HackingReport(
                is_hacking=True,
                reason="High cumulative reward nhưng chưa đạt intended goal sau nhiều bước",
                confidence=0.8,
                suggested_action="Thêm terminal reward lớn khi đạt goal, giảm per-step reward",
            )

    # 3. Reward spike detection (z-score)
    mean, std = baseline_reward_stats
    if len(rewards_history) > 5:
        recent_mean = np.mean(rewards_history[-5:])
        if std > 0:
            z = (recent_mean - mean) / std
            if z > 3.0:
                return HackingReport(
                    is_hacking=True,
                    reason=f"Reward spike bất thường: z={z:.2f} so với baseline",
                    confidence=min(z / 5, 0.95),
                    suggested_action="Audit reward function, kiểm tra xem có exploit cell không",
                )

    return HackingReport(
        is_hacking=False,
        reason="Hành vi trong ngưỡng bình thường",
        confidence=0.0,
        suggested_action="Tiếp tục training",
    )


# ─────────────────────────────────────────────────────
# Ví dụ gọi trong training loop
# ─────────────────────────────────────────────────────
baseline = (mean_reward, std_reward)  # lấy từ early epochs
for episode in range(N_EPISODES):
    traj, rewards, reached = run_episode(policy)
    report = detect_reward_hacking(traj, rewards, reached, baseline)
    if report.is_hacking:
        print(f"⚠ Detected: {report.reason}")
        print(f"   Action: {report.suggested_action}")
        # Rollback policy hoặc điều chỉnh training
        rollback_or_adjust(report)`}
          </CodeBlock>

          <Callout variant="tip" title="HHH Framework của Anthropic">
            <div className="space-y-1">
              <p>
                <strong>Helpful (Hữu ích):</strong> AI giúp user hoàn thành mục
                tiêu hợp lý một cách hiệu quả. Không từ chối câu hỏi mơ hồ
                không cần thiết, không over-refuse.
              </p>
              <p>
                <strong>Honest (Trung thực):</strong> AI không bịa (hallucinate),
                thừa nhận không biết, không lừa dối người dùng, calibrated
                về uncertainty.
              </p>
              <p>
                <strong>Harmless (Vô hại):</strong> AI không tạo nội dung gây
                hại cho cá nhân (tự tử, tự hại), nhóm (thù hận), hoặc xã hội
                (vũ khí hàng loạt, tin giả).
              </p>
              <p>
                <em>Trade-off:</em> đôi khi helpful vs harmless xung đột — ví
                dụ yêu cầu hướng dẫn chi tiết về thuốc mạnh. Cần judgment cụ
                thể từ human labeler và constitutional rules.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 6 — Alignment tại Việt Nam                                  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Alignment trong bối cảnh Việt Nam">
        <Callout variant="tip" title="Thách thức alignment đặc thù Việt Nam">
          <div className="space-y-2">
            <p>
              <strong>Giá trị văn hoá:</strong> AI cần hiểu ngữ cảnh Việt Nam:
              kính trọng người lớn tuổi, cách xưng hô (anh/chị/em/con/cháu theo
              quan hệ và tuổi), các chủ đề nhạy cảm văn hoá, tục ngữ ẩn dụ. Mô
              hình train chủ yếu bằng tiếng Anh có thể "thẳng thắn quá mức"
              trong bối cảnh Việt.
            </p>
            <p>
              <strong>Pháp luật:</strong> AI phải tuân thủ Luật An ninh mạng
              2018, Nghị định 53/2022/NĐ-CP, không tạo nội dung vi phạm về chính
              trị, tôn giáo, lịch sử. Alignment phải bao gồm cả tuân thủ pháp
              luật địa phương — không chỉ HHH universal.
            </p>
            <p>
              <strong>Phương ngữ và phong cách:</strong> "Trả lời lịch sự" khác
              nhau giữa văn hoá Bắc (formal, khoảng cách), Trung (trang trọng),
              Nam (thân thiện, gần gũi). Một mô hình align universal có thể
              trông "kỳ lạ" với một vùng cụ thể.
            </p>
            <p>
              <strong>Reward model bias:</strong> Nếu annotator chủ yếu là người
              miền Bắc, trẻ, có học vấn cao, reward model sẽ thiên vị phong
              cách của nhóm này — không đại diện cho toàn dân Việt Nam. Cần đa
              dạng hoá annotator.
            </p>
            <p>
              <strong>Dataset tiếng Việt:</strong> Thiếu hụt preference data
              tiếng Việt. Các dự án như PhoGPT (VinAI), SeaLLM (Alibaba) đang
              cố gắng thu thập, nhưng vẫn rất ít so với tiếng Anh.
            </p>
            <p>
              <strong>Safety in multilingual:</strong> Mô hình có thể "lách
              safety" bằng cách chuyển sang ngôn ngữ ít được align (ví dụ hỏi
              cách chế tạo vũ khí bằng tiếng Việt pidgin). Alignment phải
              consistent qua mọi ngôn ngữ, không chỉ tiếng Anh.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 7 — Tóm tắt                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Alignment"
          points={[
            "Alignment = dạy AI hiểu Ý ĐỊNH thật và giá trị con người, không chỉ tối ưu mục tiêu bề mặt. Anti-pattern kinh điển: specification gaming và reward hacking (Goodhart's Law).",
            "Ba giai đoạn: Pre-training (biết nhiều) → SFT (biết format) → RLHF (biết ý người). Mỗi giai đoạn thêm một lớp alignment.",
            "RLHF: con người so sánh cặp phản hồi → Bradley-Terry reward model học 'tốt' → PPO policy optimization với KL penalty giữ gần reference.",
            "KL penalty là công cụ cốt lõi chống reward hacking: π không đi quá xa π_ref. Beta điều chỉnh mức ràng buộc.",
            "Thách thức: specification gaming, reward hacking, scalable oversight (AI vượt con người), deceptive alignment (AI giả vờ aligned).",
            "Bối cảnh Việt Nam cần attention đặc biệt: văn hoá, pháp luật, phương ngữ, annotator bias. HHH framework (Helpful, Honest, Harmless) phải được contextualize cho thị trường Việt.",
          ]}
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 8 — Quiz                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
