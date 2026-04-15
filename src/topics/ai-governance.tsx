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
  slug: "ai-governance",
  title: "AI Governance",
  titleVi: "Quản trị AI — Luật chơi cho trí tuệ nhân tạo",
  description:
    "Khung pháp lý, chính sách và quy trình quản lý việc phát triển, triển khai và sử dụng hệ thống AI một cách có trách nhiệm.",
  category: "ai-safety",
  tags: ["governance", "regulation", "policy", "ethics"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "bias-fairness", "explainability"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const PILLARS = [
  { label: "Pháp lý", items: ["EU AI Act", "Luật AI quốc gia", "GDPR/Dữ liệu cá nhân"], color: "#3b82f6", desc: "Luật và quy định bắt buộc — vi phạm bị phạt tiền, cấm hoạt động." },
  { label: "Chính sách tổ chức", items: ["Đánh giá tác động AI", "Kiểm toán định kỳ", "Quản lý rủi ro"], color: "#22c55e", desc: "Quy trình nội bộ doanh nghiệp — ai chịu trách nhiệm, quy trình phê duyệt." },
  { label: "Đạo đức", items: ["Quyền con người", "Công bằng/Bao trùm", "Minh bạch"], color: "#f59e0b", desc: "Nguyên tắc hướng dẫn — vượt xa pháp luật, hướng tới AI vì con người." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "EU AI Act phân loại AI theo mức độ rủi ro. AI chấm điểm tín dụng thuộc nhóm nào?",
    options: [
      "Rủi ro thấp (low risk) — không cần tuân thủ đặc biệt",
      "Rủi ro cao (high risk) — phải đánh giá tác động, giải thích được, kiểm toán định kỳ",
      "Rủi ro không chấp nhận được (unacceptable) — bị cấm hoàn toàn",
      "Rủi ro tối thiểu (minimal) — chỉ cần ghi nhãn",
    ],
    correct: 1,
    explanation:
      "AI tín dụng ảnh hưởng trực tiếp đến cuộc sống (được/không được vay) → high risk. Phải: (1) đánh giá tác động trước triển khai, (2) giải thích được quyết định, (3) kiểm toán định kỳ, (4) human oversight. Phạt đến 3% doanh thu toàn cầu nếu vi phạm.",
  },
  {
    question: "Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân) ảnh hưởng gì đến AI tại Việt Nam?",
    options: [
      "Không ảnh hưởng — NĐ 13 chỉ về dữ liệu, không về AI",
      "AI thu thập/xử lý dữ liệu cá nhân phải: xin đồng ý, thông báo mục đích, cho phép rút lại, bảo mật",
      "Cấm hoàn toàn AI xử lý dữ liệu người Việt",
      "Chỉ áp dụng cho doanh nghiệp nước ngoài",
    ],
    correct: 1,
    explanation:
      "NĐ 13 = GDPR phiên bản Việt Nam. Mọi AI xử lý dữ liệu cá nhân (chatbot lưu hội thoại, AI nhận dạng khuôn mặt, AI y tế) phải tuân thủ: đồng ý rõ ràng, quyền xoá/sửa, bảo mật, thông báo khi vi phạm. Vi phạm phạt đến 100 triệu VND.",
  },
  {
    question: "Quản trị AI tốt giúp gì cho doanh nghiệp?",
    options: [
      "Chỉ tốn thêm chi phí tuân thủ",
      "Xây dựng niềm tin người dùng, tránh rủi ro pháp lý, phát hiện bias sớm, tăng lợi thế cạnh tranh",
      "Chỉ cần cho doanh nghiệp lớn",
      "Không cần thiết nếu AI đã qua RLHF",
    ],
    correct: 1,
    explanation:
      "Quản trị AI = đầu tư, không phải chi phí. Doanh nghiệp có AI governance tốt: (1) tránh phạt pháp lý, (2) người dùng tin tưởng hơn, (3) phát hiện bias/lỗi sớm (giảm thiệt hại), (4) đối tác quốc tế yêu cầu AI compliance (đặc biệt EU).",
  },
  {
    type: "fill-blank",
    question: "Quản trị AI đặt ra các {blank} nội bộ và đòi hỏi doanh nghiệp đạt mức {blank} với pháp luật như EU AI Act hoặc Nghị định 13/2023.",
    blanks: [
      { answer: "chính sách", accept: ["policy", "quy định", "policies"] },
      { answer: "tuân thủ", accept: ["compliance", "compliant", "tuân thủ pháp luật"] },
    ],
    explanation: "AI governance = policy (chính sách nội bộ về cách phát triển/triển khai AI) + compliance (tuân thủ luật bên ngoài: EU AI Act, GDPR, NĐ 13). Doanh nghiệp cần cả hai: policy rõ ràng trong tổ chức và compliance với regulator.",
  },
];

export default function AIGovernanceTopic() {
  const [activePillar, setActivePillar] = useState(0);
  const handlePillarClick = useCallback((i: number) => { setActivePillar(i); }, []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="AI nhận dạng khuôn mặt bị lỗi: nhận nhầm một công dân Việt Nam là tội phạm bị truy nã. Ai chịu trách nhiệm?"
          options={[
            "Không ai — AI tự quyết định",
            "Công ty phát triển AI, cơ quan triển khai, VÀ người giám sát đều có phần trách nhiệm — cần khung quản trị rõ ràng",
            "Chỉ công ty phát triển AI",
          ]}
          correct={1}
          explanation="Đây là lý do cần AI Governance! Khi AI sai, chuỗi trách nhiệm rất phức tạp: ai phát triển? ai quyết định triển khai? ai giám sát? ai chịu hậu quả? Khung quản trị AI xác định RÕ RÀNG trách nhiệm từng bên, quy trình xử lý khi có vấn đề."
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Quản trị AI dựa trên ba trụ cột. Nhấp vào từng trụ cột để xem chi tiết.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 620 260" className="w-full max-w-2xl mx-auto">
              {PILLARS.map((pillar, i) => {
                const x = 105 + i * 210;
                return (
                  <g key={i} onClick={() => handlePillarClick(i)} className="cursor-pointer">
                    <rect x={x - 85} y={15} width={170} height={38} rx={8} fill={i === activePillar ? pillar.color : "#1e293b"} stroke={pillar.color} strokeWidth={i === activePillar ? 3 : 1.5} />
                    <text x={x} y={39} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">{pillar.label}</text>
                    {pillar.items.map((item, j) => (
                      <g key={j}>
                        <line x1={x} y1={53 + j * 48} x2={x} y2={70 + j * 48} stroke="#475569" strokeWidth={1.5} />
                        <rect x={x - 75} y={70 + j * 48} width={150} height={30} rx={6} fill={i === activePillar ? "#1e293b" : "#0f172a"} stroke={pillar.color} strokeWidth={i === activePillar ? 1.5 : 0.5} />
                        <text x={x} y={90 + j * 48} textAnchor="middle" fill="#e2e8f0" fontSize={9}>{item}</text>
                      </g>
                    ))}
                  </g>
                );
              })}
              <rect x={30} y={225} width={560} height={28} rx={8} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
              <text x={310} y={244} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">Nền tảng: Quyền con người & Phát triển bền vững</text>
            </svg>
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground font-semibold">{PILLARS[activePillar].label}</p>
              <p className="text-sm text-muted">{PILLARS[activePillar].desc}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Quản trị AI giống{" "}
          <strong>luật giao thông</strong>{" "}
          — không phải để cấm lái xe, mà để mọi người lái{" "}
          <strong>an toàn</strong>. Bằng lái (chứng nhận), đăng kiểm (kiểm toán), biển báo (guardrails), bảo hiểm (trách nhiệm) — tất cả tồn tại để xe hơi (AI) phục vụ xã hội mà không gây tai nạn.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Startup Việt Nam muốn xuất khẩu sản phẩm AI y tế sang EU. Ngoài chất lượng sản phẩm, họ cần gì?"
          options={[
            "Không cần gì thêm nếu AI đã hoạt động tốt",
            "Tuân thủ EU AI Act: đánh giá rủi ro, giải thích được, kiểm toán, data governance, CE marking cho AI y tế",
            "Chỉ cần dịch giao diện sang tiếng Anh",
            "Chỉ cần chứng nhận ISO 27001",
          ]}
          correct={1}
          explanation="EU AI Act phân loại AI y tế là HIGH RISK. Startup cần: (1) đánh giá tác động AI, (2) hệ thống giải thích quyết định, (3) quản lý dữ liệu tuân thủ GDPR, (4) kiểm toán định kỳ, (5) CE marking. Đây là rào cản nhưng cũng là lợi thế cạnh tranh nếu tuân thủ sớm."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p><strong>Quản trị AI (AI Governance)</strong>{" "} bao gồm khung pháp lý, chính sách và quy trình đảm bảo AI được phát triển và triển khai có trách nhiệm — bao phủ cả kiểm soát{" "}
            <TopicLink slug="bias-fairness">bias &amp; fairness</TopicLink>, yêu cầu{" "}
            <TopicLink slug="explainability">explainability</TopicLink>{" "}và triển khai{" "}
            <TopicLink slug="guardrails">guardrails</TopicLink>{" "}kỹ thuật.</p>
          <Callout variant="insight" title="EU AI Act — Khung quản trị toàn diện nhất">
            <div className="space-y-2">
              <p><strong>Unacceptable risk (Bị cấm):</strong>{" "} Social scoring, nhận dạng khuôn mặt real-time nơi công cộng, thao túng hành vi.</p>
              <p><strong>High risk (Quy định nghiêm ngặt):</strong>{" "} AI y tế, tín dụng, tuyển dụng, giáo dục, tư pháp. Phải: đánh giá tác động, giải thích được, human oversight.</p>
              <p><strong>Limited risk (Minh bạch):</strong>{" "} Chatbot, deepfake. Phải ghi nhãn rõ {'"nội dung do AI tạo"'}.</p>
              <p><strong>Minimal risk (Tự do):</strong>{" "} Game AI, spam filter. Không yêu cầu đặc biệt.</p>
            </div>
          </Callout>
          <Callout variant="info" title="Quản trị AI tại Việt Nam">
            <div className="space-y-2">
              <p><strong>Nghị định 13/2023/NĐ-CP:</strong>{" "} Bảo vệ dữ liệu cá nhân — tương tự GDPR. AI xử lý dữ liệu phải xin đồng ý, bảo mật, cho phép xoá/sửa.</p>
              <p><strong>Quyết định 127/QĐ-TTg (2021):</strong>{" "} Chiến lược quốc gia về AI đến 2030 — phát triển AI có trách nhiệm, xây dựng khung pháp lý.</p>
              <p><strong>Luật An ninh mạng (2018):</strong>{" "} Quy định lưu trữ dữ liệu trong nước, kiểm soát nội dung — ảnh hưởng trực tiếp đến triển khai AI.</p>
              <p><strong>Xu hướng:</strong>{" "} Việt Nam đang soạn thảo quy định riêng cho AI, tham khảo EU AI Act nhưng điều chỉnh cho bối cảnh quốc gia.</p>
            </div>
          </Callout>
          <Callout variant="warning" title="Thách thức quản trị AI tại Việt Nam">
            <div className="space-y-1">
              <p>Thiếu chuyên gia AI governance — hầu hết doanh nghiệp chưa có vị trí AI Ethics Officer.</p>
              <p>Khung pháp lý đang hình thành — doanh nghiệp cần chủ động tuân thủ trước khi bắt buộc.</p>
              <p>Dữ liệu cross-border: AI dùng cloud nước ngoài (AWS, GCP) vs yêu cầu lưu trữ trong nước.</p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Checklist quản trị">
          <Callout variant="tip" title="Checklist AI Governance cho doanh nghiệp Việt Nam">
            <div className="space-y-1">
              <p>1. Phân loại AI theo mức rủi ro (theo EU AI Act framework)</p>
              <p>2. Đánh giá tác động AI (AI Impact Assessment) trước triển khai</p>
              <p>3. Tuân thủ NĐ 13/2023 về dữ liệu cá nhân</p>
              <p>4. Thiết lập quy trình human oversight cho AI rủi ro cao</p>
              <p>5. Kiểm toán fairness/bias định kỳ</p>
              <p>6. Ghi nhãn rõ ràng khi nội dung do AI tạo</p>
              <p>7. Lưu log quyết định AI để truy vết khi có vấn đề</p>
            </div>
          </Callout>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Governance"
          points={[
            "Quản trị AI = luật giao thông cho AI: không cấm, mà đảm bảo an toàn và trách nhiệm.",
            "Ba trụ cột: Pháp lý (EU AI Act, NĐ 13), Chính sách tổ chức (kiểm toán, đánh giá), Đạo đức (quyền con người).",
            "EU AI Act phân 4 mức rủi ro: cấm, cao (y tế/tín dụng), hạn chế (chatbot), tối thiểu (game).",
            "Việt Nam: NĐ 13 bảo vệ dữ liệu, QĐ 127 chiến lược AI, Luật An ninh mạng — đang soạn quy định riêng.",
            "Doanh nghiệp nên chủ động tuân thủ TRƯỚC khi bắt buộc — đây là lợi thế cạnh tranh, không chỉ chi phí.",
          ]}
        />
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
