"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cost-optimization",
  title: "Cost Optimization",
  titleVi: "Tối ưu chi phí — AI không đốt tiền",
  description:
    "Chiến lược giảm chi phí vận hành hệ thống AI mà không hy sinh chất lượng, từ chọn mô hình đến quản lý tài nguyên.",
  category: "infrastructure",
  tags: ["cost", "optimization", "budget", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "model-serving", "gpu-optimization"],
  vizType: "interactive",
};

/* ── Cost calculator ── */
interface CostScenario {
  name: string;
  reqPerDay: number;
  modelCost: number;
  cachingRate: number;
  routingSmallPct: number;
  smallModelCost: number;
}

const SCENARIOS: CostScenario[] = [
  { name: "Không tối ưu", reqPerDay: 100000, modelCost: 0.03, cachingRate: 0, routingSmallPct: 0, smallModelCost: 0.001 },
  { name: "Caching 40%", reqPerDay: 100000, modelCost: 0.03, cachingRate: 0.4, routingSmallPct: 0, smallModelCost: 0.001 },
  { name: "Routing 70/30", reqPerDay: 100000, modelCost: 0.03, cachingRate: 0, routingSmallPct: 0.7, smallModelCost: 0.001 },
  { name: "Tối ưu toàn bộ", reqPerDay: 100000, modelCost: 0.03, cachingRate: 0.4, routingSmallPct: 0.7, smallModelCost: 0.001 },
];

function calcCost(s: CostScenario) {
  const uncachedReqs = s.reqPerDay * (1 - s.cachingRate);
  const smallReqs = uncachedReqs * s.routingSmallPct;
  const largeReqs = uncachedReqs * (1 - s.routingSmallPct);
  const dailyCost = smallReqs * s.smallModelCost + largeReqs * s.modelCost;
  return { daily: dailyCost, monthly: dailyCost * 30 };
}

const TOTAL_STEPS = 7;

