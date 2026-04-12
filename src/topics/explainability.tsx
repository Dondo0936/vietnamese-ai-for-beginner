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
  slug: "explainability",
  title: "Explainability",
  titleVi: "Giải thích được — AI trong suốt",
  description:
    "Các kỹ thuật giúp con người hiểu tại sao mô hình AI đưa ra một quyết định cụ thể.",
  category: "ai-safety",
  tags: ["explainability", "interpretability", "xai", "transparency"],
  difficulty: "intermediate",
  relatedSlugs: ["bias-fairness", "alignment", "guardrails"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const FEATURES = [
  { name: "Thu nhập", importance: 0.35, color: "#3b82f6", direction: "negative" },
  { name: "Lịch sử tín dụng", importance: 0.28, color: "#22c55e", direction: "negative" },
  { name: "Tuổi", importance: 0.15, color: "#f59e0b", direction: "positive" },
  { name: "Nghề nghiệp", importance: 0.12, color: "#8b5cf6", direction: "positive" },
  { name: "Vùng miền", importance: 0.10, color: "#ef4444", direction: "negative" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "SHAP và LIME khác nhau ở điểm nào quan trọng nhất?",
    options: [
      "SHAP chỉ cho mô hình đơn giản, LIME cho mô hình phức tạp",
      "SHAP dựa trên lý thuyết trò chơi (Shapley values) cho giải thích chính xác toàn cục, LIME xấp xỉ cục bộ tại từng dự đoán",
      "SHAP nhanh hơn LIME",
      "LIME là phiên bản cải tiến của SHAP",
    ],
    correct: 1,
    explanation:
      "SHAP (SHapley Additive exPlanations) tính chính xác đóng góp của từng feature dựa trên Shapley values — công bằng theo lý thuyết trò chơi. LIME xấp xỉ model bằng linear model tại vùng lân cận — nhanh nhưng chỉ giải thích cục bộ. SHAP chính xác hơn nhưng tốn tính toán hơn.",
  },
  {
    question: "AI từ chối cho vay và giải thích: 'Vì bạn sống ở Quận 8, TP.HCM'. Đây là vấn đề gì?",
    options: [
      "AI giải thích đúng — Quận 8 có tỷ lệ nợ xấu cao",
      "Explainability phát hiện proxy discrimination: 'vùng miền' là proxy cho thu nhập/dân tộc — giải thích giúp phát hiện bias ẩn",
      "AI nên giấu lý do để không gây tranh cãi",
      "Explainability không áp dụng cho tín dụng",
    ],
    correct: 1,
    explanation:
      "Đây là ví dụ tuyệt vời về giá trị của XAI: giải thích AI cho thấy 'vùng miền' đóng góp lớn vào quyết định, phát hiện rằng AI đang dùng địa chỉ làm proxy cho thu nhập/dân tộc — một dạng phân biệt đối xử gián tiếp bị cấm bởi nhiều quy định.",
  },
  {
    question: "EU AI Act yêu cầu giải thích được cho AI rủi ro cao. Ứng dụng nào tại Việt Nam thuộc nhóm này?",
    options: [
      "Chatbot tư vấn mua hàng trên Shopee",
      "AI tạo ảnh cho mạng xã hội",
      "AI chấm điểm tín dụng ngân hàng và AI hỗ trợ chẩn đoán bệnh",
      "AI gợi ý bài hát trên Spotify",
    ],
    correct: 2,
    explanation:
      "AI rủi ro cao = ảnh hưởng trực tiếp đến cuộc sống: tín dụng (được/không được vay), y tế (chẩn đoán bệnh), tuyển dụng, tư pháp. Quyết định sai có thể gây hậu quả nghiêm trọng. Chatbot mua hàng và gợi ý nhạc là rủi ro thấp.",
  },
  {
    type: "fill-blank",
    question: "Hai kỹ thuật XAI phổ biến nhất là {blank} (dựa trên Shapley values, chính xác toàn cục) và {blank} (xấp xỉ tuyến tính cục bộ).",
    blanks: [
      { answer: "SHAP", accept: ["shap"] },
      { answer: "LIME", accept: ["lime"] },
    ],
    explanation: "SHAP dùng Shapley values từ lý thuyết trò chơi để phân bổ đóng góp của feature một cách công bằng. LIME xấp xỉ mô hình phức tạp bằng linear model trong vùng lân cận của một dự đoán.",
  },
];

export default function ExplainabilityTopic() {
  const [showImportance, setShowImportance] = useState(false);

  const toggleImportance = useCallback(() => {
    setShowImportance((prev) => !prev);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bị AI ngân hàng từ chối cho vay. Bạn hỏi 'Tại sao?' và được trả lời 'Máy tính nói thế.' Bạn cảm thấy sao?"
          options={[
            "Chấp nhận vì AI chắc phải đúng",
            "Bất mãn — bạn xứng đáng được biết LÝ DO cụ thể để có thể cải thiện",
            "Không quan tâm — chuyển sang ngân hàng khác",
          ]}
          correct={1}
          explanation="Đúng! Quyền được giải thích (right to explanation) là nền tảng của XAI. Nếu AI nói: 'Từ chối vì thu nhập thấp hơn ngưỡng 30% và lịch sử tín dụng có 2 lần trễ hạn', bạn biết chính xác cần cải thiện gì. Giải thích = CÔNG BẰNG + HÀNH ĐỘNG."
        />
      </LessonSection>

      {/* ── Step 2: Interactive Feature Importance ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhấn nút bên dưới để xem AI giải thích lý do từ chối cho vay. Mỗi thanh cho thấy yếu tố nào ảnh hưởng nhiều nhất đến quyết định.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <button
              type="button"
              onClick={toggleImportance}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              {showImportance ? "Ẩn giải thích" : "Xem tại sao AI từ chối"}
            </button>

            <svg viewBox="0 0 620 280" className="w-full max-w-2xl mx-auto">
              {/* Decision */}
              <rect x={180} y={10} width={260} height={40} rx={10} fill="#ef4444" />
              <text x={310} y={35} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                Từ chối cho vay — Rủi ro: 73%
              </text>

              {showImportance && (
                <>
                  <text x={310} y={75} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                    Mức ảnh hưởng của từng yếu tố (SHAP values):
                  </text>
                  {FEATURES.map((f, i) => {
                    const y = 90 + i * 34;
                    return (
                      <g key={i}>
                        <text x={20} y={y + 18} fill="#94a3b8" fontSize={10}>{f.name}</text>
                        <rect x={160} y={y + 3} width={370} height={22} rx={3} fill="#1e293b" />
                        <rect
                          x={160}
                          y={y + 3}
                          width={370 * f.importance}
                          height={22}
                          rx={3}
                          fill={f.color}
                        />
                        <text x={167 + 370 * f.importance + 5} y={y + 18} fill="white" fontSize={10}>
                          {(f.importance * 100).toFixed(0)}% {f.direction === "negative" ? "(tăng rủi ro)" : "(giảm rủi ro)"}
                        </text>
                      </g>
                    );
                  })}
                  <text x={310} y={265} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                    Thu nhập thấp và lịch sử tín dụng xấu là hai yếu tố chính dẫn đến từ chối
                  </text>
                </>
              )}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Explainability không chỉ để{" "}
          <strong>người dùng hiểu</strong>{" "}
          — nó còn giúp{" "}
          <strong>phát hiện bias ẩn</strong>. Nếu {'"vùng miền"'} đóng góp 10% vào quyết định từ chối, đó là dấu hiệu AI đang phân biệt đối xử theo địa chỉ — điều mà chỉ nhìn accuracy tổng không thể phát hiện được.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bác sĩ dùng AI hỗ trợ chẩn đoán X-quang phổi. AI nói: 'Có khối u, confidence 87%'. Bác sĩ cần thêm gì từ AI?"
          options={[
            "Không cần gì thêm — 87% là đủ tin cậy",
            "Heat map (attention/Grad-CAM) chỉ ra VÙNG NÀO trên X-quang AI nhìn thấy bất thường, để bác sĩ xác nhận",
            "Danh sách tất cả bệnh nhân tương tự",
            "Confidence cao hơn, ít nhất 99%",
          ]}
          correct={1}
          explanation="Heat map (Grad-CAM, attention visualization) cho bác sĩ biết AI 'nhìn' vào đâu. Nếu AI highlight đúng vùng nghi ngờ → bác sĩ tin tưởng hơn. Nếu AI nhìn vào vùng sai (metadata, chữ trên phim) → phát hiện được lỗi. XAI = công cụ kiểm tra chéo cho chuyên gia."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Giải thích được (Explainability/XAI)</strong>{" "}
            là khả năng hệ thống AI trình bày lý do đằng sau quyết định một cách con người có thể hiểu và kiểm chứng. XAI là công cụ cốt lõi để phát hiện{" "}
            <TopicLink slug="bias-fairness">thiên kiến và bất công</TopicLink>{" "}
            trong mô hình, đồng thời là yêu cầu bắt buộc của{" "}
            <TopicLink slug="ai-governance">quản trị AI</TopicLink>{" "}
            cho các hệ thống rủi ro cao.
          </p>

          <Callout variant="insight" title="Ba kỹ thuật XAI phổ biến nhất">
            <div className="space-y-3">
              <p>
                <strong>1. SHAP (SHapley Additive exPlanations):</strong>{" "}
                Dựa trên Shapley values từ lý thuyết trò chơi. Tính chính xác đóng góp của từng feature. Công bằng nhưng tốn tính toán.
              </p>
              <p>
                <strong>2. LIME (Local Interpretable Model-agnostic Explanations):</strong>{" "}
                Xấp xỉ mô hình phức tạp bằng mô hình tuyến tính tại vùng lân cận. Nhanh, dễ hiểu, nhưng chỉ giải thích cục bộ.
              </p>
              <p>
                <strong>3. Attention/Grad-CAM Visualization:</strong>{" "}
                Hiển thị phần nào của đầu vào AI {'"chú ý"'} nhất. Đặc biệt hữu ích cho ảnh (X-quang, CCTV) và văn bản.
              </p>
            </div>
          </Callout>

          <p>Shapley value cho feature i:</p>
          <LaTeX block>{"\\phi_i = \\sum_{S \\subseteq N \\setminus \\{i\\}} \\frac{|S|! \\cdot (|N|-|S|-1)!}{|N|!} \\left[ f(S \\cup \\{i\\}) - f(S) \\right]"}</LaTeX>
          <p className="text-sm text-muted">
            Ý nghĩa: đo đóng góp biên của feature i bằng cách thử TẤT CẢ tổ hợp features có và không có i, tính trung bình có trọng số. Đảm bảo công bằng: tổng tất cả Shapley values = prediction.
          </p>

          <CodeBlock language="python" title="xai_credit.py">
{`import shap
import xgboost as xgb

# Mô hình chấm điểm tín dụng
model = xgb.XGBClassifier()
model.fit(X_train, y_train)

# SHAP giải thích
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Giải thích cho 1 khách hàng bị từ chối
idx = 42  # Khách hàng số 42
print("Quyết định: TỪ CHỐI")
print("\\nYếu tố ảnh hưởng:")
for feature, value in sorted(
    zip(feature_names, shap_values[idx]),
    key=lambda x: abs(x[1]),
    reverse=True,
):
    direction = "tăng rủi ro" if value > 0 else "giảm rủi ro"
    print(f"  {feature}: {value:+.3f} ({direction})")
# Thu nhập: +0.35 (tăng rủi ro)
# Lịch sử tín dụng: +0.28 (tăng rủi ro)
# Tuổi: -0.15 (giảm rủi ro)

# Visualization
shap.waterfall_plot(
    shap.Explanation(shap_values[idx], feature_names=feature_names)
)`}
          </CodeBlock>

          <Callout variant="warning" title="Giải thích ≠ Giải thích đúng">
            <div className="space-y-1">
              <p>Attention maps có thể gây hiểu lầm: mô hình {'"chú ý"'} vào vùng không liên quan (spurious correlation).</p>
              <p>LIME xấp xỉ cục bộ có thể không phản ánh đúng logic toàn cục của mô hình.</p>
              <p>Cần kết hợp nhiều kỹ thuật XAI và kiểm chứng với chuyên gia domain.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: XAI tại Việt Nam ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="XAI tại Việt Nam">
        <ExplanationSection>
          <Callout variant="tip" title="Ứng dụng XAI trong bối cảnh Việt Nam">
            <div className="space-y-2">
              <p><strong>Ngân hàng:</strong>{" "} NHNN yêu cầu lý do rõ ràng khi từ chối tín dụng. SHAP giúp tạo giải thích tự động bằng tiếng Việt.</p>
              <p><strong>Y tế:</strong>{" "} AI hỗ trợ chẩn đoán ở bệnh viện tuyến huyện cần Grad-CAM để bác sĩ kiểm tra.</p>
              <p><strong>Bảo hiểm:</strong>{" "} AI từ chối bồi thường phải giải thích điều khoản cụ thể bị vi phạm.</p>
              <p><strong>Pháp luật:</strong>{" "} Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân sẽ ngày càng yêu cầu giải thích AI.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Explainability"
          points={[
            "XAI = giúp con người hiểu TẠI SAO AI quyết định, không chỉ kết quả cuối.",
            "SHAP (chính xác, lý thuyết trò chơi) vs LIME (nhanh, xấp xỉ cục bộ) vs Grad-CAM (cho ảnh).",
            "XAI giúp phát hiện bias ẩn: nếu 'vùng miền' ảnh hưởng 10% quyết định → dấu hiệu phân biệt đối xử.",
            "Bắt buộc cho AI rủi ro cao: tín dụng, y tế, tuyển dụng, tư pháp.",
            "Giải thích ≠ giải thích đúng: cần kết hợp nhiều kỹ thuật + kiểm chứng chuyên gia.",
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
