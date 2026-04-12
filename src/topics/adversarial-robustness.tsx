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
  slug: "adversarial-robustness",
  title: "Adversarial Robustness",
  titleVi: "Bền vững trước tấn công — AI không dễ bị lừa",
  description:
    "Khả năng của mô hình AI duy trì hiệu suất chính xác khi đối mặt với dữ liệu đầu vào bị thao túng có chủ đích.",
  category: "ai-safety",
  tags: ["adversarial", "robustness", "attack", "defense"],
  difficulty: "advanced",
  relatedSlugs: ["red-teaming", "guardrails", "alignment"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const SCENARIOS = [
  { label: "Ảnh gốc", perturbation: 0, prediction: "Mèo (99%)", correct: true, detail: "Mô hình nhận dạng chính xác — chưa có tấn công." },
  { label: "Nhiễu epsilon = 0.01", perturbation: 1, prediction: "Mèo (87%)", correct: true, detail: "Nhiễu rất nhỏ, mắt người không thấy khác biệt. Mô hình vẫn đúng nhưng confidence giảm." },
  { label: "Nhiễu epsilon = 0.05", perturbation: 5, prediction: "Chó (62%)", correct: false, detail: "Nhiễu vẫn không thể nhìn thấy! Nhưng mô hình đã bị lừa hoàn toàn — nhận mèo thành chó." },
  { label: "Nhiễu epsilon = 0.1", perturbation: 10, prediction: "Máy bay (78%)", correct: false, detail: "Ảnh gần như giống hệt gốc nhưng AI tự tin 78% đây là máy bay. Điều này nguy hiểm cho xe tự lái!" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "FGSM (Fast Gradient Sign Method) tạo nhiễu đối kháng bằng cách nào?",
    options: [
      "Thêm nhiễu ngẫu nhiên vào ảnh",
      "Tính gradient của loss theo input, rồi thêm nhiễu theo HƯỚNG tăng loss nhiều nhất",
      "Thay đổi từng pixel một cho đến khi mô hình sai",
      "Xoay hoặc cắt ảnh",
    ],
    correct: 1,
    explanation:
      "FGSM dùng gradient ĐỐI VỚI INPUT (không phải weights). Gradient chỉ ra hướng thay đổi input khiến loss tăng nhiều nhất → thêm nhiễu nhỏ epsilon theo hướng đó. Chỉ cần MỘT bước forward + backward = tấn công cực nhanh.",
  },
  {
    question: "Camera an ninh tại sân bay Nội Bài dùng AI nhận dạng khuôn mặt. Kẻ xấu đeo kính có hoạ tiết đặc biệt khiến AI không nhận ra. Đây là loại tấn công gì?",
    options: [
      "Jailbreak — lừa AI bằng prompt",
      "Physical adversarial attack — adversarial perturbation in vật lý (in trên kính, sticker lên biển báo)",
      "Prompt injection",
      "Data poisoning",
    ],
    correct: 1,
    explanation:
      "Đây là physical adversarial attack: adversarial perturbation được in ra vật thể thật (kính, áo, sticker). Nguy hiểm hơn digital attack vì hoạt động trong thế giới thực — ảnh hưởng xe tự lái, camera an ninh, nhận dạng khuôn mặt.",
  },
  {
    question: "Adversarial training (huấn luyện đối kháng) cải thiện robustness bằng cách nào?",
    options: [
      "Loại bỏ tất cả ảnh nhiễu khỏi training set",
      "Tạo adversarial examples và ĐƯA VÀO training set, buộc mô hình học cách nhận dạng đúng dù có nhiễu",
      "Tăng kích thước mô hình",
      "Dùng dropout nhiều hơn",
    ],
    correct: 1,
    explanation:
      "Adversarial training: mỗi batch, tạo adversarial examples bằng FGSM/PGD, rồi train mô hình trên CẢ ảnh gốc VÀ ảnh adversarial. Mô hình 'miễn dịch' dần với nhiễu đối kháng. Trade-off: accuracy trên dữ liệu sạch có thể giảm nhẹ.",
  },
  {
    type: "fill-blank",
    question: "Một {blank} example được tạo bằng cách thêm {blank} nhỏ (mắt thường không thấy) vào input theo hướng gradient của loss.",
    blanks: [
      { answer: "adversarial", accept: ["đối kháng"] },
      { answer: "perturbation", accept: ["nhiễu", "noise"] },
    ],
    explanation: "Adversarial example = input gốc cộng thêm perturbation nhỏ theo sign của gradient — đủ để lừa mô hình nhưng không thay đổi nhận thức của con người.",
  },
];

export default function AdversarialRobustnessTopic() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];
  const handleScenarioChange = useCallback((i: number) => { setScenarioIdx(i); }, []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn thêm nhiễu CỰC NHỎ (mắt người không thấy) vào ảnh con mèo. AI nhận dạng sẽ thế nào?"
          options={[
            "Vẫn nhận ra mèo — nhiễu nhỏ thì ảnh hưởng nhỏ",
            "CÓ THỂ nhận nhầm hoàn toàn thành vật khác — đây là adversarial attack, nhiễu nhỏ nhưng được thiết kế để lừa AI",
            "AI sẽ nói 'không biết' vì phát hiện nhiễu",
          ]}
          correct={1}
          explanation="Nghe khó tin nhưng đúng! Adversarial perturbation nhỏ đến mức mắt người KHÔNG THỂ phân biệt, nhưng được thiết kế theo gradient để đẩy dự đoán lệch HOÀN TOÀN. Ảnh con mèo có thể bị nhận thành máy bay, chó, hoặc bất cứ gì kẻ tấn công muốn!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Chọn mức nhiễu tăng dần. Quan sát: ảnh gần như không thay đổi với mắt người, nhưng dự đoán AI thay đổi hoàn toàn!
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s, i) => (
                <button key={i} type="button" onClick={() => handleScenarioChange(i)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${scenarioIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <svg viewBox="0 0 620 180" className="w-full max-w-2xl mx-auto">
              <rect x={40} y={20} width={120} height={110} rx={10} fill="#3b82f6" opacity={0.3} />
              <text x={100} y={70} textAnchor="middle" fill="white" fontSize={28}>&#128049;</text>
              {Array.from({ length: scenario.perturbation * 4 }).map((_, i) => (
                <circle key={i} cx={45 + (i * 37) % 110} cy={25 + (i * 23) % 100} r={2} fill="#ef4444" opacity={0.6} />
              ))}
              <text x={100} y={148} textAnchor="middle" fill="#94a3b8" fontSize={9}>{scenario.label}</text>
              <line x1={170} y1={75} x2={240} y2={75} stroke="#475569" strokeWidth={2} />
              <rect x={240} y={40} width={130} height={70} rx={10} fill="#1e293b" stroke="#475569" strokeWidth={2} />
              <text x={305} y={80} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">AI Model</text>
              <line x1={370} y1={75} x2={430} y2={75} stroke="#475569" strokeWidth={2} />
              <rect x={430} y={40} width={160} height={70} rx={10} fill={scenario.correct ? "#22c55e" : "#ef4444"} />
              <text x={510} y={70} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Dự đoán</text>
              <text x={510} y={90} textAnchor="middle" fill="white" fontSize={13} fontWeight="bold">{scenario.prediction}</text>
            </svg>
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground">{scenario.detail}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Adversarial attack không phải{" "}
          <strong>thêm nhiễu ngẫu nhiên</strong>{" "}
          — nó là{" "}
          <strong>nhiễu được thiết kế có mục đích</strong>{" "}
          dựa trên gradient. AI nhìn theo từng chiều trong không gian cả nghìn chiều — nhiễu nhỏ ở MỖI chiều cộng lại đủ để đẩy quyết định vượt qua ranh giới phân loại.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Xe tự lái dùng camera nhận dạng biển báo giao thông. Kẻ xấu dán sticker nhỏ lên biển 'DỪNG LẠI' khiến AI đọc thành 'Tốc độ 120km/h'. Hậu quả gì?"
          options={[
            "Xe chạy nhanh hơn một chút — không nguy hiểm",
            "Xe KHÔNG DỪNG tại nơi phải dừng — có thể gây tai nạn chết người. Physical adversarial attack cực kỳ nguy hiểm!",
            "Camera sẽ phát hiện sticker và cảnh báo",
            "Xe sẽ dùng GPS thay camera nên không ảnh hưởng",
          ]}
          correct={1}
          explanation="Đây là ví dụ kinh điển về physical adversarial attack: sticker nhỏ (mắt người vẫn đọc được 'DỪNG LẠI') nhưng AI đọc sai hoàn toàn. Đây là lý do adversarial robustness là BẮT BUỘC cho AI safety-critical: xe tự lái, y tế, an ninh."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Adversarial Robustness</strong>{" "} là khả năng AI duy trì dự đoán chính xác khi đầu vào bị thao túng có chủ đích. Khái niệm liên quan chặt chẽ tới{" "}
            <TopicLink slug="red-teaming">red-teaming</TopicLink>{" "}
            (tìm lỗ hổng chủ động) và{" "}
            <TopicLink slug="guardrails">guardrails</TopicLink>{" "}
            (hàng rào bảo vệ đầu ra).</p>
          <Callout variant="insight" title="FGSM — Tấn công nhanh nhất">
            <p>Fast Gradient Sign Method tạo adversarial example chỉ trong 1 bước:</p>
          </Callout>
          <LaTeX block>{"x_{\\text{adv}} = x + \\epsilon \\cdot \\text{sign}(\\nabla_x \\mathcal{L}(\\theta, x, y))"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\nabla_x \\mathcal{L}"}</LaTeX> là gradient của loss theo input (không phải weights!).{" "}
            <LaTeX>{"\\epsilon"}</LaTeX> kiểm soát mức nhiễu (thường 0.01-0.1).{" "}
            <LaTeX>{"\\text{sign}"}</LaTeX> lấy dấu (+1/-1) — mỗi pixel chỉ thay đổi nhỏ nhưng theo hướng tăng loss tối đa.
          </p>
          <Callout variant="info" title="Ba phương pháp phòng thủ chính">
            <div className="space-y-2">
              <p><strong>1. Adversarial Training:</strong>{" "} Tạo adversarial examples mỗi batch, train trên cả dữ liệu gốc + adversarial. Hiệu quả nhất nhưng tốn 3-10x thời gian training.</p>
              <p><strong>2. Certified Defense:</strong>{" "} Chứng minh toán học rằng dự đoán không đổi trong phạm vi epsilon. VD: Randomized Smoothing.</p>
              <p><strong>3. Input Preprocessing:</strong>{" "} Lọc/biến đổi input trước khi đến mô hình: JPEG compression, spatial smoothing, feature squeezing.</p>
            </div>
          </Callout>
          <CodeBlock language="python" title="adversarial_training.py">
{`import torch
import torch.nn.functional as F

def fgsm_attack(model, images, labels, epsilon=0.03):
    """Tạo adversarial examples bằng FGSM"""
    images.requires_grad = True
    outputs = model(images)
    loss = F.cross_entropy(outputs, labels)
    loss.backward()

    # Nhiễu theo hướng gradient
    perturbation = epsilon * images.grad.sign()
    adv_images = torch.clamp(images + perturbation, 0, 1)
    return adv_images

# Adversarial training loop
for images, labels in dataloader:
    # Train trên dữ liệu gốc
    loss_clean = F.cross_entropy(model(images), labels)

    # Tạo adversarial examples và train
    adv_images = fgsm_attack(model, images, labels, epsilon=0.03)
    loss_adv = F.cross_entropy(model(adv_images), labels)

    # Tổng loss = clean + adversarial
    total_loss = 0.5 * loss_clean + 0.5 * loss_adv
    total_loss.backward()
    optimizer.step()`}
          </CodeBlock>
          <Callout variant="warning" title="Physical adversarial attacks tại Việt Nam">
            <div className="space-y-1">
              <p>Camera giao thông AI (Hà Nội, TP.HCM) có thể bị lừa bằng hoạ tiết trên biển số xe.</p>
              <p>AI nhận dạng khuôn mặt tại sân bay có thể bị đánh bại bằng kính đặc biệt.</p>
              <p>Cần adversarial training và ensemble methods cho mọi AI an ninh.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Trade-off">
        <ExplanationSection>
          <Callout variant="tip" title="Accuracy vs Robustness trade-off">
            <p>Adversarial training cải thiện robustness nhưng có thể giảm accuracy trên dữ liệu sạch 1-3%. Đây là trade-off đáng chấp nhận cho ứng dụng safety-critical (xe tự lái, y tế), nhưng có thể không cần cho ứng dụng rủi ro thấp (gợi ý sản phẩm).</p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Adversarial Robustness"
          points={[
            "Adversarial attack = nhiễu CỰC NHỎ nhưng thiết kế theo gradient, đủ để lừa AI hoàn toàn.",
            "FGSM: 1 bước, nhanh. PGD: nhiều bước, mạnh hơn. CW: tối ưu hoá, khó phát hiện nhất.",
            "Physical attacks (sticker, kính) nguy hiểm hơn digital — hoạt động trong thế giới thực.",
            "Adversarial training hiệu quả nhất nhưng tốn 3-10x thời gian và có thể giảm accuracy sạch.",
            "BẮT BUỘC cho AI safety-critical: xe tự lái, nhận dạng khuôn mặt, camera an ninh.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
