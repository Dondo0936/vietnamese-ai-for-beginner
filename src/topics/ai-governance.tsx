"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metadata — giữ nguyên theo thiết kế ban đầu để không phá vỡ navigation.
// ---------------------------------------------------------------------------
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

const TOTAL_STEPS = 10;

// ---------------------------------------------------------------------------
// Dữ liệu 5 nguyên tắc quản trị AI — trái tim của phần visualization.
// Mỗi principle có:
//   - id, label: nhãn hiển thị
//   - color: màu SVG để phân biệt
//   - angle: vị trí trên vòng tròn (độ, 0 = đỉnh)
//   - description: tóm tắt 1 câu
//   - checklist: danh sách các yêu cầu cụ thể khi triển khai
//   - connections: id của các nguyên tắc liên quan (vẽ đường nối)
// ---------------------------------------------------------------------------
interface Principle {
  id: string;
  label: string;
  color: string;
  angle: number;
  description: string;
  checklist: string[];
  connections: string[];
}

const PRINCIPLES: Principle[] = [
  {
    id: "privacy",
    label: "Quyền riêng tư dữ liệu",
    color: "#3b82f6",
    angle: 0,
    description:
      "Bảo vệ thông tin cá nhân của người dùng trong toàn bộ vòng đời AI.",
    checklist: [
      "Xin đồng ý (consent) rõ ràng, có thể rút lại.",
      "Giảm thiểu thu thập — chỉ lấy dữ liệu thực sự cần thiết.",
      "Ẩn danh hoá (anonymization) và giả danh (pseudonymization).",
      "Mã hoá in-transit và at-rest.",
      "Kiểm soát truy cập (RBAC) và audit log.",
      "Tuân thủ NĐ 13/2023/NĐ-CP hoặc GDPR khi xuất dữ liệu.",
      "Cho phép quyền xoá (right to be forgotten).",
    ],
    connections: ["transparency", "accountability"],
  },
  {
    id: "fairness",
    label: "Công bằng & không phân biệt",
    color: "#22c55e",
    angle: 72,
    description:
      "Đảm bảo AI không thiên vị theo giới, tuổi, dân tộc, vùng miền, tôn giáo.",
    checklist: [
      "Đánh giá bias trên các nhóm bảo vệ (protected attributes).",
      "Đo disparate impact / equalized odds / demographic parity.",
      "Kiểm tra dữ liệu huấn luyện về tính đại diện.",
      "Stress-test mô hình trên edge case (dialect, vùng sâu vùng xa).",
      "Có cơ chế khiếu nại và sửa sai (appeal).",
      "Tái đánh giá định kỳ — fairness không phải kết quả một lần.",
    ],
    connections: ["transparency", "accountability", "safety"],
  },
  {
    id: "transparency",
    label: "Minh bạch & giải thích",
    color: "#f59e0b",
    angle: 144,
    description:
      "Người dùng phải biết đang tương tác với AI và hiểu được quyết định.",
    checklist: [
      "Ghi nhãn rõ ràng: 'Nội dung do AI tạo'.",
      "Giải thích quyết định theo ngôn ngữ tự nhiên (SHAP/LIME).",
      "Model card: mục đích, hạn chế, dữ liệu huấn luyện.",
      "Data sheet: nguồn, thời gian, cách thu thập.",
      "Công khai metric về fairness và accuracy theo nhóm.",
      "Cung cấp kênh liên hệ khi người dùng có thắc mắc.",
    ],
    connections: ["privacy", "fairness", "accountability"],
  },
  {
    id: "accountability",
    label: "Trách nhiệm giải trình",
    color: "#a855f7",
    angle: 216,
    description:
      "Có người cụ thể chịu trách nhiệm khi AI sai; có đường dây xử lý sự cố.",
    checklist: [
      "Chỉ định AI Ethics Officer hoặc committee.",
      "Quy trình phê duyệt triển khai (RACI matrix).",
      "Audit log đầy đủ: ai làm gì, khi nào.",
      "Quy trình incident response khi AI gây hại.",
      "Impact assessment bắt buộc trước production.",
      "Báo cáo định kỳ lên ban lãnh đạo & cơ quan quản lý.",
    ],
    connections: ["privacy", "fairness", "transparency", "safety"],
  },
  {
    id: "safety",
    label: "An toàn & bảo mật",
    color: "#ef4444",
    angle: 288,
    description:
      "AI không gây hại: red-team, guardrails, giám sát liên tục sau triển khai.",
    checklist: [
      "Red-team định kỳ — tìm cách 'phá' model.",
      "Guardrails đầu vào (prompt injection) và đầu ra.",
      "Kill-switch và rollback nhanh khi có sự cố.",
      "Monitoring drift: data drift, concept drift, performance drift.",
      "Bảo mật API (rate limit, auth, DDoS protection).",
      "Kiểm tra an toàn vật lý khi AI điều khiển thiết bị.",
    ],
    connections: ["fairness", "accountability"],
  },
];

// Toạ độ trung tâm và bán kính vòng tròn
const CENTER_X = 320;
const CENTER_Y = 220;
const RADIUS = 140;

function polar(angleDeg: number, r: number) {
  // 0 độ = đỉnh (12h), tăng theo chiều kim đồng hồ
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER_X + r * Math.cos(rad),
    y: CENTER_Y + r * Math.sin(rad),
  };
}

