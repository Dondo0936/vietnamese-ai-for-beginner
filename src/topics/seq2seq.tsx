"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "seq2seq",
  title: "Sequence-to-Sequence",
  titleVi: "Seq2Seq - Chuỗi sang chuỗi",
  description:
    "Kiến trúc mã hóa-giải mã chuyển đổi chuỗi đầu vào thành chuỗi đầu ra, nền tảng cho dịch máy và tóm tắt văn bản.",
  category: "nlp",
  tags: ["nlp", "architecture", "translation"],
  difficulty: "intermediate",
  relatedSlugs: ["rnn", "lstm", "attention-mechanism"],
  vizType: "interactive",
};

const INPUT_TOKENS = ["Tôi", "yêu", "Việt", "Nam"];
const OUTPUT_TOKENS = ["I", "love", "Vietnam", "<EOS>"];

export default function Seq2SeqTopic() {
  const [step, setStep] = useState(0);
  const maxStep = INPUT_TOKENS.length + OUTPUT_TOKENS.length;

  const encodingDone = step >= INPUT_TOKENS.length;
  const decodingStep = encodingDone ? step - INPUT_TOKENS.length : -1;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>phiên dịch viên</strong> tại hội nghị
          quốc tế. Người nói tiếng Việt nói một câu dài, bạn{" "}
          <strong>lắng nghe và ghi nhớ toàn bộ</strong> (mã hóa). Sau khi họ
          nói xong, bạn bắt đầu <strong>dịch sang tiếng Anh từng từ</strong>{" "}
          (giải mã).
        </p>
        <p>
          Bộ mã hóa (Encoder) như bộ não nghe — nén toàn bộ câu tiếng Việt
          thành một &quot;ý nghĩa tổng hợp&quot;. Bộ giải mã (Decoder) như bộ não nói —
          từ ý nghĩa đó, sinh ra câu tiếng Anh từng từ một.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-card border border-border text-muted hover:text-foreground transition-colors"
            >
              &#8592; Lùi
            </button>
            <button
              onClick={() => setStep(Math.min(maxStep, step + 1))}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-accent text-white transition-colors"
            >
              Tiếp &#8594;
            </button>
            <button
              onClick={() => setStep(0)}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-card border border-border text-muted hover:text-foreground transition-colors"
            >
              Đặt lại
            </button>
          </div>

          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {/* Encoder section */}
            <text x="120" y="20" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="bold">
              Bộ mã hóa (Encoder)
            </text>
            {INPUT_TOKENS.map((token, i) => {
              const active = step > i;
              const current = step === i + 1;
              return (
                <g key={`enc-${i}`}>
                  <rect
                    x={20 + i * 65}
                    y="35"
                    width="55"
                    height="30"
                    rx="6"
                    fill={active ? "#3b82f6" : "#1e293b"}
                    stroke={current ? "#60a5fa" : "#475569"}
                    strokeWidth={current ? 2.5 : 1.5}
                  />
                  <text
                    x={47 + i * 65}
                    y="55"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {token}
                  </text>
                  {/* Hidden states */}
                  <rect
                    x={25 + i * 65}
                    y="80"
                    width="45"
                    height="22"
                    rx="4"
                    fill={active ? "#1d4ed8" : "#0f172a"}
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x={47 + i * 65} y="95" textAnchor="middle" fill="#94a3b8" fontSize="9">
                    h{i + 1}
                  </text>
                  {i < INPUT_TOKENS.length - 1 && (
                    <line
                      x1={70 + i * 65}
                      y1="91"
                      x2={85 + i * 65}
                      y2="91"
                      stroke={active ? "#3b82f6" : "#334155"}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}

            {/* Context vector */}
            <circle
              cx="300"
              cy="140"
              r="22"
              fill={encodingDone ? "#8b5cf6" : "#1e293b"}
              stroke={encodingDone ? "#a78bfa" : "#475569"}
              strokeWidth="2"
            />
            <text x="300" y="137" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
              Context
            </text>
            <text x="300" y="149" textAnchor="middle" fill="white" fontSize="8">
              Vector
            </text>
            <line x1="262" y1="96" x2="285" y2="122" stroke={encodingDone ? "#8b5cf6" : "#334155"} strokeWidth="1.5" />

            {/* Decoder section */}
            <text x="460" y="20" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="bold">
              Bộ giải mã (Decoder)
            </text>
            {OUTPUT_TOKENS.map((token, i) => {
              const active = decodingStep > i;
              const current = decodingStep === i;
              return (
                <g key={`dec-${i}`}>
                  <rect
                    x={330 + i * 65}
                    y="35"
                    width="55"
                    height="30"
                    rx="6"
                    fill={active || current ? "#22c55e" : "#1e293b"}
                    stroke={current ? "#4ade80" : "#475569"}
                    strokeWidth={current ? 2.5 : 1.5}
                  />
                  <text
                    x={357 + i * 65}
                    y="55"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {active || current ? token : "?"}
                  </text>
                  <rect
                    x={335 + i * 65}
                    y="80"
                    width="45"
                    height="22"
                    rx="4"
                    fill={active || current ? "#15803d" : "#0f172a"}
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x={357 + i * 65} y="95" textAnchor="middle" fill="#94a3b8" fontSize="9">
                    s{i + 1}
                  </text>
                  {i < OUTPUT_TOKENS.length - 1 && (
                    <line
                      x1={380 + i * 65}
                      y1="91"
                      x2={395 + i * 65}
                      y2="91"
                      stroke={active ? "#22c55e" : "#334155"}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
            <line x1="315" y1="130" x2="340" y2="96" stroke={encodingDone ? "#8b5cf6" : "#334155"} strokeWidth="1.5" />

            {/* Step indicator */}
            <text x="300" y="250" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Bước {step}/{maxStep} —{" "}
              {!encodingDone
                ? `Mã hóa từ "${INPUT_TOKENS[step] || "..."}" `
                : decodingStep < OUTPUT_TOKENS.length
                  ? `Giải mã từ "${OUTPUT_TOKENS[decodingStep] || "..."}"`
                  : "Hoàn tất!"}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Sequence-to-Sequence (Seq2Seq)</strong> là kiến trúc gồm hai
          phần: Encoder mã hóa chuỗi đầu vào thành vector ngữ cảnh, và Decoder
          giải mã vector đó thành chuỗi đầu ra.
        </p>
        <p>Các ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Dịch máy:</strong> Chuyển đổi câu từ ngôn ngữ này sang
            ngôn ngữ khác (tiếng Việt → tiếng Anh).
          </li>
          <li>
            <strong>Tóm tắt văn bản:</strong> Nén đoạn văn dài thành bản tóm
            tắt ngắn gọn.
          </li>
          <li>
            <strong>Hỏi đáp:</strong> Nhận câu hỏi và sinh ra câu trả lời phù
            hợp.
          </li>
        </ol>
        <p>
          Hạn chế chính là <strong>nút thắt cổ chai thông tin</strong>: toàn bộ
          câu đầu vào bị nén vào một vector cố định. Với câu dài, thông tin bị
          mất. Cơ chế <strong>Attention</strong> được phát triển để giải quyết
          vấn đề này.
        </p>
      </ExplanationSection>
    </>
  );
}
