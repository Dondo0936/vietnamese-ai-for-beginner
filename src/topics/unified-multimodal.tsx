"use client";

import { useState, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "unified-multimodal",
  title: "Unified Multimodal Models",
  titleVi: "Mô hình đa phương thức thống nhất",
  description:
    "Mô hình AI duy nhất có thể hiểu và sinh ra nhiều loại dữ liệu: văn bản, ảnh, âm thanh, video trong cùng một kiến trúc.",
  category: "multimodal",
  tags: ["unified", "multimodal", "any-to-any"],
  difficulty: "advanced",
  relatedSlugs: ["vlm", "clip", "text-to-image", "tts"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const MODALITIES = [
  { label: "Văn bản", color: "#3b82f6", angle: -90, examples: "Hỏi đáp, viết bài, dịch thuật" },
  { label: "Hình ảnh", color: "#22c55e", angle: -30, examples: "Tạo ảnh, phân tích ảnh, chỉnh sửa" },
  { label: "Âm thanh", color: "#f59e0b", angle: 30, examples: "Nghe hiểu, tạo giọng nói, nh��c" },
  { label: "Video", color: "#ef4444", angle: 90, examples: "Tạo video, phân tích video, chú thích" },
  { label: "Mã nguồn", color: "#8b5cf6", angle: 150, examples: "Viết code, debug, review" },
  { label: "3D", color: "#06b6d4", angle: 210, examples: "Tạo vật thể 3D, scene understanding" },
];

const APPROACHES = [
  {
    id: "pipeline",
    label: "Ghép nối (Pipeline)",
    desc: "Nhiều mô hình chuyên biệt kết nối với nhau. VD: CLIP + GPT + Stable Diffusion + Whisper.",
    pros: "Mỗi module tối ưu cho một task riêng",
    cons: "Mất thông tin ở các bước chuyển, chậm, không học liên phương thức",
    color: "#f59e0b",
  },
  {
    id: "unified",
    label: "Thống nhất (Unified)",
    desc: "M��T mô hình duy nhất hiểu và sinh TẤT CẢ loại dữ liệu. VD: GPT-4o, Gemini.",
    pros: "Hiểu sâu mối liên hệ giữa các phương thức, nhanh, linh hoạt any-to-any",
    cons: "C���n dữ liệu huấn luyện khổng lồ, kiến trúc phức tạp, tốn tài nguyên",
    color: "#3b82f6",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Ưu điểm lớn nhất của unified multimodal so với pipeline ghép nối là gì?",
    options: [
      "Unified nhanh hơn vì dùng ít GPU",
      "Unified hiểu mối liên hệ sâu giữa các phương thức (ảnh-âm-text) vì học đồng thời trong cùng không gian biểu diễn",
      "Unified không cần dữ liệu huấn luyện",
      "Unified chỉ cần một loại dữ liệu để huấn luyện",
    ],
    correct: 1,
    explanation:
      "Pipeline ghép nối mất thông tin ở mỗi bước chuyển (bottleneck). Unified model học biểu diễn chung cho tất cả phương thức, nên hiểu 'ảnh chú chó sủa' đồng thời ở cả ba góc: thị giác (hình chó), ngôn ngữ (từ 'chó'), và âm thanh (tiếng sủa).",
  },
  {
    question: "GPT-4o có thể nói chuyện real-time bằng giọng nói. Đây là ví dụ của khả năng nào?",
    options: [
      "Text-to-speech truyền thống",
      "Any-to-any: nhận audio → hiểu nội dung → sinh audio phản hồi, tất cả trong một mô hình",
      "Speech recognition + TTS ghép nối",
      "Voice cloning",
    ],
    correct: 1,
    explanation:
      "GPT-4o xử lý audio đầu vào natively (không qua ASR trước), hiểu nội dung + ngữ điệu + cảm xúc, rồi sinh audio đầu ra trực tiếp (không qua TTS sau). Đây là any-to-any trong một forward pass, khác hẳn pipeline ASR → LLM → TTS.",
  },
  {
    question: "Tokenization trong unified multimodal model khác gì so với LLM thuần văn bản?",
    options: [
      "Không khác gì — vẫn dùng BPE",
      "Mỗi phương thức có tokenizer riêng rồi nối tất cả token vào cùng một chuỗi cho Transformer xử lý",
      "Unified model không dùng token",
      "Chỉ tokenize văn bản, các phương thức khác xử lý riêng",
    ],
    correct: 1,
    explanation:
      "Unified model tokenize MỌI phương thức: văn bản → BPE tokens, ảnh → visual tokens (qua VQ-VAE hoặc ViT patches), audio → audio tokens (qua codec). T���t cả token được nối thành một chuỗi duy nhất và Transformer xử lý đồng nhất.",
  },
];

export default function UnifiedMultimodalTopic() {
  const [activeApproach, setActiveApproach] = useState("unified");
  const approach = APPROACHES.find((a) => a.id === activeApproach)!;

  const handleApproachChange = useCallback((id: string) => {
    setActiveApproach(id);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn AI xem video clip du lịch Đà Nẵng và viết bài review kèm ảnh minh hoạ. Cần bao nhiêu mô hình AI riêng biệt?"
          options={[
            "1 mô hình — AI thống nhất có thể hiểu video, viết bài, và tạo ảnh",
            "3 mô hình — video understanding + LLM + image generation",
            "5 mô hình — video → frame extraction → caption → LLM → image gen",
          ]}
          correct={0}
          explanation="Với mô hình đa phương thức thống nhất (như Gemini hoặc GPT-4o), CHỈ CẦN MỘT mô hình! Nó nhận video đầu vào, hiểu nội dung thị giác + âm thanh, sinh bài viết văn bản, và có thể tạo ảnh minh hoạ — tất cả trong cùng một kiến trúc. Đây là sức mạnh của any-to-any!"
        />
      </LessonSection>

      {/* ── Step 2: Interactive Comparison ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          So sánh hai cách tiếp cận: ghép nối nhiều mô hình chuyên biệt (pipeline) vs một mô hình thống nhất. Chọn từng cách để hiểu ưu nhược điểm.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {APPROACHES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleApproachChange(a.id)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                    activeApproach === a.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 280" className="w-full max-w-2xl mx-auto">
              {activeApproach === "unified" ? (
                <>
                  {/* Central unified model */}
                  <circle cx={310} cy={130} r={52} fill="#1e293b" stroke="#3b82f6" strokeWidth={3} />
                  <text x={310} y={123} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Mô hình</text>
                  <text x={310} y={140} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Thống nhất</text>

                  {MODALITIES.map((m, i) => {
                    const rad = (m.angle * Math.PI) / 180;
                    const x = 310 + 120 * Math.cos(rad);
                    const y = 130 + 120 * Math.sin(rad);
                    return (
                      <g key={i}>
                        <line x1={310} y1={130} x2={x} y2={y} stroke={m.color} strokeWidth={2} opacity={0.5} />
                        <circle cx={x} cy={y} r={26} fill={m.color} opacity={0.85} />
                        <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                  <text x={310} y={270} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                    Any-to-any: bất kỳ đầu vào → b��t kỳ đầu ra
                  </text>
                </>
              ) : (
                <>
                  {/* Pipeline approach */}
                  {[
                    { label: "Whisper (ASR)", x: 70, color: "#f59e0b" },
                    { label: "CLIP (Vision)", x: 210, color: "#22c55e" },
                    { label: "GPT (LLM)", x: 350, color: "#3b82f6" },
                    { label: "DALL-E (Image)", x: 490, color: "#8b5cf6" },
                  ].map((m, i) => (
                    <g key={i}>
                      <rect x={m.x - 55} y={90} width={110} height={50} rx={10} fill="#1e293b" stroke={m.color} strokeWidth={2} />
                      <text x={m.x} y={112} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{m.label}</text>
                      <text x={m.x} y={128} textAnchor="middle" fill="#94a3b8" fontSize={7}>Module riêng</text>
                      {i < 3 && (
                        <line x1={m.x + 55} y1={115} x2={m.x + 85} y2={115} stroke="#475569" strokeWidth={2} markerEnd="url(#um-arrow)" />
                      )}
                    </g>
                  ))}
                  {/* Bottleneck markers */}
                  {[195, 335, 475].map((x, i) => (
                    <text key={i} x={x} y={155} textAnchor="middle" fill="#ef4444" fontSize={8}>
                      mất tin
                    </text>
                  ))}
                  <text x={310} y={200} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                    Pipeline: mỗi module chuyên biệt, nhưng mất thông tin giữa các bước
                  </text>
                  <defs>
                    <marker id="um-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                      <polygon points="0 0, 6 2.5, 0 5" fill="#475569" />
                    </marker>
                  </defs>
                </>
              )}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 space-y-2">
              <p className="text-sm text-foreground">{approach.desc}</p>
              <p className="text-xs text-muted">
                <strong>Ưu điểm:</strong>{" "}{approach.pros}
              </p>
              <p className="text-xs text-muted">
                <strong>Nhược điểm:</strong>{" "}{approach.cons}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Mô hình thống nhất giống như{" "}
          <strong>bộ não con người</strong>{" "}
          — không có module riêng cho mắt, tai, và miệng. Tất cả giác quan được xử lý trong{" "}
          <strong>cùng một mạng nơ-ron</strong>{" "}
          với biểu diễn chung. Nhờ đó, khi nghe tiếng {'"sủa"'}, não tự động hình dung con chó. Any-to-any là bước đầu tiên hướng tới AI có{" "}
          <strong>giác quan tổng hợp</strong>{" "}
          như con người.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="GPT-4o (omni) nghe giọng nói người dùng buồn rầu và phản hồi bằng giọng an ủi nhẹ nhàng. Pipeline truyền thống (ASR → LLM → TTS) có làm được điều này không?"
          options={[
            "Có — ASR nhận dạng được cảm xúc trong giọng nói",
            "Không — ASR chỉ chuyển giọng nói thành văn bản, mất hết thông tin ngữ điệu và cảm xúc",
            "Có — LLM có thể suy luận cảm xúc từ nội dung văn bản",
            "Không — TTS không thể tạo giọng an ủi",
          ]}
          correct={1}
          explanation="Pipeline ASR → LLM → TTS tạo bottleneck tại bước ASR: ngữ điệu, cảm xúc, nhịp thở bị mất khi chuyển thành text. GPT-4o xử lý audio natively — hiểu cả nội dung LẪN cảm xúc trong giọng nói, rồi sinh phản hồi audio phù hợp. Đây là lý do unified model mạnh hơn."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Mô hình đa phương thức thống nhất</strong>{" "}
            là thế hệ AI có khả năng xử lý và sinh ra nhiều loại dữ liệu trong{" "}
            <strong>một kiến trúc duy nhất</strong>, thay vì ghép nối nhiều mô hình chuyên biệt.
          </p>

          <Callout variant="insight" title="Kiến trúc any-to-any">
            <div className="space-y-2">
              <p>
                <strong>Tokenization thống nhất:</strong>{" "}
                Mọi phương thức được chuyển thành token: văn bản (BPE), ảnh (VQ-VAE patches), audio (codec tokens), video (spacetime patches).
              </p>
              <p>
                <strong>Shared Transformer:</strong>{" "}
                Tất cả token được nối thành chuỗi và xử lý bởi cùng một Transformer backbone. Cross-modal attention học mối liên hệ giữa các phương thức.
              </p>
              <p>
                <strong>Multimodal decoder:</strong>{" "}
                Đầu ra có thể là bất kỳ loại token nào — sinh văn bản, ảnh, hoặc audio tuỳ yêu c��u.
              </p>
            </div>
          </Callout>

          <p>Mỗi phương thức được tokenize thành chuỗi chung:</p>
          <LaTeX block>{"\\mathbf{x} = [\\underbrace{t_1, ..., t_m}_{\\text{text tokens}}, \\underbrace{v_1, ..., v_n}_{\\text{visual tokens}}, \\underbrace{a_1, ..., a_k}_{\\text{audio tokens}}]"}</LaTeX>
          <p className="text-sm text-muted">
            Transformer xử lý toàn bộ chuỗi <LaTeX>{"\\mathbf{x}"}</LaTeX> bằng self-attention, tự động học mối liên hệ giữa text token, visual token, và audio token.
          </p>

          <Callout variant="info" title="Các mô hình tiêu biểu (2024-2025)">
            <div className="space-y-2">
              <p>
                <strong>GPT-4o (OpenAI):</strong>{" "}
                Omni-modal, xử lý text + vision + audio natively, real-time voice conversation.
              </p>
              <p>
                <strong>Gemini 2.0 (Google):</strong>{" "}
                Hiểu text, ảnh, video, audio. Tạo ảnh và audio. Native multimodal training.
              </p>
              <p>
                <strong>Chameleon (Meta):</strong>{" "}
                Mã nguồn mở, early-fusion architecture, tokenize mọi phương thức đồng nhất.
              </p>
              <p>
                <strong>Claude 3.5 (Anthropic):</strong>{" "}
                Hiểu text + vision, ưu tiên an toàn và alignment trong xử lý đa phương thức.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="unified_multimodal.py">
{`# Ví dụ sử dụng Gemini 2.0 (any-to-any)
import google.generativeai as genai

model = genai.GenerativeModel("gemini-2.0-flash")

# Any-to-any: Video → Text analysis
video = genai.upload_file("du-lich-da-nang.mp4")
response = model.generate_content([
    video,
    "Phân tích video du lịch này và viết review "
    "500 từ bằng tiếng Việt, nhấn mạnh cảnh đẹp "
    "và gợi ý lịch trình 3 ngày."
])
print(response.text)

# Image + Audio → Text understanding
image = genai.upload_file("thuc-don.jpg")
audio = genai.upload_file("order-voice.wav")
response = model.generate_content([
    image, audio,
    "Khách hàng đang order gì từ thực đơn này?"
])`}
          </CodeBlock>

          <Callout variant="warning" title="Thách thức khi thống nhất">
            <div className="space-y-1">
              <p><strong>Dữ liệu:</strong>{" "} Cần hàng tỷ cặp dữ liệu đa phương thức có chất lượng, đặc biệt khan hiếm cho tiếng Việt.</p>
              <p><strong>Tài nguyên:</strong>{" "} Huấn luyện mô hình any-to-any cần cluster hàng nghìn GPU.</p>
              <p><strong>Đánh đổi:</strong>{" "} Mô hình thống nhất có thể kém hơn mô hình chuyên biệt ở từng task riêng lẻ.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Tương lai ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Xu hướng tương lai">
        <ExplanationSection>
          <Callout variant="tip" title="Hướng tới AI giác quan tổng hợp">
            <div className="space-y-2">
              <p>
                <strong>Robotics:</strong>{" "}
                Unified model điều khiển robot: nhìn (camera), nghe (microphone), nói (speaker), hành động (motor) — tất cả trong một mô hình.
              </p>
              <p>
                <strong>Metaverse/AR:</strong>{" "}
                AI hiểu đồng thời thế giới thực (camera) và thế giới ảo (3D), tương tác qua giọng nói và cử chỉ.
              </p>
              <p>
                <strong>Tiếng Việt:</strong>{" "}
                Cơ hội xây dựng unified model hiểu sâu ngữ cảnh Việt Nam: giọng Bắc/Trung/Nam, biển hiệu tiếng Việt, ẩm thực đặc trưng.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Unified Multimodal"
          points={[
            "Unified = MỘT mô hình hiểu và sinh TẤT CẢ loại dữ liệu, khác pipeline ghép nối nhiều mô hình.",
            "Tokenize mọi phương thức (text → BPE, ảnh → VQ-VAE, audio → codec) rồi Transformer xử lý đồng nhất.",
            "Ưu điểm: hiểu cross-modal sâu (ngữ điệu + nội dung + thị giác), any-to-any linh hoạt.",
            "Pipeline mất thông tin tại bottleneck (ASR → text bỏ mất cảm xúc giọng nói).",
            "GPT-4o, Gemini 2.0, Chameleon là các unified model tiêu biểu, hướng tới AGI đa giác quan.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
