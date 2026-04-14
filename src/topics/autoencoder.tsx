"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  slug: "autoencoder",
  title: "Autoencoder",
  titleVi: "Bộ tự mã hóa",
  description: "Mạng nén dữ liệu vào biểu diễn chiều thấp rồi tái tạo lại, học đặc trưng quan trọng nhất",
  category: "dl-architectures",
  tags: ["unsupervised-learning", "compression", "representation"],
  difficulty: "intermediate",
  relatedSlugs: ["vae", "pca", "gan"],
  vizType: "interactive",
};

/* ── Constants ── */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Autoencoder bottleneck có 2 neuron. Input là ảnh 784 pixel (28×28). Mạng học được gì?",
    options: [
      "Không học được gì — 2 neuron quá ít",
      "Nén 784 chiều → 2 chiều, giữ lại 2 đặc trưng quan trọng nhất (giống PCA nhưng phi tuyến)",
      "Tái tạo ảnh hoàn hảo pixel-by-pixel",
      "Học cách mã hóa nhị phân 0/1",
    ],
    correct: 1,
    explanation: "Bottleneck buộc mạng phải 'ép' 784 chiều vào 2 số. Nó sẽ tự học 2 đặc trưng quan trọng nhất — ví dụ: nghiêng trái/phải và nét đậm/nhạt. Đây là giảm chiều phi tuyến!",
  },
  {
    question: "Denoising Autoencoder nhận input bị nhiễu nhưng target là ảnh sạch. Tại sao?",
    options: [
      "Để tăng tốc huấn luyện",
      "Để mạng học biểu diễn robust — nén bản chất, không nén nhiễu",
      "Vì dữ liệu thực tế luôn có nhiễu",
      "Để giảm kích thước bottleneck",
    ],
    correct: 1,
    explanation: "Nếu input có nhiễu mà output phải sạch, mạng không thể 'copy' trực tiếp — phải hiểu bản chất dữ liệu để lọc nhiễu. Biểu diễn latent sẽ robust hơn autoencoder thường.",
  },
  {
    question: "Autoencoder thường có loss thấp nhưng không thể sinh dữ liệu mới tốt. Tại sao?",
    options: [
      "Vì loss quá thấp = overfitting",
      "Vì latent space không liên tục — lấy mẫu ngẫu nhiên sẽ rơi vào vùng 'trống' không có nghĩa",
      "Vì decoder quá yếu",
      "Vì bottleneck quá lớn",
    ],
    correct: 1,
    explanation: "Autoencoder mã hóa mỗi ảnh thành 1 điểm cố định trong latent space. Giữa các điểm là vùng trống — lấy mẫu ở đó cho output vô nghĩa. VAE giải quyết bằng cách ép latent space thành phân bố liên tục.",
  },
  {
    type: "fill-blank",
    question:
      "Autoencoder có hai phần: {blank} nén x → z (qua bottleneck nhỏ) và {blank} giải nén z → x̂. Mục tiêu: x̂ ≈ x, loss = ||x - x̂||².",
    blanks: [
      { answer: "encoder", accept: ["Encoder", "bộ mã hoá", "bộ mã hóa", "mạng nén"] },
      { answer: "decoder", accept: ["Decoder", "bộ giải mã", "mạng giải nén"] },
    ],
    explanation:
      "Encoder z = f_θ(x) nén dữ liệu D chiều vào latent d chiều (d << D). Decoder x̂ = g_φ(z) giải nén ngược lại. Bottleneck buộc mạng học đặc trưng quan trọng nhất. Với 1 lớp tuyến tính → tương đương PCA; với nhiều lớp phi tuyến → mạnh hơn nhiều.",
  },
];

