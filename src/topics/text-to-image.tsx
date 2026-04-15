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
  slug: "text-to-image",
  title: "Text-to-Image",
  titleVi: "Tạo ảnh từ văn bản — AI hoạ sĩ",
  description:
    "Mô hình AI tạo ra hình ảnh chất lượng cao từ mô tả bằng ngôn ngữ tự nhiên.",
  category: "multimodal",
  tags: ["text-to-image", "diffusion", "generation"],
  difficulty: "intermediate",
  relatedSlugs: ["diffusion-models", "text-to-video", "clip"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const PIPELINE_STEPS = [
  { label: "Nhập prompt", desc: "'Phố cổ Hà Nội mùa thu, lá vàng rơi, xe đạp'", color: "#3b82f6", detail: "Người dùng mô tả bức ảnh mong muốn bằng ngôn ngữ tự nhiên." },
  { label: "Mã hoá văn bản", desc: "CLIP text encoder chuyển prompt thành vector", color: "#8b5cf6", detail: "Bộ mã hoá CLIP biến câu mô tả thành vector 768 chiều, nắm bắt ý nghĩa ngữ nghĩa." },
  { label: "Khởi tạo nhiễu", desc: "Tạo tensor ngẫu nhiên trong không gian latent", color: "#ef4444", detail: "Bắt đầu từ nhiễu Gaussian thuần tuý — giống trang giấy trắng đầy hạt mưa ngẫu nhiên." },
  { label: "Khử nhiễu có hướng dẫn", desc: "U-Net lặp 20-50 bước, dẫn dắt bởi prompt", color: "#f59e0b", detail: "Mỗi bước, U-Net dự đoán nhiễu cần loại bỏ. Classifier-Free Guidance khuếch đại ảnh hưởng của prompt." },
  { label: "Giải mã ảnh", desc: "VAE decoder chuyển latent thành ảnh pixel", color: "#22c55e", detail: "Bước cuối: ảnh trong không gian latent (64x64) được giải mã thành ảnh pixel (512x512)." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Stable Diffusion làm việc trong 'không gian latent' thay vì trực tiếp trên pixel?",
    options: [
      "Vì không gian latent cho ảnh đẹp hơn",
      "Vì xử lý trong không gian latent (64x64) nhanh hơn nhiều so với pixel (512x512), tiết kiệm hàng chục lần tính toán",
      "Vì không gian latent dễ hiểu hơn cho người dùng",
      "Vì chỉ có không gian latent mới hỗ trợ tiếng Việt trong prompt",
    ],
    correct: 1,
    explanation:
      "Ảnh 512x512 có 786.432 pixel, nhưng latent 64x64 chỉ có 4.096 giá trị. Xử lý khử nhiễu trong không gian nhỏ hơn hàng trăm lần giúp giảm thời gian và bộ nhớ GPU đáng kể, mà vẫn giữ được chất lượng nhờ VAE decoder.",
  },
  {
    question: "Classifier-Free Guidance (CFG) scale = 7.5 nghĩa là gì?",
    options: [
      "Mô hình tạo 7.5 ảnh rồi chọn ảnh tốt nhất",
      "Mô hình khử nhiễu trong 7.5 giây",
      "Mức độ mô hình tuân theo prompt — CFG cao hơn = bám sát prompt hơn nhưng có thể kém tự nhiên",
      "Số lượng lớp trong mạng U-Net",
    ],
    correct: 2,
    explanation:
      "CFG scale điều chỉnh mức ảnh hưởng của prompt. CFG = 1 gần như bỏ qua prompt (ảnh ngẫu nhiên), CFG = 7-8 là cân bằng tốt, CFG > 15 bám sát prompt nhưng ảnh có thể bị bão hoà và thiếu tự nhiên.",
  },
  {
    question: "Bạn muốn tạo ảnh 'Chùa Một Cột dưới ánh trăng, phong cách tranh sơn dầu'. Thành phần nào chịu trách nhiệm hiểu phong cách 'sơn dầu'?",
    options: [
      "VAE Decoder — giải mã ảnh theo phong cách",
      "U-Net — vì nó khử nhiễu theo phong cách",
      "CLIP Text Encoder — mã hoá ý nghĩa 'sơn dầu' vào vector, sau đó dẫn dắt U-Net",
      "Scheduler — lên lịch khử nhiễu theo phong cách",
    ],
    correct: 2,
    explanation:
      "CLIP Text Encoder hiểu 'tranh sơn dầu' là một phong cách thị giác cụ thể và mã hoá vào conditioning vector. Vector này sau đó dẫn dắt U-Net trong quá trình khử nhiễu, khiến ảnh tạo ra mang đặc điểm sơn dầu: nét cọ dày, màu sắc đậm, kết cấu vải canvas.",
  },
  {
    type: "fill-blank",
    question: "Hai mô hình text-to-image nổi tiếng của OpenAI và Stability AI lần lượt là {blank} (tích hợp trong ChatGPT) và {blank} (mã nguồn mở, chạy được trên GPU cá nhân).",
    blanks: [
      { answer: "DALL-E", accept: ["DALL·E", "dalle", "DALL E", "dall-e 3", "dall-e-3"] },
      { answer: "Stable Diffusion", accept: ["stable-diffusion", "SD", "SDXL", "stable diffusion xl"] },
    ],
    explanation: "DALL-E 3 (OpenAI) được tích hợp trong ChatGPT, hiểu prompt phức tạp và hỗ trợ tiếng Việt tốt. Stable Diffusion (Stability AI) là mã nguồn mở, cộng đồng Việt Nam dùng nhiều nhất vì chạy được trên GPU 8GB VRAM.",
  },
];

export default function TextToImageTopic() {
  const [step, setStep] = useState(0);

  const handlePrev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const handleNext = useCallback(() => setStep((s) => Math.min(PIPELINE_STEPS.length - 1, s + 1)), []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Khi tạo ảnh từ prompt 'chú mèo ngồi trên mặt trăng', AI bắt đầu từ đâu?"
          options={[
            "Từ một bức ảnh mèo có sẵn rồi chỉnh sửa",
            "Từ nhiễu ngẫu nhiên hoàn toàn, rồi từng bước 'lộ ra' bức ảnh",
            "Từ cơ sở dữ liệu ảnh, ghép mèo + mặt trăng lại",
          ]}
          correct={1}
          explanation="Nghe có vẻ kỳ lạ, nhưng AI bắt đầu từ MỘT BỨC ẢNH HOÀN TOÀN NHIỄU (giống tivi mất sóng) rồi từng bước khử nhiễu, được dẫn dắt bởi mô tả của bạn. Giống như hoạ sĩ bắt đầu từ bản phác thảo mờ rồi thêm dần chi tiết!"
        />
      </LessonSection>

      {/* ── Step 2: Interactive Pipeline ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Hãy bấm{" "}
          <strong>Bước tiếp</strong>{" "}
          để theo dõi toàn bộ pipeline tạo ảnh từ prompt đến pixel cuối cùng.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 720 170" className="w-full max-w-3xl mx-auto">
              {PIPELINE_STEPS.map((s, i) => {
                const x = 72 + i * 148;
                const active = i <= step;
                return (
                  <g key={i}>
                    <rect
                      x={x - 60}
                      y={30}
                      width={120}
                      height={55}
                      rx={10}
                      fill={active ? s.color : "#1e293b"}
                      stroke={active ? s.color : "#475569"}
                      strokeWidth={2}
                      opacity={active ? 1 : 0.4}
                    />
                    <text x={x} y={52} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                      {s.label}
                    </text>
                    <text x={x} y={68} textAnchor="middle" fill="#e2e8f0" fontSize={7}>
                      {s.desc.length > 28 ? s.desc.slice(0, 28) + "..." : s.desc}
                    </text>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <line
                        x1={x + 60}
                        y1={57}
                        x2={x + 88}
                        y2={57}
                        stroke={i < step ? s.color : "#475569"}
                        strokeWidth={2}
                      />
                    )}
                  </g>
                );
              })}
              {/* Gradient bar */}
              <rect x={72} y={115} width={580} height={16} rx={4} fill="url(#t2i-grad)" opacity={0.5} />
              <text x={72} y={148} fill="#94a3b8" fontSize={9}>Nhiễu thuần tuý</text>
              <text x={652} y={148} textAnchor="end" fill="#94a3b8" fontSize={9}>Ảnh hoàn chỉnh</text>
              <defs>
                <linearGradient id="t2i-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-lg bg-card border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white"
              >
                Bước tiếp
              </button>
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-foreground">
                <strong>Bước {step + 1}/{PIPELINE_STEPS.length}:</strong>{" "}
                {PIPELINE_STEPS[step].detail}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Text-to-image không phải{" "}
          <strong>ghép ảnh có sẵn</strong>{" "}
          mà là{" "}
          <strong>khử nhiễu có dẫn dắt</strong>. Mỗi bước khử nhiễu, U-Net hỏi prompt: {'"nên giữ chi tiết nào, bỏ nhiễu nào?"'}. Kết quả là bức ảnh{" "}
          <strong>hoàn toàn mới</strong>{" "}
          mà chưa từng tồn tại, được{" "}
          <strong>điêu khắc từ nhiễu</strong>{" "}
          bởi ý tưởng của bạn.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn tạo ảnh 'phở bò Hà Nội' nhưng kết quả thiếu chi tiết (hành lá, thịt bò). Bạn nên làm gì?"
          options={[
            "Tăng số bước khử nhiễu từ 20 lên 200 bước",
            "Viết prompt chi tiết hơn: 'tô phở bò Hà Nội, nước dùng trong, hành lá xanh, thịt bò tái chín, ớt đỏ, chanh'",
            "Đổi sang mô hình khác vì mô hình này không biết phở",
            "Giảm CFG scale xuống 1.0 để AI tự do sáng tạo hơn",
          ]}
          correct={1}
          explanation="Prompt chi tiết giúp CLIP encoder tạo vector ngữ nghĩa phong phú hơn, dẫn dắt U-Net tạo đúng các chi tiết mong muốn. Đây là kỹ năng cốt lõi của prompt engineering cho ảnh. Tăng số bước chỉ làm ảnh mịn hơn, không thêm chi tiết mới."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Text-to-Image</strong>{" "}
            là công nghệ sử dụng{" "}
            <TopicLink slug="diffusion-models">mô hình khuếch tán (diffusion model)</TopicLink>{" "}
            để tạo hình ảnh từ mô tả ngôn ngữ tự nhiên. Kiến trúc phổ biến nhất hiện nay là Latent Diffusion (Stable Diffusion).
          </p>

          <Callout variant="insight" title="Kiến trúc Stable Diffusion">
            <div className="space-y-2">
              <p>
                <strong><TopicLink slug="clip">CLIP</TopicLink> Text Encoder:</strong>{" "}
                Chuyển prompt thành vector ngữ nghĩa, nắm bắt ý nghĩa và phong cách.
              </p>
              <p>
                <strong>U-Net:</strong>{" "}
                Mạng dự đoán nhiễu cần loại bỏ ở mỗi bước. Nhận conditioning từ text vector.
              </p>
              <p>
                <strong><TopicLink slug="vae">VAE</TopicLink> (Variational Autoencoder):</strong>{" "}
                Encoder nén ảnh vào không gian latent, Decoder giải mã ngược lại thành pixel.
              </p>
              <p>
                <strong>Scheduler:</strong>{" "}
                Điều khiển lịch trình khử nhiễu (bao nhiêu nhiễu bỏ mỗi bước).
              </p>
            </div>
          </Callout>

          <p>Quá trình khử nhiễu tuân theo công thức:</p>
          <LaTeX block>{"x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}} \\left( x_t - \\frac{1 - \\alpha_t}{\\sqrt{1 - \\bar{\\alpha}_t}} \\epsilon_\\theta(x_t, t, c) \\right) + \\sigma_t \\mathbf{z}"}</LaTeX>
          <p className="text-sm text-muted">
            Trong đó <LaTeX>{"\\epsilon_\\theta"}</LaTeX> là nhiễu dự đoán bởi U-Net, <LaTeX>{"c"}</LaTeX> là conditioning từ prompt, <LaTeX>{"\\alpha_t"}</LaTeX> là hệ số lịch trình nhiễu.
          </p>

          <Callout variant="info" title="Classifier-Free Guidance (CFG)">
            <p>
              CFG là kỹ thuật khuếch đại ảnh hưởng của prompt bằng cách so sánh dự đoán có và không có điều kiện:
            </p>
            <LaTeX block>{"\\hat{\\epsilon} = \\epsilon_{\\text{uncond}} + w \\cdot (\\epsilon_{\\text{cond}} - \\epsilon_{\\text{uncond}})"}</LaTeX>
            <p className="text-sm">
              <LaTeX>{"w"}</LaTeX> là CFG scale. <LaTeX>{"w = 1"}</LaTeX> bỏ qua prompt, <LaTeX>{"w = 7.5"}</LaTeX> là mặc định phổ biến. Giống như chỉnh volume cho giọng nói hướng dẫn của prompt.
            </p>
          </Callout>

          <CodeBlock language="python" title="stable_diffusion.py">
{`from diffusers import StableDiffusionPipeline
import torch

# Tạo ảnh phố cổ Hà Nội
pipe = StableDiffusionPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
).to("cuda")

prompt = "Phố cổ Hà Nội mùa thu, lá vàng rơi trên đường, "
prompt += "xe đạp cũ dựng bên tường gạch, ánh nắng chiều"
negative_prompt = "blurry, low quality, distorted"

image = pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    num_inference_steps=30,     # Số bước khử nhiễu
    guidance_scale=7.5,         # CFG scale
    width=1024, height=1024,
).images[0]
image.save("pho-co-ha-noi.png")`}
          </CodeBlock>

          <Callout variant="warning" title="Thách thức với tiếng Việt">
            CLIP được huấn luyện chủ yếu trên dữ liệu tiếng Anh, nên prompt tiếng Việt thường cho kết quả kém hơn. Mẹo: dùng prompt tiếng Anh cho nội dung chính, kết hợp từ khoá đặc trưng Việt Nam ({'"ao dai"'}, {'"pho bo"'}, {'"lanterns"'}).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Ứng dụng ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng thực tế">
          <Callout variant="info" title="Các mô hình text-to-image nổi bật">
            <div className="space-y-2">
              <p>
                <strong>Stable Diffusion XL:</strong>{" "}
                Mã nguồn mở, chạy được trên GPU cá nhân (8GB VRAM). Cộng đồng Việt Nam dùng nhiều nhất.
              </p>
              <p>
                <strong>DALL-E 3:</strong>{" "}
                Tích hợp trong ChatGPT, hiểu prompt phức tạp, hỗ trợ tiếng Việt tốt nhờ GPT-4.
              </p>
              <p>
                <strong>Midjourney:</strong>{" "}
                Chất lượng nghệ thuật cao, phong cách đẹp mặc định, nhưng đóng (chỉ qua Discord).
              </p>
              <p>
                <strong>Flux:</strong>{" "}
                Thế hệ mới từ Black Forest Labs, kiến trúc DiT (Diffusion Transformer) thay U-Net.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Text-to-Image"
          points={[
            "Text-to-image bắt đầu từ nhiễu ngẫu nhiên, khử nhiễu dần dưới sự dẫn dắt của prompt.",
            "Kiến trúc: CLIP encoder (hiểu prompt) → U-Net (khử nhiễu) → VAE decoder (tạo pixel).",
            "CFG scale điều chỉnh mức bám sát prompt — quá cao sẽ thiếu tự nhiên, quá thấp sẽ bỏ qua prompt.",
            "Latent diffusion xử lý trong không gian nhỏ (64x64) rồi giải mã ra ảnh lớn (512-1024px).",
            "Prompt chi tiết là kỹ năng quan trọng nhất — mô tả càng cụ thể, kết quả càng chính xác.",
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
