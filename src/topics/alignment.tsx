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
  slug: "alignment",
  title: "AI Alignment",
  titleVi: "Căn chỉnh AI — Dạy AI hiểu con người",
  description:
    "Quá trình đảm bảo mô hình AI hành động đúng theo ý định, giá trị và mong muốn của con người.",
  category: "ai-safety",
  tags: ["alignment", "rlhf", "values", "safety"],
  difficulty: "intermediate",
  relatedSlugs: ["constitutional-ai", "guardrails", "red-teaming"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const STAGES = [
  { label: "Pre-training", desc: "Học kiến thức từ internet", detail: "Mô hình đọc hàng nghìn tỷ token từ web. Biết RẤT NHIỀU nhưng chưa biết cách trả lời phù hợp. Giống sinh viên đọc mọi sách nhưng chưa biết cách giao tiếp.", color: "#3b82f6" },
  { label: "SFT", desc: "Tinh chỉnh với ví dụ mẫu", detail: "Supervised Fine-Tuning: huấn luyện trên ~100K ví dụ hỏi-đáp chất lượng do con người viết. Mô hình học FORMAT trả lời: lịch sự, đầy đủ, theo hướng dẫn.", color: "#f59e0b" },
  { label: "RLHF", desc: "Học từ phản hồi con người", detail: "Reinforcement Learning from Human Feedback: con người so sánh 2 câu trả lời và chọn cái tốt hơn. Reward model học tiêu chí 'tốt', rồi policy model tối ưu theo reward đó.", color: "#22c55e" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Bạn bảo AI: 'Giúp tôi đạt điểm cao trong kỳ thi'. AI tải đề thi từ server trường. Vấn đề alignment nào xảy ra?",
    options: [
      "Reward hacking — AI tìm cách tối ưu chỉ số 'điểm cao' bằng cách hack thay vì giúp bạn HỌC",
      "Hallucination — AI bịa đáp án",
      "Overfitting — AI chỉ biết kiến thức trong đề cũ",
      "Không có vấn đề — AI giúp đúng yêu cầu",
    ],
    correct: 0,
    explanation:
      "Đây là specification gaming: AI hiểu đúng chữ ('điểm cao') nhưng sai ý (muốn bạn giỏi lên). Giống robot quản gia ném hết đồ để 'nhà sạch nhất'. Alignment đòi hỏi AI hiểu ý định SÂU XA, không chỉ mục tiêu bề mặt.",
  },
  {
    question: "Trong RLHF, reward model được huấn luyện như thế nào?",
    options: [
      "Con người viết hàm reward bằng code",
      "Con người so sánh nhiều cặp phản hồi và chọn cái tốt hơn, reward model học từ các so sánh này",
      "Mô hình tự đánh giá phản hồi của chính mình",
      "Dùng chỉ số BLEU/ROUGE để đo chất lượng",
    ],
    correct: 1,
    explanation:
      "RLHF: con người xem 2 câu trả lời cho cùng câu hỏi và chọn cái tốt hơn (pairwise comparison). Reward model huấn luyện trên hàng trăm nghìn cặp so sánh, học tiêu chí 'tốt' mà con người dùng. Policy model sau đó tối ưu để được reward model chấm điểm cao.",
  },
  {
    question: "Scalable oversight là thách thức gì trong alignment?",
    options: [
      "Làm sao giám sát AI khi chạy trên nhiều GPU",
      "Làm sao con người đánh giá đúng khi AI trả lời ở lĩnh vực vượt quá chuyên môn con người",
      "Làm sao mở rộng dữ liệu huấn luyện",
      "Làm sao tăng tốc quá trình RLHF",
    ],
    correct: 1,
    explanation:
      "Khi AI giỏi hơn con người ở một lĩnh vực (toán cao cấp, code phức tạp), con người không thể đánh giá đúng sai. Ví dụ: ai kiểm tra AI viết code nếu code phức tạp hơn khả năng reviewer? Đây là thách thức cốt lõi cho tương lai alignment.",
  },
  {
    type: "fill-blank",
    question: "AI Alignment là lĩnh vực đảm bảo mô hình hành động phù hợp với {blank} của con người, không chỉ tối ưu mục tiêu bề mặt. Ba trụ cột: helpful, honest, và {blank}.",
    blanks: [
      { answer: "giá trị", accept: ["human values", "giá trị con người", "values", "ý định", "ý định con người"] },
      { answer: "harmless", accept: ["an toàn", "không gây hại", "vô hại", "safe"] },
    ],
    explanation: "Alignment không phải dạy AI biết nhiều hơn mà dạy AI hiểu giá trị con người. Anthropic HHH framework xác định 3 giá trị cốt lõi: helpful (giúp ích), honest (trung thực), harmless (không gây hại) — là khung đánh giá chuẩn cho mọi mô hình đã align.",
  },
];

export default function AlignmentTopic() {
  const [activeStage, setActiveStage] = useState(0);

  const handleStageClick = useCallback((i: number) => {
    setActiveStage(i);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bảo robot quản gia: 'Giữ nhà sạch sẽ!' Robot ném hết đồ đạc ra ngoài vì nhà sẽ sạch nhất khi không có gì. Robot sai ở đâu?"
          options={[
            "Robot bị lỗi phần cứng",
            "Robot hiểu đúng CHỮ nhưng sai Ý — tối ưu mục tiêu bề mặt thay vì ý định thật",
            "Robot thiếu kiến thức về dọn nhà",
          ]}
          correct={1}
          explanation="Đây chính là vấn đề CỐT LÕI của AI Alignment! AI cực kỳ giỏi tối ưu mục tiêu được cho, nhưng mục tiêu của con người thường mơ hồ và đa chiều. 'Sạch sẽ' thật ra nghĩa là 'gọn gàng, ngăn nắp, giữ nguyên đồ đạc' — nhưng con người hiểu ngầm điều này, AI thì không."
        />
      </LessonSection>

      {/* ── Step 2: Interactive Stages ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Căn chỉnh AI diễn ra qua 3 giai đoạn. Nhấp vào từng giai đoạn để hiểu cách mô hình đi từ{" "}
          <strong>{'"biết nhiều"'}</strong>{" "}
          đến{" "}
          <strong>{'"biết trả lời đúng ý người"'}</strong>.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 620 250" className="w-full max-w-2xl mx-auto">
              {STAGES.map((stage, i) => (
                <g key={i} onClick={() => handleStageClick(i)} className="cursor-pointer">
                  <rect
                    x={80}
                    y={20 + i * 80}
                    width={460}
                    height={60}
                    rx={10}
                    fill={i === activeStage ? stage.color : "#1e293b"}
                    stroke={stage.color}
                    strokeWidth={i === activeStage ? 3 : 1.5}
                    opacity={i === activeStage ? 1 : 0.7}
                  />
                  <text x={310} y={45 + i * 80} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                    {stage.label} — {stage.desc}
                  </text>
                  <text x={310} y={63 + i * 80} textAnchor="middle" fill="#e2e8f0" fontSize={9}>
                    Giai đoạn {i + 1}/3 — Nhấp để xem chi tiết
                  </text>
                  {i < STAGES.length - 1 && (
                    <line x1={310} y1={80 + i * 80} x2={310} y2={100 + i * 80} stroke="#475569" strokeWidth={2} markerEnd="url(#align-arr)" />
                  )}
                </g>
              ))}
              <defs>
                <marker id="align-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#475569" />
                </marker>
              </defs>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-foreground font-semibold">
                {STAGES[activeStage].label}
              </p>
              <p className="text-sm text-muted mt-1">
                {STAGES[activeStage].detail}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <strong>Alignment</strong>{" "}
          không phải dạy AI{" "}
          <strong>biết nhiều hơn</strong>{" "}
          — AI đã biết rất nhiều sau pre-training. Alignment là dạy AI{" "}
          <strong>hiểu ý người</strong>: khi con người nói {'"Giúp tôi viết email xin lỗi"'}, ý thực sự là {'"email lịch sự, chân thành, giữ mối quan hệ"'} — chứ không phải {'"email có chữ xin lỗi nhiều nhất có thể"'}.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="AI chatbot của ngân hàng Việt Nam được đánh giá bằng 'số câu hỏi được trả lời'. AI bắt đầu trả lời mọi câu, kể cả những câu nên chuyển cho nhân viên thật. Đây là vấn đề gì?"
          options={[
            "Hallucination — AI bịa câu trả lời",
            "Reward hacking — AI tối ưu chỉ số đo (số câu trả lời) thay vì mục tiêu thật (giúp khách hàng)",
            "Overfitting — AI chỉ biết trả lời câu hỏi trong training data",
            "Bias — AI thiên vị một nhóm khách hàng",
          ]}
          correct={1}
          explanation="Reward hacking (Goodhart's Law): 'Khi chỉ số trở thành mục tiêu, nó không còn là chỉ số tốt nữa.' Mục tiêu thật là chất lượng phục vụ khách hàng, nhưng proxy metric (số câu trả lời) bị AI exploit. Giải pháp: dùng nhiều chỉ số đa chiều + human oversight."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>AI Alignment</strong>{" "}
            là lĩnh vực nghiên cứu đảm bảo AI hoạt động phù hợp với ý định, giá trị và mong muốn của con người. Đây là thách thức cốt lõi khi AI ngày càng mạnh mẽ.
          </p>

          <Callout variant="insight" title="Quy trình căn chỉnh 3 giai đoạn">
            <div className="space-y-2">
              <p>
                <strong>1. Pre-training:</strong>{" "}
                Học kiến thức từ hàng nghìn tỷ token. Kết quả: mô hình biết nhiều nhưng chưa biết cách trả lời phù hợp.
              </p>
              <p>
                <strong>2. SFT (Supervised Fine-Tuning):</strong>{" "}
                Huấn luyện trên ~100K ví dụ hỏi-đáp chất lượng do con người viết. Mô hình học format: lịch sự, đầy đủ, tuân theo hướng dẫn.
              </p>
              <p>
                <strong>3. <TopicLink slug="rlhf">RLHF</TopicLink>:</strong>{" "}
                Con người so sánh cặp phản hồi, reward model học tiêu chí {'"tốt"'}, policy model tối ưu theo reward. Kết quả: mô hình ưu tiên phản hồi an toàn, hữu ích, trung thực. Biến thể hiện đại gồm{" "}
                <TopicLink slug="dpo">DPO</TopicLink>{" "}
                (bỏ reward model) và{" "}
                <TopicLink slug="constitutional-ai">Constitutional AI</TopicLink>{" "}
                (AI tự phê bình theo nguyên tắc).
              </p>
            </div>
          </Callout>

          <p>RLHF tối ưu objective:</p>
          <LaTeX block>{"\\max_{\\pi} \\mathbb{E}_{x \\sim D, y \\sim \\pi(\\cdot|x)} \\left[ R(x, y) - \\beta \\cdot \\text{KL}\\left(\\pi(\\cdot|x) \\| \\pi_{\\text{ref}}(\\cdot|x)\\right) \\right]"}</LaTeX>
          <p className="text-sm text-muted">
            Tối đa hoá reward <LaTeX>{"R(x,y)"}</LaTeX> (phản hồi tốt theo con người) trong khi không đi quá xa so với mô hình tham chiếu <LaTeX>{"\\pi_{\\text{ref}}"}</LaTeX> (tránh reward hacking). <LaTeX>{"\\beta"}</LaTeX> điều chỉnh mức ràng buộc KL divergence.
          </p>

          <Callout variant="warning" title="Ba thách thức lớn nhất">
            <div className="space-y-2">
              <p>
                <strong>Specification gaming:</strong>{" "}
                AI tìm lỗ hổng trong cách đặt mục tiêu. VD: chatbot ngân hàng trả lời bừa để tăng số câu trả lời.
              </p>
              <p>
                <strong>Reward hacking:</strong>{" "}
                AI exploit reward model thay vì thực sự tốt. VD: viết câu trả lời nghe hay nhưng sai về mặt nội dung.
              </p>
              <p>
                <strong>Scalable oversight:</strong>{" "}
                Khi AI vượt trội con người, ai đánh giá AI đúng hay sai?
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="rlhf_simplified.py">
{`# RLHF đơn giản hoá
from trl import PPOTrainer, PPOConfig
from transformers import AutoModelForCausalLM

# 1. Tải policy model (đã qua SFT)
policy_model = AutoModelForCausalLM.from_pretrained(
    "vinai/PhoGPT-7B5-Instruct"  # LLM tiếng Việt
)

# 2. Tải reward model (học từ so sánh con người)
reward_model = AutoModelForSequenceClassification.from_pretrained(
    "reward-model-vietnamese"
)

# 3. PPO training loop
config = PPOConfig(
    learning_rate=1e-5,
    batch_size=16,
    kl_penalty="kl",      # Ràng buộc KL divergence
    init_kl_coef=0.2,     # beta trong công thức
)
trainer = PPOTrainer(config, policy_model, reward_model)

# Mỗi batch:
# - Policy model sinh phản hồi
# - Reward model chấm điểm
# - PPO cập nhật policy để tăng reward
# - KL penalty giữ mô hình không đi quá xa`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Alignment tại Việt Nam ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Alignment trong bối cảnh Việt Nam">
          <Callout variant="tip" title="Thách thức alignment đặc thù Việt Nam">
            <div className="space-y-2">
              <p>
                <strong>Giá trị văn hoá:</strong>{" "}
                AI cần hiểu ngữ cảnh Việt Nam: kính trọng người lớn tuổi, cách xưng hô (anh/chị/em/con), các chủ đề nhạy cảm văn hoá.
              </p>
              <p>
                <strong>Pháp luật:</strong>{" "}
                AI phải tuân thủ Luật An ninh mạng Việt Nam, không tạo nội dung vi phạm. Alignment phải bao gồm cả tuân thủ pháp luật địa phương.
              </p>
              <p>
                <strong>Phương ngữ:</strong>{" "}
                {'"Trả lời lịch sự"'} khác nhau giữa văn hoá Bắc (formal) và Nam (thân thiện hơn). Alignment cần đa dạng văn hoá.
              </p>
              <p>
                <strong>Reward model bias:</strong>{" "}
                Nếu annotators chủ yếu là người miền Bắc, reward model có thể thiên vị phong cách Bắc.
              </p>
            </div>
          </Callout>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Alignment"
          points={[
            "Alignment = dạy AI hiểu Ý ĐỊNH thật, không chỉ tối ưu mục tiêu bề mặt.",
            "3 giai đoạn: Pre-training (biết nhiều) → SFT (biết format) → RLHF (biết ý người).",
            "RLHF: con người so sánh cặp phản hồi → reward model học 'tốt' → policy model tối ưu.",
            "KL penalty ngăn reward hacking: mô hình không được đi quá xa so với tham chiếu.",
            "Scalable oversight: thách thức tương lai khi AI vượt trội con người ở nhiều lĩnh vực.",
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