// ---------------------------------------------------------------------------
// Bảng quizz 8 câu — kết hợp multiple choice + fill-blank theo yêu cầu.
// ---------------------------------------------------------------------------
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "EU AI Act phân loại AI theo mức độ rủi ro. AI chấm điểm tín dụng thuộc nhóm nào?",
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
    question:
      "Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân) ảnh hưởng gì đến AI tại Việt Nam?",
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
    question:
      "Quản trị AI đặt ra các {blank} nội bộ và đòi hỏi doanh nghiệp đạt mức {blank} với pháp luật như EU AI Act hoặc Nghị định 13/2023.",
    blanks: [
      { answer: "chính sách", accept: ["policy", "quy định", "policies"] },
      {
        answer: "tuân thủ",
        accept: ["compliance", "compliant", "tuân thủ pháp luật"],
      },
    ],
    explanation:
      "AI governance = policy (chính sách nội bộ về cách phát triển/triển khai AI) + compliance (tuân thủ luật bên ngoài: EU AI Act, GDPR, NĐ 13). Doanh nghiệp cần cả hai: policy rõ ràng trong tổ chức và compliance với regulator.",
  },
  {
    question:
      "Chatbot chăm sóc khách hàng của một ngân hàng trả lời sai khiến khách hàng mất tiền. Ai chịu trách nhiệm?",
    options: [
      "Nhà cung cấp mô hình nền (OpenAI, Anthropic) chịu toàn bộ",
      "Ngân hàng chịu chính (deployer/operator), kèm nhà cung cấp theo điều khoản hợp đồng và quy định pháp luật",
      "Không ai — AI 'tự quyết'",
      "Khách hàng chịu vì đã tin AI",
    ],
    correct: 1,
    explanation:
      "Trong khuôn khổ EU AI Act và hầu hết luật quốc gia, 'deployer' (bên triển khai cho người dùng cuối) chịu trách nhiệm chính. Nhà cung cấp model nền chịu trách nhiệm phần họ xây. Doanh nghiệp cần: model card của vendor, test trên use case cụ thể, giám sát liên tục, kênh khiếu nại cho khách hàng.",
  },
  {
    question:
      "Một công ty HR dùng AI sàng lọc CV. Sau 6 tháng phát hiện AI loại CV của ứng viên nữ nhiều hơn nam dù trình độ tương đương. Bước đầu tiên đúng là gì?",
    options: [
      "Im lặng và tiếp tục sử dụng",
      "Tạm dừng hệ thống, khởi động incident response: bias audit, thông báo cho ứng viên bị ảnh hưởng, sửa & tái kiểm định",
      "Đổ lỗi cho thuật toán và không làm gì",
      "Tăng tốc độ xử lý để bù",
    ],
    correct: 1,
    explanation:
      "Đây là high-risk AI theo EU AI Act (tuyển dụng). Khi phát hiện bias: (1) tạm dừng để ngừng gây hại, (2) audit nguyên nhân (dữ liệu, feature, threshold), (3) thông báo & khắc phục cho người bị ảnh hưởng, (4) sửa model và tái kiểm định, (5) báo cáo lên lãnh đạo/regulator nếu luật yêu cầu. Pattern 'phát hiện → khắc phục → báo cáo' là nền của accountability.",
  },
  {
    question:
      "Model card và data sheet có tác dụng gì trong AI governance?",
    options: [
      "Chỉ là tài liệu marketing",
      "Là công cụ minh bạch: model card mô tả mục đích/hạn chế/metric, data sheet mô tả nguồn/cách thu thập/biases của dữ liệu",
      "Chỉ cần cho model nghiên cứu, không cần cho sản phẩm",
      "Là bắt buộc ở Việt Nam từ 2020",
    ],
    correct: 1,
    explanation:
      "Model card (Mitchell et al. 2019) và datasheet for datasets (Gebru et al. 2018) là chuẩn mực minh bạch. Chúng giúp: (1) người triển khai hiểu giới hạn, (2) regulator kiểm tra, (3) người dùng biết AI hoạt động ra sao, (4) nhóm khác tái sử dụng đúng cách. Là một trong những yêu cầu cụ thể của EU AI Act cho high-risk AI.",
  },
  {
    question:
      "Khi nào một hệ thống AI bị xếp vào 'rủi ro không chấp nhận được' (unacceptable risk) theo EU AI Act?",
    options: [
      "Khi model quá lớn (> 100 tỷ tham số)",
      "Khi thao túng hành vi, social scoring quy mô nhà nước, nhận dạng khuôn mặt thời gian thực nơi công cộng (trừ ngoại lệ an ninh)",
      "Khi chạy trên cloud nước ngoài",
      "Khi train trên nhiều hơn 1 triệu sample",
    ],
    correct: 1,
    explanation:
      "Các use case bị CẤM: (1) AI thao túng hành vi dưới ngưỡng nhận thức gây hại, (2) social scoring quy mô nhà nước, (3) real-time remote biometric identification ở không gian công cộng (trừ trường hợp hẹp về an ninh có phép toà án), (4) cảm xúc ở nơi làm việc/giáo dục, (5) phân loại sinh trắc học suy diễn chủng tộc, tôn giáo, xu hướng tình dục. Kích cỡ hay nơi chạy không phải tiêu chí.",
  },
];

