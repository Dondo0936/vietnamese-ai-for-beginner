"use client";

// AI Governance — Luật giao thông cho trí tuệ nhân tạo.
// Bản viết cho dân văn phòng Việt Nam: manager, pháp chế, IT lead.
// Không code, không công thức, tối đa tương tác trực quan.

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Globe2,
  Landmark,
  Factory,
  Database,
  Cpu,
  Rocket,
  Eye,
  LifeBuoy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  LessonSection,
  TabView,
  ToggleCompare,
  DragDrop,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// Metadata — KHÔNG ĐỔI. Routing + registry phụ thuộc vào các trường này.
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

//Dữ liệu Demo 1 — Policy Stack (4 tầng quy định chồng lên nhau)
interface PolicyLayer {
  id: string;
  label: string;
  scope: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  tint: string;
  items: Array<{ name: string; note: string }>;
}

const POLICY_LAYERS: PolicyLayer[] = [
  {
    id: "global",
    label: "Quốc tế",
    scope: "Hiệu lực xuyên biên giới — áp dụng cho công ty xuất khẩu dịch vụ AI",
    icon: Globe2,
    color: "#3b82f6",
    tint: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
    items: [
      { name: "EU AI Act (2024)", note: "Luật AI toàn diện đầu tiên thế giới. Phân 4 mức rủi ro, phạt tới 7% doanh thu toàn cầu." },
      { name: "OECD AI Principles", note: "5 nguyên tắc do 46 quốc gia ký: bao trùm, giá trị con người, minh bạch, vững vàng, trách nhiệm." },
      { name: "ISO/IEC 42001:2023", note: "Tiêu chuẩn quốc tế đầu tiên về AI Management System — đối tác quốc tế hay yêu cầu." },
      { name: "NIST AI RMF (Mỹ)", note: "Khung quản lý rủi ro tự nguyện nhưng bắt buộc với nhà thầu liên bang Hoa Kỳ." },
    ],
  },
  {
    id: "national",
    label: "Quốc gia (Việt Nam)",
    scope: "Luật pháp Việt Nam — mọi doanh nghiệp hoạt động trong nước phải tuân thủ",
    icon: Landmark,
    color: "#a855f7",
    tint: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700",
    items: [
      { name: "Nghị định 13/2023/NĐ-CP", note: "Bảo vệ dữ liệu cá nhân — phiên bản GDPR Việt Nam. AI xử lý dữ liệu phải xin đồng ý." },
      { name: "Luật An ninh mạng (2018)", note: "Lưu trữ dữ liệu trong nước, kiểm soát nội dung — ảnh hưởng nơi đặt hạ tầng AI." },
      { name: "Quyết định 127/QĐ-TTg (2021)", note: "Chiến lược quốc gia về AI đến 2030 — định hướng AI có trách nhiệm." },
      { name: "Luật Giao dịch điện tử (2023)", note: "Chữ ký số, hợp đồng điện tử — áp dụng khi AI tự động tạo hoặc ký hợp đồng." },
    ],
  },
  {
    id: "industry",
    label: "Ngành",
    scope: "Quy định theo lĩnh vực — ngân hàng, y tế, bảo hiểm có thêm lớp riêng",
    icon: Factory,
    color: "#f59e0b",
    tint: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700",
    items: [
      { name: "Tài chính — Thông tư 09/2020/TT-NHNN", note: "Ngân hàng dùng AI chấm điểm tín dụng/chống gian lận phải đảm bảo an toàn hệ thống." },
      { name: "Y tế — Bộ Y tế phê duyệt", note: "AI chẩn đoán phải được cấp phép như thiết bị y tế. Tài liệu đầy đủ, quy trình nghiêm." },
      { name: "Bảo hiểm — Luật KDBH", note: "AI định giá, duyệt bồi thường phải minh bạch, cho khách quyền khiếu nại." },
      { name: "Quảng cáo & tiêu dùng", note: "Luật BVQL người tiêu dùng (2023) buộc minh bạch khi AI cá nhân hoá giá/khuyến mãi." },
    ],
  },
  {
    id: "company",
    label: "Công ty",
    scope: "Chính sách nội bộ — do từng doanh nghiệp tự xây, thường chặt hơn luật",
    icon: Building2,
    color: "#22c55e",
    tint: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700",
    items: [
      { name: "AI Acceptable Use Policy", note: "Nhân viên được dùng ChatGPT/Claude cho việc gì, không được dán dữ liệu nào vào chat." },
      { name: "Hội đồng đạo đức AI", note: "3-7 người (IT, pháp chế, kinh doanh, nhân sự) duyệt dự án AI rủi ro cao trước triển khai." },
      { name: "Incident response playbook", note: "Khi AI lỗi — ai gọi, tắt hệ thống trong bao lâu, thông báo khách hàng ra sao." },
      { name: "Data retention & logging", note: "Giữ log prompt/response bao lâu, ai được xem, xoá khi khách yêu cầu trong bao nhiêu ngày." },
    ],
  },
];

//Dữ liệu Demo 2 — Drag-drop xếp use case AI vào 4 mức rủi ro EU AI Act
const RISK_USE_CASES = [
  { id: "spam-filter", label: "Lọc email spam nội bộ" },
  { id: "chatbot-fyi", label: "Chatbot trả lời FAQ sản phẩm" },
  { id: "hiring-cv", label: "AI sàng lọc CV tuyển dụng" },
  { id: "loan-scoring", label: "Chấm điểm duyệt vay ngân hàng" },
  { id: "medical-dx", label: "AI hỗ trợ chẩn đoán hình ảnh y khoa" },
  { id: "social-score", label: "Chấm điểm xã hội công dân" },
  { id: "emotion-work", label: "AI nhận diện cảm xúc nhân viên tại nơi làm" },
  { id: "content-rec", label: "Gợi ý sản phẩm trên website" },
];

