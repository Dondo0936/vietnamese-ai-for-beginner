"use client";

import { useState, useMemo, useCallback } from "react";
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
  slug: "vae",
  title: "Variational Autoencoder",
  titleVi: "Bộ tự mã hóa biến phân",
  description: "Autoencoder với không gian tiềm ẩn có cấu trúc xác suất, cho phép sinh dữ liệu mới",
  category: "dl-architectures",
  tags: ["generative", "unsupervised-learning", "probability"],
  difficulty: "advanced",
  relatedSlugs: ["autoencoder", "gan", "diffusion-models"],
  vizType: "interactive",
};

/* ── Seeded RNG ── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Data ── */
const quizQuestions: QuizQuestion[] = [
  {
    question: "VAE encoder xuất ra μ và σ thay vì z cố định. Tại sao?",
    options: [
      "Để tăng tốc huấn luyện",
      "Để latent space thành phân bố liên tục — lấy mẫu bất kỳ đâu đều có nghĩa, cho phép sinh dữ liệu mới",
      "Để giảm số tham số",
      "Vì μ và σ dễ tính gradient hơn z",
    ],
    correct: 1,
    explanation: "Autoencoder thường: mỗi ảnh → 1 điểm z. Giữa các điểm là vùng trống → lấy mẫu ở đó cho output vô nghĩa. VAE: mỗi ảnh → vùng mờ (μ, σ) → các vùng overlap → latent space liên tục → sinh dữ liệu mới tốt!",
  },
  {
    question: "KL divergence trong VAE loss có tác dụng gì?",
    options: [
      "Cải thiện chất lượng ảnh tái tạo",
      "Ép phân bố latent gần N(0,1) — đảm bảo latent space có cấu trúc mượt, liên tục",
      "Tăng tốc gradient descent",
      "Giảm kích thước latent space",
    ],
    correct: 1,
    explanation: "Không có KL loss, encoder có thể mã hóa mỗi ảnh vào vùng cách xa nhau (latent space rời rạc). KL divergence ép tất cả gần N(0,1) → overlap → liên tục. Nhưng quá mạnh sẽ làm mất chi tiết (posterior collapse).",
  },
  {
    question: "Reparameterization trick: z = μ + σ × ε (ε ~ N(0,1)). Tại sao cần trick này?",
    options: [
      "Để z luôn dương",
      "Vì 'lấy mẫu' không có gradient, nhưng z = μ + σε thì gradient chảy qua μ và σ được",
      "Để giảm variance khi training",
      "Vì sampling từ N(μ, σ²) quá chậm",
    ],
    correct: 1,
    explanation: "Backprop không thể đi qua phép 'sampling' (random operation). Trick: z = μ + σ × ε tách random ra biến ε riêng. Gradient chảy qua μ và σ bình thường. ε chỉ là constant random — không cần gradient!",
  },
  {
    type: "fill-blank",
    question:
      "VAE học biểu diễn trong {blank} (không gian tiềm ẩn) có cấu trúc xác suất. Loss gồm reconstruction + {blank} divergence — ép phân phối encoder gần N(0, 1).",
    blanks: [
      { answer: "latent space", accept: ["latent", "không gian tiềm ẩn", "latent-space"] },
      { answer: "KL", accept: ["kl", "Kullback-Leibler", "Kullback Leibler"] },
    ],
    explanation:
      "VAE nén dữ liệu vào latent space có cấu trúc liên tục — mỗi ảnh thành (μ, σ) thay vì 1 điểm cố định. KL divergence D_KL(q(z|x) || p(z)) ép phân phối encoder gần N(0, I), đảm bảo latent space mượt và có thể sinh dữ liệu mới.",
  },
];

