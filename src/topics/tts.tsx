"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tts",
  title: "Text-to-Speech",
  titleVi: "Tổng hợp giọng nói — AI biết nói",
  description:
    "Công nghệ chuyển đổi văn bản thành giọng nói tự nhiên, với khả năng kiểm soát ngữ điệu và cảm xúc.",
  category: "multimodal",
  tags: ["tts", "speech", "synthesis", "audio"],
  difficulty: "intermediate",
  relatedSlugs: ["speech-recognition", "unified-multimodal", "tlm"],
  vizType: "interactive",
};

const VOICES = [
  { id: "neutral", label: "Trung tính", wave: "M0,50 Q50,20 100,50 Q150,80 200,50 Q250,20 300,50" },
  { id: "happy", label: "Vui vẻ", wave: "M0,50 Q30,10 60,50 Q90,90 120,50 Q150,10 180,50 Q210,90 240,50 Q270,10 300,50" },
  { id: "serious", label: "Nghiêm túc", wave: "M0,50 Q75,35 150,50 Q225,65 300,50" },
  { id: "whisper", label: "Thì thầm", wave: "M0,50 Q50,42 100,50 Q150,58 200,50 Q250,42 300,50" },
];

export default function TTSTopic() {
  const [selectedVoice, setSelectedVoice] = useState("neutral");
  const voice = VOICES.find((v) => v.id === selectedVoice)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>nghệ sĩ lồng tiếng</strong>. Khi đọc kịch bản,
          bạn không chỉ phát âm đúng từng từ mà còn phải <strong>diễn đạt cảm xúc</strong>:
          vui vẻ khi nhân vật cười, buồn bã khi nhân vật khóc, căng thẳng khi tình huống
          nguy hiểm.
        </p>
        <p>
          TTS hiện đại cũng làm được như vậy — không chỉ &quot;đọc&quot; văn bản mà còn
          <strong> thổi hồn</strong> vào giọng nói với ngữ điệu, nhịp điệu và cảm xúc
          gần giống con người.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">Chọn phong cách giọng nói:</p>
          <div className="flex flex-wrap gap-3">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedVoice === v.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Text input box */}
            <rect x={20} y={20} width={200} height={40} rx={8} fill="#3b82f6" />
            <text x={120} y={45} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              Văn bản đầu vào
            </text>

            {/* TTS engine */}
            <line x1={220} y1={40} x2={250} y2={40} stroke="#475569" strokeWidth={2} />
            <rect x={250} y={15} width={120} height={50} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={310} y={45} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              TTS Engine
            </text>

            {/* Output waveform */}
            <line x1={370} y1={40} x2={400} y2={40} stroke="#475569" strokeWidth={2} />
            <rect x={400} y={15} width={180} height={50} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <path d={voice.wave} fill="none" stroke="#22c55e" strokeWidth={2} transform="translate(420, -10) scale(0.5)" />
            <text x={490} y={55} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              {voice.label}
            </text>

            {/* Pipeline label */}
            <text x={300} y={95} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Quy trình tổng hợp
            </text>

            {/* Steps */}
            {["Phân tích văn bản", "Tạo Mel-spectrogram", "Vocoder → Sóng âm"].map((step, i) => {
              const x = 100 + i * 200;
              return (
                <g key={i}>
                  <rect x={x - 70} y={115} width={140} height={32} rx={6} fill="#3b82f6" opacity={0.7} />
                  <text x={x} y={136} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{step}</text>
                  {i < 2 && <line x1={x + 70} y1={131} x2={x + 130} y2={131} stroke="#475569" strokeWidth={1.5} />}
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Text-to-Speech (TTS)</strong> là công nghệ chuyển đổi văn bản thành giọng nói
          tự nhiên. TTS hiện đại không chỉ phát âm chính xác mà còn thể hiện được
          ngữ điệu, cảm xúc và phong cách nói.
        </p>
        <p>Pipeline TTS hiện đại gồm:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phân tích văn bản:</strong> Xử lý chính tả, viết tắt, số thành dạng đọc được.
            Xác định nhịp điệu và trọng âm.
          </li>
          <li>
            <strong>Mô hình âm học:</strong> Tạo Mel-spectrogram — biểu diễn trung gian
            của âm thanh. Các mô hình như VITS, Tacotron, FastSpeech.
          </li>
          <li>
            <strong>Vocoder:</strong> Chuyển Mel-spectrogram thành dạng sóng âm thực tế.
            HiFi-GAN là vocoder phổ biến nhất.
          </li>
        </ol>
        <p>
          Các hệ thống TTS hàng đầu hiện nay bao gồm <strong>ElevenLabs</strong>,
          <strong> Bark</strong>, và <strong>XTTS</strong> — có khả năng nhân bản giọng nói
          chỉ từ vài giây mẫu.
        </p>
      </ExplanationSection>
    </>
  );
}
