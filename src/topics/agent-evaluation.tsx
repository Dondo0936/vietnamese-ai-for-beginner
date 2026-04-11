"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agent-evaluation",
  title: "Agent Evaluation",
  titleVi: "Đánh giá Agent — Đo lường AI tự chủ",
  description:
    "Các phương pháp và tiêu chí để đánh giá hiệu quả, độ chính xác và an toàn của AI Agent.",
  category: "ai-agents",
  tags: ["evaluation", "benchmark", "agent", "metrics"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "agentic-workflows", "guardrails"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const DIMENSIONS = [
  { label: "Tỷ lệ hoàn thành", value: 85, unit: "%", color: "#22c55e",
    desc: "Agent giải quyết được nhiệm vụ không? Pass/fail trên test cases." },
  { label: "Hiệu quả (bước)", value: 42, unit: "/10", color: "#3b82f6",
    desc: "Trung bình bao nhiêu bước? Ít bước hơn = hiệu quả hơn." },
  { label: "Dùng công cụ đúng", value: 92, unit: "%", color: "#8b5cf6",
    desc: "Chọn đúng tool, truyền đúng param? Sai tool = kết quả sai." },
  { label: "Chi phí token", value: 24, unit: "K", color: "#f59e0b",
    desc: "Tổng token tiêu thụ. Ít token hơn = rẻ hơn." },
  { label: "Tỷ lệ lỗi", value: 8, unit: "%", color: "#ef4444",
    desc: "Hành động nguy hiểm, ngoài phạm vi, hoặc gây hại." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao đánh giá Agent khó hơn đánh giá LLM thông thường?",
    options: [
      "Vì Agent chậm hơn",
      "Vì Agent có nhiều bước, tương tác với môi trường, kết quả phụ thuộc vào chuỗi quyết định — không chỉ 1 output",
      "Vì Agent dùng nhiều mô hình",
      "Vì Agent tốn nhiều token",
    ],
    correct: 1,
    explanation:
      "LLM: 1 input → 1 output → đánh giá output. Agent: nhiều bước, mỗi bước là quyết định (chọn tool, tham số, dừng/tiếp). Cần đánh giá cả quá trình (trajectory) không chỉ kết quả cuối.",
  },
  {
    question: "SWE-bench đánh giá Agent về khả năng gì?",
    options: [
      "Viết thơ",
      "Tự sửa lỗi trong mã nguồn thật từ GitHub — đọc issue, tìm bug, viết patch, pass test",
      "Trả lời câu hỏi tổng quát",
      "Điều hướng website",
    ],
    correct: 1,
    explanation:
      "SWE-bench: Agent nhận GitHub issue → tìm file lỗi → viết patch → chạy test suite → pass. Đánh giá khả năng lập trình thực tế end-to-end. Kết quả top: Claude ~50%, GPT-4 ~33%.",
  },
  {
    question: "Agent có tỷ lệ hoàn thành 95% nhưng chi phí gấp 10 lần agent khác có 90%. Chọn agent nào?",
    options: [
      "Luôn chọn 95% — chất lượng quan trọng nhất",
      "Tuỳ thuộc context: nếu sai 5% gây hậu quả nghiêm trọng thì chọn 95%, nếu không thì 90% với chi phí thấp hơn",
      "Luôn chọn rẻ hơn",
      "Không đủ thông tin để quyết định",
    ],
    correct: 1,
    explanation:
      "Đánh giá agent cần cân nhắc NHIỀU chiều: accuracy, cost, speed, safety. 5% improvement có đáng gấp 10x cost? Phụ thuộc use case: y khoa (sai = nguy hiểm) vs chatbot (sai = nhỏ).",
  },
];

export default function AgentEvaluationTopic() {
  const [selectedDim, setSelectedDim] = useState(0);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn xây Agent tự sửa bug trong code. Agent sửa được 8/10 bug. Điều này có đủ để đánh giá Agent tốt không?"
          options={[
            "Có — 80% là tỷ lệ cao",
            "Chưa đủ — cần xem: mất bao nhiêu bước, tốn bao nhiêu token, có gây thêm bug mới không, có vượt quyền không",
            "Chưa đủ — cần test trên 1000 bug",
          ]}
          correct={1}
          explanation="Đánh giá Agent cần NHIỀU chiều: tỷ lệ thành công + hiệu quả (bước, token, thời gian) + an toàn (có gây hại không) + chi phí. Giống đánh giá nhân viên: không chỉ kết quả mà cả quá trình."
        >
          <p className="text-sm text-muted mt-2">
            Hãy khám phá 5 chiều đánh giá quan trọng nhất cho AI Agent.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            5 chiều đánh giá Agent
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn vào từng chiều để xem chi tiết.
          </p>

          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto mb-4">
            {DIMENSIONS.map((d, i) => {
              const y = 10 + i * 48;
              const barWidth = Math.min(d.value * 3.5, 320);
              const isActive = selectedDim === i;
              return (
                <g key={i} onClick={() => setSelectedDim(i)} className="cursor-pointer">
                  <text x="10" y={y + 20} fill={isActive ? d.color : "var(--text-tertiary)"} fontSize="10"
                    fontWeight={isActive ? "bold" : "normal"}>
                    {d.label}
                  </text>
                  <rect x="170" y={y + 5} width={barWidth} height="24" rx="4"
                    fill={d.color} opacity={isActive ? 0.9 : 0.4} />
                  <text x={180 + barWidth} y={y + 22} fill={d.color} fontSize="11" fontWeight="bold">
                    {d.value}{d.unit}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-3">
            <p className="text-sm font-medium" style={{ color: DIMENSIONS[selectedDim].color }}>
              {DIMENSIONS[selectedDim].label}
            </p>
            <p className="text-sm text-muted mt-1">{DIMENSIONS[selectedDim].desc}</p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Đánh giá Agent không phải chỉ &quot;đúng hay sai&quot; — mà là
          <strong>{" "}đánh giá cả hành trình</strong>. Hai Agent cùng sửa đúng 1 bug,
          nhưng Agent A mất 3 bước (50 token), Agent B mất 20 bước (5000 token).
          <strong>{" "}Trajectory matters</strong>{" "}— đường đi quan trọng không kém đích đến.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent trợ lý email được yêu cầu: 'Xoá email cũ hơn 30 ngày'. Agent xoá TOÀN BỘ email. Chiều đánh giá nào phát hiện lỗi này?"
          options={[
            "Tỷ lệ hoàn thành — vì Agent đã hoàn thành nhiệm vụ",
            "Tỷ lệ lỗi / An toàn — Agent vượt phạm vi yêu cầu, thực hiện hành động gây hại (xoá cả email mới)",
            "Chi phí token",
            "Hiệu quả bước",
          ]}
          correct={1}
          explanation="Agent 'hoàn thành' nhưng sai phạm vi → gây hại. Safety evaluation phát hiện: (1) Agent vượt scope (xoá cả email mới), (2) hành động không thể hoàn tác, (3) không xác nhận với user trước khi xoá."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Đánh giá Agent</strong>{" "}khác biệt căn bản so với đánh giá LLM vì Agent
            có nhiều bước, tương tác với môi trường, và có thể gây hậu quả thực tế.
          </p>

          <p>5 chiều đánh giá:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong>Task Success Rate:</strong>{" "}Agent giải quyết được % nhiệm vụ. Metric cơ bản nhất.</li>
            <li><strong>Efficiency:</strong>{" "}Số bước, token, thời gian. Ít hơn = hiệu quả hơn.</li>
            <li><strong>Tool Use Accuracy:</strong>{" "}Chọn đúng tool, đúng param. Sai = kết quả sai.</li>
            <li><strong>Safety:</strong>{" "}Không vượt phạm vi, không gây hại, confirm trước hành động nguy hiểm.</li>
            <li><strong>Cost:</strong>{" "}Tổng token + API calls. Quan trọng cho production.</li>
          </ul>

          <CodeBlock language="python" title="agent_evaluation.py">{`class AgentEvaluator:
    def evaluate(self, agent, test_cases):
        results = []
        for test in test_cases:
            trajectory = agent.run(test.task)

            result = {
                "success": test.check_success(trajectory.final_output),
                "steps": len(trajectory.steps),
                "tokens": trajectory.total_tokens,
                "tool_accuracy": self.check_tool_usage(trajectory),
                "safety_violations": self.check_safety(trajectory),
                "cost": trajectory.total_cost,
            }
            results.append(result)

        return {
            "success_rate": mean([r["success"] for r in results]),
            "avg_steps": mean([r["steps"] for r in results]),
            "avg_tokens": mean([r["tokens"] for r in results]),
            "tool_accuracy": mean([r["tool_accuracy"] for r in results]),
            "safety_score": 1 - mean([r["safety_violations"] for r in results]),
        }`}</CodeBlock>

          <Callout variant="tip" title="Benchmarks phổ biến">
            SWE-bench (sửa bug GitHub), WebArena (điều hướng web), GAIA
            (tác vụ tổng quát), HumanEval (viết code). Mỗi benchmark đo khía
            cạnh khác nhau — không có benchmark nào đủ toàn diện.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Agent Evaluation"
          points={[
            "5 chiều: Success Rate, Efficiency (bước/token), Tool Accuracy, Safety, Cost — cần đánh giá tất cả.",
            "Đánh giá trajectory (hành trình) không chỉ output — 2 Agent cùng đáp án nhưng đường đi khác nhau.",
            "Safety quan trọng nhất cho production: Agent vượt phạm vi, hành động không thể hoàn tác = nguy hiểm.",
            "Benchmarks: SWE-bench (code), WebArena (web), GAIA (tổng quát). Kết hợp auto-eval + human-eval.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
