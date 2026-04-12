"use client";

import { useState, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "clip",
  title: "CLIP",
  titleVi: "CLIP — Kết nối hình ảnh và ngôn ngữ",
  description:
    "Mô hình học cách liên kết hình ảnh và văn bản trong cùng một không gian vector, cho phép tìm kiếm ảnh bằng ngôn ngữ tự nhiên.",
  category: "multimodal",
  tags: ["clip", "contrastive-learning", "image-text", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["vlm", "text-to-image", "unified-multimodal"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const PAIRS = [
  { image: "Ảnh phở bò Hà Nội", text: "Tô phở bò nóng hổi", score: 0.91, match: true },
  { image: "Ảnh phở bò Hà Nội", text: "Chiếc xe máy Honda", score: 0.06, match: false },
  { image: "Ảnh vịnh Hạ Long", text: "Đảo đá vôi giữa biển xanh", score: 0.89, match: true },
  { image: "Ảnh vịnh Hạ Long", text: "Cánh đồng lúa chín vàng", score: 0.11, match: false },
  { image: "Ảnh áo dài trắng", text: "Nữ sinh mặc áo dài", score: 0.93, match: true },
  { image: "Ảnh áo dài trắng", text: "Máy tính xách tay", score: 0.04, match: false },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "CLIP được huấn luyện bằng phương pháp nào?",
    options: [
      "Supervised learning — con người gán nhãn từng ảnh",
      "Contrastive learning — kéo cặp ảnh-mô tả đúng lại gần, đẩy cặp sai ra xa trong không gian embedding",
      "Reinforcement learning — thử-sai để tìm cặp phù hợp",
      "Self-supervised learning — dự đoán phần bị che trong ảnh",
    ],
    correct: 1,
    explanation:
      "CLIP dùng contrastive learning trên 400 triệu cặp ảnh-mô tả từ internet. Với mỗi batch N cặp, mô hình phải xác định đúng N cặp khớp trong ma trận N x N khả năng. Đây là InfoNCE loss.",
  },
  {
    question: "CLIP có thể phân loại ảnh mà KHÔNG cần dữ liệu huấn luyện cho task đó (zero-shot). Cách nào?",
    options: [
      "CLIP nhớ hết các ảnh đã thấy trong quá trình huấn luyện",
      "Tạo text embedding cho mỗi nhãn (ví dụ: 'a photo of a cat'), so sánh similarity với image embedding của ảnh cần phân loại",
      "CLIP dùng bộ phân loại SVM ẩn bên trong",
      "CLIP tra cứu ảnh tương tự trên Google Images",
    ],
    correct: 1,
    explanation:
      "Đây là sức mạnh zero-shot: thay vì train classifier, ta chỉ cần viết mô tả cho mỗi nhãn bằng ngôn ngữ tự nhiên, encode thành text embedding, rồi so cosine similarity với image embedding. Nhãn có similarity cao nhất = kết quả phân loại.",
  },
  {
    question: "Stable Diffusion dùng CLIP text encoder. Vai trò của nó trong text-to-image là gì?",
    options: [
      "Phân loại prompt vào các thể loại ảnh",
      "Tạo ảnh trực tiếp từ prompt",
      "Mã hoá prompt thành conditioning vector để dẫn dắt quá trình khử nhiễu của U-Net",
      "Kiểm tra prompt có vi phạm nội quy không",
    ],
    correct: 2,
    explanation:
      "CLIP text encoder chuyển prompt thành vector ngữ nghĩa 768 chiều. Vector này được đưa vào U-Net qua cross-attention, dẫn dắt quá trình khử nhiễu: 'nên khử nhiễu theo hướng nào để ảnh khớp với mô tả?'. Không có CLIP, U-Net sẽ tạo ảnh ngẫu nhiên.",
  },
  {
    type: "fill-blank",
    question: "CLIP dùng hai encoder song song để tạo embedding của {blank} (qua Vision Transformer) và embedding của {blank} (qua Text Transformer), rồi đặt cả hai vào cùng một không gian vector để so cosine similarity.",
    blanks: [
      { answer: "image", accept: ["hình ảnh", "Image", "ảnh"] },
      { answer: "text", accept: ["văn bản", "Text", "mô tả"] },
    ],
    explanation: "CLIP học liên kết image ↔ text: image encoder (ViT) cho ra vector ảnh, text encoder (Transformer) cho ra vector văn bản, cả hai được chiếu vào cùng không gian 768 chiều. Nhờ đó, cosine similarity giữa image embedding và text embedding cho biết ảnh và mô tả có khớp nhau không.",
  },
];

export default function CLIPTopic() {
  const [selectedPair, setSelectedPair] = useState(0);
  const pair = PAIRS[selectedPair];

  const handlePairChange = useCallback((i: number) => {
    setSelectedPair(i);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có 1000 ảnh chưa gán nhãn và muốn tìm tất cả ảnh có phở. Cách nào nhanh nhất?"
          options={[
            "Xem từng ảnh và gán nhãn thủ công",
            "Huấn luyện bộ phân loại ảnh riêng cho phở (cần dữ liệu huấn luyện)",
            "Dùng mô hình đã hiểu cả ảnh lẫn ngôn ngữ — gõ 'phở bò' và tìm ảnh khớp nhất",
          ]}
          correct={2}
          explanation="Đáp án 3 mô tả chính xác cách CLIP hoạt động! CLIP đã liên kết ảnh và văn bản trong cùng không gian vector, nên bạn chỉ cần gõ mô tả và tìm ảnh có embedding gần nhất. Không cần dữ liệu huấn luyện riêng cho 'phở' — đây là zero-shot search!"
        />
      </LessonSection>

      {/* ── Step 2: Interactive Similarity Explorer ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Thử chọn các cặp ảnh-mô tả khác nhau. Quan sát điểm tương đồng (cosine similarity) — CLIP đặt cặp đúng gần nhau và cặp sai xa nhau trong không gian vector.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PAIRS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePairChange(i)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    selectedPair === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {p.image.replace("Ảnh ", "")} + {'"'}{p.text.length > 15 ? p.text.slice(0, 15) + "..." : p.text}{'"'}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 200" className="w-full max-w-2xl mx-auto">
              {/* Image encoder */}
              <rect x={20} y={40} width={140} height={50} rx={10} fill="#3b82f6" />
              <text x={90} y={60} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Image Encoder (ViT)</text>
              <text x={90} y={78} textAnchor="middle" fill="#bfdbfe" fontSize={8}>{pair.image}</text>

              {/* Text encoder */}
              <rect x={20} y={110} width={140} height={50} rx={10} fill="#22c55e" />
              <text x={90} y={130} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Text Encoder</text>
              <text x={90} y={148} textAnchor="middle" fill="#bbf7d0" fontSize={7}>
                {'"'}{pair.text.length > 20 ? pair.text.slice(0, 20) + "..." : pair.text}{'"'}
              </text>

              {/* Arrows */}
              <line x1={160} y1={65} x2={280} y2={100} stroke="#3b82f6" strokeWidth={2} />
              <line x1={160} y1={135} x2={280} y2={100} stroke="#22c55e" strokeWidth={2} />

              {/* Shared space */}
              <circle cx={340} cy={100} r={55} fill="none" stroke="#475569" strokeWidth={2} strokeDasharray="6,3" />
              <text x={340} y={80} textAnchor="middle" fill="#94a3b8" fontSize={8}>Không gian</text>
              <text x={340} y={93} textAnchor="middle" fill="#94a3b8" fontSize={8}>embedding chung</text>
              {/* Dots showing distance */}
              <circle cx={320} cy={110} r={4} fill="#3b82f6" />
              <circle cx={pair.match ? 328 : 370} cy={pair.match ? 115 : 85} r={4} fill="#22c55e" />
              {pair.match && <line x1={320} y1={110} x2={328} y2={115} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2,2" />}

              {/* Similarity score */}
              <rect x={430} y={75} width={170} height={50} rx={10} fill={pair.match ? "#22c55e" : "#ef4444"} />
              <text x={515} y={97} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Cosine similarity</text>
              <text x={515} y={117} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold">
                {(pair.score * 100).toFixed(0)}%
              </text>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-sm text-muted">
                {pair.match
                  ? "Ảnh và mô tả có ý nghĩa tương đồng — CLIP đặt chúng GẦN nhau trong không gian vector!"
                  : "Ảnh và mô tả không liên quan — CLIP đặt chúng XA nhau. Cosine similarity thấp!"}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <strong>CLIP</strong>{" "}
          không phải bộ phân loại ảnh — nó là{" "}
          <strong>bộ dịch giữa hai ngôn ngữ</strong>: ngôn ngữ thị giác và ngôn ngữ văn bản. Bằng cách đặt cả hai vào{" "}
          <strong>cùng một không gian vector</strong>, bất kỳ ảnh nào cũng có thể được tìm bằng bất kỳ mô tả nào — mà không cần huấn luyện riêng cho từng task!
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn dùng CLIP zero-shot để phân loại ảnh thành 3 nhóm: 'phở', 'bánh mì', 'cơm tấm'. Kết quả cho ảnh bún chả là 'phở: 40%, bánh mì: 25%, cơm tấm: 35%'. Tại sao?"
          options={[
            "CLIP bị hỏng vì bún chả không có trong 3 nhãn",
            "Bún chả trông giống phở (đều có nước dùng và bún) nên CLIP chọn nhãn gần nhất, dù không chính xác",
            "CLIP chỉ hoạt động với ảnh tiếng Anh",
            "Cần huấn luyện lại CLIP từ đầu",
          ]}
          correct={1}
          explanation="Zero-shot classification BẮT BUỘC phải chọn trong các nhãn cho sẵn. Khi không có nhãn 'bún chả', CLIP chọn nhãn gần nhất — 'phở' — vì cả hai đều có bún và nước. Bài học: danh sách nhãn phải đủ bao phủ tất cả khả năng!"
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>CLIP</strong>{" "}
            (Contrastive Language-Image Pre-training) là mô hình của OpenAI, học cách liên kết hình ảnh và văn bản trong cùng không gian vector thông qua{" "}
            <strong>học tương phản</strong>{" "}
            (contrastive learning) trên 400 triệu cặp ảnh-mô tả từ internet. CLIP là nền tảng cho các{" "}
            <TopicLink slug="vlm">VLM</TopicLink>, các kiến trúc{" "}
            <TopicLink slug="unified-multimodal">unified multimodal</TopicLink>, và hầu hết hệ thống{" "}
            <TopicLink slug="text-to-image">text-to-image</TopicLink>{" "}hiện đại.
          </p>

          <Callout variant="insight" title="Cách CLIP học">
            <div className="space-y-2">
              <p>
                <strong>1. Mã hoá song song:</strong>{" "}
                Ảnh qua Vision Transformer (ViT-L/14), văn bản qua Text Transformer. Cả hai tạo ra vector 768 chiều.
              </p>
              <p>
                <strong>2. Chiếu vào không gian chung:</strong>{" "}
                Linear projection chiếu cả hai vector vào cùng không gian d chiều.
              </p>
              <p>
                <strong>3. Contrastive loss:</strong>{" "}
                Trong batch N cặp, kéo N cặp đúng lại gần (cosine similarity cao) và đẩy N(N-1) cặp sai ra xa.
              </p>
            </div>
          </Callout>

          <p>Loss function của CLIP (InfoNCE loss đối xứng):</p>
          <LaTeX block>{"\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ \\log \\frac{e^{\\text{sim}(I_i, T_i) / \\tau}}{\\sum_{j=1}^{N} e^{\\text{sim}(I_i, T_j) / \\tau}} + \\log \\frac{e^{\\text{sim}(T_i, I_i) / \\tau}}{\\sum_{j=1}^{N} e^{\\text{sim}(T_i, I_j) / \\tau}} \\right]"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\text{sim}(I, T) = \\cos(\\mathbf{v}_I, \\mathbf{v}_T)"}</LaTeX> là cosine similarity.{" "}
            <LaTeX>{"\\tau"}</LaTeX> là temperature (thường 0.07). Loss đối xứng: cả ảnh tìm mô tả và mô tả tìm ảnh.
          </p>

          <CodeBlock language="python" title="clip_vietnamese.py">
{`import torch
from transformers import CLIPProcessor, CLIPModel

# Tải CLIP
model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")

# Zero-shot classification ảnh ẩm thực Việt Nam
from PIL import Image
image = Image.open("mon-an.jpg")

# Các nhãn ẩm thực Việt
labels = [
    "a photo of pho bo (Vietnamese beef noodle soup)",
    "a photo of banh mi (Vietnamese sandwich)",
    "a photo of com tam (broken rice plate)",
    "a photo of bun cha (grilled pork with noodles)",
]

inputs = processor(
    text=labels, images=image,
    return_tensors="pt", padding=True
)

outputs = model(**inputs)
probs = outputs.logits_per_image.softmax(dim=-1)
for label, prob in zip(labels, probs[0]):
    print(f"{label}: {prob:.1%}")`}
          </CodeBlock>

          <Callout variant="tip" title="CLIP là nền tảng cho nhiều ứng dụng">
            <div className="space-y-1">
              <p><strong>Stable Diffusion:</strong>{" "} CLIP text encoder mã hoá prompt để dẫn dắt tạo ảnh.</p>
              <p><strong>Image search:</strong>{" "} Tìm ảnh bằng ngôn ngữ tự nhiên (Google Photos, Apple Photos).</p>
              <p><strong>Zero-shot classification:</strong>{" "} Phân loại ảnh không cần dữ liệu huấn luyện riêng.</p>
              <p><strong>Image-text retrieval:</strong>{" "} Cho ảnh tìm mô tả, cho mô tả tìm ảnh.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Limitations ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hạn chế">
        <ExplanationSection>
          <Callout variant="warning" title="Hạn chế của CLIP">
            <div className="space-y-2">
              <p>
                <strong>Bias văn hoá:</strong>{" "}
                Huấn luyện chủ yếu trên dữ liệu tiếng Anh, nên hiểu {'"ao dai"'} kém hơn {'"dress"'}. Prompt tiếng Anh thường cho kết quả tốt hơn tiếng Việt.
              </p>
              <p>
                <strong>Counting:</strong>{" "}
                CLIP yếu trong đếm số lượng. {'"3 con mèo"'} và {'"5 con mèo"'} có similarity gần nhau.
              </p>
              <p>
                <strong>Spatial reasoning:</strong>{" "}
                {'"Mèo trên bàn"'} vs {'"Bàn trên mèo"'} — CLIP không phân biệt tốt vị trí tương đối.
              </p>
              <p>
                <strong>Fine-grained:</strong>{" "}
                Phân biệt giữa các loài chim, giống chó cụ thể vẫn khó cho CLIP.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về CLIP"
          points={[
            "CLIP liên kết ảnh và văn bản trong CÙNG MỘT không gian vector bằng contrastive learning.",
            "Zero-shot: phân loại ảnh chỉ cần viết mô tả nhãn, không cần dữ liệu huấn luyện riêng.",
            "InfoNCE loss đối xứng: kéo cặp đúng gần, đẩy cặp sai xa trong ma trận NxN.",
            "CLIP là nền tảng cho Stable Diffusion (text encoder) và image search.",
            "Hạn chế: bias tiếng Anh, yếu counting/spatial reasoning, không phân biệt tốt chi tiết nhỏ.",
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