export default function CostOptimizationTopic() {
  const [activeScenario, setActiveScenario] = useState(0);
  const baseline = calcCost(SCENARIOS[0]);
  const current = calcCost(SCENARIOS[activeScenario]);
  const saving = ((1 - current.monthly / baseline.monthly) * 100).toFixed(0);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Model routing quyết định gửi request đến model nào. Tiêu chí nào phù hợp nhất?",
      options: [
        "Gửi random cho đều",
        "Phân loại độ phức tạp câu hỏi: đơn giản → model nhỏ rẻ, phức tạp → model lớn mạnh",
        "Luôn dùng model lớn nhất để đảm bảo chất lượng",
      ],
      correct: 1,
      explanation: "70% câu hỏi thường ngày (dịch, tóm tắt, FAQ) model nhỏ (Llama-8B, $0.001/req) xử lý tốt. Chỉ 30% câu phức tạp (code, toán, suy luận) cần model lớn ($0.03/req). Routing thông minh giảm 60-80% chi phí.",
    },
    {
      question: "Semantic caching khác exact caching ở điểm nào?",
      options: [
        "Cache kết quả cho câu hỏi TƯƠNG TỰ (dùng embedding similarity), không cần khớp chính xác",
        "Lưu cache trên SSD thay vì RAM",
        "Cache chỉ cho GET request, không cho POST",
      ],
      correct: 0,
      explanation: "'Thời tiết HN hôm nay?' và 'Hà Nội hôm nay thời tiết sao?' là cùng ý. Semantic caching encode câu hỏi thành embedding, tìm cache entry có cosine similarity > 0.95. Cache hit rate tăng từ 10% (exact) lên 40%+ (semantic).",
    },
    {
      question: "Spot/Preemptible instances giảm chi phí GPU tới 70% nhưng có nhược điểm gì?",
      options: [
        "GPU yếu hơn on-demand instances",
        "Có thể bị cloud provider thu hồi bất kỳ lúc nào",
        "Không hỗ trợ CUDA",
      ],
      correct: 1,
      explanation: "Spot instances là GPU 'thừa' của cloud, giảm 60-90% giá nhưng có thể bị thu hồi (2 phút cảnh báo). Phù hợp cho training (có checkpoint), không phù hợp cho production serving (cần availability cao).",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Startup Việt Nam dùng GPT-4 API cho chatbot, 100K requests/ngày, hoá đơn $90K/tháng. CEO yêu cầu giảm còn $20K mà không giảm chất lượng đáng kể. Có khả thi không?"
          options={[
            "Không — cần cắt tính năng hoặc giảm request",
            "Có — kết hợp model routing, caching, quantization giảm 70-80% chi phí",
            "Chỉ giảm được 10-20% bằng cách viết prompt ngắn hơn",
          ]}
          correct={1}
          explanation="Hoàn toàn khả thi! 70% request đơn giản dùng Llama-8B tự host ($0.001/req thay vì $0.03). 40% cache hit thêm miễn phí. Kết quả: $90K → $18K/tháng. Nhiều startup Việt đã làm điều này!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">chiến lược tối ưu</strong>{" "}
          để xem chi phí thay đổi cho 100K requests/ngày.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScenario(i)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    activeScenario === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              {/* Monthly cost comparison */}
              <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
                Chi phí hàng tháng
              </text>

              {/* Baseline bar */}
              <text x={15} y={55} fill="#94a3b8" fontSize={9}>Gốc</text>
              <rect x={80} y={40} width={420} height={22} rx={4} fill="#ef4444" opacity={0.3} />
              <text x={505} y={55} fill="#ef4444" fontSize={10} fontWeight="bold">
                ${baseline.monthly.toLocaleString()}
              </text>

              {/* Current bar */}
              <text x={15} y={85} fill="#94a3b8" fontSize={9}>Hiện tại</text>
              <rect x={80} y={70} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={80} y={70} width={Math.max(10, 420 * (current.monthly / baseline.monthly))} height={22} rx={4} fill="#22c55e" />
              <text x={85 + 420 * (current.monthly / baseline.monthly)} y={85} fill="white" fontSize={10} fontWeight="bold">
                ${current.monthly.toLocaleString()}
              </text>

              {/* Saving indicator */}
              <text x={300} y={120} textAnchor="middle" fill="#22c55e" fontSize={16} fontWeight="bold">
                Tiết kiệm {saving}% = ${(baseline.monthly - current.monthly).toLocaleString()}/tháng
              </text>

              {/* Cost breakdown */}
              <text x={300} y={150} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                {SCENARIOS[activeScenario].cachingRate > 0 ? `Caching: ${SCENARIOS[activeScenario].cachingRate * 100}% hit rate` : ""}{" "}
                {SCENARIOS[activeScenario].routingSmallPct > 0 ? `| Routing: ${SCENARIOS[activeScenario].routingSmallPct * 100}% dùng model nhỏ` : ""}
              </text>
              <text x={300} y={170} textAnchor="middle" fill="#64748b" fontSize={9}>
                100K requests/ngày | Model lớn: $0.03/req | Model nhỏ: $0.001/req
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Giống nhà hàng thông minh: <strong>mì gói thì nhân viên mới nấu</strong>{" "}(model nhỏ),{" "}
            <strong>beefsteak mới cần đầu bếp 5 sao</strong>{" "}(model lớn),{" "}
            <strong>khách quen gọi món cũ thì mang từ cache ra</strong>.
            Không phải mọi request đều cần GPT-4 — <strong>70% chỉ cần Llama-8B!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn tự host Llama-70B trên 2 GPU A100 ($3/giờ). Model xử lý 500 req/s. Chi phí per request? So sánh với GPT-4 API ($0.03/req)."
          options={[
            "Self-host: $0.002/req — rẻ hơn 15x so với GPT-4 API",
            "Self-host: $0.01/req — rẻ hơn 3x",
            "Giống nhau vì model cùng kích thước",
          ]}
          correct={0}
          explanation="$3/giờ / 3600s = $0.00083/s. Với 500 req/s: $0.00083/500 = $0.0000017/req. Nhưng cần tính thêm overhead (DevOps, monitoring, idle time): thực tế ~$0.002/req. Vẫn rẻ hơn API 15x! Trade-off: cần team vận hành."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tối ưu chi phí AI</strong>{" "}
            là chiến lược giảm chi phí vận hành hệ thống AI (GPU, API, bandwidth) mà vẫn duy trì chất lượng dịch vụ.
          </p>

          <p><strong>Công thức chi phí tổng:</strong></p>
          <LaTeX block>{"\\text{Cost}_{\\text{total}} = \\underbrace{N_{\\text{req}} \\times C_{\\text{per\\_req}}}_{\\text{Inference}} + \\underbrace{N_{\\text{GPU}} \\times T \\times P_{\\text{GPU}}}_{\\text{Infrastructure}} + \\underbrace{C_{\\text{ops}}}_{\\text{Operations}}"}</LaTeX>

          <p><strong>5 chiến lược chính:</strong></p>

          <p><strong>1. Model Routing</strong>{" "}— classifier quyết định model nào xử lý:</p>
          <LaTeX block>{"\\text{Cost}_{\\text{routed}} = p_{\\text{simple}} \\times C_{\\text{small}} + (1 - p_{\\text{simple}}) \\times C_{\\text{large}}"}</LaTeX>

          <p><strong>2. Semantic Caching</strong>{" "}— cache theo ý nghĩa, không chỉ exact match:</p>
          <LaTeX block>{"\\text{Cost}_{\\text{cached}} = (1 - \\text{hit\\_rate}) \\times \\text{Cost}_{\\text{original}}"}</LaTeX>

          <Callout variant="tip" title="Cache hit rate">
            Exact match: 5-15% hit rate. Semantic (embedding similarity &gt; 0.95): 30-50%. Prompt prefix caching (vLLM): giảm 30-50% compute cho prompts có system message chung.
          </Callout>

          <p><strong>3. Quantization</strong>{" "}— giảm kích thước model, cần ít GPU hơn</p>
          <p><strong>4. Auto-scaling</strong>{" "}— scale-to-zero khi không có traffic</p>
          <p><strong>5. Prompt optimization</strong>{" "}— mỗi token đều có giá</p>

          <LaTeX block>{"\\text{Prompt cost} = \\frac{\\text{input\\_tokens} \\times P_{\\text{input}} + \\text{output\\_tokens} \\times P_{\\text{output}}}{1000}"}</LaTeX>

          <CodeBlock language="python" title="Model router + semantic caching">
{`from litellm import Router
import numpy as np

# Model routing: phân loại độ phức tạp
router_config = {
    "model_list": [
        {"model_name": "simple", "litellm_params": {
            "model": "ollama/llama3-8b",  # $0.001/req tự host
        }},
        {"model_name": "complex", "litellm_params": {
            "model": "gpt-4o",  # $0.03/req API
        }},
    ],
    "routing_strategy": "cost-based",
}

router = Router(**router_config)

# Semantic cache với embedding similarity
from redis import Redis
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")
cache = Redis(host="localhost")

def get_cached_or_call(query: str, threshold=0.95):
    emb = embedder.encode(query)

    # Tìm cache entry tương tự
    cached = cache.get(f"emb:{hash(query)}")
    if cached:
        similarity = np.dot(emb, cached["embedding"])
        if similarity > threshold:
            return cached["response"]  # Cache HIT - miễn phí!

    # Cache MISS - gọi model
    complexity = classify_complexity(query)
    model = "simple" if complexity < 0.5 else "complex"
    response = router.completion(model=model, messages=[...])

    # Lưu cache
    cache.set(f"emb:{hash(query)}", {
        "embedding": emb, "response": response
    }, ex=3600)  # TTL 1 giờ
    return response`}
          </CodeBlock>

          <Callout variant="info" title="Chi phí AI tại Việt Nam">
            Startup Việt có budget giới hạn. Pattern phổ biến: self-host model nhỏ (Llama/Qwen) trên FPT Cloud cho 80% request, fallback GPT-4 cho 20% phức tạp. Kết hợp caching → giảm từ $50K xuống $5K/tháng.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Model routing: 70% request đơn giản dùng model nhỏ ($0.001), 30% phức tạp dùng model lớn ($0.03).",
          "Semantic caching: cache theo ý nghĩa (embedding similarity > 0.95) tăng hit rate từ 10% lên 40%+.",
          "Self-host Llama trên FPT Cloud rẻ hơn 10-15x so với GPT-4 API cho high-volume use cases.",
          "Auto-scaling + scale-to-zero tiết kiệm 50% cho traffic không đều (thấp ban đêm, cao ban ngày).",
          "Kết hợp tất cả chiến lược giảm 70-90% chi phí AI mà chất lượng giảm không đáng kể.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
