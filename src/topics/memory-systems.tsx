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
  slug: "memory-systems",
  title: "Memory Systems",
  titleVi: "Hệ thống bộ nhớ — Trí nhớ của AI Agent",
  description:
    "Các cơ chế lưu trữ thông tin giúp AI Agent nhớ bối cảnh, kinh nghiệm và kiến thức qua nhiều phiên làm việc.",
  category: "ai-agents",
  tags: ["memory", "agent", "context", "vector-store"],
  difficulty: "intermediate",
  relatedSlugs: ["agent-architecture", "planning", "multi-agent"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const MEMORY_TYPES = [
  { id: "short", label: "Bộ nhớ ngắn hạn", color: "#3b82f6",
    items: ["Context window (hội thoại)", "Scratchpad (ghi chú tạm)", "Kết quả bước trung gian"],
    limit: "Giới hạn bởi context window (4K-200K tokens)",
    tech: "In-context, system prompt, chat history" },
  { id: "long", label: "Bộ nhớ dài hạn", color: "#8b5cf6",
    items: ["Vector database (Pinecone, Chroma)", "Tóm tắt cuộc trò chuyện cũ", "Sở thích & hồ sơ người dùng"],
    limit: "Gần như vô hạn — lưu trên disk/cloud",
    tech: "RAG, embedding, vector similarity search" },
  { id: "episodic", label: "Bộ nhớ sự kiện", color: "#22c55e",
    items: ["Kinh nghiệm thành công / thất bại", "Kịch bản tương tự đã gặp", "Bài học từ phản hồi người dùng"],
    limit: "Lưu trữ có chọn lọc — chỉ sự kiện quan trọng",
    tech: "Few-shot retrieval, experience replay" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao AI Agent cần bộ nhớ dài hạn khi LLM đã có context window?",
    options: [
      "Để tăng tốc xử lý",
      "Vì context window có giới hạn — không thể chứa toàn bộ lịch sử. Bộ nhớ dài hạn lưu thông tin qua nhiều phiên",
      "Vì LLM không có khả năng nhớ",
      "Để giảm chi phí API",
    ],
    correct: 1,
    explanation:
      "Context window = bộ nhớ ngắn hạn (vài nghìn → 200K tokens). Nhưng Agent cần nhớ qua nhiều phiên, nhiều ngày. Vector DB giải quyết: lưu vô hạn, truy xuất bằng semantic search khi cần.",
  },
  {
    question: "Bộ nhớ sự kiện (episodic memory) giúp Agent điều gì?",
    options: [
      "Lưu trữ code",
      "Nhớ kinh nghiệm quá khứ: lần trước làm cách A thất bại → lần này thử cách B. Học từ sai lầm",
      "Tăng kích thước context window",
      "Thay thế bộ nhớ dài hạn",
    ],
    correct: 1,
    explanation:
      "Episodic memory lưu trải nghiệm cụ thể: 'Prompt X + tool Y → thất bại vì Z'. Khi gặp tình huống tương tự, Agent retrieve kinh nghiệm này và tránh lặp lại sai lầm.",
  },
  {
    question: "Kỹ thuật nào phổ biến nhất để triển khai bộ nhớ dài hạn cho Agent?",
    options: [
      "Lưu toàn bộ text trong file",
      "RAG — embed thông tin thành vector, lưu trong vector DB, truy xuất bằng similarity search khi cần",
      "Fine-tune mô hình mỗi khi có thông tin mới",
      "Tăng context window lên vô hạn",
    ],
    correct: 1,
    explanation:
      "RAG (Retrieval-Augmented Generation): embed text → lưu vector DB → khi cần, search vector gần nhất → đưa vào context. Nhanh, scalable, không cần retrain mô hình.",
  },
];

export default function MemorySystemsTopic() {
  const [activeType, setActiveType] = useState("short");
  const active = MEMORY_TYPES.find(m => m.id === activeType)!;

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn nói với AI: 'Tôi thích phở' vào tuần trước. Hôm nay hỏi: 'Gợi ý nhà hàng?'. AI không nhớ bạn thích phở. Tại sao?"
          options={[
            "AI không đủ thông minh",
            "Mỗi phiên hội thoại là độc lập — AI không có bộ nhớ dài hạn trừ khi được thiết kế thêm",
            "Bạn cần nhắc lại mỗi lần",
          ]}
          correct={1}
          explanation="LLM mặc định KHÔNG nhớ gì giữa các phiên. Context window = bộ nhớ ngắn hạn (chỉ trong 1 cuộc trò chuyện). Để nhớ dài hạn, Agent cần hệ thống bộ nhớ bên ngoài: vector DB, user profile, etc."
        >
          <p className="text-sm text-muted mt-2">
            Hãy khám phá 3 loại bộ nhớ giúp Agent nhớ và học từ kinh nghiệm.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            3 loại bộ nhớ của AI Agent
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn loại bộ nhớ để xem chi tiết.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {MEMORY_TYPES.map(m => (
              <button key={m.id} onClick={() => setActiveType(m.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeType === m.id ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={activeType === m.id ? { backgroundColor: m.color } : {}}>
                {m.label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto mb-4">
            <circle cx={300} cy={100} r={40} fill="var(--bg-surface)" stroke={active.color} strokeWidth={3} />
            <text x={300} y={96} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">AI Agent</text>
            <text x={300} y={112} textAnchor="middle" fill="var(--text-tertiary)" fontSize={11}>Bộ não</text>

            {active.items.map((item, i) => {
              const angle = -Math.PI / 2 + (i * Math.PI) / (active.items.length - 1 || 1);
              const rx = 190, ry = 75;
              const cx = 300 + rx * Math.cos(angle);
              const cy = 100 + ry * Math.sin(angle);
              return (
                <g key={i}>
                  <line x1={300} y1={100} x2={cx} y2={cy} stroke={active.color} strokeWidth={1.5} opacity={0.5} />
                  <rect x={cx - 80} y={cy - 14} width={160} height={28} rx={6} fill={active.color} opacity={0.85} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                    {item}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-xs text-muted">Giới hạn:</p>
              <p className="text-sm text-foreground">{active.limit}</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-xs text-muted">Kỹ thuật:</p>
              <p className="text-sm text-foreground">{active.tech}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Bộ nhớ Agent hoạt động giống <strong>bộ nhớ con người</strong>:
          ngắn hạn (bảng trắng — ghi nhanh xoá nhanh), dài hạn (nhật ký — lưu mãi),
          sự kiện (album ảnh — nhớ trải nghiệm cụ thể). LLM mặc định chỉ có
          &quot;bảng trắng&quot;. Thêm &quot;nhật ký&quot; và &quot;album ảnh&quot; biến nó
          thành Agent có trí nhớ thực sự.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent trợ lý lập trình nhớ rằng lần trước gợi ý dùng thư viện X nhưng user phàn nàn X chậm. Lần này user hỏi tương tự. Agent nên dùng loại bộ nhớ nào?"
          options={[
            "Bộ nhớ ngắn hạn — context hiện tại",
            "Bộ nhớ sự kiện — retrieve kinh nghiệm 'X chậm' và gợi ý thư viện Y thay thế",
            "Bộ nhớ dài hạn — tìm tài liệu về thư viện",
            "Không cần bộ nhớ — LLM tự biết",
          ]}
          correct={1}
          explanation="Episodic memory: 'Lần trước gợi ý X → user phàn nàn chậm'. Khi gặp câu hỏi tương tự, retrieve kinh nghiệm này → tránh gợi ý X, đề xuất Y. Agent HỌC từ phản hồi qua bộ nhớ sự kiện."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hệ thống bộ nhớ</strong>{" "}giải quyết 2 giới hạn của LLM: context window
            hữu hạn và không nhớ giữa các phiên.
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Bộ nhớ ngắn hạn:</strong>{" "}Context window + scratchpad. Chứa hội
              thoại hiện tại và kết quả trung gian. Kích thước cố định.
            </li>
            <li>
              <strong>Bộ nhớ dài hạn:</strong>{" "}Vector DB lưu embedding. Truy xuất bằng
              semantic similarity. Mở rộng gần vô hạn.
            </li>
            <li>
              <strong>Bộ nhớ sự kiện:</strong>{" "}Lưu trải nghiệm có cấu trúc: (tình huống,
              hành động, kết quả, bài học). Few-shot retrieval khi gặp tình huống tương tự.
            </li>
          </ul>

          <CodeBlock language="python" title="memory_system.py">{`class AgentMemory:
    def __init__(self):
        self.short_term = []        # Context window
        self.vector_db = ChromaDB()  # Bộ nhớ dài hạn
        self.episodes = []           # Kinh nghiệm

    def remember(self, text, type="long"):
        if type == "short":
            self.short_term.append(text)
        elif type == "long":
            embedding = embed(text)
            self.vector_db.add(embedding, text)
        elif type == "episode":
            self.episodes.append(text)

    def recall(self, query, k=5):
        """Truy xuất thông tin liên quan"""
        # Bộ nhớ ngắn hạn — luôn có
        context = self.short_term[-10:]

        # Bộ nhớ dài hạn — semantic search
        relevant = self.vector_db.search(query, k=k)
        context.extend(relevant)

        # Bộ nhớ sự kiện — tìm kinh nghiệm tương tự
        similar_episodes = self.find_similar_episodes(query)
        context.extend(similar_episodes)

        return context`}</CodeBlock>

          <Callout variant="warning" title="Thách thức của bộ nhớ dài hạn">
            Retrieval không hoàn hảo: có thể lấy thông tin không liên quan (noise)
            hoặc bỏ sót thông tin quan trọng. Cần: re-ranking, filtering, và
            memory management (xoá thông tin cũ/không còn đúng).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Memory Systems"
          points={[
            "3 loại: Ngắn hạn (context window), Dài hạn (vector DB), Sự kiện (kinh nghiệm cụ thể).",
            "LLM mặc định chỉ có bộ nhớ ngắn hạn. Bộ nhớ dài hạn cần vector DB + RAG.",
            "Episodic memory giúp Agent HỌC từ kinh nghiệm: nhớ lần trước thất bại → tránh lặp lại.",
            "Kỹ thuật: embedding + similarity search cho dài hạn, experience replay cho sự kiện. Cần re-ranking để giảm noise.",
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
