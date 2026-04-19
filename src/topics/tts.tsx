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
  slug: "tts",
  title: "Text-to-Speech",
  titleVi: "Tổng hợp giọng nói — AI biết nói",
  description:
    "Công nghệ chuyển đổi văn bản thành giọng nói tự nhiên, với khả năng kiểm soát ngữ điệu và cảm xúc.",
  category: "multimodal",
  tags: ["tts", "speech", "synthesis", "audio"],
  difficulty: "advanced",
  relatedSlugs: ["speech-recognition", "unified-multimodal", "tlm"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const VOICES = [
  { id: "neutral", label: "Trung tính", wave: "M0,50 Q50,20 100,50 Q150,80 200,50 Q250,20 300,50", desc: "Giọng đọc tin tức VnExpress — rõ ràng, không cảm xúc quá mức." },
  { id: "happy", label: "Vui vẻ", wave: "M0,50 Q30,10 60,50 Q90,90 120,50 Q150,10 180,50 Q210,90 240,50 Q270,10 300,50", desc: "Giọng quảng cáo — nhịp nhanh, cao giọng, năng lượng tích cực." },
  { id: "serious", label: "Nghiêm túc", wave: "M0,50 Q75,35 150,50 Q225,65 300,50", desc: "Giọng thuyết trình — chậm rãi, trầm, nhấn nhá có chủ đích." },
  { id: "whisper", label: "Thì thầm", wave: "M0,50 Q50,42 100,50 Q150,58 200,50 Q250,42 300,50", desc: "Giọng kể chuyện đêm — biên độ nhỏ, tần số thấp, thân mật." },
];

const PIPELINE_STEPS = [
  { label: "Phân tích văn bản", desc: "Xử lý viết tắt, số, ký hiệu thành dạng đọc được", color: "#3b82f6" },
  { label: "Dự đoán prosody", desc: "Xác định nhịp điệu, trọng âm, ngắt nghỉ", color: "#8b5cf6" },
  { label: "Tạo Mel-spectrogram", desc: "Mô hình âm học sinh biểu diễn tần số", color: "#f59e0b" },
  { label: "Vocoder → Sóng âm", desc: "Chuyển spectrogram thành sóng âm nghe được", color: "#22c55e" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Câu '109 Trần Hưng Đạo, Q.1, TP.HCM' cần bước xử lý nào trước khi TTS đọc?",
    options: [
      "Dịch sang tiếng Anh trước",
      "Text normalization: '109' → 'một trăm lẻ chín', 'Q.1' → 'Quận Một', 'TP.HCM' → 'Thành phố Hồ Chí Minh'",
      "Chỉ cần gửi thẳng vào vocoder",
      "Tách từng ký tự và phát âm riêng lẻ",
    ],
    correct: 1,
    explanation:
      "Text normalization là bước đầu tiên và cực kỳ quan trọng trong TTS. Mô hình cần biết '109' là địa chỉ (đọc 'một trăm lẻ chín') chứ không phải số điện thoại (đọc 'một không chín'). Tiếng Việt có nhiều quy tắc đọc phức tạp cho số, viết tắt, và ký hiệu.",
  },
  {
    question: "TTS hiện đại dùng vocoder (HiFi-GAN) thay vì tổng hợp ghép nối (concatenative). Tại sao?",
    options: [
      "Vocoder rẻ hơn",
      "Vocoder tạo giọng nói liền mạch, tự nhiên, không bị giật như ghép các đoạn âm thanh ghi sẵn",
      "Vocoder hỗ trợ nhiều ngôn ngữ hơn",
      "Vocoder không cần GPU",
    ],
    correct: 1,
    explanation:
      "TTS ghép nối (concatenative) cắt-dán các đoạn ghi âm sẵn — nghe máy móc và giật ở chỗ nối. Vocoder neural (HiFi-GAN) sinh sóng âm liên tục từ spectrogram, tạo giọng nói mượt mà và tự nhiên hơn nhiều.",
  },
  {
    question: "Bạn muốn tạo giọng đọc tin VnExpress tự động bằng TTS. Thách thức lớn nhất với tiếng Việt là gì?",
    options: [
      "Tiếng Việt có quá nhiều từ vựng",
      "Tiếng Việt dùng chữ Latin nên không khác tiếng Anh",
      "6 thanh điệu quyết định nghĩa từ — nhầm thanh = nhầm nghĩa hoàn toàn, và prosody (ngữ điệu câu) phức tạp",
      "Tiếng Việt không có phần mềm TTS nào hỗ trợ",
    ],
    correct: 2,
    explanation:
      "6 thanh điệu tiếng Việt là thách thức cốt lõi: 'ma' (ngang) ≠ 'má' (sắc) ≠ 'mà' (huyền) ≠ 'mả' (hỏi) ≠ 'mã' (ngã) ≠ 'mạ' (nặng). TTS phải sinh đúng F0 contour cho từng thanh, đồng thời duy trì prosody tự nhiên ở cấp câu.",
  },
  {
    type: "fill-blank",
    question: "Pipeline TTS hiện đại có hai mô-đun chính: mô hình {blank} (acoustic model) sinh Mel-spectrogram, và {blank} chuyển spectrogram thành sóng âm thực nghe được.",
    blanks: [
      { answer: "acoustic", accept: ["âm học", "acoustic model", "mô hình âm học"] },
      { answer: "vocoder", accept: ["bộ mã hoá giọng", "neural vocoder", "hifi-gan", "hifigan"] },
    ],
    explanation: "TTS neural tách thành 2 bước: (1) Acoustic model (VITS, FastSpeech2, Tacotron2) sinh biểu diễn trung gian Mel-spectrogram từ văn bản, (2) Vocoder (HiFi-GAN phổ biến nhất) chuyển Mel-spectrogram thành sóng âm 22kHz chất lượng cao.",
  },
];

export default function TTSTopic() {
  const [selectedVoice, setSelectedVoice] = useState("neutral");
  const voice = VOICES.find((v) => v.id === selectedVoice)!;

  const handleVoiceChange = useCallback((id: string) => {
    setSelectedVoice(id);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Khi TTS đọc câu 'Hà Nội 36°C', AI xử lý '36°C' như thế nào?"
          options={[
            "Đọc từng ký tự: 'ba', 'sáu', 'độ', 'xê'",
            "Chuyển thành 'ba mươi sáu độ xê' rồi mới tổng hợp giọng nói",
            "Bỏ qua '36°C' vì không phải chữ",
          ]}
          correct={1}
          explanation="Đúng! Trước khi tổng hợp giọng, TTS phải chạy text normalization: '36°C' → 'ba mươi sáu độ xê'. Đây là bước quan trọng nhất và phức tạp nhất — ví dụ '10/3' có thể là 'mười phần ba' (phân số) hoặc 'ngày mười tháng ba' (ngày tháng) tuỳ ngữ cảnh!"
        />
      </LessonSection>

      {/* ── Step 2: Interactive Voice Explorer ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          TTS hiện đại không chỉ đọc văn bản mà còn{" "}
          <strong>diễn đạt cảm xúc</strong>. Cùng một câu {'"Hà Nội hôm nay thật đẹp"'} nhưng mỗi phong cách giọng mang lại cảm nhận hoàn toàn khác.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted">Chọn phong cách giọng nói:</p>
            <div className="flex flex-wrap gap-3">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVoiceChange(v.id)}
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

            <svg viewBox="0 0 620 210" className="w-full max-w-2xl mx-auto">
              {/* Text input */}
              <rect x={20} y={15} width={200} height={36} rx={8} fill="#3b82f6" />
              <text x={120} y={38} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                Văn bản đầu vào
              </text>

              {/* TTS engine */}
              <line x1={220} y1={33} x2={250} y2={33} stroke="#475569" strokeWidth={2} />
              <rect x={250} y={10} width={120} height={46} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={310} y={30} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                TTS Engine
              </text>
              <text x={310} y={46} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                {voice.label}
              </text>

              {/* Output waveform */}
              <line x1={370} y1={33} x2={400} y2={33} stroke="#475569" strokeWidth={2} />
              <rect x={400} y={10} width={200} height={46} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
              <path d={voice.wave} fill="none" stroke="#22c55e" strokeWidth={2} transform="translate(415, -13) scale(0.6)" />

              {/* Pipeline steps */}
              <text x={310} y={82} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Pipeline tổng hợp
              </text>
              {PIPELINE_STEPS.map((step, i) => {
                const x = 32 + i * 155;
                return (
                  <g key={i}>
                    <rect x={x} y={95} width={140} height={34} rx={6} fill={step.color} opacity={0.8} />
                    <text x={x + 70} y={109} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{step.label}</text>
                    <text x={x + 70} y={122} textAnchor="middle" fill="#e2e8f0" fontSize={11}>
                      {step.desc.length > 30 ? step.desc.slice(0, 30) + "..." : step.desc}
                    </text>
                    {i < PIPELINE_STEPS.length - 1 && <line x1={x + 140} y1={112} x2={x + 155} y2={112} stroke="#475569" strokeWidth={1.5} />}
                  </g>
                );
              })}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground">
                <strong>{voice.label}:</strong>{" "}
                {voice.desc}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          TTS hiện đại không phải{" "}
          <strong>ghép nối âm thanh ghi sẵn</strong>{" "}
          — nó{" "}
          <strong>sinh sóng âm hoàn toàn mới</strong>{" "}
          từ spectrogram. Giống như nghệ sĩ lồng tiếng tạo ra mỗi câu thoại là duy nhất, TTS neural tạo giọng nói chưa từng tồn tại, với cảm xúc và ngữ điệu được kiểm soát chính xác.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Câu 'Tôi ở số 10/3 Nguyễn Huệ' — TTS cần xử lý '10/3' như thế nào?"
          options={[
            "Đọc 'mười phần ba' vì đó là phân số",
            "Đọc 'mười trên ba' vì đó là tỷ lệ",
            "Đọc 'mười xẹt ba' vì ngữ cảnh cho thấy đây là số nhà/hẻm",
            "Bỏ qua và chỉ đọc 'Nguyễn Huệ'",
          ]}
          correct={2}
          explanation="Trong ngữ cảnh địa chỉ Việt Nam, '10/3' là số nhà hẻm — đọc 'mười xẹt ba' (ở miền Nam) hoặc 'mười ngách ba' (ở miền Bắc). Đây là ví dụ điển hình cho thấy text normalization cần hiểu ngữ cảnh, không chỉ quy tắc cố định!"
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Text-to-Speech (TTS)</strong>{" "}
            là công nghệ chuyển đổi văn bản thành giọng nói tự nhiên — ngược lại với bài toán{" "}
            <TopicLink slug="speech-recognition">nhận dạng giọng nói (ASR)</TopicLink>{" "}
            chuyển âm thanh thành chữ. TTS hiện đại không chỉ phát âm chính xác mà còn thể hiện ngữ điệu, cảm xúc, và phong cách nói.
          </p>

          <Callout variant="insight" title="Pipeline TTS hiện đại gồm 4 bước">
            <div className="space-y-2">
              <p>
                <strong>1. Text Normalization:</strong>{" "}
                Chuyển số, viết tắt, ký hiệu thành dạng đọc. Ví dụ: {'"TP.HCM"'} thành {'"Thành phố Hồ Chí Minh"'}, {'"50.000đ"'} thành {'"năm mươi nghìn đồng"'}.
              </p>
              <p>
                <strong>2. Prosody Prediction:</strong>{" "}
                Dự đoán nhịp điệu, trọng âm, ngắt nghỉ. Câu hỏi có ngữ điệu lên, câu trần thuật có ngữ điệu xuống.
              </p>
              <p>
                <strong>3. Acoustic Model:</strong>{" "}
                Tạo Mel-spectrogram — biểu diễn trung gian tần số-thời gian. Các mô hình: VITS, FastSpeech2, Tacotron2.
              </p>
              <p>
                <strong>4. Vocoder:</strong>{" "}
                Chuyển Mel-spectrogram thành sóng âm thực. HiFi-GAN là vocoder phổ biến nhất, tạo âm thanh 22kHz chất lượng cao.
              </p>
            </div>
          </Callout>

          <p>Mô hình F0 (fundamental frequency) cho thanh điệu tiếng Việt:</p>
          <LaTeX block>{"F_0(t) = F_{\\text{base}} + \\Delta F_{\\text{tone}}(t) + \\Delta F_{\\text{intonation}}(t)"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"F_{\\text{base}}"}</LaTeX> là tần số cơ bản của giọng (nam ~120Hz, nữ ~220Hz).{" "}
            <LaTeX>{"\\Delta F_{\\text{tone}}"}</LaTeX> là biến thiên do thanh điệu từ (6 thanh).{" "}
            <LaTeX>{"\\Delta F_{\\text{intonation}}"}</LaTeX> là biến thiên ngữ điệu câu (hỏi, trần thuật, cảm thán).
          </p>

          <CodeBlock language="python" title="tts_vietnamese.py">
{`# TTS tiếng Việt với VITS (end-to-end)
from TTS.api import TTS

# Tải mô hình TTS tiếng Việt
tts = TTS(model_name="tts_models/vi/vits/vivos")

# Đọc tin VnExpress bằng giọng tự nhiên
text = "Hà Nội hôm nay nhiệt độ 36 độ C, "
text += "người dân được khuyến cáo hạn chế ra ngoài "
text += "từ 11 giờ đến 15 giờ chiều."

tts.tts_to_file(
    text=text,
    file_path="tin-thoi-tiet.wav",
    speed=1.0,        # Tốc độ đọc (1.0 = bình thường)
)

# Voice cloning — nhân bản giọng nói từ 10 giây mẫu
tts_clone = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
tts_clone.tts_to_file(
    text="Xin chào, tôi là trợ lý ảo tiếng Việt",
    speaker_wav="giong-mau-10s.wav",  # File giọng mẫu
    language="vi",
    file_path="giong-nhan-ban.wav",
)`}
          </CodeBlock>

          <Callout variant="warning" title="Rủi ro từ voice cloning">
            Công nghệ nhân bản giọng nói chỉ cần 3-10 giây mẫu. Tại Việt Nam, đã có nhiều vụ lừa đảo qua Zalo bằng giọng nói nhân bản của người thân. Luôn xác minh bằng video call hoặc câu hỏi bảo mật trước khi chuyển tiền!
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Ứng dụng ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng tại Việt Nam">
          <Callout variant="info" title="TTS trong đời sống Việt Nam">
            <div className="space-y-2">
              <p>
                <strong>Đọc tin tức tự động:</strong>{" "}
                Các báo điện tử (VnExpress, Tuổi Trẻ) đang thử nghiệm đọc bài báo bằng TTS, giúp người dùng nghe tin khi lái xe.
              </p>
              <p>
                <strong>Trợ lý ảo:</strong>{" "}
                Viettel Cyberbot, FPT.AI cung cấp TTS tiếng Việt cho tổng đài tự động ngân hàng, bệnh viện.
              </p>
              <p>
                <strong>Audiobook:</strong>{" "}
                Chuyển sách/truyện tiếng Việt thành sách nói — phục vụ người khiếm thị và người bận rộn.
              </p>
              <p>
                <strong>Giáo dục:</strong>{" "}
                TTS đọc đề thi, bài giảng cho học sinh khuyết tật thị giác theo Thông tư 32 Bộ Giáo dục.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về TTS"
          points={[
            "TTS pipeline: Text Normalization → Prosody → Acoustic Model (Mel-spectrogram) → Vocoder (sóng âm).",
            "Text normalization là bước phức tạp nhất cho tiếng Việt: số, viết tắt, địa chỉ cần hiểu ngữ cảnh.",
            "6 thanh điệu tiếng Việt quyết định F0 contour — nhầm thanh = nhầm nghĩa hoàn toàn.",
            "TTS neural (VITS, XTTS) sinh sóng âm mới, khác hẳn TTS ghép nối cũ.",
            "Voice cloning cần chỉ 3-10 giây mẫu — mạnh mẽ nhưng cũng nguy hiểm cho lừa đảo.",
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
