"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "speech-recognition",
  title: "Speech Recognition",
  titleVi: "Nhận dạng giọng nói — Tai nghe AI",
  description:
    "Công nghệ chuyển đổi giọng nói con người thành văn bản, là nền tảng cho trợ lý ảo và ghi chú tự động.",
  category: "multimodal",
  tags: ["speech", "asr", "audio", "transcription"],
  difficulty: "intermediate",
  relatedSlugs: ["tts", "unified-multimodal", "tlm"],
  vizType: "interactive",
};

const PIPELINE = [
  { label: "Sóng âm", color: "#3b82f6", desc: "Thu nhận tín hiệu âm thanh thô" },
  { label: "Trích đặc trưng", color: "#8b5cf6", desc: "Chuyển thành Mel-spectrogram" },
  { label: "Bộ mã hoá", color: "#f59e0b", desc: "Encoder xử lý đặc trưng âm thanh" },
  { label: "Bộ giải mã", color: "#22c55e", desc: "Decoder sinh ra chuỗi từ/ký tự" },
  { label: "Văn bản", color: "#ef4444", desc: "Kết quả nhận dạng cuối cùng" },
];

export default function SpeechRecognitionTopic() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang nghe một bài hát <strong>bằng tiếng nước ngoài</strong>.
          Đầu tiên, bạn <strong>nghe âm thanh</strong>, rồi <strong>nhận ra từng từ</strong>,
          sau đó <strong>ghép thành câu</strong> có nghĩa. Nếu có từ nghe không rõ,
          bạn dùng <strong>ngữ cảnh</strong> để đoán.
        </p>
        <p>
          Hệ thống nhận dạng giọng nói hoạt động tương tự: nhận sóng âm → trích xuất đặc trưng
          → nhận dạng từng phần → ghép thành câu hoàn chỉnh, có sử dụng mô hình ngôn ngữ
          để sửa lỗi và tăng độ chính xác.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 700 160" className="w-full max-w-3xl mx-auto">
            {PIPELINE.map((s, i) => {
              const x = 70 + i * 145;
              const active = i === activeStep;
              return (
                <g key={i} onClick={() => setActiveStep(i)} className="cursor-pointer">
                  <rect
                    x={x - 55}
                    y={35}
                    width={110}
                    height={50}
                    rx={10}
                    fill={active ? s.color : "#1e293b"}
                    stroke={s.color}
                    strokeWidth={active ? 3 : 1.5}
                  />
                  <text x={x} y={58} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                    {s.label}
                  </text>
                  <text x={x} y={72} textAnchor="middle" fill="#cbd5e1" fontSize={7}>
                    Bước {i + 1}
                  </text>
                  {i < PIPELINE.length - 1 && (
                    <line x1={x + 55} y1={60} x2={x + 90} y2={60} stroke="#475569" strokeWidth={2} />
                  )}
                </g>
              );
            })}
            {/* Waveform decoration */}
            <path d="M 15 60 Q 25 40, 35 60 Q 45 80, 55 60" fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.5} />
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              <strong>{PIPELINE[activeStep].label}:</strong> {PIPELINE[activeStep].desc}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Nhận dạng giọng nói (ASR — Automatic Speech Recognition)</strong> là công nghệ
          chuyển đổi tín hiệu âm thanh thành văn bản. Đây là nền tảng cho trợ lý ảo (Siri, Alexa),
          phụ đề tự động, và ghi chú cuộc họp.
        </p>
        <p>Pipeline xử lý gồm các bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Thu âm & tiền xử lý:</strong> Lọc nhiễu, chuẩn hoá biên độ tín hiệu.</li>
          <li><strong>Trích đặc trưng:</strong> Chuyển sóng âm thành Mel-spectrogram hoặc MFCC.</li>
          <li><strong>Mã hoá (Encoder):</strong> Mạng nơ-ron trích xuất biểu diễn ngữ nghĩa từ âm thanh.</li>
          <li><strong>Giải mã (Decoder):</strong> Sinh chuỗi ký tự hoặc từ dựa trên biểu diễn đã mã hoá.</li>
        </ol>
        <p>
          Mô hình nổi bật nhất hiện nay là <strong>Whisper</strong> (OpenAI) — hỗ trợ 99 ngôn ngữ
          bao gồm tiếng Việt, với kiến trúc encoder-decoder dựa trên Transformer.
        </p>
      </ExplanationSection>
    </>
  );
}
