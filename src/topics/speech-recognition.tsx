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

/* ── Constants ── */
const TOTAL_STEPS = 8;

const PIPELINE = [
  { label: "Sóng âm", color: "#3b82f6", desc: "Thu nhận tín hiệu âm thanh thô từ microphone", detail: "Sóng âm liên tục được số hoá (sampling) thành chuỗi số — thường 16.000 mẫu/giây (16kHz). Mỗi mẫu là một giá trị biên độ." },
  { label: "Mel-spectrogram", color: "#8b5cf6", desc: "Chuyển sóng âm thành 'ảnh' tần số-thời gian", detail: "STFT chia âm thanh thành cửa sổ 25ms, chuyển sang miền tần số. Mel scale mô phỏng cách tai người nghe: nhạy với tần thấp, ít nhạy với tần cao." },
  { label: "Encoder", color: "#f59e0b", desc: "Transformer encoder trích xuất đặc trưng ngữ nghĩa", detail: "Encoder (thường là Transformer) xử lý spectrogram, tạo ra chuỗi hidden states nắm bắt ý nghĩa âm thanh: nguyên âm, phụ âm, ngữ điệu." },
  { label: "Decoder", color: "#22c55e", desc: "Autoregressive decoder sinh ra chuỗi token văn bản", detail: "Decoder sinh từng token một (giống GPT), sử dụng cross-attention để 'nghe' lại audio features. Token = từ hoặc mảnh từ." },
  { label: "Văn bản", color: "#ec4899", desc: "Kết quả nhận dạng cuối cùng có dấu câu", detail: "Chuỗi token được ghép thành văn bản hoàn chỉnh. Các mô hình tốt tự thêm dấu câu, viết hoa, và timestamp." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Whisper dùng Mel-spectrogram thay vì sóng âm thô (raw waveform)?",
    options: [
      "Vì Mel-spectrogram đẹp hơn khi hiển thị",
      "Vì Mel-spectrogram nén thông tin tần số theo cách tai người nghe, giúp mô hình học hiệu quả hơn",
      "Vì sóng âm thô quá lớn để lưu trữ",
      "Vì Mel-spectrogram là định dạng âm thanh phổ biến nhất",
    ],
    correct: 1,
    explanation:
      "Mel-spectrogram biến đổi tần số theo Mel scale — mô phỏng cách tai người nhạy hơn với tần thấp (giọng nói) và ít nhạy với tần cao. Điều này giúp mô hình tập trung vào thông tin quan trọng nhất của tiếng nói.",
  },
  {
    question: "Người miền Trung nói 'con cá' nhưng Whisper nhận ra 'con ká'. Vấn đề nằm ở đâu?",
    options: [
      "Microphone bị lỗi",
      "Whisper không hỗ trợ tiếng Việt",
      "Dữ liệu huấn luyện thiếu đại diện phương ngữ miền Trung, nên mô hình 'nghe nhầm' thanh điệu",
      "Phương ngữ miền Trung không phải tiếng Việt chuẩn nên không thể nhận dạng",
    ],
    correct: 2,
    explanation:
      "Whisper huấn luyện chủ yếu trên giọng Bắc (phổ thông). Phương ngữ Trung/Nam có hệ thống thanh điệu và phụ âm khác biệt (ví dụ: /k/ vs /c/, nhập thanh). Fine-tuning trên dữ liệu đa phương ngữ Việt Nam giúp cải thiện đáng kể.",
  },
  {
    question: "Encoder-decoder ASR (như Whisper) khác CTC-based ASR (như Wav2Vec2) ở điểm nào?",
    options: [
      "Encoder-decoder chỉ dùng cho tiếng Anh, CTC dùng cho mọi ngôn ngữ",
      "CTC nhanh hơn (không autoregressive) nhưng encoder-decoder xử lý tốt hơn ngữ cảnh dài và tự thêm dấu câu",
      "Encoder-decoder cần GPU, CTC chạy được trên CPU",
      "Không có sự khác biệt đáng kể",
    ],
    correct: 1,
    explanation:
      "CTC (Connectionist Temporal Classification) sinh tất cả token song song — nhanh nhưng mỗi token không biết token trước/sau. Encoder-decoder sinh tuần tự — chậm hơn nhưng hiểu ngữ cảnh, tự sửa lỗi, và thêm dấu câu. Whisper dùng encoder-decoder.",
  },
  {
    type: "fill-blank",
    question: "Mô hình ASR hiện đại như {blank} (OpenAI) chuyển sóng âm thành biểu diễn trung gian gọi là {blank} — một 'ảnh' tần số-thời gian mô phỏng cách tai người nghe.",
    blanks: [
      { answer: "Whisper", accept: ["whisper"] },
      { answer: "Mel-spectrogram", accept: ["mel spectrogram", "mel-spectrogram", "mel", "spectrogram"] },
    ],
    explanation: "Whisper là mô hình ASR mã nguồn mở phổ biến nhất của OpenAI, hỗ trợ 99 ngôn ngữ. Nó chuyển sóng âm 16kHz thành Mel-spectrogram 80 kênh — biểu diễn tần số theo Mel scale mô phỏng cảm nhận phi tuyến tính của tai người.",
  },
];

