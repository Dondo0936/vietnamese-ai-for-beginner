"use client";

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
  slug: "nerf",
  title: "Neural Radiance Fields",
  titleVi: "Trường bức xạ nơ-ron",
  description: "Biểu diễn cảnh 3D bằng mạng nơ-ron, tái tạo góc nhìn mới từ ảnh 2D",
  category: "dl-architectures",
  tags: ["3d", "computer-vision", "rendering"],
  difficulty: "advanced",
  relatedSlugs: ["cnn", "positional-encoding", "transfer-learning"],
  vizType: "interactive",
};

const quizQuestions: QuizQuestion[] = [
  {
    question: "NeRF nhận input (x, y, z, θ, φ) và output (r, g, b, σ). Tại sao cần hướng nhìn (θ, φ)?",
    options: [
      "Để tăng tốc render",
      "Vì cùng 1 điểm nhìn từ góc khác nhau có màu khác nhau (phản xạ, bóng sáng) — view-dependent effects",
      "Để biết camera ở đâu",
      "Không cần — chỉ là thừa",
    ],
    correct: 1,
    explanation: "Mặt nước phản chiếu: nhìn từ trên → xanh, nhìn xiên → phản chiếu trời. Kim loại bóng: nhìn thẳng → sáng, nhìn xiên → tối. (θ, φ) cho phép NeRF mô tả hiệu ứng phụ thuộc góc nhìn — tạo ảnh thực hơn.",
  },
  {
    question: "NeRF dùng positional encoding cho input (x,y,z). Tại sao?",
    options: [
      "Để MLP biết thứ tự các điểm",
      "MLP với input liên tục khó học chi tiết tần số cao (cạnh sắc, texture). PE biến (x,y,z) thành sin/cos ở nhiều tần số → MLP học được chi tiết",
      "Để giảm kích thước input",
    ],
    correct: 1,
    explanation: "MLP thiên hướng học hàm smooth (tần số thấp). Nhưng cảnh 3D có cạnh sắc, texture chi tiết (tần số cao). Positional encoding: γ(x) = [sin(2⁰πx), cos(2⁰πx), ..., sin(2ᴸπx), cos(2ᴸπx)] giúp MLP nắm được cả chi tiết lẫn tổng thể.",
  },
  {
    question: "NeRF gốc render 1 ảnh mất ~30 giây. Instant-NGP giảm xuống bao nhiêu?",
    options: [
      "~10 giây (nhanh hơn 3×)",
      "~5ms — nhanh hơn ~6000× nhờ hash encoding thay PE + CUDA optimizations",
      "~1 phút (chậm hơn vì phức tạp hơn)",
    ],
    correct: 1,
    explanation: "Instant-NGP (NVIDIA, 2022) thay positional encoding bằng multiresolution hash table + tiny MLP. Kết hợp với CUDA kernels tối ưu → train trong vài giây, render realtime. 3D Gaussian Splatting (2023) còn nhanh hơn nữa.",
  },
  {
    type: "fill-blank",
    question: "Để render một pixel, NeRF bắn một {blank} từ camera xuyên qua cảnh {blank}D, lấy mẫu nhiều điểm dọc theo tia rồi tích phân màu và mật độ để tạo pixel cuối.",
    blanks: [
      { answer: "ray", accept: ["tia", "Ray", "tia nhìn"] },
      { answer: "3", accept: ["ba"] },
    ],
    explanation: "NeRF dùng volume rendering: mỗi pixel tương ứng với một ray (tia) bắn qua cảnh 3D. MLP được hỏi tại 64-192 điểm mẫu dọc tia → trả về (rgb, sigma), sau đó tích phân theo công thức T_i · (1 - exp(-σ_i·δ_i)) · c_i để ra màu pixel.",
  },
];