const RISK_ZONES = [
  {
    id: "minimal",
    label: "Minimal — tự do",
    accepts: ["spam-filter", "content-rec"],
  },
  {
    id: "limited",
    label: "Limited — cần minh bạch",
    accepts: ["chatbot-fyi"],
  },
  {
    id: "high",
    label: "High — quy định nghiêm ngặt",
    accepts: ["hiring-cv", "loan-scoring", "medical-dx"],
  },
  {
    id: "unacceptable",
    label: "Unacceptable — bị cấm",
    accepts: ["social-score", "emotion-work"],
  },
];

//Dữ liệu Demo 3 — Policy template builder (toggle 4 yếu tố → compliance score)
interface PolicyElement {
  id: string;
  label: string;
  description: string;
  weight: number;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const POLICY_ELEMENTS: PolicyElement[] = [
  {
    id: "retention",
    label: "Giới hạn lưu trữ dữ liệu",
    description: "Xoá log prompt/response sau 30 ngày, trừ khi có lý do pháp lý cụ thể.",
    weight: 20,
    icon: Database,
  },
  {
    id: "logging",
    label: "Audit log đầy đủ",
    description: "Mọi yêu cầu AI ghi lại: ai dùng, lúc nào, để làm gì, kết quả ra sao.",
    weight: 25,
    icon: Eye,
  },
  {
    id: "review",
    label: "Human review cho rủi ro cao",
    description: "Quyết định AI ảnh hưởng tới cá nhân (tuyển dụng, vay, y tế) phải có con người duyệt lại.",
    weight: 35,
    icon: ShieldCheck,
  },
  {
    id: "optout",
    label: "Cho phép khách hàng từ chối AI",
    description: "Khách có quyền yêu cầu xử lý bởi con người thay vì AI, không bị thiệt thòi khi từ chối.",
    weight: 20,
    icon: LifeBuoy,
  },
];

//Dữ liệu 5 trụ cột quản trị AI — dùng cho ExplanationSection
const PILLARS = [
  {
    id: "data",
    label: "Dữ liệu",
    icon: Database,
    color: "#3b82f6",
    summary: "Nguồn gốc rõ ràng, tuân thủ NĐ 13, xin đồng ý, cho phép xoá.",
  },
  {
    id: "model",
    label: "Mô hình",
    icon: Cpu,
    color: "#a855f7",
    summary: "Model card công khai, đánh giá bias, kiểm toán định kỳ.",
  },
  {
    id: "deploy",
    label: "Triển khai",
    icon: Rocket,
    color: "#22c55e",
    summary: "Impact assessment trước go-live, ghi nhãn rõ 'AI tạo ra', phê duyệt 2 cấp.",
  },
  {
    id: "monitor",
    label: "Giám sát",
    icon: Eye,
    color: "#f59e0b",
    summary: "Dashboard drift, fairness metric theo nhóm, báo cáo hàng quý cho lãnh đạo.",
  },
  {
    id: "incident",
    label: "Sự cố",
    icon: LifeBuoy,
    color: "#ef4444",
    summary: "Kill-switch, quy trình T+1h/T+24h/T+72h, kênh khiếu nại cho khách hàng.",
  },
];

//Quiz 8 câu — mix MCQ + fill-blank
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "Ngân hàng ABC muốn dùng AI chấm điểm tín dụng. Theo khung EU AI Act, đây là mức rủi ro nào?",
    options: [
      "Minimal — không cần tuân thủ đặc biệt",
      "Limited — chỉ cần ghi nhãn 'có AI tham gia'",
      "High — bắt buộc đánh giá tác động, giải thích được, human oversight, kiểm toán định kỳ",
      "Unacceptable — bị cấm hoàn toàn",
    ],
    correct: 2,
    explanation:
      "AI tín dụng ảnh hưởng trực tiếp tới quyền tiếp cận dịch vụ tài chính của cá nhân — EU AI Act xếp vào high-risk. Ngân hàng phải: (1) impact assessment trước go-live, (2) giải thích được quyết định cho khách, (3) có người duyệt lại, (4) kiểm toán fairness 6-12 tháng/lần. Vi phạm phạt tới 3% doanh thu toàn cầu.",
  },
  {
    question:
      "Nghị định 13/2023/NĐ-CP ảnh hưởng như thế nào khi công ty dùng ChatGPT xử lý email khách hàng?",
    options: [
      "Không ảnh hưởng — NĐ 13 chỉ quản dữ liệu, không quản AI",
      "Phải xin đồng ý khách hàng, thông báo mục đích xử lý, cho phép rút lại, bảo mật dữ liệu, thông báo khi vi phạm",
      "Cấm hoàn toàn không được dán email khách vào AI",
      "Chỉ áp dụng cho công ty có vốn nước ngoài",
    ],
    correct: 1,
    explanation:
      "NĐ 13 = GDPR Việt Nam. Email khách hàng chứa dữ liệu cá nhân (tên, địa chỉ, số điện thoại) — mọi xử lý bởi AI (bao gồm đưa vào ChatGPT) phải: đồng ý rõ ràng, mục đích cụ thể, cho phép xoá, bảo mật, thông báo nếu có sự cố. Vi phạm phạt tới 100 triệu VND cho cá nhân, cao hơn cho tổ chức.",
  },
  {
    question:
      "Tại sao doanh nghiệp nên đầu tư vào AI governance dù chưa có luật bắt buộc ở Việt Nam?",
    options: [
      "Chỉ tốn thêm chi phí không có lợi ích",
      "Tránh rủi ro pháp lý tương lai, xây niềm tin khách, phát hiện bias sớm, đối tác quốc tế thường yêu cầu",
      "Chỉ cần thiết cho công ty trên 1000 nhân viên",
      "Không cần nếu AI đã được huấn luyện tốt",
    ],
    correct: 1,
    explanation:
      "AI governance = đầu tư bảo hiểm. (1) Luật Việt Nam về AI đang soạn thảo — doanh nghiệp chủ động sẽ chuyển đổi dễ hơn. (2) Khách hàng ngày càng chú ý quyền riêng tư. (3) Bias phát hiện sớm rẻ hơn khi đã gây thiệt hại. (4) Đối tác EU/Mỹ gần như luôn yêu cầu tài liệu governance khi ký hợp đồng lớn.",
  },
  {
    type: "fill-blank",
    question:
      "Một khung quản trị AI doanh nghiệp hoàn chỉnh luôn gồm hai phần: các {blank} nội bộ do công ty tự đặt, và mức {blank} với luật bên ngoài như NĐ 13 hoặc EU AI Act.",
    blanks: [
      { answer: "chính sách", accept: ["policy", "quy định", "policies"] },
      {
        answer: "tuân thủ",
        accept: ["compliance", "compliant", "tuân thủ pháp luật"],
      },
    ],
    explanation:
      "Hai nửa không thay thế được cho nhau. Chính sách = do công ty chủ động đặt, thường nghiêm hơn luật. Tuân thủ = đáp ứng bắt buộc từ bên ngoài. Công ty giỏi có cả hai rõ ràng, dễ chứng minh với thanh tra và với đối tác.",
  },
  {
    question:
      "Chatbot của công ty bán lẻ trả lời sai về chính sách đổi trả, khiến khách hàng bị thiệt. Ai chịu trách nhiệm chính?",
    options: [
      "OpenAI/Anthropic — vì họ xây mô hình nền",
      "Công ty triển khai chatbot (deployer) — kèm nhà cung cấp mô hình theo hợp đồng. Công ty chịu trách nhiệm với khách hàng trước tiên",
      "Không ai — AI tự quyết định, không ai chịu",
      "Khách hàng — vì đã tin lời AI",
    ],
    correct: 1,
    explanation:
      "Theo EU AI Act và hầu hết khung pháp lý, 'deployer' (bên triển khai cho người dùng cuối) chịu trách nhiệm chính với khách hàng. Công ty cần: (a) model card của vendor, (b) test riêng trên use case của mình, (c) giám sát liên tục, (d) kênh khiếu nại rõ ràng. Phần nhà cung cấp mô hình chịu được phân định qua hợp đồng.",
  },
  {
    question:
      "Công ty HR dùng AI sàng lọc CV. Sau 6 tháng phát hiện AI loại CV nữ nhiều hơn nam dù trình độ tương đương. Bước ĐẦU TIÊN đúng là gì?",
    options: [
      "Im lặng, tiếp tục sử dụng vì 'chưa ai phàn nàn'",
      "Tạm dừng hệ thống, khởi động incident response: audit nguyên nhân, thông báo ứng viên bị ảnh hưởng, sửa model và tái kiểm định",
      "Đổ lỗi cho thuật toán, tiếp tục chạy",
      "Tăng tốc độ xử lý để bù lại",
    ],
    correct: 1,
    explanation:
      "AI tuyển dụng là high-risk theo EU AI Act. Khi phát hiện bias: (1) tạm dừng để ngưng gây hại, (2) audit nguyên nhân (dữ liệu lệch? feature nào gây ra?), (3) thông báo cho ứng viên bị ảnh hưởng, (4) sửa và tái kiểm định, (5) báo cáo lên lãnh đạo. Pattern 'phát hiện → khắc phục → báo cáo' là xương sống của accountability.",
  },
  {
    question:
      "Model card và data sheet có tác dụng gì trong quản trị AI doanh nghiệp?",
    options: [
      "Chỉ là tài liệu marketing để khoe với khách",
      "Là tài liệu minh bạch bắt buộc: model card mô tả mục đích/hạn chế/metric, data sheet mô tả nguồn/cách thu thập/biases của dữ liệu",
      "Chỉ cần cho model nghiên cứu, sản phẩm thương mại không cần",
      "Là tài liệu nội bộ, không được chia sẻ ra ngoài",
    ],
    correct: 1,
    explanation:
      "Model card và data sheet là hai tài liệu minh bạch chuẩn quốc tế. Chúng giúp: (a) người triển khai hiểu giới hạn để dùng đúng, (b) thanh tra kiểm tra nhanh, (c) khách hàng biết AI hoạt động ra sao. EU AI Act yêu cầu cụ thể cho high-risk AI. Đối tác quốc tế cũng thường xin hai tài liệu này khi due diligence.",
  },
  {
    question:
      "Theo EU AI Act, use case nào sau đây bị xếp vào 'unacceptable risk' (bị cấm hoàn toàn)?",
    options: [
      "Model quá lớn (trên 100 tỷ tham số)",
      "Thao túng hành vi dưới ngưỡng nhận thức, social scoring quy mô nhà nước, nhận diện khuôn mặt real-time nơi công cộng (trừ ngoại lệ an ninh hẹp), nhận diện cảm xúc tại nơi làm việc",
      "Chạy trên hạ tầng cloud nước ngoài",
      "Huấn luyện trên hơn 1 triệu điểm dữ liệu",
    ],
    correct: 1,
    explanation:
      "Các use case BỊ CẤM gồm: (1) thao túng hành vi dưới ngưỡng nhận thức gây hại, (2) social scoring quy mô nhà nước, (3) real-time biometric identification công cộng (trừ ngoại lệ có lệnh toà), (4) nhận diện cảm xúc tại nơi làm việc/giáo dục, (5) phân loại sinh trắc suy diễn chủng tộc/tôn giáo/xu hướng tình dục. Kích cỡ hay nơi chạy không phải tiêu chí.",
  },
];

