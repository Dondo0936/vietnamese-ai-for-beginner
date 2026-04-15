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
  slug: "text-to-video",
  title: "Text-to-Video",
  titleVi: "Tạo video từ văn bản — AI đạo diễn",
  description:
    "Mô hình AI tạo ra đoạn video liền mạch từ mô tả bằng ngôn ngữ tự nhiên, bao gồm cả chuyển động và âm thanh.",
  category: "multimodal",
  tags: ["text-to-video", "generation", "diffusion", "video"],
  difficulty: "advanced",
  relatedSlugs: ["text-to-image", "diffusion-models", "vlm"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const CHALLENGES = [
  {
    id: "temporal",
    label: "Nhất quán thời gian",
    desc: "Nhân vật không biến mất hay thay đổi hình dạng giữa các frame. Áo đỏ ở frame 1 phải vẫn đỏ ở frame 100.",
    difficulty: "Rất khó",
    color: "#ef4444",
  },
  {
    id: "physics",
    label: "Tính vật lý",
    desc: "Nước chảy xuống, bóng rơi theo trọng lực, tóc bay theo gió. Vi phạm vật lý khiến video trông giả ngay lập tức.",
    difficulty: "Khó",
    color: "#f59e0b",
  },
  {
    id: "compute",
    label: "Tài nguyên tính toán",
    desc: "1 giây video = 24-30 frame. Video 10 giây = 240 ảnh cần nhất quán. Tốn gấp hàng trăm lần so với tạo 1 ảnh.",
    difficulty: "Rất khó",
    color: "#8b5cf6",
  },
  {
    id: "motion",
    label: "Chuyển động phức tạp",
    desc: "Camera xoay, nhiều nhân vật tương tác, đối tượng đi vào/ra khung hình. Mỗi yếu tố tăng độ phức tạp theo cấp số nhân.",
    difficulty: "Khó",
    color: "#3b82f6",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Thách thức lớn nhất phân biệt text-to-video với text-to-image là gì?",
    options: [
      "Video cần nhiều GPU hơn",
      "Video cần duy trì sự nhất quán thời gian giữa hàng trăm frame liên tiếp",
      "Video cần prompt dài hơn",
      "Video không thể dùng mô hình diffusion",
    ],
    correct: 1,
    explanation:
      "Nhất quán thời gian (temporal consistency) là thách thức cốt lõi. Mỗi frame phải vừa đẹp riêng, vừa liền mạch với frame trước/sau — nhân vật không thay đổi hình dáng, vật lý phải đúng, chuyển động phải mượt.",
  },
  {
    question: "Sora (OpenAI) sử dụng kiến trúc nào thay vì U-Net truyền thống?",
    options: [
      "CNN 3D (3D Convolutional Neural Network)",
      "Diffusion Transformer (DiT) — xử lý spacetime patches",
      "GAN (Generative Adversarial Network)",
      "RNN (Recurrent Neural Network) cho mỗi frame",
    ],
    correct: 1,
    explanation:
      "Sora dùng Diffusion Transformer, chia video thành các spacetime patches (mảnh không gian-thời gian) và xử lý bằng Transformer. Điều này cho phép mô hình hiểu mối quan hệ xa giữa các frame tốt hơn U-Net.",
  },
  {
    question: "Bạn muốn tạo video 'xe máy chạy qua phố cổ Hội An' nhưng cảnh bị nhảy giật (flickering). Vấn đề nằm ở đâu?",
    options: [
      "Prompt không đủ chi tiết",
      "Temporal attention giữa các frame chưa đủ mạnh, nên mỗi frame gần như được tạo độc lập",
      "Video quá dài nên hết bộ nhớ GPU",
      "Mô hình không biết xe máy là gì",
    ],
    correct: 1,
    explanation:
      "Flickering xảy ra khi temporal attention không đủ ràng buộc giữa các frame liên tiếp. Các mô hình tốt hơn (Sora, Kling) dùng spacetime attention mạnh hơn để đảm bảo frame t và t+1 nhất quán.",
  },
  {
    type: "fill-blank",
    question: "Thách thức cốt lõi phân biệt text-to-video với text-to-image là chiều {blank} — mỗi {blank} phải vừa đẹp riêng, vừa nhất quán với các frame lân cận.",
    blanks: [
      { answer: "thời gian", accept: ["temporal", "time", "temporal dimension", "chiều thời gian"] },
      { answer: "frame", accept: ["khung hình", "frames"] },
    ],
    explanation: "Video thêm một chiều mới so với ảnh tĩnh: chiều thời gian (temporal). Mỗi frame phải vừa là một ảnh chất lượng riêng lẻ, vừa liền mạch với các frame trước/sau — đây là lý do cần temporal attention hoặc spacetime patches.",
  },
];

export default function TextToVideoTopic() {
  const [activeChallenge, setActiveChallenge] = useState("temporal");
  const challenge = CHALLENGES.find((c) => c.id === activeChallenge)!;

  const handleChallengeChange = useCallback((id: string) => {
    setActiveChallenge(id);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Tạo video 10 giây (240 frame) từ prompt tốn gấp bao nhiêu lần so với tạo 1 ảnh?"
          options={[
            "Khoảng 10 lần (vì 10 giây)",
            "Khoảng 240 lần (vì 240 frame)",
            "Hơn 240 lần rất nhiều, vì còn phải đảm bảo nhất quán giữa tất cả frame",
          ]}
          correct={2}
          explanation="Không chỉ là 240 lần! Ngoài việc tạo 240 frame, mô hình còn phải xử lý temporal attention giữa TẤT CẢ các frame để đảm bảo nhất quán. Chi phí tính toán tăng theo bình phương số frame. Đây là lý do text-to-video cần GPU cluster khổng lồ."
        />
      </LessonSection>

      {/* ── Step 2: Interactive Challenges ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Tạo video không chỉ là tạo nhiều ảnh ghép lại. Hãy khám phá bốn thách thức kỹ thuật lớn nhất mà text-to-video phải giải quyết.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CHALLENGES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChallengeChange(c.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeChallenge === c.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 230" className="w-full max-w-2xl mx-auto">
              {/* Prompt */}
              <rect x={20} y={15} width={580} height={32} rx={8} fill="#3b82f6" />
              <text x={310} y={36} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Prompt: {'"Xe máy chạy qua phố cổ Hội An lúc hoàng hôn"'}
              </text>

              {/* Arrow */}
              <line x1={310} y1={47} x2={310} y2={68} stroke="#475569" strokeWidth={2} />

              {/* Model */}
              <rect x={190} y={68} width={240} height={36} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={310} y={91} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                Mô hình Text-to-Video
              </text>

              {/* Arrow */}
              <line x1={310} y1={104} x2={310} y2={125} stroke="#475569" strokeWidth={2} />

              {/* Video frames */}
              {Array.from({ length: 8 }).map((_, i) => {
                const x = 55 + i * 70;
                const hue = 200 + i * 15;
                return (
                  <g key={i}>
                    <rect x={x} y={130} width={55} height={38} rx={4} fill={`hsl(${hue}, 55%, 35%)`} stroke={challenge.color} strokeWidth={activeChallenge === "temporal" ? 1.5 : 0.5} strokeDasharray={activeChallenge === "temporal" ? "3,2" : "0"} />
                    <text x={x + 27} y={153} textAnchor="middle" fill="white" fontSize={9}>
                      F{i + 1}
                    </text>
                    {i < 7 && (
                      <line x1={x + 55} y1={149} x2={x + 70} y2={149} stroke="#22c55e" strokeWidth={1.5} />
                    )}
                  </g>
                );
              })}

              {/* Challenge highlight */}
              <rect x={20} y={185} width={580} height={35} rx={6} fill={challenge.color} opacity={0.15} />
              <text x={310} y={207} textAnchor="middle" fill={challenge.color} fontSize={10} fontWeight="bold">
                {challenge.label} ({challenge.difficulty})
              </text>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-foreground">{challenge.desc}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Text-to-video không phải{" "}
          <strong>text-to-image chạy 240 lần</strong>. Nếu chỉ tạo từng frame độc lập, video sẽ nhảy giật như slideshow. Bí quyết là{" "}
          <strong>temporal attention</strong>{" "}
          — mỗi frame{" "}
          <strong>nhìn vào các frame xung quanh</strong>{" "}
          để đảm bảo chuyển động liền mạch. Đây là chiều thứ ba mà text-to-image không cần: chiều thời gian.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Video AI tạo ra cho thấy một người bước đi nhưng đôi giày đổi từ đen sang trắng giữa chừng. Thách thức nào bị vi phạm?"
          options={[
            "Tính vật lý — giày không nên đổi màu theo trọng lực",
            "Nhất quán thời gian — thuộc tính đối tượng phải giữ nguyên giữa các frame",
            "Tài nguyên tính toán — GPU không đủ mạnh nên bỏ sót chi tiết",
            "Chuyển động phức tạp — camera di chuyển nên nhìn nhầm màu giày",
          ]}
          correct={1}
          explanation="Đây là lỗi nhất quán thời gian (temporal consistency). Thuộc tính thị giác của đối tượng (màu giày, kiểu áo, khuôn mặt) phải được duy trì nhất quán xuyên suốt video. Mô hình cần temporal attention đủ mạnh để 'nhớ' giày đen ở frame đầu."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Text-to-Video</strong>{" "}
            mở rộng{" "}
            <TopicLink slug="text-to-image">text-to-image</TopicLink>{" "}
            bằng cách thêm chiều thời gian, tạo ra chuỗi frame liền mạch từ mô tả văn bản. Nền tảng vẫn là{" "}
            <TopicLink slug="diffusion-models">mô hình khuếch tán</TopicLink>, chỉ khác ở chỗ mở rộng sang không gian 4D (thời gian + không gian). Đây là một trong những thách thức khó nhất của AI sinh tạo.
          </p>

          <Callout variant="insight" title="Hai kiến trúc chính">
            <div className="space-y-3">
              <p>
                <strong>1. U-Net 3D (Stable Video Diffusion):</strong>{" "}
                Mở rộng U-Net 2D bằng temporal convolution và temporal attention. Xử lý video như tensor 4D: (batch, frames, height, width).
              </p>
              <p>
                <strong>2. Diffusion Transformer / DiT (Sora):</strong>{" "}
                Chia video thành spacetime patches — mỗi patch là một vùng nhỏ trong không gian VÀ thời gian. Transformer xử lý tất cả patches cùng lúc, nắm bắt mối quan hệ xa.
              </p>
            </div>
          </Callout>

          <p>Spacetime patching trong DiT hoạt động như sau:</p>
          <LaTeX block>{"\\text{Video } \\in \\mathbb{R}^{T \\times H \\times W \\times 3} \\xrightarrow{\\text{patch}} N_{\\text{patches}} = \\frac{T}{p_t} \\times \\frac{H}{p_h} \\times \\frac{W}{p_w}"}</LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"T"}</LaTeX> frame, mỗi patch có kích thước <LaTeX>{"p_t \\times p_h \\times p_w"}</LaTeX>. Transformer attention giữa tất cả patches giúp đảm bảo nhất quán không gian-thời gian.
          </p>

          <Callout variant="warning" title="Hạn chế hiện tại">
            <div className="space-y-1">
              <p>
                <strong>Thời lượng:</strong>{" "}
                Hầu hết mô hình chỉ tạo được 4-16 giây. Video dài hơn cần kỹ thuật nối đoạn (temporal tiling).
              </p>
              <p>
                <strong>Vật lý:</strong>{" "}
                AI vẫn hay vi phạm vật lý: nước chảy ngược, vật biến mất rồi xuất hiện lại.
              </p>
              <p>
                <strong>Chi phí:</strong>{" "}
                Tạo 1 video 10 giây có thể tốn hàng chục USD trên cloud GPU.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Các mô hình text-to-video hàng đầu (2024-2025)">
            <div className="space-y-1">
              <p><strong>Sora</strong>{" "} (OpenAI): DiT, lên đến 60 giây, chất lượng điện ảnh.</p>
              <p><strong>Kling</strong>{" "} (Kuaishou): Phổ biến tại châu Á, tạo video nhân vật rất tốt.</p>
              <p><strong>Runway Gen-3 Alpha:</strong>{" "} Giao diện thân thiện, dùng nhiều trong quảng cáo.</p>
              <p><strong>Stable Video Diffusion:</strong>{" "} Mã nguồn mở, cộng đồng phát triển mạnh.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Ứng dụng Việt Nam ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng tại Việt Nam">
          <Callout variant="tip" title="Text-to-video trong bối cảnh Việt Nam">
            <div className="space-y-2">
              <p>
                <strong>Quảng cáo và marketing:</strong>{" "}
                Doanh nghiệp nhỏ Việt Nam có thể tạo video quảng cáo sản phẩm chỉ từ mô tả văn bản, tiết kiệm chi phí quay phim hàng chục triệu đồng.
              </p>
              <p>
                <strong>Du lịch:</strong>{" "}
                Tạo video giới thiệu điểm du lịch: {'"Vịnh Hạ Long lúc bình minh, thuyền kayak giữa các đảo đá vôi"'}.
              </p>
              <p>
                <strong>Giáo dục:</strong>{" "}
                Tạo video minh hoạ bài giảng lịch sử: {'"Quang cảnh Hà Nội năm 1945, đám đông tập trung ở Quảng trường Ba Đình"'}.
              </p>
              <p>
                <strong>Thận trọng:</strong>{" "}
                Cần cảnh giác với deepfake video — lừa đảo qua Zalo bằng video giả khuôn mặt người thân đang trở thành vấn nạn tại Việt Nam.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Text-to-Video"
          points={[
            "Text-to-video = text-to-image + chiều thời gian. Temporal attention là chìa khoá nhất quán.",
            "Hai kiến trúc: U-Net 3D (thêm temporal conv) và DiT/Sora (spacetime patches + Transformer).",
            "Bốn thách thức: nhất quán thời gian, vật lý đúng, chi phí tính toán, chuyển động phức tạp.",
            "Video AI 2025 đã khá tốt (4-60 giây) nhưng vẫn hay lỗi vật lý và bị giới hạn thời lượng.",
            "Cảnh giác: công nghệ này cũng tạo ra deepfake video — cần hiểu để phòng tránh lừa đảo.",
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