export default function NerfTopic() {
  const TOTAL_STEPS = 8;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn chụp 50 ảnh chiếc xe máy từ nhiều góc. Giờ muốn xem xe từ góc chưa chụp bao giờ. Cần gì?"
          options={[
            "Chụp thêm ảnh ở góc đó",
            "Dùng AI xây dựng mô hình 3D từ 50 ảnh, rồi render ảnh mới từ góc bất kỳ",
            "Không thể — chỉ xem được góc đã chụp",
          ]}
          correct={1}
          explanation="NeRF! Nó học một 'hàm 3D': cho mọi điểm (x,y,z) và hướng nhìn (θ,φ), trả về màu (RGB) và mật độ (σ). Từ đó render ảnh từ BẤT KỲ góc nhìn nào — như bạn có camera ảo bay quanh cảnh."
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá NeRF">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn dùng Google Maps để xem phố cổ Hội An. Từ ảnh 2D đã chụp, AI xây dựng &quot;thế giới 3D&quot; — bạn &quot;bay&quot; quanh, zoom vào ngóc ngách chưa ai chụp. Đó là công nghệ đằng sau{" "}
          <strong>NeRF</strong>.
        </p>

        <VisualizationSection>
          <svg viewBox="0 0 500 280" className="w-full rounded-lg border border-border bg-background">
            <text x={250} y={18} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              NeRF Pipeline: Ảnh 2D &rarr; MLP &rarr; Góc nhìn mới
            </text>

            {/* Input photos */}
            <text x={60} y={42} fontSize={9} fill="#3b82f6" textAnchor="middle" fontWeight={600}>Ảnh đầu vào</text>
            {[0, 1, 2].map((i) => {
              const y = 50 + i * 42;
              return (
                <g key={i} transform={`rotate(${-8 + i * 8}, 60, ${y + 16})`}>
                  <rect x={25} y={y} width={70} height={36} rx={4}
                    fill="#3b82f6" opacity={0.12} stroke="#3b82f6" strokeWidth={1.5} />
                  <text x={60} y={y + 22} fontSize={9} fill="#3b82f6" textAnchor="middle">
                    Góc {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Arrow to MLP */}
            <line x1={110} y1={110} x2={145} y2={110} stroke="#888" strokeWidth={2} />
            <polygon points="150,110 143,105 143,115" fill="#888" />

            {/* MLP */}
            <rect x={155} y={50} width={155} height={130} rx={12}
              fill="#f97316" opacity={0.08} stroke="#f97316" strokeWidth={2} />
            <text x={232} y={72} fontSize={11} fill="#f97316" textAnchor="middle" fontWeight={700}>
              MLP (mạng nơ-ron)
            </text>
            <text x={232} y={92} fontSize={8} fill="#f97316" textAnchor="middle">
              Input: (x, y, z, &theta;, &phi;)
            </text>
            <text x={232} y={105} fontSize={7} fill="#f97316" textAnchor="middle" opacity={0.7}>
              Vị trí 3D + Hướng nhìn
            </text>
            <rect x={175} y={112} width={115} height={16} rx={4}
              fill="#8b5cf6" opacity={0.1} stroke="#8b5cf6" strokeWidth={1} />
            <text x={232} y={124} fontSize={7} fill="#8b5cf6" textAnchor="middle">
              + Positional Encoding
            </text>
            <text x={232} y={148} fontSize={8} fill="#f97316" textAnchor="middle">
              Output: (r, g, b, &sigma;)
            </text>
            <text x={232} y={162} fontSize={7} fill="#f97316" textAnchor="middle" opacity={0.7}>
              Màu sắc + Mật độ
            </text>

            {/* Arrow to rendering */}
            <line x1={310} y1={110} x2={345} y2={110} stroke="#888" strokeWidth={2} />
            <polygon points="350,110 343,105 343,115" fill="#888" />

            {/* Volume rendering */}
            <rect x={355} y={65} width={120} height={42} rx={8}
              fill="#22c55e" opacity={0.12} stroke="#22c55e" strokeWidth={1.5} />
            <text x={415} y={83} fontSize={9} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Volume Rendering
            </text>
            <text x={415} y={99} fontSize={7} fill="#22c55e" textAnchor="middle">
              Tích phân dọc tia nhìn
            </text>

            {/* Output */}
            <rect x={365} y={120} width={100} height={55} rx={8}
              fill="#ec4899" opacity={0.12} stroke="#ec4899" strokeWidth={2} />
            <text x={415} y={142} fontSize={10} fill="#ec4899" textAnchor="middle" fontWeight={700}>
              Góc nhìn mới!
            </text>
            <text x={415} y={158} fontSize={8} fill="#ec4899" textAnchor="middle">
              (chưa từng chụp)
            </text>

            {/* Ray diagram */}
            <text x={250} y={210} fontSize={9} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Volume Rendering: bắn tia qua cảnh, lấy mẫu nhiều điểm
            </text>
            <circle cx={60} cy={242} r={7} fill="none" stroke="#3b82f6" strokeWidth={2} />
            <circle cx={60} cy={242} r={2.5} fill="#3b82f6" />
            <line x1={68} y1={242} x2={440} y2={242} stroke="#f59e0b" strokeWidth={1.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={`s-${i}`}>
                <circle cx={115 + i * 70} cy={242} r={4}
                  fill="#f97316" opacity={0.2 + i * 0.15} />
                <text x={115 + i * 70} y={262} fontSize={6} fill="currentColor" className="text-muted"
                  textAnchor="middle">(rgb, &sigma;)</text>
              </g>
            ))}
            <text x={455} y={246} fontSize={8} fill="#22c55e" fontWeight={600}>&sum; &rarr; pixel</text>
          </svg>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>NeRF</strong>{" "}
            biến bài toán 3D thành bài toán hàm số: F(x,y,z,&theta;,&phi;) &rarr; (r,g,b,&sigma;). Một MLP đơn giản mã hóa TOÀN BỘ cảnh 3D! Không cần mesh, point cloud, hay voxel — chỉ cần weights của neural network.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Volume Rendering">
        <VisualizationSection>
          <Callout variant="insight" title="Volume Rendering = Tích phân dọc tia">
            <p>
              Để tính màu 1 pixel: bắn tia từ camera, lấy mẫu N điểm trên tia, hỏi MLP tại mỗi điểm → (rgb, &sigma;). Tích phân: C = &Sigma; T_i &middot; (1 - exp(-&sigma;_i &middot; &delta;_i)) &middot; c_i. Trong đó T_i = xác suất tia đến được điểm i (không bị chặn trước đó).
            </p>
          </Callout>
          <Callout variant="info" title="Biến thể nhanh hơn">
            <p>
              <strong>Instant-NGP</strong>{" "}
              (NVIDIA): hash encoding + tiny MLP → train giây, render ms.{" "}
              <strong>3D Gaussian Splatting</strong>{" "}
              (2023): biểu diễn cảnh bằng hàng triệu Gaussian 3D, rasterize trực tiếp → render realtime 100+ FPS. Cả hai đang thay thế NeRF gốc.
            </p>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Render ảnh 800×800 từ NeRF. Mỗi pixel bắn 1 tia, lấy 64 mẫu/tia. MLP được gọi bao nhiêu lần?"
          options={[
            "800 × 800 = 640.000 lần",
            "800 × 800 × 64 = ~41 triệu lần — đây là lý do NeRF gốc chậm!",
            "64 lần (mỗi mẫu 1 lần)",
          ]}
          correct={1}
          explanation="640K pixels × 64 mẫu/pixel = ~41 triệu MLP forward passes cho 1 ảnh! Mỗi pass tính (r,g,b,σ). Đây là bottleneck chính → NeRF gốc ~30s/ảnh. Instant-NGP dùng hash table thay MLP → nhanh hơn 6000×."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>NeRF</strong>{" "}
            (Mildenhall et al., 2020) biểu diễn cảnh 3D bằng continuous function mã hóa trong MLP — khác với cách mô hình sinh như{" "}
            <TopicLink slug="vae">VAE</TopicLink>{" "}nén cảnh vào latent vector rời rạc, NeRF giữ cảnh như một hàm liên tục trên không gian 3D.
          </p>
          <LaTeX block>{String.raw`F_\Theta: (\mathbf{x}, \mathbf{d}) \rightarrow (\mathbf{c}, \sigma)`}</LaTeX>
          <p className="text-sm text-muted mt-1">
            <LaTeX>{String.raw`\mathbf{x} = (x,y,z)`}</LaTeX> vị trí,{" "}
            <LaTeX>{String.raw`\mathbf{d} = (\theta, \phi)`}</LaTeX> hướng nhìn,{" "}
            <LaTeX>{String.raw`\mathbf{c} = (r,g,b)`}</LaTeX> màu,{" "}
            <LaTeX>{String.raw`\sigma`}</LaTeX> mật độ.
          </p>
          <p className="mt-3 font-semibold text-foreground">Volume rendering:</p>
          <LaTeX block>{String.raw`C(\mathbf{r}) = \sum_{i=1}^{N} T_i \cdot (1 - e^{-\sigma_i \delta_i}) \cdot \mathbf{c}_i, \quad T_i = \exp\!\left(-\sum_{j<i} \sigma_j \delta_j\right)`}</LaTeX>

          <CodeBlock language="python" title="nerf_simplified.py">
{`# NeRF MLP (simplified)
class NeRF(nn.Module):
    def __init__(self, D=8, W=256, input_ch=63, input_ch_views=27):
        super().__init__()
        # 8 lớp FC cho vị trí
        self.pts_layers = nn.ModuleList(
            [nn.Linear(input_ch, W)] +
            [nn.Linear(W, W) for _ in range(D-1)]
        )
        # Output: density σ (không phụ thuộc hướng nhìn)
        self.sigma_out = nn.Linear(W, 1)
        # Output: color rgb (phụ thuộc hướng nhìn)
        self.rgb_layer = nn.Linear(W + input_ch_views, W // 2)
        self.rgb_out = nn.Linear(W // 2, 3)

    def forward(self, x, d):
        # x: positional_encoding(xyz), d: positional_encoding(direction)
        h = x
        for layer in self.pts_layers:
            h = F.relu(layer(h))
        sigma = F.relu(self.sigma_out(h))    # Mật độ ≥ 0
        h = F.relu(self.rgb_layer(torch.cat([h, d], -1)))
        rgb = torch.sigmoid(self.rgb_out(h))  # Màu trong [0,1]
        return rgb, sigma`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về NeRF"
          points={[
            "NeRF biểu diễn cảnh 3D bằng MLP: F(x,y,z,θ,φ) → (r,g,b,σ). Toàn bộ cảnh mã hóa trong weights.",
            "Volume rendering: bắn tia từ camera, lấy mẫu nhiều điểm, tích phân → pixel color.",
            "Positional encoding giúp MLP học chi tiết tần số cao (cạnh sắc, texture).",
            "NeRF gốc chậm (~30s/ảnh). Instant-NGP và 3D Gaussian Splatting nhanh hơn 1000-6000×.",
            "Ứng dụng: Google Maps immersive, VR/AR, điện ảnh VFX, bất động sản ảo, bảo tồn di sản.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