//Component phụ — Thẻ lớp Policy Stack (dùng trong TabView)
function PolicyLayerPanel({ layer }: { layer: PolicyLayer }) {
  const Icon = layer.icon;
  return (
    <motion.div
      key={layer.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      <div className={`rounded-lg border p-3 ${layer.tint}`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={18} className="shrink-0" style={{ color: layer.color }} />
          <span className="font-semibold text-sm text-foreground">
            {layer.label}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{layer.scope}</p>
      </div>
      <ul className="space-y-2">
        {layer.items.map((item) => (
          <li
            key={item.name}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-start gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {item.name}
                </div>
                <div className="text-xs text-muted mt-0.5 leading-relaxed">
                  {item.note}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

//Component phụ — Sơ đồ Policy Stack (SVG xếp chồng)
function PolicyStackDiagram({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 520 260"
      className="mx-auto w-full max-w-xl"
      role="img"
      aria-label="Sơ đồ 4 tầng quy định AI xếp chồng"
    >
      {POLICY_LAYERS.map((layer, i) => {
        const y = 20 + i * 55;
        const isActive = layer.id === active;
        return (
          <g
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className="cursor-pointer"
            role="button"
            aria-label={`Chọn tầng ${layer.label}`}
          >
            <motion.rect
              x={40}
              y={y}
              width={440}
              height={45}
              rx={8}
              fill={isActive ? layer.color : "#1e293b"}
              fillOpacity={isActive ? 0.85 : 0.3}
              stroke={layer.color}
              strokeWidth={isActive ? 2.5 : 1.5}
              initial={false}
              animate={{
                fillOpacity: isActive ? 0.85 : 0.3,
                strokeWidth: isActive ? 2.5 : 1.5,
              }}
              transition={{ duration: 0.25 }}
            />
            <text
              x={60}
              y={y + 22}
              fill={isActive ? "#ffffff" : "#e2e8f0"}
              fontSize={14}
              fontWeight={isActive ? 700 : 500}
            >
              {layer.label}
            </text>
            <text
              x={60}
              y={y + 38}
              fill={isActive ? "#ffffff" : "#94a3b8"}
              fontSize={11}
              opacity={0.85}
            >
              {layer.scope.substring(0, 62)}
              {layer.scope.length > 62 ? "..." : ""}
            </text>
            {isActive && (
              <motion.circle
                cx={460}
                cy={y + 22}
                r={6}
                fill="#ffffff"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

//Component phụ — Policy Template Builder
function PolicyBuilder() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const score = useMemo(() => {
    let total = 0;
    for (const el of POLICY_ELEMENTS) {
      if (selected.has(el.id)) total += el.weight;
    }
    return total;
  }, [selected]);

  const scoreColor =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    score >= 80
      ? "Đầy đủ — sẵn sàng ký với đối tác quốc tế"
      : score >= 50
        ? "Cơ bản — chạy được nội bộ, chưa đủ cho đối tác EU/Mỹ"
        : score >= 20
          ? "Yếu — rủi ro pháp lý và niềm tin khách hàng"
          : "Thiếu — gần như không có governance";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Chọn các thành phần bạn muốn đưa vào chính sách AI của công ty. Mỗi lựa
        chọn nâng điểm tuân thủ. Điểm 80+ thường đủ cho due diligence với đối
        tác quốc tế.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {POLICY_ELEMENTS.map((el) => {
          const active = selected.has(el.id);
          const Icon = el.icon;
          return (
            <button
              key={el.id}
              type="button"
              onClick={() => toggle(el.id)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                active
                  ? "border-accent bg-accent-light"
                  : "border-border bg-card hover:border-accent/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    active ? "bg-accent text-white" : "bg-surface text-muted"
                  }`}
                >
                  {active ? <CheckCircle2 size={14} /> : <Icon size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {el.label}{" "}
                    <span className="text-xs text-muted">(+{el.weight})</span>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {el.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Điểm tuân thủ
          </span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {score}/100
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p
          className="text-xs mt-2 font-medium"
          style={{ color: scoreColor }}
        >
          {scoreLabel}
        </p>
      </div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                Đoạn chính sách được sinh ra
              </div>
              <div className="text-sm text-foreground leading-relaxed space-y-1.5">
                <p>
                  <strong>Chính sách sử dụng AI — Công ty ABC.</strong>
                </p>
                {selected.has("retention") && (
                  <p>
                    1. Mọi dữ liệu prompt/response với AI được lưu tối đa 30
                    ngày, trừ khi có lý do pháp lý buộc giữ lâu hơn.
                  </p>
                )}
                {selected.has("logging") && (
                  <p>
                    2. Mọi tương tác với hệ thống AI được ghi log: người dùng,
                    thời điểm, mục đích, tóm tắt kết quả.
                  </p>
                )}
                {selected.has("review") && (
                  <p>
                    3. Quyết định AI ảnh hưởng trực tiếp tới quyền lợi cá nhân
                    (tuyển dụng, tín dụng, y tế) phải được một nhân sự có thẩm
                    quyền duyệt lại trước khi thi hành.
                  </p>
                )}
                {selected.has("optout") && (
                  <p>
                    4. Khách hàng có quyền yêu cầu xử lý bởi con người thay vì
                    AI. Công ty không phân biệt đối xử với người từ chối AI.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//Component chính
export default function AIGovernanceTopic() {
  const [activeLayer, setActiveLayer] = useState<string>("global");
  const activeLayerData = useMemo(
    () => POLICY_LAYERS.find((l) => l.id === activeLayer) ?? POLICY_LAYERS[0],
    [activeLayer],
  );

  return (
    <>
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Phép so sánh",
            "Ba ô tương tác",
            "Aha",
            "Thử thách",
            "Khung kiến thức",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      {/* Bước 1 — PredictionGate: ai phải OK dùng ChatGPT?            */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Công ty bạn muốn dùng ChatGPT để xử lý dữ liệu khách hàng. Ai là người phải 'OK' quyết định này?"
          options={[
            "Chỉ IT — vì đây là vấn đề kỹ thuật",
            "Chỉ CEO — vì CEO có thẩm quyền cao nhất",
            "Cả IT, pháp chế, CISO (bảo mật) và trưởng bộ phận dữ liệu — cần nhiều góc nhìn",
            "Không ai cần OK — nhân viên tự quyết là được",
          ]}
          correct={2}
          explanation="Một quyết định AI chạm dữ liệu khách hàng có bốn mặt rủi ro: kỹ thuật (IT), pháp lý (pháp chế, NĐ 13), bảo mật (CISO), và chất lượng dữ liệu (data owner). Thiếu bất kỳ mặt nào đều có thể gây sự cố lớn. Đây chính là lý do AI governance tồn tại — tạo quy trình để các quyết định này được xem xét đầy đủ, không phụ thuộc vào một cá nhân."
        />
      </LessonSection>

      {/* Bước 2 — Phép so sánh: luật giao thông                       */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Phép so sánh">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground">
            <strong className="text-accent-dark dark:text-accent">
              Quản trị AI giống luật giao thông
            </strong>{" "}
            — không ngăn bạn lái xe, mà đảm bảo không ai đâm ai, không ai vi
            phạm, và khi có tai nạn thì có bảo hiểm để xử lý. Biển báo, bằng
            lái, đăng kiểm, CSGT, bảo hiểm — mỗi thành phần đều có lý do của
            nó.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-blue-500" />
                <span className="font-semibold text-sm text-foreground">
                  Luật giao thông
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted">
                <li>• Biển báo, đèn giao thông</li>
                <li>• Bằng lái — chứng nhận được phép lái</li>
                <li>• Đăng kiểm — xe an toàn không</li>
                <li>• CSGT — phát hiện vi phạm</li>
                <li>• Bảo hiểm — ai đền khi có tai nạn</li>
              </ul>
            </div>
            <div className="rounded-lg border border-accent bg-accent-light p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-accent" />
                <span className="font-semibold text-sm text-foreground">
                  Quản trị AI
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-foreground">
                <li>• Guardrails, policy sử dụng AI</li>
                <li>• Impact assessment — được phép triển khai không</li>
                <li>• Audit định kỳ — model có an toàn không</li>
                <li>• Monitoring dashboard — phát hiện sự cố</li>
                <li>• Hợp đồng + bảo hiểm trách nhiệm khi AI gây hại</li>
              </ul>
            </div>
          </div>

          <Callout variant="insight" title="Cái gốc của quản trị AI">
            <p>
              Không phải để cấm AI. Là để AI chạy an toàn, có người chịu trách
              nhiệm rõ ràng khi có sự cố, và khách hàng tin tưởng sử dụng.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* Bước 3 — VisualizationSection: 3 demo tương tác              */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Ba ô tương tác">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-8">
            {/* ---------- Demo 1 — Policy Stack Visualizer ---------- */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  1
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Bốn tầng quy định chồng lên doanh nghiệp của bạn
                </h3>
              </div>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                Khi công ty triển khai AI, bốn lớp quy định xếp chồng: quốc tế
                → quốc gia → ngành → nội bộ. Mỗi lớp thêm một lớp ràng buộc.
                Click vào từng tầng để xem các quy định nổi bật.
              </p>
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div>
                  <PolicyStackDiagram
                    active={activeLayer}
                    onSelect={setActiveLayer}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {POLICY_LAYERS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setActiveLayer(l.id)}
                        className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                          l.id === activeLayer
                            ? "border-accent bg-accent-light text-accent-dark"
                            : "border-border bg-surface text-muted hover:text-foreground"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <PolicyLayerPanel layer={activeLayerData} />
              </div>
            </div>

            <hr className="border-border" />

            {/* ---------- Demo 2 — Risk Tier Classifier ---------- */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  2
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Xếp use case AI vào 4 mức rủi ro EU AI Act
                </h3>
              </div>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                EU AI Act phân 4 mức: Minimal (tự do) → Limited (cần minh bạch)
                → High (quy định nghiêm) → Unacceptable (bị cấm). Hãy kéo từng
                use case vào mức bạn nghĩ đúng. Mỗi mức kéo được nhiều mục.
              </p>
              <DragDrop
                items={RISK_USE_CASES}
                zones={RISK_ZONES}
                instruction="Kéo mỗi use case vào đúng mức rủi ro theo EU AI Act."
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-muted">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={14} className="mt-0.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">Minimal:</strong> không
                    ảnh hưởng tới quyền/cơ hội cá nhân. Tự do phát triển.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={14} className="mt-0.5 text-blue-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">Limited:</strong> cần
                    ghi nhãn "có AI tham gia". Ví dụ chatbot, deepfake.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert size={14} className="mt-0.5 text-amber-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">High:</strong> ảnh hưởng
                    tới quyền/cơ hội. Cần impact assessment + human oversight.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 text-red-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">Unacceptable:</strong>{" "}
                    vi phạm giá trị con người. BỊ CẤM — không có ngoại lệ.
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* ---------- Demo 3 — Policy Builder ---------- */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Tự dựng chính sách AI cho công ty — đo điểm tuân thủ
                </h3>
              </div>
              <PolicyBuilder />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* Bước 4 — AhaMoment                                           */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          Quản trị AI không phải là <strong>cái phanh</strong> ngăn công ty
          chạy nhanh. Nó là <strong>cái vô lăng</strong> giúp công ty chạy
          nhanh mà không đâm vào ai. Công ty có governance tốt triển khai AI
          nhanh hơn, an toàn hơn, và ít khủng hoảng truyền thông hơn công ty
          không có.
        </AhaMoment>
      </LessonSection>

      {/* Bước 5 — InlineChallenge                                     */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Startup Việt Nam muốn xuất khẩu sản phẩm AI y tế sang EU. Ngoài chất lượng sản phẩm, họ cần gì?"
          options={[
            "Không cần gì thêm nếu AI hoạt động tốt",
            "Tuân thủ EU AI Act (AI y tế là high-risk): đánh giá rủi ro, giải thích được, kiểm toán, data governance, CE marking",
            "Chỉ cần dịch giao diện sang tiếng Anh",
            "Chỉ cần chứng nhận ISO 27001 về bảo mật thông tin",
          ]}
          correct={1}
          explanation="AI y tế là high-risk theo EU AI Act. Cần: (1) impact assessment đầy đủ, (2) hệ thống giải thích quyết định, (3) data governance theo GDPR, (4) kiểm toán định kỳ, (5) CE marking như thiết bị y tế. Rào cản cao nhưng cũng là lợi thế cạnh tranh nếu tuân thủ sớm hơn đối thủ."
        />
        <div className="mt-4">
          <InlineChallenge
            question="Nền tảng giáo dục dùng AI gợi ý nội dung, muốn thu thập dữ liệu học tập của học sinh dưới 16 tuổi. Vấn đề pháp lý?"
            options={[
              "Không vấn đề gì vì mục đích giáo dục",
              "Cần đồng ý của phụ huynh/người giám hộ theo NĐ 13; AI giáo dục đánh giá học sinh còn là high-risk theo EU AI Act",
              "Chỉ cần ghi chú trong điều khoản sử dụng",
              "Chỉ cần ẩn danh dữ liệu là đủ",
            ]}
            correct={1}
            explanation="Dữ liệu trẻ em được bảo vệ chặt chẽ ở hầu hết luật: NĐ 13 (VN) và GDPR Điều 8 (EU). Cần đồng ý phụ huynh, minh bạch mục đích/thời gian lưu, tối thiểu hoá dữ liệu, cho phép xoá, không dùng cho profiling. EU AI Act coi AI giáo dục đánh giá học sinh là high-risk — buộc có impact assessment và human oversight."
          />
        </div>
      </LessonSection>

      {/* Bước 6 — ExplanationSection (visual-heavy)                   */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Khung kiến thức">
        <ExplanationSection topicSlug={metadata.slug}>
          {/* ---------- 6a. Bốn khung pháp lý chính — Callout cards ---------- */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Bốn khung pháp lý quan trọng nhất để biết
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Callout variant="info" title="EU AI Act (2024)">
                <p>
                  Luật AI toàn diện đầu tiên thế giới. Phân 4 mức rủi ro.
                  Phạt tới 7% doanh thu toàn cầu. Ảnh hưởng mọi công ty bán
                  dịch vụ AI vào thị trường EU.
                </p>
              </Callout>
              <Callout variant="insight" title="NIST AI RMF (Mỹ, 2023)">
                <p>
                  Khung quản lý rủi ro tự nguyện 4 chức năng: GOVERN - MAP -
                  MEASURE - MANAGE. Rất chi tiết kỹ thuật, bắt buộc với nhà
                  thầu liên bang Hoa Kỳ.
                </p>
              </Callout>
              <Callout variant="tip" title="ISO/IEC 42001:2023">
                <p>
                  Tiêu chuẩn quốc tế đầu tiên về AI Management System — chứng
                  nhận tự nguyện. Đối tác quốc tế ngày càng yêu cầu trong đấu
                  thầu lớn.
                </p>
              </Callout>
              <Callout variant="warning" title="NĐ 13/2023/NĐ-CP (Việt Nam)">
                <p>
                  Bảo vệ dữ liệu cá nhân — phiên bản GDPR Việt Nam. AI xử lý
                  dữ liệu phải xin đồng ý, cho phép rút lại. Vi phạm phạt tới
                  100 triệu VND cho cá nhân.
                </p>
              </Callout>
            </div>
          </div>

          {/* ---------- 6b. Risk tier matrix — bảng màu 4 mức ---------- */}
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Ma trận 4 mức rủi ro EU AI Act
            </h3>
            <div className="grid gap-2">
              <RiskTierRow
                tier="Unacceptable"
                color="#ef4444"
                tint="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                examples="Social scoring nhà nước, nhận diện cảm xúc nơi làm việc, real-time biometric công cộng"
                requirement="BỊ CẤM HOÀN TOÀN"
                penalty="Phạt tới 7% doanh thu toàn cầu"
              />
              <RiskTierRow
                tier="High"
                color="#f59e0b"
                tint="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                examples="Tuyển dụng, tín dụng, y tế, giáo dục, tư pháp, hạ tầng quan trọng"
                requirement="Impact assessment + human oversight + kiểm toán + CE marking"
                penalty="Phạt tới 3% doanh thu toàn cầu"
              />
              <RiskTierRow
                tier="Limited"
                color="#3b82f6"
                tint="bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                examples="Chatbot, deepfake, nội dung do AI tạo"
                requirement="Ghi nhãn rõ 'có AI tham gia' / 'nội dung do AI tạo'"
                penalty="Phạt tới 1,5% doanh thu toàn cầu"
              />
              <RiskTierRow
                tier="Minimal"
                color="#22c55e"
                tint="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                examples="Lọc spam, AI game, gợi ý sản phẩm"
                requirement="Tự do — không yêu cầu đặc biệt"
                penalty="Không phạt — khuyến khích best practices"
              />
            </div>
          </div>

          {/* ---------- 6c. 5 trụ cột quản trị AI doanh nghiệp ---------- */}
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Năm trụ cột quản trị AI doanh nghiệp
            </h3>
            <p className="text-sm text-muted">
              Khung do nhiều công ty lớn (Microsoft, Google, IBM) dùng chung.
              Mỗi trụ cột là một việc phải làm, không thể bỏ.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {PILLARS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={18} style={{ color: p.color }} />
                      <span className="font-semibold text-sm text-foreground">
                        {p.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {p.summary}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ---------- 6d. Decision tree: có được dùng AI không? (TabView) ---------- */}
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Cây quyết định: công ty tôi có được dùng AI cho tác vụ này không?
            </h3>
            <p className="text-sm text-muted">
              Bốn câu hỏi đi lần lượt. Click từng tab để đi qua từng bước.
            </p>
            <TabView
              tabs={[
                {
                  label: "B1. Có bị cấm?",
                  content: (
                    <DecisionStep
                      question="Tác vụ có nằm trong danh sách bị cấm của EU AI Act không? (social scoring, nhận diện cảm xúc nhân viên, thao túng hành vi...)"
                      yesVariant="red"
                      yesIcon={XCircle}
                      yesBody="Dừng ngay. Không có cách triển khai hợp pháp ở EU và nhiều thị trường khác. Tìm giải pháp thay thế."
                      noBody="Sang bước 2."
                    />
                  ),
                },
                {
                  label: "B2. High-risk?",
                  content: (
                    <DecisionStep
                      question="Tác vụ ảnh hưởng tới quyền/cơ hội cá nhân (tuyển dụng, tín dụng, y tế, giáo dục, tư pháp, hạ tầng quan trọng) không?"
                      yesVariant="amber"
                      yesIcon={ShieldAlert}
                      yesList={[
                        "Impact assessment trước triển khai",
                        "Human oversight cho mọi quyết định",
                        "Kiểm toán fairness 6-12 tháng/lần",
                        "Model card và data sheet công khai",
                        "Kênh khiếu nại cho người bị ảnh hưởng",
                      ]}
                      noBody="Sang bước 3."
                    />
                  ),
                },
                {
                  label: "B3. Có dữ liệu cá nhân?",
                  content: (
                    <DecisionStep
                      question="AI có xử lý dữ liệu cá nhân khách hàng/nhân viên không? (tên, email, lịch sử giao dịch, ảnh...)"
                      yesVariant="blue"
                      yesIcon={Database}
                      yesList={[
                        "Xin đồng ý rõ ràng, có thể rút lại",
                        "Thông báo mục đích và thời gian lưu",
                        "Mã hoá in-transit và at-rest",
                        "Tuân thủ NĐ 13/2023/NĐ-CP",
                        "Cho phép khách yêu cầu xoá",
                      ]}
                      noBody="Sang bước 4."
                    />
                  ),
                },
                {
                  label: "B4. Có giao tiếp khách?",
                  content: (
                    <DecisionStep
                      question="AI có giao tiếp trực tiếp với khách hàng hay tạo nội dung cho khách đọc không? (chatbot, email tự động, bài viết...)"
                      yesVariant="blue"
                      yesIcon={Eye}
                      yesList={[
                        'Ghi nhãn rõ "có AI tham gia" / "do AI tạo"',
                        "Cung cấp kênh yêu cầu xử lý bởi con người",
                        "Monitoring liên tục để phát hiện lỗi",
                      ]}
                      noLabel="Nếu KHÔNG (Minimal risk):"
                      noBody="Không yêu cầu đặc biệt. Best practice: vẫn nên có monitoring cơ bản và ghi log cho trường hợp tranh chấp."
                    />
                  ),
                },
              ]}
            />
          </div>

          {/* ---------- 6e. Thêm ngữ cảnh VN dưới dạng ToggleCompare ---------- */}
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Việt Nam năm 2026: giữa hai thế giới
            </h3>
            <ToggleCompare
              labelA="Trạng thái hiện tại"
              labelB="Hướng đi 2026-2030"
              description="So sánh tình hình pháp lý AI tại Việt Nam hôm nay với dự kiến vài năm tới."
              childA={
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <strong>Hiện tại (2026):</strong> chưa có luật AI riêng.
                    Doanh nghiệp dựa vào:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    <li>NĐ 13/2023 — bảo vệ dữ liệu cá nhân</li>
                    <li>Luật An ninh mạng (2018) — lưu trữ trong nước</li>
                    <li>QĐ 127/QĐ-TTg (2021) — chiến lược AI đến 2030</li>
                    <li>Quy định theo ngành (ngân hàng, y tế, bảo hiểm)</li>
                  </ul>
                  <p className="text-muted text-xs mt-2">
                    Doanh nghiệp xuất khẩu sang EU đã phải tuân thủ EU AI Act
                    dù Việt Nam chưa buộc.
                  </p>
                </div>
              }
              childB={
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <strong>2026-2030:</strong> Việt Nam đang soạn khung AI
                    riêng, dự kiến:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    <li>
                      Tham khảo EU AI Act nhưng điều chỉnh cho bối cảnh (có
                      thể bớt rộng hơn về unacceptable)
                    </li>
                    <li>Phân mức rủi ro tương tự 4 tầng</li>
                    <li>Yêu cầu đăng ký các AI high-risk với cơ quan quản lý</li>
                    <li>
                      Gắn với tiêu chuẩn quốc gia về AI và ngành kỹ thuật số
                    </li>
                  </ul>
                  <p className="text-muted text-xs mt-2">
                    Doanh nghiệp chủ động tuân thủ ISO 42001 hoặc EU AI Act từ
                    bây giờ sẽ chuyển đổi rất nhẹ nhàng.
                  </p>
                </div>
              }
            />
          </div>

          {/* ---------- 6f. Collapsible details — kiến thức sâu hơn ---------- */}
          <div className="mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Đào sâu thêm (tuỳ chọn)
            </h3>
            <CollapsibleDetail title="AI Impact Assessment — công ty cần viết gì?">
              <p className="text-sm text-muted">
                Tài liệu bắt buộc cho mọi AI high-risk. Một bản IA hoàn chỉnh gồm sáu phần:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted">
                <li><strong>Mô tả hệ thống:</strong> mục đích, người dùng, phạm vi, dữ liệu vào/ra.</li>
                <li><strong>Nhóm bị ảnh hưởng:</strong> ai hưởng lợi, ai có thể thiệt — chú ý nhóm yếu thế.</li>
                <li><strong>Rủi ro:</strong> phân tích 4 trục — công bằng, an toàn, riêng tư, tự chủ.</li>
                <li><strong>Mitigation:</strong> kỹ thuật (debiasing) và quy trình (human oversight, appeals).</li>
                <li><strong>Rủi ro còn lại:</strong> sau khi mitigate — có chấp nhận được không?</li>
                <li><strong>Chữ ký:</strong> ít nhất 2 người — thường là Product Owner + AI Ethics Officer.</li>
              </ul>
            </CollapsibleDetail>

            <CollapsibleDetail title="ISO/IEC 42001:2023 — tiêu chuẩn quốc tế đầu tiên về AI Management">
              <p className="text-sm text-muted">
                Ban hành 12/2023, chứng nhận tự nguyện, nhưng đối tác quốc tế ngày càng yêu cầu trong đấu thầu lớn. 10 clauses chính (tương tự ISO 27001), 38 controls trong Annex A. Cấu trúc tương thích EU AI Act — đạt ISO 42001 giúp đáp ứng phần lớn EU AI Act. Chứng nhận mất 6-12 tháng, chi phí vài trăm triệu đến vài tỷ VND.
              </p>
            </CollapsibleDetail>

            <CollapsibleDetail title="So sánh EU AI Act, NIST AI RMF, ISO 42001 — dùng cái nào?">
              <div className="space-y-1.5 text-sm text-muted">
                <p><strong>EU AI Act:</strong> luật bắt buộc nếu bán dịch vụ vào EU. Không có lựa chọn "không tuân thủ".</p>
                <p><strong>ISO 42001:</strong> chứng nhận tự nguyện để chứng minh với đối tác. Bổ trợ cho EU AI Act.</p>
                <p><strong>NIST AI RMF:</strong> khung kỹ thuật chi tiết. Sổ tay cho kỹ sư và data scientist.</p>
                <p><strong>Thực tế:</strong> doanh nghiệp lớn dùng cả ba — EU AI Act làm ranh giới pháp lý, ISO 42001 làm khung chứng nhận, NIST AI RMF làm sổ tay thực thi.</p>
              </div>
            </CollapsibleDetail>

            <CollapsibleDetail title="Anti-pattern: những sai lầm kinh điển doanh nghiệp hay mắc">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                <li><strong>Ethics washing:</strong> dùng từ ngữ đạo đức làm marketing mà không có quy trình thật.</li>
                <li><strong>Last-minute compliance:</strong> đợi sát deadline release mới làm impact assessment.</li>
                <li><strong>Box ticking:</strong> coi checklist là cho xong, không thực sự đánh giá chất lượng.</li>
                <li><strong>Owner rỗng:</strong> "ai cũng chịu" = không ai chịu. Cần một cái tên cụ thể cho từng rủi ro.</li>
                <li><strong>Fire and forget:</strong> làm governance lúc release rồi quên. Audit 6-12 tháng là bắt buộc.</li>
                <li><strong>Không đào tạo:</strong> kỹ sư không biết EU AI Act, manager không hiểu concept drift.</li>
              </ul>
            </CollapsibleDetail>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* Bước 7 — MiniSummary                                         */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về quản trị AI"
          points={[
            "Quản trị AI = luật giao thông cho AI: không cấm, đảm bảo an toàn và trách nhiệm.",
            "4 tầng quy định chồng lên công ty: quốc tế → quốc gia → ngành → nội bộ. Mỗi tầng thêm ràng buộc.",
            "EU AI Act phân 4 mức rủi ro: Minimal → Limited → High → Unacceptable. Biết use case của bạn ở mức nào.",
            "Việt Nam: NĐ 13 bảo vệ dữ liệu, QĐ 127 chiến lược AI, Luật An ninh mạng. Đang soạn luật AI riêng.",
            "5 trụ cột doanh nghiệp: Dữ liệu — Mô hình — Triển khai — Giám sát — Sự cố.",
            "Chủ động tuân thủ TRƯỚC khi bắt buộc = lợi thế cạnh tranh, không chỉ là chi phí.",
          ]}
        />
      </LessonSection>

      {/* Bước 8 — QuizSection                                         */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

//Component phụ — Một bước trong cây quyết định (TabView tab)
const DECISION_VARIANTS: Record<
  "red" | "amber" | "blue",
  { box: string; icon: string }
> = {
  red: {
    box: "bg-red-50 dark:bg-red-900/20 border-red-500",
    icon: "text-red-500",
  },
  amber: {
    box: "bg-amber-50 dark:bg-amber-900/20 border-amber-500",
    icon: "text-amber-500",
  },
  blue: {
    box: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
    icon: "text-blue-500",
  },
};

function DecisionStep({
  question,
  yesVariant,
  yesIcon: YesIcon,
  yesBody,
  yesList,
  yesLabel = "Nếu CÓ:",
  noLabel = "Nếu KHÔNG:",
  noBody,
}: {
  question: string;
  yesVariant: keyof typeof DECISION_VARIANTS;
  yesIcon: React.ComponentType<{ size?: number; className?: string }>;
  yesBody?: string;
  yesList?: string[];
  yesLabel?: string;
  noLabel?: string;
  noBody: string;
}) {
  const variant = DECISION_VARIANTS[yesVariant];
  const NoIcon = noLabel === "Nếu KHÔNG:" ? ArrowRight : CheckCircle2;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-start gap-2">
        <HelpCircle size={16} className="mt-0.5 text-accent shrink-0" />
        <p className="font-medium text-foreground">{question}</p>
      </div>
      <div className={`rounded-lg border-l-4 p-3 ${variant.box}`}>
        <div className="flex items-center gap-2 mb-1">
          <YesIcon size={16} className={variant.icon} />
          <strong className="text-foreground">{yesLabel}</strong>
        </div>
        {yesBody && <p className="text-foreground/90 pl-6">{yesBody}</p>}
        {yesList && (
          <ul className="text-foreground/90 pl-6 space-y-1 list-disc list-inside">
            {yesList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <NoIcon size={16} className="text-emerald-500" />
          <strong className="text-foreground">{noLabel}</strong>
        </div>
        <p className="text-foreground/90 pl-6">{noBody}</p>
      </div>
    </div>
  );
}

//Component phụ — Một dòng trong ma trận 4 mức rủi ro
function RiskTierRow({
  tier,
  color,
  tint,
  examples,
  requirement,
  penalty,
}: {
  tier: string;
  color: string;
  tint: string;
  examples: string;
  requirement: string;
  penalty: string;
}) {
  return (
    <div className={`rounded-lg border-l-4 border p-3 ${tint}`} style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-bold"
          style={{ color }}
        >
          {tier}
        </span>
        <span className="text-xs text-muted font-medium">{penalty}</span>
      </div>
      <div className="grid gap-1.5 text-xs">
        <div>
          <span className="font-semibold text-foreground">Ví dụ:</span>{" "}
          <span className="text-foreground/90">{examples}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Yêu cầu:</span>{" "}
          <span className="text-foreground/90">{requirement}</span>
        </div>
      </div>
    </div>
  );
}
