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
  slug: "bias-fairness",
  title: "Bias & Fairness",
  titleVi: "Thiên kiến & Công bằng trong AI",
  description:
    "Nhận diện và giảm thiểu các thiên kiến trong dữ liệu và mô hình AI để đảm bảo kết quả công bằng cho mọi nhóm.",
  category: "ai-safety",
  tags: ["bias", "fairness", "ethics", "discrimination"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "explainability", "ai-governance"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const BIAS_TYPES = [
  { id: "data", label: "Thiên kiến dữ liệu", desc: "Dữ liệu huấn luyện không đại diện đủ các nhóm. VD: hệ thống nhận dạng khuôn mặt huấn luyện chủ yếu trên người châu Âu.", pct: [72, 18, 10], groups: ["Nhóm đa số", "Nhóm thiểu số A", "Nhóm thiểu số B"] },
  { id: "label", label: "Thiên kiến gán nhãn", desc: "Annotator mang định kiến khi gán nhãn. VD: mô tả ảnh phụ nữ luôn gắn với nấu ăn, đàn ông gắn với công nghệ.", pct: [85, 10, 5], groups: ["Stereotype", "Trung lập", "Phản stereotype"] },
  { id: "representation", label: "Thiên kiến đại diện", desc: "Mô hình ngôn ngữ phản ánh bias xã hội trong dữ liệu. VD: 'bác sĩ' liên tưởng nam, 'y tá' liên tưởng nữ.", pct: [65, 25, 10], groups: ["Kết quả thiên vị", "Kết quả trung lập", "Kết quả ngược"] },
];

const GROUP_COLORS = ["#3b82f6", "#22c55e", "#f59e0b"];

const QUIZ: QuizQuestion[] = [
  {
    question: "Hệ thống AI tuyển dụng tại Việt Nam từ chối hồ sơ từ miền Trung nhiều hơn miền Bắc/Nam. Nguyên nhân có thể là gì?",
    options: [
      "Ứng viên miền Trung yếu hơn",
      "Dữ liệu huấn luyện chứa ít hồ sơ thành công từ miền Trung, nên mô hình 'học' rằng miền Trung ít phù hợp (data bias)",
      "AI có ý thức phân biệt vùng miền",
      "Lỗi kỹ thuật trong hệ thống",
    ],
    correct: 1,
    explanation:
      "Data bias: nếu dữ liệu huấn luyện chủ yếu chứa hồ sơ từ Hà Nội và TP.HCM (vì tuyển dụng tập trung ở đó), mô hình sẽ 'học' pattern 'miền Trung = ít thành công'. Bias không cần AI có ý thức — nó tự động phản ánh sự mất cân bằng trong dữ liệu.",
  },
  {
    question: "Demographic parity yêu cầu gì?",
    options: [
      "Tất cả nhóm có accuracy bằng nhau",
      "Tỷ lệ kết quả tích cực (VD: được duyệt vay) phải bằng nhau giữa các nhóm nhân khẩu học",
      "Mô hình không được biết thông tin nhân khẩu học",
      "Mỗi nhóm có số lượng bằng nhau trong dữ liệu",
    ],
    correct: 1,
    explanation:
      "Demographic parity: P(Y_hat=1 | A=0) = P(Y_hat=1 | A=1). VD: tỷ lệ được duyệt vay phải bằng nhau giữa nam và nữ. Tuy nhiên, tiêu chí này có hạn chế: nếu hai nhóm thực sự có rủi ro tín dụng khác nhau, demographic parity có thể dẫn đến quyết định tài chính sai.",
  },
  {
    question: "Bạn phát hiện AI chatbot dùng ngôn ngữ formal hơn khi trả lời người dùng tên 'Nguyễn Văn A' nhưng casual hơn với 'John Smith'. Đây là loại bias nào?",
    options: [
      "Selection bias — chọn dữ liệu không đại diện",
      "Representation bias — mô hình học rằng tên Việt = formal, tên Anh = casual từ dữ liệu training",
      "Measurement bias — đo lường sai",
      "Không phải bias — đây là hành vi phù hợp văn hoá",
    ],
    correct: 1,
    explanation:
      "Đây là representation bias: mô hình học association giữa tên (proxy cho ethnicity) và phong cách ngôn ngữ từ dữ liệu training. Dù có thể vô tình phù hợp văn hoá, việc phân biệt đối xử dựa trên tên vẫn là bias cần kiểm soát.",
  },
  {
    type: "fill-blank",
    question: "Bias trong AI thường bắt nguồn từ {blank} không cân bằng, sau đó mô hình khuếch đại và gây ra {blank} với các nhóm yếu thế.",
    blanks: [
      { answer: "dữ liệu huấn luyện", accept: ["training data", "dữ liệu", "dữ liệu training", "data"] },
      { answer: "phân biệt đối xử", accept: ["discrimination", "phân biệt", "bất công"] },
    ],
    explanation: "Chuỗi phổ biến: dữ liệu huấn luyện phản ánh bias xã hội (ví dụ ít hồ sơ thành công từ một nhóm) → mô hình học bias đó → triển khai ở quy mô lớn → phân biệt đối xử hệ thống. Kiểm soát cần bắt đầu từ audit dữ liệu.",
  },
];

export default function BiasFairnessTopic() {
  const [activeBias, setActiveBias] = useState("data");
  const bias = BIAS_TYPES.find((b) => b.id === activeBias)!;

  const handleBiasChange = useCallback((id: string) => {
    setActiveBias(id);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Hệ thống nhận dạng giọng nói được huấn luyện chủ yếu trên giọng Bắc. Khi người miền Nam dùng, điều gì xảy ra?"
          options={[
            "Hoạt động bình thường vì tiếng Việt là tiếng Việt",
            "Tỷ lệ lỗi cao hơn đáng kể vì mô hình chưa 'nghe' đủ giọng Nam — bias từ dữ liệu huấn luyện",
            "Từ chối nhận dạng vì phát hiện giọng khác",
          ]}
          correct={1}
          explanation="Đúng! Đây là ví dụ kinh điển của data bias tại Việt Nam. Mô hình huấn luyện chủ yếu trên giọng Bắc sẽ có WER (Word Error Rate) cho giọng Nam cao hơn 2-3 lần. Người miền Nam phải nói 'giọng Bắc' để được nhận dạng đúng — đây là bất công về mặt công nghệ!"
        />
      </LessonSection>

      {/* ── Step 2: Interactive Bias Explorer ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Chọn loại thiên kiến để xem cách nó biểu hiện trong dữ liệu. Thanh biểu đồ cho thấy sự mất cân bằng giữa các nhóm.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {BIAS_TYPES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBiasChange(b.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeBias === b.id
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 620 200" className="w-full max-w-2xl mx-auto">
              <text x={310} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
                Phân bổ dữ liệu theo nhóm
              </text>
              {bias.groups.map((g, i) => {
                const y = 35 + i * 50;
                const w = bias.pct[i] * 4.2;
                return (
                  <g key={i}>
                    <text x={20} y={y + 22} fill="#94a3b8" fontSize={10}>{g}</text>
                    <rect x={160} y={y + 5} width={420} height={28} rx={4} fill="#1e293b" />
                    <rect x={160} y={y + 5} width={w} height={28} rx={4} fill={GROUP_COLORS[i]} />
                    <text x={165 + w + 8} y={y + 25} fill="white" fontSize={11} fontWeight="bold">
                      {bias.pct[i]}%
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground">{bias.desc}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          AI không{" "}
          <strong>tạo ra</strong>{" "}
          thiên kiến — nó{" "}
          <strong>phản ánh và khuếch đại</strong>{" "}
          thiên kiến đã tồn tại trong dữ liệu và xã hội. Nếu 80% dữ liệu tuyển dụng là nam, AI sẽ {'"học"'} rằng nam phù hợp hơn. Không phải AI xấu — mà là{" "}
          <strong>dữ liệu chứa bias xã hội</strong>, và AI khuếch đại nó lên quy mô triệu người.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Chatbot y tế AI khuyên 'Anh nên đi khám tim mạch' cho triệu chứng đau ngực ở nam, nhưng khuyên 'Chị nên nghỉ ngơi, có thể do stress' cho triệu chứng tương tự ở nữ. Bias nào đang hoạt động?"
          options={[
            "Mô hình đúng vì nam có nguy cơ tim mạch cao hơn",
            "Data bias: dữ liệu y khoa lịch sử thiên về nghiên cứu nam giới, nên AI 'học' rằng đau ngực ở nữ ít nghiêm trọng hơn",
            "Lỗi kỹ thuật trong mô hình",
            "AI đang cá nhân hoá theo giới tính — tốt chứ không phải bias",
          ]}
          correct={1}
          explanation="Đây là data bias nghiêm trọng trong y tế: lịch sử y khoa tập trung nghiên cứu trên nam giới, nên AI 'học' rằng triệu chứng tim mạch ở nữ ít nghiêm trọng. Thực tế, phụ nữ thường có triệu chứng tim mạch khác nam và bị chẩn đoán muộn hơn. AI khuếch đại bias này lên quy mô triệu bệnh nhân."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Thiên kiến (Bias)</strong>{" "}
            trong AI xảy ra khi mô hình tạo ra kết quả không công bằng cho một nhóm người. Bias có thể xuất phát từ dữ liệu, thuật toán, hoặc cách đánh giá — và thường được kiểm soát qua khung{" "}
            <TopicLink slug="ai-governance">AI governance</TopicLink>.
          </p>

          <Callout variant="insight" title="Chuỗi bias từ dữ liệu đến quyết định">
            <div className="space-y-2">
              <p>
                <strong>1. Data bias:</strong>{" "}
                Dữ liệu không đại diện (ít mẫu giọng miền Trung) hoặc phản ánh bias xã hội (70% CEO trong ảnh là nam).
              </p>
              <p>
                <strong>2. Algorithmic bias:</strong>{" "}
                Hàm mục tiêu ưu tiên accuracy tổng → hy sinh accuracy nhóm thiểu số. 95% accuracy tổng nhưng 70% cho nhóm nhỏ.
              </p>
              <p>
                <strong>3. Evaluation bias:</strong>{" "}
                Chỉ đo performance trung bình, không phân tích theo từng nhóm nhân khẩu.
              </p>
              <p>
                <strong>4. Deployment bias:</strong>{" "}
                Sản phẩm triển khai trong bối cảnh khác huấn luyện (train ở Mỹ, deploy ở Việt Nam).
              </p>
            </div>
          </Callout>

          <p>Các chỉ số công bằng phổ biến:</p>
          <LaTeX block>{"\\text{Demographic Parity: } P(\\hat{Y}=1 | A=0) = P(\\hat{Y}=1 | A=1)"}</LaTeX>
          <LaTeX block>{"\\text{Equalized Odds: } P(\\hat{Y}=1 | Y=y, A=0) = P(\\hat{Y}=1 | Y=y, A=1), \\forall y"}</LaTeX>
          <p className="text-sm text-muted">
            Demographic Parity đòi hỏi tỷ lệ kết quả tích cực bằng nhau giữa các nhóm. Equalized Odds đòi hỏi true positive rate VÀ false positive rate bằng nhau — nghiêm ngặt hơn.
          </p>

          <CodeBlock language="python" title="fairness_audit.py">
{`from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference,
    MetricFrame,
)
from sklearn.metrics import accuracy_score

# Ví dụ: kiểm toán AI tuyển dụng ở Việt Nam
y_true = [...]     # Kết quả thực tế (0/1)
y_pred = [...]     # Dự đoán của AI
region = [...]     # Vùng miền: "Bắc", "Trung", "Nam"

# Tính accuracy theo vùng miền
mf = MetricFrame(
    metrics=accuracy_score,
    y_true=y_true,
    y_pred=y_pred,
    sensitive_features=region,
)
print(mf.by_group)
# Bắc: 92%, Trung: 78%, Nam: 88%
# → AI kém hơn đáng kể cho miền Trung!

# Đo demographic parity
dp_diff = demographic_parity_difference(
    y_true, y_pred, sensitive_features=region
)
print(f"Demographic Parity Gap: {dp_diff:.3f}")
# Nếu > 0.1 → cần can thiệp`}
          </CodeBlock>

          <Callout variant="warning" title="Bias đặc thù Việt Nam">
            <div className="space-y-1">
              <p><strong>Phương ngữ:</strong>{" "} ASR có WER ~12% cho giọng Bắc nhưng ~25% cho giọng miền Trung.</p>
              <p><strong>Giới tính:</strong>{" "} AI tạo ảnh VN thường gắn phụ nữ với áo dài/nấu ăn, đàn ông với công nghệ/kinh doanh.</p>
              <p><strong>Vùng miền:</strong>{" "} AI tuyển dụng thiên vị ứng viên TP.HCM/Hà Nội do dữ liệu tập trung.</p>
              <p><strong>Kinh tế:</strong>{" "} AI tín dụng thiên vị người thành thị có digital footprint, bất lợi cho nông thôn.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Giải pháp ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải pháp">
        <ExplanationSection>
          <Callout variant="tip" title="Giảm thiểu bias: framework 4 bước">
            <div className="space-y-2">
              <p><strong>1. Đo lường:</strong>{" "} Kiểm toán fairness trên TẤT CẢ nhóm nhân khẩu. Dùng fairlearn, AIF360. Kết hợp với <TopicLink slug="explainability">explainability</TopicLink>{" "}(SHAP, LIME) để hiểu quyết định.</p>
              <p><strong>2. Cân bằng dữ liệu:</strong>{" "} Thu thập thêm dữ liệu nhóm thiểu số, dùng oversampling/augmentation.</p>
              <p><strong>3. Ràng buộc trong training:</strong>{" "} Thêm fairness constraints vào loss function (adversarial debiasing).</p>
              <p><strong>4. Post-processing:</strong>{" "} Điều chỉnh threshold riêng cho từng nhóm để đạt equalized odds.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Bias & Fairness"
          points={[
            "AI không tạo bias — nó PHẢN ÁNH và KHUẾCH ĐẠI bias trong dữ liệu và xã hội lên quy mô triệu người.",
            "4 nguồn bias: data (mất cân bằng), algorithm (tối ưu sai), evaluation (đo sai), deployment (ngữ cảnh khác).",
            "Demographic parity và equalized odds là hai chỉ số fairness phổ biến nhất.",
            "Bias đặc thù VN: phương ngữ Bắc/Trung/Nam, giới tính trong mô tả ảnh, vùng miền trong tuyển dụng.",
            "Framework 4 bước: đo lường → cân bằng dữ liệu → ràng buộc training → post-processing.",
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