// ---------------------------------------------------------------------------
// Component phụ — chú thích chấm màu cho legend của sơ đồ.
// ---------------------------------------------------------------------------
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component phụ — checklist panel cho nguyên tắc đang được chọn.
// ---------------------------------------------------------------------------
function ChecklistPanel({ principle }: { principle: Principle }) {
  return (
    <motion.div
      key={principle.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-border bg-background/50 p-4"
      role="region"
      aria-label={`Checklist cho ${principle.label}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: principle.color }}
        />
        <h3 className="text-sm font-semibold text-foreground">
          {principle.label}
        </h3>
      </div>
      <p className="mb-3 text-sm text-muted">{principle.description}</p>
      <ul className="space-y-1.5">
        {principle.checklist.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <span
              className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: principle.color }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------
export default function AIGovernanceTopic() {
  const [activeId, setActiveId] = useState<string>("privacy");

  const activePrinciple = useMemo(
    () => PRINCIPLES.find((p) => p.id === activeId) ?? PRINCIPLES[0],
    [activeId],
  );

  const handleClick = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // Tạo các đường nối — dựa trên activeId để làm nổi bật các kết nối của
  // nguyên tắc đang được chọn, các kết nối khác mờ đi.
  const connections = useMemo(() => {
    const lines: Array<{
      from: string;
      to: string;
      highlighted: boolean;
    }> = [];
    const seen = new Set<string>();
    for (const p of PRINCIPLES) {
      for (const target of p.connections) {
        const key = [p.id, target].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        const highlighted = p.id === activeId || target === activeId;
        lines.push({ from: p.id, to: target, highlighted });
      }
    }
    return lines;
  }, [activeId]);

  // Toạ độ từng circle trên SVG
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const p of PRINCIPLES) {
      map[p.id] = polar(p.angle, RADIUS);
    }
    return map;
  }, []);

  return (
    <>
      {/* Thanh tiến trình tổng thể */}
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Checklist",
            "Thử thách",
            "Khung pháp lý",
            "Việt Nam",
            "Góc sâu",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      {/* ========================================================= */}
      {/* Bước 1 — Dự đoán                                           */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* Bước 2 — Sơ đồ 5 nguyên tắc quản trị (VisualizationSection) */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Quản trị AI hiện đại xoay quanh{" "}
          <strong className="text-foreground">năm nguyên tắc nền</strong>. Chúng
          liên kết với nhau chứ không tách rời. Nhấp vào từng vòng tròn để mở
          checklist yêu cầu cụ thể cho từng nguyên tắc.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {PRINCIPLES.map((p) => (
                <LegendDot key={p.id} color={p.color} label={p.label} />
              ))}
            </div>

            <svg
              viewBox="0 0 640 440"
              className="mx-auto w-full max-w-2xl"
              role="img"
              aria-label="Sơ đồ năm nguyên tắc quản trị AI liên kết với nhau"
            >
              <defs>
                <radialGradient id="center-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* Vùng nền trung tâm */}
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={RADIUS + 30}
                fill="url(#center-gradient)"
              />

              {/* Các đường nối giữa các nguyên tắc */}
              {connections.map((c, i) => {
                const from = positions[c.from];
                const to = positions[c.to];
                return (
                  <motion.line
                    key={i}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={c.highlighted ? "#8b5cf6" : "#334155"}
                    strokeWidth={c.highlighted ? 2.2 : 1}
                    strokeDasharray={c.highlighted ? "none" : "4 4"}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: c.highlighted ? 0.9 : 0.35,
                    }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                );
              })}

              {/* Nhãn trung tâm */}
              <text
                x={CENTER_X}
                y={CENTER_Y - 8}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={13}
                fontWeight="bold"
              >
                AI
              </text>
              <text
                x={CENTER_X}
                y={CENTER_Y + 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={11}
              >
                Governance
              </text>

              {/* Các vòng tròn nguyên tắc */}
              {PRINCIPLES.map((p) => {
                const pos = positions[p.id];
                const isActive = p.id === activeId;
                return (
                  <g
                    key={p.id}
                    onClick={() => handleClick(p.id)}
                    className="cursor-pointer"
                    role="button"
                    aria-label={`Mở checklist cho ${p.label}`}
                  >
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isActive ? 48 : 40}
                      fill={isActive ? p.color : "#0f172a"}
                      stroke={p.color}
                      strokeWidth={isActive ? 3 : 2}
                      initial={false}
                      animate={{ r: isActive ? 48 : 40 }}
                      transition={{ duration: 0.25 }}
                    />
                    <foreignObject
                      x={pos.x - 55}
                      y={pos.y - 24}
                      width={110}
                      height={50}
                      style={{ pointerEvents: "none" }}
                    >
                      <div
                        className="flex h-full w-full items-center justify-center text-center"
                        style={{
                          color: isActive ? "#ffffff" : "#e2e8f0",
                          fontSize: 10,
                          fontWeight: 600,
                          lineHeight: 1.1,
                        }}
                      >
                        {p.label}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Chú thích đường nối */}
              <text
                x={CENTER_X}
                y={420}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
              >
                Các nguyên tắc liên kết — nhấp một vòng tròn để làm nổi bật kết
                nối.
              </text>
            </svg>

            {/* Panel checklist cho nguyên tắc đang chọn */}
            <ChecklistPanel principle={activePrinciple} />

            {/* Các nút chuyển nhanh để truy cập bằng bàn phím */}
            <div className="flex flex-wrap gap-2">
              {PRINCIPLES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleClick(p.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    p.id === activeId
                      ? "border-accent bg-surface text-accent"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 3 — Aha                                                */}
      {/* ========================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          Quản trị AI giống{" "}
          <strong>luật giao thông</strong>{" "}— không phải để cấm lái xe, mà để
          mọi người lái{" "}
          <strong>an toàn</strong>. Bằng lái (chứng nhận), đăng kiểm (kiểm
          toán), biển báo (guardrails), bảo hiểm (trách nhiệm) — tất cả tồn tại
          để xe hơi (AI) phục vụ xã hội mà không gây tai nạn.
        </AhaMoment>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 4 — Checklist tổng hợp cho doanh nghiệp                */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Checklist cho doanh nghiệp">
        <Callout
          variant="tip"
          title="Checklist AI Governance cho doanh nghiệp Việt Nam"
        >
          <ol className="list-decimal space-y-1.5 pl-4 text-sm">
            <li>Phân loại AI theo mức rủi ro (theo EU AI Act framework).</li>
            <li>Đánh giá tác động AI (AI Impact Assessment) trước triển khai.</li>
            <li>Tuân thủ NĐ 13/2023 về dữ liệu cá nhân.</li>
            <li>Thiết lập quy trình human oversight cho AI rủi ro cao.</li>
            <li>Kiểm toán fairness/bias định kỳ.</li>
            <li>Ghi nhãn rõ ràng khi nội dung do AI tạo.</li>
            <li>Lưu log quyết định AI để truy vết khi có vấn đề.</li>
            <li>Model card và data sheet công khai cho mỗi model production.</li>
            <li>Quy trình incident response và kênh khiếu nại cho người dùng.</li>
          </ol>
        </Callout>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 5 — Thử thách x 2                                      */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
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
        <div className="mt-4">
          <InlineChallenge
            question="Một nền tảng giáo dục dùng AI gợi ý nội dung. Họ muốn thu thập dữ liệu học tập của học sinh dưới 16 tuổi. Vấn đề pháp lý?"
            options={[
              "Không vấn đề vì mục đích giáo dục",
              "Cần đồng ý của phụ huynh/người giám hộ (NĐ 13 + các quy định bảo vệ trẻ em); cân nhắc EU AI Act coi AI trong giáo dục là high-risk",
              "Chỉ cần ghi chú trong điều khoản",
              "Chỉ cần anonymize là đủ",
            ]}
            correct={1}
            explanation="Dữ liệu của trẻ em được bảo vệ nghiêm ngặt hơn ở hầu hết các luật (NĐ 13 tại VN, GDPR Điều 8 tại EU). Cần: đồng ý của phụ huynh, minh bạch về mục đích/thời gian lưu, tối thiểu hoá dữ liệu, cho phép xoá, không dùng cho profiling. EU AI Act còn coi AI giáo dục đánh giá học sinh là high-risk — phải có impact assessment và human oversight."
          />
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 6 — Lý thuyết + Code                                   */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Quản trị AI (AI Governance)</strong>{" "}bao gồm khung pháp lý,
            chính sách và quy trình đảm bảo AI được phát triển và triển khai có
            trách nhiệm — bao phủ cả kiểm soát{" "}
            <TopicLink slug="bias-fairness">bias &amp; fairness</TopicLink>, yêu
            cầu <TopicLink slug="explainability">explainability</TopicLink>{" "}và
            triển khai{" "}
            <TopicLink slug="guardrails">guardrails</TopicLink>{" "}kỹ thuật.
          </p>

          <LaTeX block>
            {"\\text{Risk} = \\text{Likelihood} \\times \\text{Impact} \\times (1 - \\text{Mitigation})"}
          </LaTeX>

          <Callout
            variant="insight"
            title="EU AI Act — Khung quản trị toàn diện nhất"
          >
            <div className="space-y-2">
              <p>
                <strong>Unacceptable risk (Bị cấm):</strong>{" "}Social scoring,
                nhận dạng khuôn mặt real-time nơi công cộng, thao túng hành vi.
              </p>
              <p>
                <strong>High risk (Quy định nghiêm ngặt):</strong>{" "}AI y tế, tín
                dụng, tuyển dụng, giáo dục, tư pháp. Phải: đánh giá tác động,
                giải thích được, human oversight.
              </p>
              <p>
                <strong>Limited risk (Minh bạch):</strong>{" "}Chatbot, deepfake.
                Phải ghi nhãn rõ {"'nội dung do AI tạo'"}.
              </p>
              <p>
                <strong>Minimal risk (Tự do):</strong>{" "}Game AI, spam filter.
                Không yêu cầu đặc biệt.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Quản trị AI tại Việt Nam">
            <div className="space-y-2">
              <p>
                <strong>Nghị định 13/2023/NĐ-CP:</strong>{" "}Bảo vệ dữ liệu cá
                nhân — tương tự GDPR. AI xử lý dữ liệu phải xin đồng ý, bảo mật,
                cho phép xoá/sửa.
              </p>
              <p>
                <strong>Quyết định 127/QĐ-TTg (2021):</strong>{" "}Chiến lược quốc
                gia về AI đến 2030 — phát triển AI có trách nhiệm, xây dựng
                khung pháp lý.
              </p>
              <p>
                <strong>Luật An ninh mạng (2018):</strong>{" "}Quy định lưu trữ dữ
                liệu trong nước, kiểm soát nội dung — ảnh hưởng trực tiếp đến
                triển khai AI.
              </p>
              <p>
                <strong>Xu hướng:</strong>{" "}Việt Nam đang soạn thảo quy định
                riêng cho AI, tham khảo EU AI Act nhưng điều chỉnh cho bối cảnh
                quốc gia.
              </p>
            </div>
          </Callout>

          <Callout
            variant="warning"
            title="Thách thức quản trị AI tại Việt Nam"
          >
            <div className="space-y-1">
              <p>
                Thiếu chuyên gia AI governance — hầu hết doanh nghiệp chưa có vị
                trí AI Ethics Officer.
              </p>
              <p>
                Khung pháp lý đang hình thành — doanh nghiệp cần chủ động tuân
                thủ trước khi bắt buộc.
              </p>
              <p>
                Dữ liệu cross-border: AI dùng cloud nước ngoài (AWS, GCP) vs yêu
                cầu lưu trữ trong nước.
              </p>
            </div>
          </Callout>

          <CodeBlock
            language="python"
            title="Khung tham chiếu AI Governance — định nghĩa tối thiểu"
          >
{`from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional

class RiskTier(str, Enum):
    UNACCEPTABLE = "unacceptable"
    HIGH = "high"
    LIMITED = "limited"
    MINIMAL = "minimal"

@dataclass
class ModelCard:
    name: str
    version: str
    purpose: str
    risk_tier: RiskTier
    limitations: List[str]
    fairness_metrics: dict
    owner: str   # ai ethics officer hoặc team lead
    reviewers: List[str]
    last_audit: str
    model_hash: str

@dataclass
class DataSheet:
    sources: List[str]
    collection_period: str
    consent_basis: str           # NĐ 13 / GDPR Art.6
    pii_fields: List[str]
    protected_attributes: List[str]
    known_biases: List[str]
    retention_days: int

@dataclass
class ImpactAssessment:
    affected_groups: List[str]
    potential_harms: List[str]
    mitigations: List[str]
    approved_by: List[str]

@dataclass
class AIGovernanceRecord:
    model_card: ModelCard
    data_sheet: DataSheet
    impact_assessment: ImpactAssessment
    human_oversight: bool = True
    monitoring_enabled: bool = True
    incident_hotline: Optional[str] = None
    appeals_url: Optional[str] = None
    audit_logs: List[str] = field(default_factory=list)

    def can_go_live(self) -> bool:
        if self.model_card.risk_tier == RiskTier.UNACCEPTABLE:
            return False
        if self.model_card.risk_tier == RiskTier.HIGH:
            return (
                self.human_oversight
                and self.monitoring_enabled
                and bool(self.incident_hotline)
                and bool(self.appeals_url)
                and len(self.impact_assessment.approved_by) >= 2
            )
        return self.monitoring_enabled`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="Kiểm tra công bằng theo nhóm trước khi release"
          >
{`from typing import Dict
import numpy as np

def demographic_parity(
    y_pred: np.ndarray,
    group: np.ndarray,
) -> Dict[str, float]:
    """Tỷ lệ dự đoán dương tính theo từng nhóm — chênh lệch lớn = cảnh báo."""
    result = {}
    for g in np.unique(group):
        mask = group == g
        result[str(g)] = float(np.mean(y_pred[mask] == 1))
    return result

def equalized_odds(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    group: np.ndarray,
) -> Dict[str, Dict[str, float]]:
    """TPR và FPR theo từng nhóm — dùng để so sánh cơ hội giữa các nhóm."""
    out: Dict[str, Dict[str, float]] = {}
    for g in np.unique(group):
        mask = group == g
        yt, yp = y_true[mask], y_pred[mask]
        tpr = float(np.sum((yt == 1) & (yp == 1)) / max(1, np.sum(yt == 1)))
        fpr = float(np.sum((yt == 0) & (yp == 1)) / max(1, np.sum(yt == 0)))
        out[str(g)] = {"tpr": tpr, "fpr": fpr}
    return out

# Ngưỡng cảnh báo: chênh lệch > 0.1 giữa hai nhóm → review trước khi launch
THRESHOLD = 0.1

def fairness_passes(metrics: Dict[str, float]) -> bool:
    values = list(metrics.values())
    return (max(values) - min(values)) <= THRESHOLD`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 7 — Khung pháp lý Việt Nam chi tiết                    */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Khung Việt Nam">
        <div className="space-y-3 text-sm text-foreground">
          <p>
            Ngoài NĐ 13/2023 và QĐ 127/QĐ-TTg, nhiều quy định khác cũng tác
            động tới việc triển khai AI tại Việt Nam:
          </p>
          <ul className="list-inside list-disc space-y-1.5 pl-2 text-sm">
            <li>
              <strong>Luật Giao dịch điện tử (2023):</strong>{" "}quy định chữ ký
              số, hợp đồng điện tử — cần thiết khi AI tự động tạo hợp đồng.
            </li>
            <li>
              <strong>Luật Bảo vệ quyền lợi người tiêu dùng (2023):</strong>{" "}
              yêu cầu minh bạch khi dùng AI trong quảng cáo, khuyến mãi, định
              giá cá nhân hoá.
            </li>
            <li>
              <strong>Luật Sở hữu trí tuệ:</strong>{" "}câu hỏi về bản quyền của
              nội dung do AI tạo, sử dụng tác phẩm làm dữ liệu huấn luyện.
            </li>
            <li>
              <strong>Thông tư 09/2020/TT-NHNN:</strong>{" "}khi AI được ngân hàng
              sử dụng phải đảm bảo an toàn hệ thống thông tin.
            </li>
            <li>
              <strong>Quy định ngành y tế:</strong>{" "}AI chẩn đoán cần được Bộ Y
              tế phê duyệt như thiết bị y tế — quy trình nghiêm ngặt.
            </li>
          </ul>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 8 — Góc sâu (CollapsibleDetail chi tiết về chuẩn)     */}
      {/* ========================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Góc sâu">
        <div className="space-y-3">
          <CollapsibleDetail title="AI Impact Assessment — cần những gì?">
            <p className="text-sm text-muted">
              Impact assessment (IA) là tài liệu bắt buộc với high-risk AI ở EU
              và được khuyến nghị mạnh ở Việt Nam. Một IA đầy đủ gồm:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
              <li>
                <strong>Mô tả hệ thống:</strong>{" "}mục đích, người dùng, phạm
                vi, dữ liệu đầu vào/ra.
              </li>
              <li>
                <strong>Nhóm bị ảnh hưởng:</strong>{" "}ai hưởng lợi, ai có thể
                bị thiệt hại; đặc biệt chú ý nhóm yếu thế.
              </li>
              <li>
                <strong>Rủi ro có thể xảy ra:</strong>{" "}phân tích theo các trục
                công bằng, an toàn, quyền riêng tư, tự chủ.
              </li>
              <li>
                <strong>Biện pháp giảm thiểu:</strong>{" "}kỹ thuật (debiasing,
                guardrails), quy trình (human oversight, appeals).
              </li>
              <li>
                <strong>Rủi ro còn lại:</strong>{" "}sau mitigation, rủi ro nào
                vẫn còn và có chấp nhận được hay không.
              </li>
              <li>
                <strong>Chữ ký phê duyệt:</strong>{" "}ít nhất 2 người chịu trách
                nhiệm; nếu cao hơn, cần hội đồng đạo đức.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="So sánh EU AI Act, US Executive Order và NĐ 13 của Việt Nam">
            <div className="space-y-2 text-sm text-muted">
              <p>
                <strong>EU AI Act (2024):</strong>{" "}khung tiếp cận dựa trên rủi
                ro (risk-based). 4 tầng: unacceptable (cấm), high (quy định
                nghiêm), limited (minh bạch), minimal (tự do). Phạt đến 7% doanh
                thu toàn cầu (hành vi bị cấm) hoặc 3% (vi phạm high-risk).
              </p>
              <p>
                <strong>US Executive Order 14110 (2023):</strong>{" "}tập trung vào
                an toàn quốc gia, bảo vệ người lao động, thúc đẩy cạnh tranh.
                Nhẹ tay hơn EU, dựa nhiều vào tự quản ngành và NIST framework.
              </p>
              <p>
                <strong>Việt Nam (NĐ 13 + các luật liên quan):</strong>{" "}chưa có
                luật AI riêng. Hiện dựa vào dữ liệu cá nhân (NĐ 13), an ninh
                mạng (Luật 2018) và chiến lược quốc gia (QĐ 127). Đang soạn
                thảo khung chuyên biệt, tham khảo EU nhưng điều chỉnh cho bối
                cảnh.
              </p>
              <p>
                Doanh nghiệp có hoạt động quốc tế cần áp dụng mẫu số chung
                nghiêm ngặt nhất (thường là EU) để một lần tuân thủ là đủ cho
                mọi thị trường.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="ISO/IEC 42001:2023 — tiêu chuẩn quốc tế về AI Management System">
            <p className="text-sm text-muted">
              ISO/IEC 42001:2023 là tiêu chuẩn quốc tế <strong>đầu tiên</strong>{" "}
              về hệ thống quản lý AI (AIMS — AI Management System), ban hành
              tháng 12/2023. Tương tự ISO 27001 cho bảo mật thông tin, nó định
              nghĩa cách một tổ chức xây dựng, vận hành và cải tiến liên tục
              quy trình quản trị AI.
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>
                <strong>Cấu trúc theo Annex SL (chung cho các ISO management
                system):</strong>
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>
                  <strong>Clause 4 — Context:</strong> hiểu bối cảnh tổ chức,
                  bên liên quan, phạm vi AIMS.
                </li>
                <li>
                  <strong>Clause 5 — Leadership:</strong> cam kết của ban lãnh
                  đạo, chính sách AI, vai trò và trách nhiệm.
                </li>
                <li>
                  <strong>Clause 6 — Planning:</strong> đánh giá rủi ro AI,
                  đánh giá tác động (AIIA), mục tiêu AI.
                </li>
                <li>
                  <strong>Clause 7 — Support:</strong> tài nguyên, năng lực,
                  nhận thức, truyền thông, tài liệu.
                </li>
                <li>
                  <strong>Clause 8 — Operation:</strong> vòng đời AI từ design
                  → develop → deploy → retire với kiểm soát ở từng giai đoạn.
                </li>
                <li>
                  <strong>Clause 9 — Performance evaluation:</strong> giám sát,
                  đo lường, đánh giá nội bộ, review của lãnh đạo.
                </li>
                <li>
                  <strong>Clause 10 — Improvement:</strong> không phù hợp, hành
                  động khắc phục, cải tiến liên tục.
                </li>
              </ul>
              <p className="mt-2">
                <strong>Annex A (normative) — 38 controls</strong> chia thành 9
                nhóm: chính sách AI, vai trò nội bộ, tài nguyên, đánh giá tác
                động, vòng đời, dữ liệu, thông tin cho bên liên quan, sử dụng AI,
                và quan hệ với bên thứ ba.
              </p>
              <p>
                <strong>Vì sao quan trọng cho doanh nghiệp Việt Nam?</strong>{" "}
                (1) Đối tác quốc tế ngày càng yêu cầu chứng nhận này trong đấu
                thầu. (2) Cấu trúc tương thích EU AI Act — tuân thủ ISO 42001
                giúp đạt phần lớn yêu cầu high-risk AI của EU. (3) Là ngôn ngữ
                chung để trao đổi với regulator. Chứng nhận mất 6-12 tháng, chi
                phí vài trăm triệu đến vài tỷ VND tuỳ quy mô.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="NIST AI Risk Management Framework (AI RMF 1.0) — khung Mỹ">
            <p className="text-sm text-muted">
              NIST AI RMF 1.0 (ban hành 01/2023) là khung quản lý rủi ro AI
              được phát triển bởi Viện Tiêu chuẩn và Công nghệ Quốc gia Hoa Kỳ.
              Khác với EU AI Act (luật bắt buộc), AI RMF là{" "}
              <strong>tự nguyện</strong>{" "}— nhưng được US Executive Order
              14110 tham chiếu như khung chuẩn, khiến nhiều cơ quan liên bang
              và đối tác của họ phải tuân theo trong thực tế.
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>
                <strong>Phần 1 — Foundational Information:</strong> đặc tính
                của AI trustworthy gồm 7 trụ: valid &amp; reliable, safe, secure
                &amp; resilient, accountable &amp; transparent, explainable
                &amp; interpretable, privacy-enhanced, fair with harmful bias
                managed.
              </p>
              <p>
                <strong>Phần 2 — Core (4 chức năng):</strong>
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>
                  <strong>GOVERN:</strong> văn hoá, chính sách, quy trình,
                  trách nhiệm — làm nền cho 3 chức năng kia.
                </li>
                <li>
                  <strong>MAP:</strong> xác định bối cảnh sử dụng, bên liên
                  quan, rủi ro tiềm ẩn theo use case cụ thể.
                </li>
                <li>
                  <strong>MEASURE:</strong> phương pháp định lượng và định tính
                  để đo rủi ro đã xác định — metrics, test, red-team.
                </li>
                <li>
                  <strong>MANAGE:</strong> ưu tiên hoá rủi ro và triển khai
                  biện pháp giảm thiểu, monitoring liên tục, incident response.
                </li>
              </ul>
              <p className="mt-2">
                <strong>AI RMF Playbook:</strong> tài liệu kèm theo với hàng
                trăm action cụ thể cho mỗi category — rất hữu ích làm checklist
                thực thi.
              </p>
              <p>
                <strong>Generative AI Profile (07/2024):</strong> bổ sung 12
                loại rủi ro đặc thù của GenAI (CBRN — vũ khí hoá học/sinh học,
                confabulation, nội dung độc hại, vi phạm quyền dữ liệu, bảo
                mật thông tin, thiên kiến có hại, phụ thuộc, bảo mật, quyền
                sở hữu trí tuệ, nội dung khiêu dâm phi nguyện, nội dung xấu
                độc công khai, chuỗi cung ứng giá trị).
              </p>
              <p>
                <strong>So với ISO 42001:</strong> AI RMF chi tiết hơn về kỹ
                thuật đo lường, ISO 42001 có cấu trúc rõ ràng để chứng nhận.
                Nhiều tổ chức dùng cả hai: RMF cho operation, ISO 42001 cho
                governance layer.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="EU AI Act — Annex III: danh sách high-risk AI chi tiết">
            <p className="text-sm text-muted">
              Annex III của EU AI Act liệt kê cụ thể các use case được xếp vào
              nhóm <strong>high-risk</strong> — đòi hỏi tuân thủ đầy đủ Điều
              9-15 (risk management system, data governance, technical
              documentation, record-keeping, transparency, human oversight,
              accuracy, robustness, cybersecurity).
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>
                <strong>8 nhóm theo Annex III:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-2">
                <li>
                  <strong>Biometrics (ngoài use case bị cấm):</strong> nhận dạng
                  sinh trắc từ xa (không real-time), phân loại sinh trắc theo
                  thuộc tính nhạy cảm, nhận dạng cảm xúc.
                </li>
                <li>
                  <strong>Hạ tầng quan trọng:</strong> AI vận hành lưới điện,
                  giao thông đường bộ/sắt/thuỷ, cấp nước, khí đốt, sưởi ấm.
                </li>
                <li>
                  <strong>Giáo dục và đào tạo nghề:</strong> quyết định tuyển
                  sinh, đánh giá kết quả học tập, giám sát thi cử, phân loại
                  học sinh theo khả năng.
                </li>
                <li>
                  <strong>Việc làm và quản lý lao động:</strong> sàng lọc CV,
                  quảng cáo tuyển dụng có mục tiêu, quyết định thăng chức/sa
                  thải, phân chia nhiệm vụ, giám sát hiệu suất.
                </li>
                <li>
                  <strong>Dịch vụ thiết yếu (công và tư):</strong> đánh giá
                  credit score và từ chối tín dụng, xếp hạng rủi ro trong bảo
                  hiểm y tế và nhân thọ, phân loại ưu tiên cấp cứu 115, đánh
                  giá đủ điều kiện phúc lợi xã hội.
                </li>
                <li>
                  <strong>Thực thi pháp luật:</strong> đánh giá rủi ro tái
                  phạm, phát hiện nói dối (polygraph AI), đánh giá độ tin cậy
                  của bằng chứng, dự đoán tội phạm cá nhân (chú ý — predictive
                  policing profile còn bị cấm trong một số trường hợp).
                </li>
                <li>
                  <strong>Di cư, tị nạn, kiểm soát biên giới:</strong>{" "}
                  polygraph AI cho người di cư, đánh giá rủi ro di cư, hỗ trợ
                  xử lý đơn xin tị nạn/visa, nhận dạng người tại biên giới.
                </li>
                <li>
                  <strong>Tư pháp và dân chủ:</strong> AI hỗ trợ cơ quan tư
                  pháp nghiên cứu và diễn giải luật/sự kiện, AI ảnh hưởng kết
                  quả bầu cử hoặc hành vi cử tri (trừ AI chỉ hỗ trợ hành chính).
                </li>
              </ol>
              <p className="mt-2">
                <strong>Yêu cầu tuân thủ cho high-risk AI:</strong> đánh giá
                hợp quy (conformity assessment) trước khi vào thị trường, đăng
                ký vào EU database, CE marking, hệ thống chất lượng tài liệu,
                post-market monitoring, báo cáo sự cố nghiêm trọng trong 15
                ngày.
              </p>
              <p>
                <strong>Phạt vi phạm:</strong> lên tới 15 triệu EUR hoặc 3%
                doanh thu toàn cầu (lấy giá trị cao hơn) cho vi phạm nghĩa vụ
                cung cấp thông tin high-risk; 35 triệu EUR hoặc 7% cho use
                case bị cấm.
              </p>
              <p>
                <strong>Thời gian áp dụng:</strong> nghĩa vụ cho high-risk AI
                có hiệu lực đầy đủ từ 02/08/2026 (24 tháng sau entry into
                force). Một số nghĩa vụ prohibited practices đã có hiệu lực từ
                02/02/2025.
              </p>
            </div>
          </CollapsibleDetail>
        </div>

        <div className="mt-6 space-y-3">
          <Callout
            variant="info"
            title="ISO 42001 vs NIST AI RMF vs EU AI Act — dùng cái nào?"
          >
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>EU AI Act</strong> — luật bắt buộc nếu AI của bạn được
                đưa ra thị trường EU hoặc ảnh hưởng người dùng EU. Không có
                lựa chọn &quot;không tuân thủ&quot;.
              </li>
              <li>
                <strong>ISO/IEC 42001</strong> — chuẩn chứng nhận tự nguyện,
                giúp hệ thống hoá quản trị AI nội bộ và chứng minh với đối
                tác. Bổ trợ rất tốt cho EU AI Act.
              </li>
              <li>
                <strong>NIST AI RMF</strong> — khung tư vấn kỹ thuật, rất chi
                tiết về đo lường rủi ro. Dùng làm sổ tay cho kỹ sư. Bắt buộc
                cho nhà thầu liên bang Mỹ.
              </li>
              <li>
                <strong>Thực tế:</strong> doanh nghiệp lớn thường dùng cả ba —
                EU AI Act làm ranh giới pháp lý, ISO 42001 làm khung chứng
                nhận, NIST AI RMF làm sổ tay thực thi.
              </li>
            </ul>
          </Callout>

          <Callout
            variant="insight"
            title="Checklist tuân thủ chéo — một hành động, ba khung"
          >
            <p className="text-sm mb-2">
              Dưới đây là các hành động đơn lẻ giúp bạn tuân thủ cùng lúc
              EU AI Act, ISO 42001 và NIST AI RMF:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Lập danh mục (inventory) mọi AI đang dùng</strong>{" "}— EU
                AI Act Điều 49 (đăng ký), ISO 42001 Clause 4.3 (phạm vi), NIST
                AI RMF MAP-1.
              </li>
              <li>
                <strong>AI Impact Assessment cho từng use case</strong>{" "}— EU
                AI Act Điều 27 (FRIA), ISO 42001 Clause 6.1 (rủi ro &amp; cơ
                hội), NIST AI RMF MAP-5.
              </li>
              <li>
                <strong>Model card &amp; data sheet</strong>{" "}— EU AI Act Điều
                11 (technical documentation), ISO 42001 Annex A.6, NIST AI RMF
                GOVERN-1.4.
              </li>
              <li>
                <strong>Human oversight &amp; kill-switch</strong>{" "}— EU AI Act
                Điều 14, ISO 42001 Annex A.8, NIST AI RMF MANAGE-2.4.
              </li>
              <li>
                <strong>Giám sát sau triển khai (post-market)</strong>{" "}— EU AI
                Act Điều 72, ISO 42001 Clause 9.1, NIST AI RMF MEASURE-3.
              </li>
            </ul>
          </Callout>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 9 — Tóm tắt                                            */}
      {/* ========================================================= */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Governance"
          points={[
            "Quản trị AI = luật giao thông cho AI: không cấm, mà đảm bảo an toàn và trách nhiệm.",
            "Năm nguyên tắc: Privacy, Fairness, Transparency, Accountability, Safety — liên kết lẫn nhau.",
            "EU AI Act phân 4 mức rủi ro: cấm, cao (y tế/tín dụng), hạn chế (chatbot), tối thiểu (game).",
            "Việt Nam: NĐ 13 bảo vệ dữ liệu, QĐ 127 chiến lược AI, Luật An ninh mạng — đang soạn quy định riêng.",
            "Model card + data sheet + impact assessment là ba tài liệu cốt lõi cho mọi AI triển khai.",
            "Doanh nghiệp nên chủ động tuân thủ TRƯỚC khi bắt buộc — đây là lợi thế cạnh tranh, không chỉ chi phí.",
          ]}
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* Bước 10 — Kiểm tra                                          */}
      {/* ========================================================= */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Ghi chú phát triển — dành cho maintainer
//
// 1. Sơ đồ 5 nguyên tắc dùng SVG thuần, không dùng lib thêm. Nếu sau này
//    cần hoạt ảnh phức tạp hơn (node drag, layout tự động), cân nhắc dùng
//    reactflow hoặc d3-force — nhưng chỉ khi thực sự cần, vì bundle size
//    của reactflow khá nặng.
//
// 2. Các kết nối (connections) được khai báo trong dữ liệu PRINCIPLES. Thứ
//    tự không quan trọng, vì mã deduplicate bằng key sắp xếp.
//
// 3. Màu của từng principle được chọn có ý đồ: blue = dữ liệu/privacy,
//    green = fairness/công bằng (đồng đều), amber = transparency (ánh sáng),
//    purple = accountability (trang nghiêm), red = safety (báo động). Khi
//    đổi màu nhớ giữ nhất quán với các topic khác trong cùng category.
//
// 4. Quiz có 8 câu — mix multiple choice & fill-blank. Nếu muốn thêm case
//    study dài, nên tạo Topic riêng thay vì nhồi nhét vào đây.
//
// 5. CodeBlock Python ở đây là SKELETON — khi đưa vào production, hãy tách
//    thành package riêng và test đầy đủ. Không copy y nguyên vào hệ thống
//    thật mà không review.
//
// 6. 2 CollapsibleDetail ở bước 8 — có thể mở rộng thêm về "AI liability
//    directive" của EU nếu cần, nhưng giữ ở 2 để không làm loãng.
//
// 7. Khi cần cập nhật luật pháp Việt Nam, kiểm tra lại ngày: NĐ 13 có hiệu
//    lực từ 01/07/2023, QĐ 127 ban hành 26/01/2021. EU AI Act có hiệu lực
//    theo lộ trình từ 08/2024 với các mốc tới 2026.
//
// 8. Thanh ProgressSteps ở đầu trang đồng bộ với TOTAL_STEPS — nếu thêm
//    bước thì nhớ thêm nhãn tương ứng.
//
// 9. Các nhãn chữ Việt trong SVG dùng foreignObject + div để tận dụng khả
//    năng tự xuống dòng của HTML; nếu gặp vấn đề về render trên một số
//    browser cũ, đổi lại text với tspan.
//
// 10. Metadata không được đổi — routing và mục lục phụ thuộc vào slug và
//     các related slugs.
//
// ---------------------------------------------------------------------------
// Phụ lục A — Vai trò và RACI mẫu cho AI project
//
// AI Ethics Officer:
//   - Owner của AI governance tổng thể
//   - Phê duyệt impact assessment
//   - Báo cáo ban lãnh đạo hằng quý
//
// Product Owner:
//   - Chịu trách nhiệm về use case & người dùng
//   - Chuẩn bị model card & data sheet cùng với ML team
//
// ML Lead:
//   - Kỹ thuật: chọn model, giám sát metric
//   - Phối hợp với data privacy team về PII
//
// Data Protection Officer (DPO):
//   - Tuân thủ NĐ 13 / GDPR
//   - Xử lý yêu cầu từ người dùng (xoá, sửa, xuất)
//
// Security Lead:
//   - Mã hoá, RBAC, red-team
//   - Incident response kỹ thuật
//
// Legal Counsel:
//   - Tư vấn hợp đồng, tuân thủ luật
//   - Đánh giá rủi ro pháp lý
//
// ---------------------------------------------------------------------------
// Phụ lục B — Quy trình incident response mẫu khi AI gây hại
//
// T+0: Phát hiện qua monitoring / khiếu nại / báo chí
//   → Alert đến AI Ethics Officer + ML Lead + PR
//
// T+1 giờ: Kích hoạt kill-switch hoặc rollback model
//   → Chuyển sang baseline (rule-based) hoặc human-in-the-loop
//
// T+4 giờ: Thành lập incident team
//   → Ethics Officer chủ trì, có legal và PR
//
// T+24 giờ: Root cause analysis sơ bộ
//   → Dữ liệu, model, triển khai, hay hành vi người dùng?
//
// T+72 giờ: Thông báo chính thức
//   → Cho người bị ảnh hưởng, nhà chức trách (nếu luật yêu cầu), công chúng
//
// T+1 tuần: Biện pháp khắc phục
//   → Sửa model, cập nhật quy trình, đào tạo lại nhân sự nếu cần
//
// T+1 tháng: Post-mortem không đổ lỗi
//   → Rút bài học, cập nhật checklist, chia sẻ với cộng đồng
//
// ---------------------------------------------------------------------------
// Phụ lục C — Kỹ thuật minh bạch: Model card & Data sheet
//
// Model card thường có các mục (theo Mitchell et al. 2019):
//   (1) Model details: người tạo, ngày, phiên bản, kiến trúc, license
//   (2) Intended use: use case chính, người dùng, out-of-scope use
//   (3) Factors: điều kiện liên quan đến performance (nhóm, môi trường)
//   (4) Metrics: metric được chọn, vì sao, kèm confidence interval
//   (5) Evaluation data: mô tả tập đánh giá, cách chọn
//   (6) Training data: mô tả tập huấn luyện, xử lý
//   (7) Quantitative analyses: kết quả chia theo nhóm
//   (8) Ethical considerations: rủi ro đã biết
//   (9) Caveats and recommendations: hạn chế & khuyến nghị
//
// Data sheet for datasets (Gebru et al. 2018) đi sâu về dữ liệu:
//   (1) Motivation: vì sao dataset được tạo
//   (2) Composition: cấu trúc, loại instance, số lượng
//   (3) Collection process: ai thu thập, bằng cách nào
//   (4) Preprocessing/cleaning: đã làm gì
//   (5) Uses: các use đã và chưa được thử
//   (6) Distribution: phát hành ra sao, license
//   (7) Maintenance: ai bảo trì, có cập nhật không
//
// Hai tài liệu này đi đôi với nhau — model card nói "model làm được gì",
// data sheet nói "dữ liệu đến từ đâu". Cùng nhau chúng là xương sống của
// minh bạch.
//
// ---------------------------------------------------------------------------
// Phụ lục D — Các anti-pattern cần tránh
//
//   (a) "Ethics washing": dùng từ ngữ đạo đức làm marketing mà không có
//       quy trình thật bên trong.
//
//   (b) "Last-minute compliance": đợi sát deadline release mới làm impact
//       assessment — vừa tốn, vừa nhiều khả năng bỏ qua lỗ hổng.
//
//   (c) "Box ticking": coi checklist là cho xong việc, không thực sự hiểu
//       rủi ro. Checklist tốt cần kèm đánh giá chất lượng.
//
//   (d) "Owner rỗng": ai cũng chịu trách nhiệm = không ai chịu trách nhiệm.
//       Cần một người tên cụ thể cho từng rủi ro.
//
//   (e) "Fire and forget": làm governance lúc release rồi không bao giờ
//       nhìn lại. Audit định kỳ (6 tháng hoặc 1 năm) là bắt buộc.
//
//   (f) "Không dạy gì cho nhân viên": kỹ sư không hiểu EU AI Act là gì,
//       quản lý không hiểu concept drift. Đào tạo là một phần của
//       governance.
//
// ---------------------------------------------------------------------------
// Kết — mục tiêu của bài học
//
// Sau khi hoàn thành chuỗi bước ở trên, người học nên có thể:
//   1. Giải thích được 5 nguyên tắc nền của AI governance.
//   2. Phân loại một use case AI theo 4 mức rủi ro của EU AI Act.
//   3. Liệt kê các yêu cầu pháp lý chính ở Việt Nam (NĐ 13, QĐ 127, Luật
//      An ninh mạng) và cách chúng ảnh hưởng đến AI.
//   4. Soạn model card, data sheet, impact assessment cơ bản.
//   5. Thiết kế quy trình incident response khi AI gây hại.
//   6. Nhận ra các anti-pattern (ethics washing, last-minute compliance,
//      box ticking).
//
// Quản trị AI không phải là gánh nặng — nó là cách để AI thực sự hữu ích
// cho xã hội và bền vững cho doanh nghiệp.
// ---------------------------------------------------------------------------