/* ── Component ── */
export default function AutoencoderTopic() {
  const [bottleneck, setBottleneck] = useState(3);

  const encoderLayers = [8, 6, bottleneck];
  const decoderLayers = [bottleneck, 6, 8];
  const allLayers = [...encoderLayers, ...decoderLayers.slice(1)];

  const layerX = (i: number) => 55 + i * 88;

  const compressionRatio = useMemo(() => {
    return (8 / bottleneck).toFixed(1);
  }, [bottleneck]);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần gửi ảnh 1MB qua mạng chỉ cho phép 10KB. Bạn nén ảnh xuống 10KB rồi giải nén lại. Ảnh giải nén có giống 100% ảnh gốc không?"
          options={[
            "Giống 100% — nén không mất thông tin",
            "Gần giống nhưng mất chi tiết — nén buộc phải giữ cái quan trọng, bỏ chi tiết",
            "Hoàn toàn khác — nén nhiều quá thì mất hết",
          ]}
          correct={1}
          explanation="Nén 100 lần thì phải mất chi tiết! Nhưng thuật toán nén thông minh sẽ giữ lại bản chất (hình dạng, màu chính) và bỏ chi tiết (texture, noise). Autoencoder học cách nén thông minh này tự động!"
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Architecture ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá kiến trúc">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Giống bạn gọi Grab đi từ Sài Gòn ra Hà Nội. Đường đi phải qua &quot;cổ chai&quot; — đoạn đường hẹp nhất (bottleneck). Mọi thông tin phải nén lại để chui qua, rồi &quot;giải nén&quot; ở đầu bên kia.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Kéo thanh trượt để thay đổi kích thước bottleneck. Nhỏ hơn = nén mạnh hơn = buộc mạng học bản chất.
          </p>

          <svg viewBox="0 0 500 250" className="w-full rounded-lg border border-border bg-background">
            {/* Labels */}
            <rect x={40} y={5} width={175} height={22} rx={6} fill="#3b82f6" opacity={0.1} />
            <text x={128} y={20} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
              Encoder (Nén)
            </text>

            <rect x={290} y={5} width={175} height={22} rx={6} fill="#22c55e" opacity={0.1} />
            <text x={378} y={20} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Decoder (Giải nén)
            </text>

            <motion.text
              key={bottleneck}
              x={layerX(2)} y={20} fontSize={11} fill="#f59e0b" textAnchor="middle" fontWeight={700}
              initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
            >
              Bottleneck ({bottleneck})
            </motion.text>

            {/* Layers */}
            {allLayers.map((nodeCount, li) => {
              const x = layerX(li);
              const isBottleneck = li === 2;
              const isEncoder = li < 2;
              const color = isBottleneck ? "#f59e0b" : isEncoder ? "#3b82f6" : "#22c55e";

              return (
                <g key={li}>
                  {Array.from({ length: nodeCount }, (_, ni) => {
                    const y = 125 - ((nodeCount - 1) * 22) / 2 + ni * 22;
                    return (
                      <motion.circle
                        key={`${li}-${ni}`}
                        cx={x} cy={y} r={9}
                        fill={color} opacity={0.3}
                        stroke={color} strokeWidth={isBottleneck ? 2.5 : 1.5}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: li * 0.05 + ni * 0.02, type: "spring", stiffness: 300 }}
                      />
                    );
                  })}

                  {li < allLayers.length - 1 &&
                    Array.from({ length: nodeCount }, (_, ni) => {
                      const y1 = 125 - ((nodeCount - 1) * 22) / 2 + ni * 22;
                      const nextCount = allLayers[li + 1];
                      return Array.from({ length: nextCount }, (_, nj) => {
                        const y2 = 125 - ((nextCount - 1) * 22) / 2 + nj * 22;
                        return (
                          <line key={`${li}-${ni}-${nj}`}
                            x1={x + 9} y1={y1} x2={layerX(li + 1) - 9} y2={y2}
                            stroke={color} strokeWidth={0.4} opacity={0.25} />
                        );
                      });
                    })}

                  <text x={x} y={125 + ((nodeCount - 1) * 22) / 2 + 22}
                    fontSize={10} fill={color} textAnchor="middle" fontWeight={600}>
                    {nodeCount}
                  </text>
                </g>
              );
            })}

            {/* I/O labels */}
            <text x={layerX(0)} y={230} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              Input x
            </text>
            <text x={layerX(allLayers.length - 1)} y={230} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              Output x&apos; ≈ x
            </text>

            {/* Loss */}
            <text x={250} y={248} fontSize={10} fill="#ef4444" textAnchor="middle" fontWeight={500}>
              Loss = ||x - x&apos;||&sup2; (càng nhỏ = tái tạo càng giống)
            </text>
          </svg>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">Kích thước bottleneck:</label>
            <input type="range" min={1} max={7} value={bottleneck}
              onChange={(e) => setBottleneck(Number(e.target.value))}
              className="flex-1 accent-accent" />
            <span className="w-8 text-center text-sm font-bold text-accent">{bottleneck}</span>
          </div>

          <div className="mt-2 rounded-lg border border-border bg-background/50 p-3 flex items-center justify-between">
            <span className="text-xs text-muted">Tỷ lệ nén: {compressionRatio}×</span>
            <span className="text-xs text-muted">
              {bottleneck <= 2 && "Nén cực mạnh → chỉ giữ bản chất nhất"}
              {bottleneck === 3 && "Nén tốt → cân bằng giữa nén và chất lượng"}
              {bottleneck >= 4 && bottleneck <= 5 && "Nén nhẹ → giữ nhiều chi tiết"}
              {bottleneck >= 6 && "Gần như không nén → dễ 'copy' thay vì học"}
            </span>
          </div>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy bottleneck nhỏ buộc mạng phải &quot;ép&quot; thông tin. Nhưng nó học được gì ở phần nén?
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Autoencoder</strong>{" "}
            không chỉ nén dữ liệu — nó học <strong>biểu diễn bản chất</strong>{" "}
            (latent representation). Bottleneck buộc mạng phải tìm ra đặc trưng quan trọng nhất để giữ lại, giống PCA nhưng mạnh hơn vì phi tuyến!
          </p>
          <p className="text-sm text-muted mt-1">
            Input = ảnh chữ số viết tay. Bottleneck 2D → mạng tự học 2 yếu tố: nghiêng trái/phải và nét đậm/nhạt. Không ai dạy nó — nó tự khám phá!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Variants ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Các biến thể">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
              <h4 className="text-sm font-semibold text-blue-500 mb-2">Autoencoder thường</h4>
              <p className="text-xs text-muted">Nén → giải nén. Học biểu diễn nén. Dùng cho giảm chiều, trích xuất đặc trưng.</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <span className="text-blue-500">x</span>
                <span className="text-muted">→</span>
                <span className="text-amber-500 font-bold">z</span>
                <span className="text-muted">→</span>
                <span className="text-green-500">x&apos;</span>
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
              <h4 className="text-sm font-semibold text-purple-500 mb-2">Denoising AE</h4>
              <p className="text-xs text-muted">Input = ảnh bị nhiễu, target = ảnh sạch. Học lọc nhiễu tự động.</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <span className="text-red-400">x̃ (nhiễu)</span>
                <span className="text-muted">→</span>
                <span className="text-amber-500 font-bold">z</span>
                <span className="text-muted">→</span>
                <span className="text-green-500">x (sạch)</span>
              </div>
            </div>
            <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
              <h4 className="text-sm font-semibold text-pink-500 mb-2">Sparse AE</h4>
              <p className="text-xs text-muted">Thêm ràng buộc: phần lớn neuron ở bottleneck phải = 0. Mỗi input chỉ kích hoạt vài neuron.</p>
              <div className="mt-2 text-center">
                <span className="text-pink-500 text-xs">L = ||x-x&apos;||&sup2; + &lambda; &middot; sparsity</span>
              </div>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
              <h4 className="text-sm font-semibold text-orange-500 mb-2">
                <TopicLink slug="vae">VAE (Variational)</TopicLink>
              </h4>
              <p className="text-xs text-muted">Latent space = phân bố xác suất. Có thể sinh dữ liệu mới bằng lấy mẫu!</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <span className="text-blue-500">x</span>
                <span className="text-muted">→</span>
                <span className="text-amber-500 font-bold">&mu;, &sigma;</span>
                <span className="text-muted">→ sample →</span>
                <span className="text-green-500">x&apos;</span>
              </div>
            </div>
          </div>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Autoencoder bottleneck bằng kích thước input (ví dụ: 784 → 784 → 784). Mạng sẽ học gì?"
          options={[
            "Học biểu diễn nén hiệu quả như bình thường",
            "Có thể chỉ 'copy' input → output mà không học gì hữu ích (identity function)",
            "Không thể train được — loss luôn bằng 0",
          ]}
          correct={1}
          explanation="Khi bottleneck = input size, mạng có thể đơn giản copy input → output (identity mapping). Bottleneck phải NHỎ HƠN input để buộc mạng nén — đây là nguồn gốc tên 'cổ chai'. Denoising AE giải quyết bằng cách thêm nhiễu."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Autoencoder</strong>{" "}
            là mạng nơ-ron học nén (encode) và tái tạo (decode) dữ liệu. Mục tiêu: output giống input nhất có thể khi phải đi qua bottleneck.
          </p>

          <LaTeX block>{String.raw`\text{Encoder: } z = f_\theta(x) \in \mathbb{R}^d`}</LaTeX>
          <LaTeX block>{String.raw`\text{Decoder: } \hat{x} = g_\phi(z) \in \mathbb{R}^D`}</LaTeX>
          <LaTeX block>{String.raw`\mathcal{L} = \|x - \hat{x}\|^2 = \|x - g_\phi(f_\theta(x))\|^2`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            Trong đó d &lt;&lt; D (bottleneck nhỏ hơn input). Mạng phải tìm cách nén D chiều vào d chiều mà vẫn tái tạo được.
          </p>

          <Callout variant="insight" title="Autoencoder vs PCA">
            <p>
              Autoencoder 1 lớp tuyến tính (không activation) = tương đương{" "}
              <TopicLink slug="pca">PCA</TopicLink>
              . Thêm nhiều lớp + activation phi tuyến → Autoencoder mạnh hơn PCA nhiều, nắm bắt được quan hệ phi tuyến trong dữ liệu.
            </p>
          </Callout>

          <Callout variant="info" title="Ứng dụng thực tế">
            <p>
              <strong>Phát hiện bất thường:</strong>{" "}
              Train trên dữ liệu bình thường. Khi gặp dữ liệu lạ → reconstruction error cao → phát hiện anomaly.{" "}
              <strong>Giảm chiều:</strong>{" "}
              Latent code z dùng cho clustering, visualization (giống t-SNE).{" "}
              <strong>Khử nhiễu:</strong>{" "}
              Denoising AE lọc nhiễu ảnh/audio tự động.
            </p>
          </Callout>

          <CodeBlock language="python" title="autoencoder.py">
{`import torch.nn as nn

class Autoencoder(nn.Module):
    def __init__(self, input_dim=784, latent_dim=32):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, latent_dim),  # Bottleneck!
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 256),
            nn.ReLU(),
            nn.Linear(256, input_dim),
            nn.Sigmoid(),  # Output trong [0, 1]
        )

    def forward(self, x):
        z = self.encoder(x)       # Nén: 784 → 32
        x_hat = self.decoder(z)   # Giải nén: 32 → 784
        return x_hat

    def encode(self, x):
        return self.encoder(x)    # Chỉ lấy latent code

# Training
loss_fn = nn.MSELoss()  # ||x - x_hat||²
# Target = input! (self-supervised)
loss = loss_fn(model(x), x)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Autoencoder"
          points={[
            "Autoencoder = Encoder (nén) + Bottleneck (cổ chai) + Decoder (giải nén). Mục tiêu: output ≈ input.",
            "Bottleneck buộc mạng học đặc trưng quan trọng nhất — giảm chiều phi tuyến, mạnh hơn PCA.",
            "Ứng dụng: phát hiện bất thường, giảm chiều, khử nhiễu, trích xuất đặc trưng.",
            "Nhược điểm: latent space không liên tục → không sinh dữ liệu mới tốt → cần VAE.",
            "Biến thể: Denoising AE (lọc nhiễu), Sparse AE (biểu diễn thưa), VAE (sinh dữ liệu).",
          ]}
        />
      </LessonSection>

      {/* ═══ Step 8: QUIZ ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