export default function SpeechRecognitionTopic() {
  const [activeStep, setActiveStep] = useState(0);

  const handleStepClick = useCallback((i: number) => {
    setActiveStep(i);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Khi bạn nói 'Xin chào Việt Nam' vào microphone, AI nhận dạng giọng nói 'nghe' được gì?"
          options={[
            "Trực tiếp nghe được các từ tiếng Việt giống con người",
            "Nhận được chuỗi số biểu diễn biên độ sóng âm, rồi phải 'giải mã' thành chữ",
            "Tra cứu trong từ điển âm thanh để tìm từ phù hợp nhất",
          ]}
          correct={1}
          explanation="AI không 'nghe' như con người! Microphone chuyển sóng âm thành 16.000 con số mỗi giây. Mô hình phải biến đổi chuỗi số này thành spectrogram (ảnh tần số), rồi dùng Transformer để 'giải mã' ý nghĩa thành văn bản."
        />
      </LessonSection>

      {/* ── Step 2: Interactive Pipeline ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhấp vào từng bước trong pipeline để hiểu cách sóng âm biến thành văn bản. Mỗi bước biến đổi dữ liệu sang dạng khác.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 720 140" className="w-full max-w-3xl mx-auto">
              {PIPELINE.map((s, i) => {
                const x = 72 + i * 148;
                const active = i === activeStep;
                return (
                  <g
                    key={i}
                    onClick={() => handleStepClick(i)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - 60}
                      y={25}
                      width={120}
                      height={55}
                      rx={10}
                      fill={active ? s.color : "#1e293b"}
                      stroke={s.color}
                      strokeWidth={active ? 3 : 1.5}
                    />
                    <text x={x} y={48} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                      {s.label}
                    </text>
                    <text x={x} y={64} textAnchor="middle" fill="#cbd5e1" fontSize={7}>
                      Bước {i + 1}
                    </text>
                    {i < PIPELINE.length - 1 && (
                      <line x1={x + 60} y1={52} x2={x + 88} y2={52} stroke="#475569" strokeWidth={2} markerEnd="url(#asr-arrow)" />
                    )}
                  </g>
                );
              })}
              {/* Waveform decoration */}
              <path d="M 10 52 Q 20 35, 30 52 Q 40 69, 50 52" fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.4} />
              <defs>
                <marker id="asr-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#475569" />
                </marker>
              </defs>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 space-y-1">
              <p className="text-sm text-foreground font-semibold">
                {PIPELINE[activeStep].label}: {PIPELINE[activeStep].desc}
              </p>
              <p className="text-sm text-muted">
                {PIPELINE[activeStep].detail}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Nhận dạng giọng nói thực chất là bài toán{" "}
          <strong>dịch ngôn ngữ</strong>{" "}
          — dịch từ{" "}
          <strong>ngôn ngữ âm thanh</strong>{" "}
          (sóng âm) sang{" "}
          <strong>ngôn ngữ văn bản</strong>{" "}
          (ký tự). Đây là lý do kiến trúc encoder-decoder (giống dịch máy) hoạt động cực kỳ hiệu quả cho ASR.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn dùng Whisper để ghi chú cuộc họp tiếng Việt. Kết quả có nhiều lỗi thanh điệu ('ma' thay vì 'mã'). Giải pháp tốt nhất là gì?"
          options={[
            "Chuyển sang dùng Google Speech-to-Text vì nó tốt hơn",
            "Fine-tune Whisper trên dữ liệu tiếng Việt với đa dạng thanh điệu và phương ngữ",
            "Nói chậm hơn và rõ ràng hơn khi họp",
            "Dùng microphone đắt tiền hơn",
          ]}
          correct={1}
          explanation="Fine-tuning Whisper trên dữ liệu tiếng Việt (bao gồm cả giọng Bắc, Trung, Nam) giúp mô hình học cách phân biệt 6 thanh điệu tiếng Việt chính xác hơn. Dữ liệu VIVOS và CommonVoice Vietnamese là điểm bắt đầu tốt."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Nhận dạng giọng nói (ASR — Automatic Speech Recognition)</strong>{" "}
            chuyển đổi tín hiệu âm thanh thành văn bản. Đây là nền tảng cho trợ lý ảo (Siri, Alexa), phụ đề tự động, và ghi chú cuộc họp — ngược lại với bài toán{" "}
            <TopicLink slug="tts">tổng hợp giọng nói (TTS)</TopicLink>{" "}
            chuyển văn bản thành âm thanh.
          </p>

          <Callout variant="insight" title="Kiến trúc Whisper (OpenAI)">
            <div className="space-y-2">
              <p>
                <strong>Tiền xử lý:</strong>{" "}
                Sóng âm 16kHz chuyển thành Mel-spectrogram 80 kênh, cửa sổ 25ms, bước nhảy 10ms.
              </p>
              <p>
                <strong>Encoder:</strong>{" "}
                <TopicLink slug="transformer">Transformer</TopicLink>{" "}
                encoder với 2 lớp CNN ban đầu, xử lý spectrogram thành chuỗi hidden states.
              </p>
              <p>
                <strong>Decoder:</strong>{" "}
                Transformer decoder sinh token tuần tự, sử dụng cross-attention với encoder output.
              </p>
              <p>
                <strong>Multitask:</strong>{" "}
                Cùng một mô hình làm được: nhận dạng, dịch, phát hiện ngôn ngữ, thêm timestamp.
              </p>
            </div>
          </Callout>

          <p>Quá trình chuyển đổi tần số bằng Mel-spectrogram:</p>
          <LaTeX block>{"\\text{Mel}(f) = 2595 \\cdot \\log_{10}\\left(1 + \\frac{f}{700}\\right)"}</LaTeX>
          <p className="text-sm text-muted">
            Công thức Mel scale chuyển tần số Hz sang thang Mel, mô phỏng cảm nhận phi tuyến tính của tai người: khoảng cách từ 100Hz đến 200Hz{" "}
            <strong>nghe</strong>{" "}
            xa hơn nhiều so với 5000Hz đến 5100Hz.
          </p>

          <CodeBlock language="python" title="whisper_vietnamese.py">
{`import whisper

# Tải mô hình Whisper
model = whisper.load_model("large-v3")

# Nhận dạng tiếng Việt
result = model.transcribe(
    "cuoc-hop-vnexpress.wav",
    language="vi",           # Chỉ định tiếng Việt
    task="transcribe",       # Hoặc "translate" để dịch sang Anh
    word_timestamps=True,    # Timestamp từng từ
)

print(result["text"])
# "Xin chào các bạn, hôm nay chúng ta sẽ thảo luận
#  về chiến lược marketing quý 4..."

# Truy cập timestamp từng segment
for seg in result["segments"]:
    print(f"[{seg['start']:.1f}s - {seg['end']:.1f}s] {seg['text']}")`}
          </CodeBlock>

          <Callout variant="warning" title="Thách thức với tiếng Việt">
            <div className="space-y-1">
              <p>
                <strong>Thanh điệu:</strong>{" "}
                Tiếng Việt có 6 thanh (ngang, huyền, sắc, hỏi, ngã, nặng). Nhầm thanh = nhầm nghĩa hoàn toàn ({'"ma"'} vs {'"mã"'} vs {'"mả"'}).
              </p>
              <p>
                <strong>Phương ngữ:</strong>{" "}
                Giọng Bắc ({'"s"'} vs {'"x"'}), Trung ({'"tr"'} = {'"t"'}), Nam ({'"v"'} = {'"d"'}) rất khác nhau. Mô hình cần dữ liệu đa vùng miền.
              </p>
              <p>
                <strong>Từ ghép:</strong>{" "}
                {'"Việt Nam"'} là 1 từ nhưng 2 âm tiết. ASR cần hiểu ngữ cảnh để không tách nhầm.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Nhận dạng giọng Bắc/Trung/Nam">
            Khi fine-tune cho tiếng Việt, chia dữ liệu theo vùng miền và dùng dialect tag: {'"vi-north"'}, {'"vi-central"'}, {'"vi-south"'}. Dataset VIVOS (~15 giờ) và CommonVoice Vietnamese (~100 giờ) là điểm khởi đầu, nhưng cần thêm dữ liệu phương ngữ để đạt chất lượng production.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: So sánh mô hình ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="So sánh mô hình">
          <Callout variant="info" title="Các mô hình ASR phổ biến">
            <div className="space-y-2">
              <p>
                <strong>Whisper (OpenAI):</strong>{" "}
                Encoder-decoder, 99 ngôn ngữ, miễn phí. Chất lượng tiếng Việt khá (WER ~15-20% tùy điều kiện).
              </p>
              <p>
                <strong>Wav2Vec2 (Meta):</strong>{" "}
                CTC-based, self-supervised learning. Nhanh hơn Whisper, nhưng cần fine-tune riêng cho tiếng Việt.
              </p>
              <p>
                <strong>Google Speech-to-Text:</strong>{" "}
                API thương mại, hỗ trợ streaming real-time. Tốt cho tiếng Việt phổ thông, yếu với phương ngữ.
              </p>
              <p>
                <strong>PhoWhisper (VinAI):</strong>{" "}
                Whisper fine-tuned riêng cho tiếng Việt, cải thiện đáng kể với thanh điệu và phương ngữ.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Nhận dạng giọng nói"
          points={[
            "ASR = dịch từ sóng âm sang văn bản. Kiến trúc encoder-decoder (Whisper) là chuẩn hiện đại.",
            "Pipeline: Sóng âm → Mel-spectrogram → Encoder → Decoder → Văn bản có dấu câu.",
            "Mel scale mô phỏng tai người — lý do spectrogram hiệu quả hơn sóng âm thô.",
            "Tiếng Việt thách thức vì 6 thanh điệu và 3 phương ngữ chính (Bắc/Trung/Nam).",
            "Fine-tune trên dữ liệu đa phương ngữ là bắt buộc để đạt chất lượng tốt cho tiếng Việt.",
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