/* ── Component ── */
export default function VaeTopic() {
  const [sampleX, setSampleX] = useState(250);
  const [sampleY, setSampleY] = useState(140);

  const latentPoints = useMemo(() => {
    const rng = seededRandom(42);
    const clusters = [
      { cx: 180, cy: 110, label: "A", color: "#3b82f6" },
      { cx: 320, cy: 170, label: "B", color: "#ef4444" },
    ];
    const pts: Array<{ x: number; y: number; label: string; color: string }> = [];
    for (const cl of clusters) {
      for (let i = 0; i < 18; i++) {
        pts.push({
          x: cl.cx + (rng() - 0.5) * 120,
          y: cl.cy + (rng() - 0.5) * 100,
          label: cl.label,
          color: cl.color,
        });
      }
    }
    return pts;
  }, []);

  const nearestInfo = useMemo(() => {
    let minD = Infinity;
    let label = "A";
    let color = "#3b82f6";
    latentPoints.forEach((p) => {
      const d = (p.x - sampleX) ** 2 + (p.y - sampleY) ** 2;
      if (d < minD) { minD = d; label = p.label; color = p.color; }
    });
    return { label, color, dist: Math.sqrt(minD) };
  }, [latentPoints, sampleX, sampleY]);

  const onSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    const y = ((e.clientY - rect.top) / rect.height) * 280;
    if (x > 50 && x < 450 && y > 30 && y < 250) {
      setSampleX(x);
      setSampleY(y);
    }
  }, []);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Autoencoder nén ảnh mèo thành 1 điểm trong latent space, ảnh chó thành điểm khác. Nếu bạn lấy điểm GIỮA hai điểm đó và decode, kết quả sẽ là gì?"
          options={[
            "Ảnh nửa mèo nửa chó — nội suy mượt",
            "Ảnh vô nghĩa — vì giữa hai điểm là vùng 'trống' không có dữ liệu",
            "Ảnh mèo hoặc chó ngẫu nhiên",
          ]}
          correct={1}
          explanation="Autoencoder thường: mỗi ảnh → 1 điểm cô lập. Giữa các điểm là 'sa mạc' → output vô nghĩa. VAE giải quyết bằng cách biến mỗi điểm thành 'đám mây' (phân bố Gaussian) → các đám mây overlap → nội suy mượt!"
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            VAE là bước tiến hoá của{" "}
            <TopicLink slug="autoencoder">autoencoder</TopicLink>{" "}
            thành mô hình sinh, đi trước{" "}
            <TopicLink slug="gan">GAN</TopicLink>{" "}
            và{" "}
            <TopicLink slug="diffusion-models">diffusion models</TopicLink>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Latent Space ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá Latent Space">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bản đồ Google Maps. Autoencoder thường giống bản đồ chỉ có vài chấm thành phố — giữa chúng là biển trắng. VAE giống bản đồ liên tục — mỗi nơi đều có địa hình, bạn đi từ Sài Gòn ra Huế thấy cảnh thay đổi dần.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3">
            Nhấn vào bất kỳ đâu trên latent space để &quot;lấy mẫu&quot;. Quan sát các điểm phân bố liên tục — không có vùng trống.
          </p>

          <svg viewBox="0 0 500 280"
            className="w-full cursor-crosshair rounded-lg border border-border bg-background"
            onClick={onSvgClick}>
            <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Latent Space (Không gian tiềm ẩn)
            </text>

            {/* Gaussian contours */}
            {[120, 85, 50].map((r, i) => (
              <ellipse key={i} cx={250} cy={140} rx={r * 1.6} ry={r}
                fill="none" stroke="#8b5cf6" strokeWidth={0.8}
                opacity={0.12 + i * 0.05} strokeDasharray="4 3" />
            ))}

            {/* Gaussian clouds around each encoded point (VAE difference!) */}
            {latentPoints.map((p, i) => (
              <circle key={`cloud-${i}`} cx={p.x} cy={p.y} r={18}
                fill={p.color} opacity={0.04} />
            ))}

            {/* Encoded points */}
            {latentPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4}
                fill={p.color} opacity={0.65} stroke="#fff" strokeWidth={0.8} />
            ))}

            {/* Sample point */}
            <motion.circle cx={sampleX} cy={sampleY} r={9}
              fill="#f59e0b" stroke="#fff" strokeWidth={2.5}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }} />

            {/* Sample cloud */}
            <circle cx={sampleX} cy={sampleY} r={28}
              fill="#f59e0b" opacity={0.08} />

            <text x={sampleX + 15} y={sampleY - 5} fontSize={11} fill="#f59e0b" fontWeight={600}>
              Sample
            </text>
            <text x={sampleX + 15} y={sampleY + 8} fontSize={11} fill={nearestInfo.color} fontWeight={500}>
              → gần nhất: lớp {nearestInfo.label}
            </text>

            {/* Legend */}
            <circle cx={60} cy={265} r={4} fill="#3b82f6" />
            <text x={70} y={269} fontSize={11} fill="#3b82f6">Lớp A (μ_A, σ_A)</text>
            <circle cx={190} cy={265} r={4} fill="#ef4444" />
            <text x={200} y={269} fontSize={11} fill="#ef4444">Lớp B (μ_B, σ_B)</text>
            <circle cx={320} cy={265} r={5} fill="#f59e0b" />
            <text x={330} y={269} fontSize={11} fill="#f59e0b">Điểm lấy mẫu</text>
          </svg>

          <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
            <p className="text-sm text-foreground">
              Mỗi &quot;đám mây&quot; quanh điểm = phân bố Gaussian mà VAE học được. Các đám mây overlap → latent space liên tục →{" "}
              <strong>sinh dữ liệu mới</strong>{" "}
              bằng cách lấy mẫu bất kỳ đâu!
            </p>
          </div>
        </VisualizationSection>

        <p className="text-sm text-muted mt-3">
          Bạn vừa thấy sự khác biệt cốt lõi: autoencoder → điểm cô lập, VAE → vùng mờ overlap. Nhưng bằng cách nào VAE tạo ra sự &quot;mờ&quot; này?
        </p>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>VAE</strong>{" "}
            = Autoencoder + Xác suất! Encoder không xuất z cố định mà xuất{" "}
            <strong>&mu;</strong>{" "}
            (trung tâm) và <strong>&sigma;</strong>{" "}
            (mức độ &quot;mờ&quot;). Rồi lấy mẫu: z = &mu; + &sigma; &times; &epsilon;. KL divergence ép các đám mây gần nhau → latent space liên tục.
          </p>
          <p className="text-sm text-muted mt-1">
            Giống bạn vẽ bản đồ: thay vì đặt 1 ghim cho mỗi quán phở, bạn tô 1 vùng tròn mờ quanh nó. Các vùng overlap → bạn đi giữa 2 quán vẫn thấy quán khác gần đó!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: DEEPEN — Reparameterization Trick ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Reparameterization Trick">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Vấn đề: Backprop không đi qua phép sampling
          </h3>

          <div className="space-y-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <h4 className="text-sm font-semibold text-red-500 mb-1">Cách sai (không gradient)</h4>
              <p className="text-xs text-muted">z ~ N(&mu;, &sigma;&sup2;) — phép sampling ngẫu nhiên, gradient không chảy qua được.</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                <span className="text-blue-500">&mu;, &sigma;</span>
                <span className="text-red-500 font-bold">→ SAMPLE →</span>
                <span className="text-amber-500">z</span>
                <span className="text-red-500 text-xs ml-2">&#x274C; no gradient!</span>
              </div>
            </div>

            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <h4 className="text-sm font-semibold text-green-500 mb-1">Reparameterization trick (gradient ok!)</h4>
              <p className="text-xs text-muted">z = &mu; + &sigma; &times; &epsilon;, &epsilon; ~ N(0,1). Random tách ra &epsilon;, gradient chảy qua &mu; và &sigma;.</p>
              <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                <span className="text-blue-500">&mu;, &sigma;</span>
                <span className="text-muted">→</span>
                <span className="text-amber-500 font-bold">&mu; + &sigma; &times; &epsilon;</span>
                <span className="text-muted">→</span>
                <span className="text-amber-500">z</span>
                <span className="text-green-500 text-xs ml-2">&#x2705; gradient flows!</span>
              </div>
            </div>
          </div>

          <Callout variant="insight" title="Tại sao trick này hoạt động?">
            <p>
              z = &mu; + &sigma; &times; &epsilon; toán học tương đương z ~ N(&mu;, &sigma;&sup2;), nhưng đặt phần random (&epsilon;) sang bên ngoài. &epsilon; là input cố định (constant) cho mỗi forward pass → gradient chảy qua &mu; và &sigma; bình thường qua phép cộng và nhân!
            </p>
          </Callout>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="VAE loss = Reconstruction + β × KL. Nếu β quá lớn, điều gì xảy ra?"
          options={[
            "Ảnh tái tạo sắc nét hơn",
            "Posterior collapse: encoder bỏ qua input, xuất μ≈0, σ≈1 cho mọi ảnh → latent không mang thông tin",
            "Training nhanh hơn vì loss giảm nhanh",
          ]}
          correct={1}
          explanation="β quá lớn → KL loss chi phối → encoder ép phân bố về N(0,1) cho mọi ảnh → tất cả ảnh cùng 1 phân bố → latent code không mang thông tin → decoder phải 'đoán' → output mờ nhòe. Đây gọi là posterior collapse."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>VAE (Variational Autoencoder)</strong>{" "}
            (Kingma & Welling, 2013) biến autoencoder thành mô hình sinh bằng cách thêm cấu trúc xác suất vào latent space.
          </p>

          <p className="mt-3 font-semibold text-foreground">ELBO (Evidence Lower Bound):</p>
          <LaTeX block>{String.raw`\mathcal{L} = \underbrace{\mathbb{E}_{q(z|x)}[\log p(x|z)]}_{\text{Reconstruction}} - \underbrace{D_{KL}(q(z|x) \| p(z))}_{\text{KL Regularization}}`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            <strong>Reconstruction:</strong>{" "}
            Ảnh giải mã phải giống ảnh gốc (giống autoencoder thường).
          </p>
          <p className="text-sm text-muted">
            <strong>KL Divergence:</strong>{" "}
            Ép <LaTeX>{"q(z|x)"}</LaTeX> (phân bố encoder) gần <LaTeX>{"p(z) = \\mathcal{N}(0, I)"}</LaTeX> (phân bố chuẩn).
          </p>

          <p className="mt-3 font-semibold text-foreground">Reparameterization Trick:</p>
          <LaTeX block>{String.raw`z = \mu + \sigma \odot \epsilon, \quad \epsilon \sim \mathcal{N}(0, I)`}</LaTeX>

          <p className="mt-3 font-semibold text-foreground">KL divergence (closed form cho Gaussian):</p>
          <LaTeX block>{String.raw`D_{KL} = -\frac{1}{2}\sum_{j=1}^{d}(1 + \log\sigma_j^2 - \mu_j^2 - \sigma_j^2)`}</LaTeX>

          <Callout variant="info" title="VAE vs GAN">
            <p>
              <strong>VAE:</strong>{" "}
              Latent space có cấu trúc tốt (nội suy mượt), nhưng ảnh sinh thường mờ do MSE loss trung bình hóa.{" "}
              <strong>GAN:</strong>{" "}
              Ảnh sinh sắc nét, nhưng latent space không có cấu trúc rõ ràng, dễ bị mode collapse.{" "}
              <strong>Diffusion:</strong>{" "}
              Kết hợp ưu điểm cả hai — latent tốt + ảnh sắc nét.
            </p>
          </Callout>

          <CodeBlock language="python" title="vae.py">
{`import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, input_dim=784, latent_dim=20):
        super().__init__()
        # Encoder → μ và log(σ²)
        self.fc1 = nn.Linear(input_dim, 256)
        self.fc_mu = nn.Linear(256, latent_dim)
        self.fc_logvar = nn.Linear(256, latent_dim)
        # Decoder
        self.fc3 = nn.Linear(latent_dim, 256)
        self.fc4 = nn.Linear(256, input_dim)

    def encode(self, x):
        h = F.relu(self.fc1(x))
        return self.fc_mu(h), self.fc_logvar(h)

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)     # σ = exp(½ log σ²)
        eps = torch.randn_like(std)        # ε ~ N(0,1)
        return mu + std * eps              # z = μ + σε

    def decode(self, z):
        h = F.relu(self.fc3(z))
        return torch.sigmoid(self.fc4(h))

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar

def vae_loss(x_hat, x, mu, logvar):
    # Reconstruction loss
    recon = F.binary_cross_entropy(x_hat, x, reduction='sum')
    # KL divergence (closed-form cho Gaussian)
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon + kl

# Sinh ảnh mới: lấy mẫu z ~ N(0,1) rồi decode!
z_new = torch.randn(1, latent_dim)
new_image = model.decode(z_new)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về VAE"
          points={[
            "VAE = Autoencoder + Xác suất. Encoder xuất μ, σ thay vì z cố định → latent space liên tục.",
            "Loss = Reconstruction (tái tạo giống) + KL Divergence (ép phân bố gần N(0,1)).",
            "Reparameterization trick: z = μ + σε cho phép backprop qua phép sampling.",
            "Ưu điểm: latent space có cấu trúc tốt (nội suy, sinh dữ liệu). Nhược điểm: ảnh sinh thường mờ.",
            "Là nền tảng cho Stable Diffusion (VAE encoder/decoder) và nhiều mô hình sinh hiện đại.",
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
