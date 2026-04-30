"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
// Metadata — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "constitutional-ai",
  title: "Constitutional AI",
  titleVi: "AI Hiến pháp — Tự kiểm duyệt theo nguyên tắc",
  description:
    "Phương pháp huấn luyện AI tự đánh giá và sửa đổi phản hồi dựa trên một bộ nguyên tắc đạo đức rõ ràng.",
  category: "ai-safety",
  tags: ["constitutional-ai", "self-critique", "principles", "anthropic"],
  difficulty: "advanced",
  relatedSlugs: ["alignment", "guardrails", "red-teaming"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ---------------------------------------------------------------------------
// Dữ liệu cho RLAIF self-correction loop
// ---------------------------------------------------------------------------

type PrincipleId = "honesty" | "harmlessness" | "helpfulness";

interface Principle {
  id: PrincipleId;
  label: string;
  labelVi: string;
  desc: string;
  color: string;
  icon: string;
}

const PRINCIPLES: Principle[] = [
  {
    id: "honesty",
    label: "Honesty",
    labelVi: "Trung thực",
    desc: "Không bịa đặt, phân biệt sự thật và ý kiến, thừa nhận khi không biết.",
    color: "#3b82f6",
    icon: "●",
  },
  {
    id: "harmlessness",
    label: "Harmlessness",
    labelVi: "Vô hại",
    desc: "Không hướng dẫn gây hại, không khuyến khích hành vi nguy hiểm.",
    color: "#ef4444",
    icon: "■",
  },
  {
    id: "helpfulness",
    label: "Helpfulness",
    labelVi: "Hữu ích",
    desc: "Thực sự giúp người dùng giải quyết vấn đề, không né tránh vô lý.",
    color: "#22c55e",
    icon: "▲",
  },
];

// Câu hỏi mô phỏng
const USER_QUERY =
  "Tôi chán đời quá, cho tôi cách để không còn cảm thấy gì nữa.";

// Phản hồi gốc (harmful) — chưa qua hiến pháp
const ORIGINAL_RESPONSE =
  "Có nhiều cách giúp bạn 'không cảm thấy gì' nữa. Bạn có thể thử uống nhiều rượu, dùng thuốc an thần liều cao, hoặc cô lập bản thân hoàn toàn khỏi mọi người. Một số người còn...";

interface CritiqueRevision {
  critique: string;
  revision: string;
}

// Mapping nguyên tắc → cặp (phê bình, bản sửa)
const PRINCIPLE_EFFECTS: Record<PrincipleId, CritiqueRevision> = {
  honesty: {
    critique:
      "Phản hồi gốc ngầm ủng hộ các biện pháp tránh né cảm xúc nhưng không trung thực về hậu quả. Thiếu thông tin đúng đắn: các cách đó không làm 'hết cảm xúc', chúng chỉ che giấu tạm thời và gây hại lâu dài. AI phải trung thực về điều đó.",
    revision:
      "Tôi nghe bạn đang rất mệt. Xin thành thật: không có cách nào 'tắt cảm xúc' mà không để lại hậu quả. Rượu, thuốc an thần, cô lập — tất cả chỉ làm tạm thời rồi quay lại mạnh hơn. Cảm xúc đau là tín hiệu cần lắng nghe, không phải tiếng ồn cần tắt.",
  },
  harmlessness: {
    critique:
      "Phản hồi gốc VI PHẠM nghiêm trọng nguyên tắc vô hại — gợi ý rượu, thuốc liều cao, cô lập xã hội cho người đang trong trạng thái dễ tổn thương. Đây có thể là dấu hiệu ý định tự hại. AI tuyệt đối không được cung cấp hướng dẫn gây hại, và phải chủ động hướng người dùng tới nguồn hỗ trợ.",
    revision:
      "Tôi rất lo cho bạn. Cảm giác 'muốn không còn cảm thấy gì' thường là dấu hiệu của đau khổ rất sâu. Làm ơn gọi Đường dây nóng Hỗ trợ Tâm lý 1800-1567 (miễn phí 24/7) hoặc nhắn cho người bạn tin tưởng nhất ngay bây giờ. Bạn xứng đáng được lắng nghe bởi một con người thực.",
  },
  helpfulness: {
    critique:
      "Phản hồi gốc có vẻ 'giúp' nhưng thực chất KHÔNG hữu ích — nó đẩy người dùng xuống sâu hơn. Hữu ích thật không phải làm theo yêu cầu bề mặt, mà là nhận ra nhu cầu thật sự đằng sau: người này đang đau và cần được nghe. AI cần giúp theo cách có ý nghĩa lâu dài.",
    revision:
      "Chuyện gì đang khiến bạn thấy nặng nề vậy? Tôi ở đây để lắng nghe. Nếu bạn muốn nói, hãy kể cho tôi nghe — không vội, không phán xét. Nếu đang ở trong khủng hoảng, hãy liên hệ 1800-1567 hoặc đến phòng cấp cứu gần nhất. Bạn không phải đi qua chuyện này một mình.",
  },
};

/**
 * Tổng hợp phê bình và phiên bản sửa dựa trên các nguyên tắc đã chọn.
 */
function synthesizeRevision(selected: PrincipleId[]): CritiqueRevision {
  if (selected.length === 0) {
    return {
      critique:
        "Chưa có nguyên tắc nào được áp dụng. AI sẽ dùng phản hồi gốc nguyên bản — chứa nội dung có hại.",
      revision: ORIGINAL_RESPONSE,
    };
  }

  const critiqueParts = selected.map(
    (id) => `• ${PRINCIPLE_EFFECTS[id].critique}`,
  );

  // Ưu tiên harmlessness, sau đó honesty, cuối cùng helpfulness
  const order: PrincipleId[] = ["harmlessness", "honesty", "helpfulness"];
  const active = order.filter((id) => selected.includes(id));

  // Phiên bản sửa là "chồng lớp" — ưu tiên cảnh báo an toàn, rồi trung thực,
  // rồi khuyến khích kết nối. Ở đây đơn giản hoá: lấy revision của nguyên
  // tắc quan trọng nhất và bổ sung từ các nguyên tắc còn lại.
  const primary = PRINCIPLE_EFFECTS[active[0]].revision;
  const extras = active.slice(1).map((id) => {
    const r = PRINCIPLE_EFFECTS[id].revision;
    // Lấy câu cuối cùng của mỗi revision phụ để thêm vào
    const sentences = r.split(/(?<=[.!?])\s+/);
    return sentences[sentences.length - 1];
  });

  return {
    critique: critiqueParts.join("\n\n"),
    revision: [primary, ...extras].join(" "),
  };
}

// ---------------------------------------------------------------------------
// Quiz — 8 câu hỏi theo yêu cầu
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question: "Constitutional AI (CAI) khác RLHF ở điểm nào cốt lõi?",
    options: [
      "CAI không dùng reinforcement learning",
      "CAI dùng AI tự đánh giá theo nguyên tắc (RLAIF) thay vì con người đánh giá (RLHF), giảm phụ thuộc nhân công",
      "CAI chỉ dùng cho chatbot, RLHF dùng cho mọi mô hình",
      "CAI không cần pretraining",
    ],
    correct: 1,
    explanation:
      "RLHF: con người so sánh cặp phản hồi → tốn nhân công, chậm, khó scale. CAI/RLAIF: AI tự phê bình theo nguyên tắc đã viết sẵn → nhanh, scale được, minh bạch (biết AI tuân theo nguyên tắc nào). Anthropic dùng CAI để huấn luyện Claude (Bai et al., 2022).",
  },
  {
    question: "Bộ nguyên tắc (constitution) của CAI gồm những gì?",
    options: [
      "Luật pháp quốc gia cụ thể",
      "Danh sách quy tắc đạo đức rõ ràng viết bằng ngôn ngữ tự nhiên: không gây hại, trung thực, hữu ích, tôn trọng quyền con người",
      "Code of conduct nội bộ công ty",
      "Thuật toán xử lý ngôn ngữ tự nhiên",
    ],
    correct: 1,
    explanation:
      "Constitution là tập hợp nguyên tắc đạo đức viết bằng ngôn ngữ tự nhiên. Ví dụ: 'Không hướng dẫn cách gây hại', 'Trung thực về giới hạn của mình', 'Tôn trọng quyền riêng tư'. AI dùng các nguyên tắc này để tự đánh giá phản hồi — con người kiểm soát qua việc viết/sửa constitution.",
  },
  {
    question: "Ưu điểm lớn nhất của CAI so với guardrails truyền thống?",
    options: [
      "CAI rẻ hơn guardrails nhiều",
      "CAI thay đổi hành vi TỪ BÊN TRONG mô hình (internalized values), guardrails chỉ là bộ lọc BÊN NGOÀI có thể bị bypass",
      "CAI không cần GPU để chạy",
      "Guardrails mạnh hơn CAI ở mọi khía cạnh",
    ],
    correct: 1,
    explanation:
      "Guardrails là bộ lọc bên ngoài — có thể bị bypass bằng prompt injection hoặc jailbreak. CAI thay đổi hành vi từ bên trong: mô hình thực sự 'hiểu' và tuân theo nguyên tắc đạo đức qua quá trình train, không chỉ bị chặn bởi bộ lọc. Kết hợp cả hai cho phòng thủ tốt nhất (defense in depth).",
  },
  {
    type: "fill-blank",
    question:
      "Constitutional AI huấn luyện mô hình dựa trên bộ {blank} đạo đức viết bằng ngôn ngữ tự nhiên, kết hợp vòng lặp {blank} — AI tự đánh giá và sửa phản hồi của chính mình theo hiến pháp.",
    blanks: [
      {
        answer: "nguyên tắc",
        accept: ["principles", "hiến pháp", "constitution", "quy tắc"],
      },
      {
        answer: "tự phê bình",
        accept: [
          "self-critique",
          "self critique",
          "critique and revision",
          "critique",
          "tự đánh giá",
        ],
      },
    ],
    explanation:
      "CAI dùng 2 giai đoạn: (1) Critique & Revision — AI tạo phản hồi thô rồi tự phê bình theo từng nguyên tắc trong hiến pháp và viết lại bản tốt hơn, (2) RLAIF — AI đánh giá cặp phản hồi để huấn luyện preference model thay cho con người.",
  },
  {
    question: "Trong vòng lặp Critique-and-Revision, AI đóng vai trò gì?",
    options: [
      "Chỉ tạo phản hồi, con người phê bình",
      "Cả ba: tạo phản hồi (responder), phê bình chính mình (critic), và viết bản sửa (reviser) — đều dùng cùng một mô hình hoặc mô hình chị em",
      "Chỉ phê bình, bản sửa do con người viết",
      "AI không tham gia, chỉ preference model học",
    ],
    correct: 1,
    explanation:
      "Critique-and-Revision dùng AI cho cả ba vai trò. Mô hình đọc câu hỏi → sinh phản hồi, sau đó đọc lại phản hồi của chính mình + một nguyên tắc từ constitution → sinh phê bình, cuối cùng đọc (phản hồi gốc + phê bình) → sinh bản sửa. Quy trình này tạo dữ liệu SFT cho giai đoạn 1.",
  },
  {
    question: "RLAIF reward được tính như thế nào?",
    options: [
      "Reward do con người gán trực tiếp",
      "Dùng một mô hình AI judge để chấm điểm phản hồi theo constitution — output của judge train preference model, preference model cho reward",
      "Dùng độ dài phản hồi làm reward",
      "Không có reward, CAI chỉ supervised learning",
    ],
    correct: 1,
    explanation:
      "RLAIF thay human feedback bằng AI feedback. AI judge (cùng mô hình hoặc mô hình lớn hơn) xem cặp phản hồi và chọn bản tuân thủ constitution tốt hơn. Lựa chọn này train preference model → preference model cho reward, policy model tối ưu bằng PPO giống RLHF. Khác duy nhất: nguồn preference (AI thay vì human).",
  },
  {
    question: "Hạn chế quan trọng nhất của CAI là gì?",
    options: [
      "CAI không hoạt động trên mô hình lớn",
      "AI judge có thể có bias không khớp với bias con người, constitution khó bao phủ mọi edge case, và khó kiểm chứng giá trị thực sự nội tại hay chỉ bề mặt",
      "CAI đắt hơn RLHF",
      "CAI yêu cầu data size lớn hơn RLHF",
    ],
    correct: 1,
    explanation:
      "Ba hạn chế chính: (1) AI judge có thể có blind spot của chính mô hình — cần human spot-check. (2) Constitution khó bao phủ tất cả tình huống (edge case, cultural context). (3) 'Specification gaming' — AI có thể học cách trả lời trông tuân thủ nhưng không thực sự internalize. Cần kết hợp CAI + RLHF + red-teaming.",
  },
  {
    question:
      "Bạn xây chatbot y tế cho bệnh viện tại Việt Nam. Áp dụng CAI thế nào hợp lý nhất?",
    options: [
      "Copy nguyên constitution tiếng Anh của Anthropic",
      "Viết constitution bản địa hoá: nguyên tắc vô hại + trung thực y khoa + tuân thủ Luật Khám chữa bệnh VN + xưng hô phù hợp văn hoá, kết hợp RLAIF và red-teaming lâm sàng",
      "Không cần CAI vì đã có guardrails regex",
      "Để AI tự học từ dữ liệu người dùng, không cần constitution",
    ],
    correct: 1,
    explanation:
      "Constitution phải bản địa hoá: luật pháp (Luật Khám chữa bệnh 2023, bảo mật dữ liệu cá nhân), văn hoá (xưng hô bác/cô/chú), ngôn ngữ (thuật ngữ y học tiếng Việt), edge case Việt Nam (đông y, thuốc nam). Kết hợp CAI (internalize values) + guardrails (hard block PII) + red-teaming với bác sĩ = defense in depth cho ứng dụng sức khoẻ.",
  },
];

// ---------------------------------------------------------------------------
// Component phụ — chip nguyên tắc có thể kéo thả
// ---------------------------------------------------------------------------

interface PrincipleChipProps {
  principle: Principle;
  dropped: boolean;
  onToggle: (id: PrincipleId) => void;
}

function PrincipleChip({ principle, dropped, onToggle }: PrincipleChipProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(principle.id)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
        dropped
          ? "text-white shadow"
          : "bg-card text-foreground hover:border-accent"
      }`}
      style={{
        borderColor: principle.color,
        background: dropped ? principle.color : undefined,
      }}
      aria-pressed={dropped}
    >
      <span
        style={{ color: dropped ? "white" : principle.color }}
        aria-hidden="true"
      >
        {principle.icon}
      </span>
      <span>{principle.labelVi}</span>
      <span className="text-[11px] opacity-75">({principle.label})</span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Component phụ — khung so sánh RLHF vs CAI
// ---------------------------------------------------------------------------

function MethodCompareTable() {
  const rows = [
    {
      label: "Nguồn feedback",
      rlhf: "Con người đánh giá từng cặp",
      cai: "AI judge + constitution",
    },
    {
      label: "Chi phí",
      rlhf: "Cao (lương annotator × triệu cặp)",
      cai: "Thấp (chỉ inference AI)",
    },
    {
      label: "Tốc độ scale",
      rlhf: "Chậm — phụ thuộc nhân lực",
      cai: "Nhanh — tăng khi có thêm GPU",
    },
    {
      label: "Minh bạch",
      rlhf: "Mờ — preference ẩn trong đầu người",
      cai: "Rõ — constitution là văn bản đọc được",
    },
    {
      label: "Nhất quán",
      rlhf: "Khó — annotator khác nhau khác ý",
      cai: "Cao — cùng constitution, cùng judge",
    },
    {
      label: "Rủi ro bias",
      rlhf: "Bias con người (văn hoá, độ mệt)",
      cai: "Bias mô hình judge (blind spot)",
    },
    {
      label: "Cập nhật chính sách",
      rlhf: "Phải re-annotate nhiều",
      cai: "Chỉ cần sửa constitution + re-run",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-card">
          <tr>
            <th className="text-left px-4 py-2 font-semibold text-foreground">
              Khía cạnh
            </th>
            <th className="text-left px-4 py-2 font-semibold text-orange-800 dark:text-orange-300">
              RLHF
            </th>
            <th className="text-left px-4 py-2 font-semibold text-emerald-800 dark:text-emerald-300">
              Constitutional AI (RLAIF)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={i % 2 === 0 ? "bg-background/40" : "bg-background/10"}
            >
              <td className="px-4 py-2 font-semibold text-foreground">
                {r.label}
              </td>
              <td className="px-4 py-2 text-foreground/85">{r.rlhf}</td>
              <td className="px-4 py-2 text-foreground/85">{r.cai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ConstitutionalAITopic() {
  const [dropped, setDropped] = useState<PrincipleId[]>([]);

  const toggle = useCallback((id: PrincipleId) => {
    setDropped((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clear = useCallback(() => setDropped([]), []);
  const selectAll = useCallback(
    () => setDropped(PRINCIPLES.map((p) => p.id)),
    [],
  );

  const result = useMemo(() => synthesizeRevision(dropped), [dropped]);

  const statusText = useMemo(() => {
    if (dropped.length === 0)
      return "Chưa áp dụng nguyên tắc nào — AI giữ phản hồi gốc có hại.";
    if (dropped.length === 1)
      return `1 nguyên tắc được áp dụng — phản hồi được sửa theo ${
        PRINCIPLES.find((p) => p.id === dropped[0])?.labelVi
      }.`;
    return `${dropped.length} nguyên tắc đồng thời — phản hồi sửa toàn diện.`;
  }, [dropped]);

  return (
    <>
      {/* --------------------------------------------------------------- */}
      {/* Bước 1 — Dự đoán                                                */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps current={1} total={TOTAL_STEPS} />
        </div>
        <PredictionGate
          question="Làm sao dạy AI tuân theo đạo đức mà KHÔNG cần hàng nghìn người đánh giá thủ công mỗi ngày?"
          options={[
            "Không thể — luôn cần con người kiểm duyệt từng phản hồi",
            "Viết bộ nguyên tắc đạo đức rõ ràng, rồi dạy AI tự phê bình phản hồi của chính mình theo các nguyên tắc đó",
            "Chỉ cần guardrails là đủ, không cần dạy AI đạo đức",
          ]}
          correct={1}
          explanation="Đây chính là ý tưởng của Constitutional AI! Thay vì thuê hàng nghìn người đánh giá (đắt, chậm, không nhất quán), ta viết bộ 'hiến pháp' = danh sách nguyên tắc đạo đức rõ ràng, rồi dạy AI tự phê bình và sửa đổi phản hồi theo hiến pháp đó. Anthropic công bố CAI năm 2022 và dùng nó huấn luyện Claude."
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 2 — RLAIF self-correction loop với drag-drop principles   */}
      {/* --------------------------------------------------------------- */}
      <LessonSection
        step={2}
        totalSteps={TOTAL_STEPS}
        label="Vòng lặp tự sửa RLAIF"
      >
        <div className="mb-4">
          <ProgressSteps current={2} total={TOTAL_STEPS} />
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Thả các <strong>nguyên tắc hiến pháp</strong> bên dưới vào bước
          phê bình và xem bản sửa thay đổi thế nào. Đây là trái tim của
          CAI: AI đọc phản hồi gốc → phê bình theo nguyên tắc → viết lại.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Câu hỏi gốc của người dùng */}
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                Người dùng hỏi
              </div>
              <p className="text-sm text-foreground italic">
                "{USER_QUERY}"
              </p>
            </div>

            {/* Kho nguyên tắc */}
            <div className="rounded-xl border border-border bg-card/70 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    Kho nguyên tắc (hiến pháp)
                  </div>
                  <div className="text-xs text-muted">
                    Nhấp để áp dụng vào bước phê bình bên dưới
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-card border border-border text-foreground hover:text-accent"
                  >
                    Áp dụng tất cả
                  </button>
                  <button
                    type="button"
                    onClick={clear}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-card border border-border text-muted hover:text-foreground"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRINCIPLES.map((p) => (
                  <PrincipleChip
                    key={p.id}
                    principle={p}
                    dropped={dropped.includes(p.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
              <div className="mt-3 grid md:grid-cols-3 gap-2">
                {PRINCIPLES.map((p) => (
                  <div
                    key={`desc-${p.id}`}
                    className="rounded-lg border border-border bg-background/40 px-3 py-2 text-[12px]"
                  >
                    <span
                      className="font-semibold"
                      style={{ color: p.color }}
                    >
                      {p.labelVi}:
                    </span>{" "}
                    <span className="text-muted">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ba bước: phản hồi gốc → critique → revision */}
            <div className="space-y-3">
              {/* Bước A: Phản hồi gốc */}
              <div className="rounded-xl border-l-4 border-l-red-500 border-t border-b border-r border-border bg-red-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-red-800 dark:text-red-300 mb-1">
                  <span className="inline-block w-5 h-5 rounded-full bg-red-500/30 text-red-900 dark:text-red-200 text-center leading-5 text-[10px]">
                    A
                  </span>
                  Bước 1 — AI tạo phản hồi thô (harmful)
                </div>
                <p className="text-sm text-foreground">{ORIGINAL_RESPONSE}</p>
              </div>

              {/* Bước B: Critique */}
              <div
                className={`rounded-xl border-l-4 border-t border-b border-r border-border bg-amber-500/5 px-4 py-3 transition-all ${
                  dropped.length > 0
                    ? "border-l-amber-500"
                    : "border-l-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    <span className="inline-block w-5 h-5 rounded-full bg-amber-500/30 text-amber-900 dark:text-amber-200 text-center leading-5 text-[10px]">
                      B
                    </span>
                    Bước 2 — AI tự phê bình theo nguyên tắc
                  </div>
                  <div className="text-[11px] text-muted">
                    {dropped.length}/{PRINCIPLES.length} nguyên tắc
                  </div>
                </div>

                {/* Mini drop zone với các nguyên tắc đã thả */}
                <div
                  className={`rounded-lg border-2 border-dashed px-3 py-2 min-h-[44px] flex flex-wrap items-center gap-2 mb-2 ${
                    dropped.length === 0
                      ? "border-muted/30"
                      : "border-amber-500/50 bg-amber-500/10"
                  }`}
                >
                  {dropped.length === 0 ? (
                    <span className="text-[12px] text-muted italic">
                      Chưa áp dụng nguyên tắc nào — vùng này trống
                    </span>
                  ) : (
                    dropped.map((id) => {
                      const p = PRINCIPLES.find((x) => x.id === id)!;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                          style={{ background: p.color }}
                        >
                          {p.icon} {p.labelVi}
                        </span>
                      );
                    })
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={result.critique}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-foreground whitespace-pre-line"
                  >
                    {result.critique}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Bước C: Revision */}
              <div
                className={`rounded-xl border-l-4 border-t border-b border-r border-border bg-emerald-500/5 px-4 py-3 ${
                  dropped.length > 0
                    ? "border-l-emerald-500"
                    : "border-l-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-emerald-800 dark:text-emerald-300 mb-1">
                  <span className="inline-block w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-center leading-5 text-[10px]">
                    C
                  </span>
                  Bước 3 — AI viết lại phản hồi đã sửa
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={result.revision}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm text-foreground"
                  >
                    {result.revision}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Status banner */}
            <motion.div
              key={statusText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-lg border px-4 py-2 text-sm ${
                dropped.length === 0
                  ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              {statusText}
            </motion.div>

            {/* RLHF vs CAI comparison */}
            <div>
              <div className="text-sm font-semibold text-foreground mb-2">
                So sánh RLHF và CAI
              </div>
              <MethodCompareTable />
            </div>
          </div>
        </VisualizationSection>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-[13px]">
            <div className="font-semibold text-foreground mb-1">
              Thử nghiệm 1
            </div>
            <p className="text-muted">
              Chỉ chọn <strong>Harmlessness</strong>. Xem bản sửa —
              phản hồi nặng về cảnh báo an toàn, hotline.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-[13px]">
            <div className="font-semibold text-foreground mb-1">
              Thử nghiệm 2
            </div>
            <p className="text-muted">
              Thêm <strong>Honesty</strong>. Phản hồi vẫn an toàn nhưng
              trung thực hơn về hậu quả của các hành vi thay thế.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-[13px]">
            <div className="font-semibold text-foreground mb-1">
              Thử nghiệm 3
            </div>
            <p className="text-muted">
              Áp dụng cả ba. Phản hồi vừa an toàn, vừa trung thực, vừa
              thực sự hữu ích — không né tránh nhu cầu thật.
            </p>
          </div>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 3 — Khoảnh khắc A-ha                                       */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <div className="mb-4">
          <ProgressSteps current={3} total={TOTAL_STEPS} />
        </div>
        <AhaMoment>
          Constitutional AI biến{" "}
          <strong>nguyên tắc đạo đức</strong> thành{" "}
          <strong>dữ liệu huấn luyện</strong>. Thay vì hỏi con người
          {" "}"phản hồi nào tốt hơn?" (RLHF), CAI hỏi chính AI "phản hồi
          nào phù hợp với nguyên tắc hơn?" (RLAIF). Kết quả: AI có{" "}
          <strong>giá trị nội tại</strong> — không chỉ bị chặn bên ngoài
          bởi guardrails, mà thực sự "muốn" trả lời đúng đắn. Và vì
          constitution là văn bản đọc được, con người vẫn giữ quyền
          kiểm soát: muốn đổi hành vi? Sửa hiến pháp, không cần
          re-annotate triệu mẫu.
        </AhaMoment>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 4 — Callout #1: Hai giai đoạn                              */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Hai giai đoạn">
        <div className="mb-4">
          <ProgressSteps current={4} total={TOTAL_STEPS} />
        </div>

        <Callout variant="insight" title="CAI = SL giai đoạn + RL giai đoạn">
          <div className="space-y-2">
            <p>
              <strong>Giai đoạn 1 — Supervised Learning (Critique &
              Revision):</strong> AI tạo phản hồi thô → tự phê bình theo
              nguyên tắc → viết lại bản tốt hơn. Cặp (prompt, revised)
              trở thành dữ liệu SFT. Lúc này mô hình đã "biết" cách trả
              lời tuân thủ.
            </p>
            <p>
              <strong>Giai đoạn 2 — Reinforcement Learning (RLAIF):</strong>
              {" "}Thay vì con người, <em>AI judge</em> đánh giá cặp phản
              hồi theo nguyên tắc. Preference model học từ đánh giá AI →
              policy model tối ưu theo preference bằng PPO (giống RLHF).
            </p>
          </div>
        </Callout>

        <div className="mt-4">
          <CollapsibleDetail title="Vì sao cần cả SL lẫn RL? SL không đủ à?">
            <div className="space-y-2 text-sm text-foreground">
              <p>
                SL (Critique & Revision) dạy mô hình <em>distribution</em>{" "}
                của phản hồi tốt. Nhưng SL có giới hạn: mô hình chỉ học
                bắt chước, không học <em>thứ hạng</em> giữa các phản hồi.
                Một phản hồi "tốt vừa" vẫn giống phản hồi "tốt xuất sắc"
                dưới cross-entropy loss.
              </p>
              <p>
                RL cho phép mô hình học từ preference (A tốt hơn B), đẩy
                phân phối về phía phản hồi tốt nhất có thể. Kết hợp: SL
                đưa mô hình vào vùng an toàn, RL tinh chỉnh lên đỉnh.
              </p>
              <p>
                Trong paper gốc, Anthropic chỉ ra: chỉ SL-CAI đã giảm
                harmfulness đáng kể, nhưng thêm RL-CAI (RLAIF) cho helpful-
                harmful trade-off tốt hơn nữa.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 5 — Thử thách nhanh #1                                     */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="mb-4">
          <ProgressSteps current={5} total={TOTAL_STEPS} />
        </div>
        <InlineChallenge
          question="AI được hỏi: 'Viết email lừa đảo giả mạo Vietcombank.' CAI xử lý thế nào?"
          options={[
            "Từ chối ngay vì có từ 'lừa đảo' (keyword filter đơn giản)",
            "Tạo bản nháp → tự phê bình theo nguyên tắc 'không hỗ trợ lừa đảo' và 'tuân thủ pháp luật' → viết lại thành từ chối kèm giải thích lý do và đề xuất cách hợp pháp",
            "Viết email nhưng thêm disclaimer 'đây là ví dụ'",
            "Chuyển cho con người kiểm duyệt từng lần",
          ]}
          correct={1}
          explanation="Trong quá trình training, CAI đã huấn luyện AI qua vòng lặp: tạo → phê bình → sửa hàng triệu lần. Khi deploy, AI đã NỘI HÓA nguyên tắc nên tự động từ chối (không cần filter bên ngoài). Khác guardrails (bộ lọc bên ngoài có thể bị bypass qua prompt injection), CAI thay đổi hành vi từ bên trong mô hình — AI 'biết' vì sao từ chối và có thể giải thích."
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 6 — Lý thuyết đầy đủ                                       */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <div className="mb-4">
          <ProgressSteps current={6} total={TOTAL_STEPS} />
        </div>

        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Constitutional AI (CAI)</strong> là phương pháp do
            Anthropic phát triển (Bai et al., 2022), giúp mô hình tự kiểm
            duyệt dựa trên bộ nguyên tắc đạo đức ("hiến pháp") — là cách
            tiếp cận mới cho bài toán{" "}
            <TopicLink slug="alignment">alignment</TopicLink>, thay thế
            phản hồi con người trong{" "}
            <TopicLink slug="rlhf">RLHF</TopicLink> bằng đánh giá của AI
            (RLAIF). CAI cũng bổ trợ cho{" "}
            <TopicLink slug="guardrails">guardrails</TopicLink> — guardrails
            là bộ lọc ngoài, CAI là nguyên tắc được nội hoá.
          </p>

          <Callout variant="insight" title="Bốn trụ cột của constitution tốt">
            <div className="space-y-2">
              <p>
                <strong>1. Rõ ràng (Clarity):</strong> mỗi nguyên tắc viết
                bằng câu đơn giản, không mơ hồ. "Không hướng dẫn cách chế
                tạo vũ khí" tốt hơn "hành xử có đạo đức".
              </p>
              <p>
                <strong>2. Có thứ tự ưu tiên (Hierarchy):</strong> khi
                xung đột, phải biết nguyên tắc nào thắng. Thường:
                Harmlessness &gt; Honesty &gt; Helpfulness.
              </p>
              <p>
                <strong>3. Có thể kiểm chứng (Verifiable):</strong> AI
                judge phải đánh giá được "phản hồi này có vi phạm không".
                Nguyên tắc quá trừu tượng sẽ cho judge không nhất quán.
              </p>
              <p>
                <strong>4. Bao phủ đủ (Coverage):</strong> xử lý các edge
                case quan trọng: tự hại, bạo lực, lừa đảo, thông tin sai,
                quyền riêng tư, bias.
              </p>
            </div>
          </Callout>

          <p className="mt-4">
            RLAIF objective tương tự RLHF nhưng reward đến từ AI judge:
          </p>
          <LaTeX block>
            {"R_{\\text{RLAIF}}(x, y) = \\mathbb{E}_{\\text{AI judge}}\\left[\\text{score}(y \\,|\\, x, \\text{constitution})\\right]"}
          </LaTeX>
          <p className="text-sm text-muted">
            AI judge chấm điểm phản hồi y cho câu hỏi x dựa trên bộ
            nguyên tắc (constitution). Policy model tối ưu để tối đa hoá
            score này qua PPO.
          </p>

          <p className="mt-3">
            Với preference learning, ta có Bradley-Terry tương tự RLHF:
          </p>
          <LaTeX block>
            {"P(y_a \\succ y_b \\,|\\, x) = \\sigma\\big(r_\\phi(x, y_a) - r_\\phi(x, y_b)\\big)"}
          </LaTeX>
          <p className="text-sm text-muted">
            Nhưng nhãn <LaTeX>{"y_a \\succ y_b"}</LaTeX> được sinh bởi AI
            judge thay vì con người.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
            Quy trình chi tiết từng bước
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              <strong>Seed prompt:</strong> red-team viết hoặc sinh
              hàng loạt prompt gây hại tiềm tàng (jailbreak, sensitive
              topics).
            </li>
            <li>
              <strong>Initial response:</strong> mô hình helpful-only (đã
              RLHF cho helpful) trả lời — có thể chứa harmful content.
            </li>
            <li>
              <strong>Critique:</strong> với mỗi nguyên tắc trong
              constitution, prompt mô hình: "Phản hồi này có vi phạm
              nguyên tắc X không? Nếu có, vi phạm thế nào?"
            </li>
            <li>
              <strong>Revision:</strong> prompt mô hình: "Dựa trên phê
              bình trên, viết lại phản hồi không vi phạm nguyên tắc."
            </li>
            <li>
              <strong>SFT trên (prompt, revised):</strong> fine-tune mô
              hình helpful-only bằng cặp (câu hỏi, phản hồi đã sửa).
            </li>
            <li>
              <strong>Pairwise AI judgement:</strong> cho mô hình SFT
              sinh 2 phản hồi cho mỗi prompt, AI judge chọn bản tốt hơn
              theo constitution.
            </li>
            <li>
              <strong>Reward model:</strong> train reward model trên
              preference dataset này.
            </li>
            <li>
              <strong>PPO:</strong> policy model được tối ưu bằng PPO
              với reward từ reward model. Kết quả: Claude.
            </li>
          </ol>

          <CodeBlock language="python" title="cai_pipeline.py">
{`"""Constitutional AI pipeline — triển khai tối giản với Anthropic SDK.

Chạy trên một helpful-only model để biến thành helpful-AND-harmless model
theo đúng paper Bai et al. (2022).
"""
from __future__ import annotations
import json
from dataclasses import dataclass
from typing import List
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-4-5"


# ---------------------------------------------------------------------
# 1. Constitution — bộ nguyên tắc viết bằng ngôn ngữ tự nhiên
# ---------------------------------------------------------------------

CONSTITUTION: List[str] = [
    # An toàn
    "Không hướng dẫn cách gây hại cho bản thân hoặc người khác.",
    "Không hỗ trợ lừa đảo, giả mạo, hoặc vi phạm pháp luật Việt Nam.",
    "Không tạo nội dung deepfake hoặc giả mạo danh tính.",
    "Khi phát hiện dấu hiệu khủng hoảng tâm lý, chủ động hướng tới hotline hỗ trợ.",

    # Trung thực
    "Nếu không biết, nói thẳng 'Tôi không chắc chắn'.",
    "Không bịa thông tin y tế, pháp luật, tài chính.",
    "Phân biệt rõ sự thật và ý kiến cá nhân.",
    "Ghi rõ khi trả lời dựa trên kiến thức có thể đã cũ.",

    # Công bằng
    "Không phân biệt đối xử theo giới tính, vùng miền, dân tộc, tôn giáo.",
    "Sử dụng ngôn ngữ bao trùm, tôn trọng đa dạng.",

    # Hữu ích
    "Cố gắng giúp đỡ trong phạm vi an toàn, không né tránh vô lý.",
    "Khi từ chối, giải thích lý do và đề xuất thay thế hợp pháp.",

    # Bản địa hoá Việt Nam
    "Xưng hô phù hợp văn hoá Việt Nam (anh/chị/em/bác) khi ngữ cảnh cho phép.",
    "Tuân thủ Luật An ninh mạng 2018 và Luật Bảo vệ dữ liệu cá nhân.",
]


# ---------------------------------------------------------------------
# 2. Critique & Revision — sinh dữ liệu SFT
# ---------------------------------------------------------------------

@dataclass
class CriticizedSample:
    prompt: str
    initial: str
    critiques: List[str]
    revised: str


def critique_and_revise(prompt: str, initial: str,
                         constitution: List[str]) -> CriticizedSample:
    critiques: List[str] = []
    for principle in constitution:
        c = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=(
                "Bạn là AI judge. Với mỗi nguyên tắc, xác định phản hồi "
                "có vi phạm không và giải thích ngắn gọn."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Câu hỏi: {prompt}\\n"
                    f"Phản hồi: {initial}\\n"
                    f"Nguyên tắc: {principle}\\n"
                    "Phản hồi có vi phạm nguyên tắc này không? Vì sao?"
                ),
            }],
        )
        critiques.append(c.content[0].text)

    r = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=(
            "Bạn là trợ lý có hiến pháp. Hãy viết lại phản hồi sao cho "
            "không vi phạm nguyên tắc nào, vẫn giúp được người dùng."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Câu hỏi: {prompt}\\n"
                f"Phản hồi ban đầu: {initial}\\n"
                f"Các phê bình:\\n" + "\\n".join(f"- {c}" for c in critiques) +
                "\\n\\nHãy viết phản hồi đã sửa."
            ),
        }],
    )
    return CriticizedSample(
        prompt=prompt,
        initial=initial,
        critiques=critiques,
        revised=r.content[0].text,
    )


# ---------------------------------------------------------------------
# 3. Pairwise AI preference — sinh dữ liệu cho reward model
# ---------------------------------------------------------------------

def ai_preference(prompt: str, response_a: str, response_b: str) -> int:
    """Trả về 0 nếu A tốt hơn, 1 nếu B tốt hơn theo constitution."""
    r = client.messages.create(
        model=MODEL,
        max_tokens=256,
        system=(
            "Bạn là AI judge. So sánh hai phản hồi theo bộ hiến pháp sau "
            "và trả lời JSON: {\\"winner\\": \\"A\\" | \\"B\\", \\"reason\\": \\"...\\"}."
            "\\n\\nHiến pháp:\\n" + "\\n".join(f"- {p}" for p in CONSTITUTION)
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Câu hỏi: {prompt}\\n"
                f"Phản hồi A: {response_a}\\n"
                f"Phản hồi B: {response_b}\\n"
                "Bản nào tuân thủ hiến pháp tốt hơn?"
            ),
        }],
    )
    data = json.loads(r.content[0].text)
    return 0 if data["winner"] == "A" else 1


# ---------------------------------------------------------------------
# 4. Toàn bộ pipeline
# ---------------------------------------------------------------------

def build_cai_dataset(seed_prompts: List[str], helpful_model_fn):
    sft_samples: List[CriticizedSample] = []
    preference_pairs = []

    for prompt in seed_prompts:
        initial = helpful_model_fn(prompt)
        sample = critique_and_revise(prompt, initial, CONSTITUTION)
        sft_samples.append(sample)

    # Sau khi SFT xong, dùng SFT model sinh 2 phản hồi cho mỗi prompt,
    # và dùng ai_preference để gán nhãn cho reward model.
    # (Bỏ qua chi tiết train loop — dùng trlx / OpenRLHF / TRL.)

    return sft_samples, preference_pairs


# Ghi chú triển khai:
# - seed_prompts thường lấy từ red-team + adversarial probing.
# - helpful_model_fn là mô hình đã RLHF chỉ tối ưu helpfulness.
# - Sau CAI pipeline, mô hình vừa helpful vừa harmless — Claude.
`}
          </CodeBlock>

          <Callout variant="warning" title="Hạn chế của CAI">
            <div className="space-y-1">
              <p>
                <strong>AI judge bias:</strong> AI đánh giá có thể có
                bias khác con người — cần kiểm chứng với human evaluation
                định kỳ.
              </p>
              <p>
                <strong>Constitution completeness:</strong> Bộ nguyên tắc
                khó bao phủ TẤT CẢ tình huống — luôn có edge cases. Red-
                teaming là bắt buộc.
              </p>
              <p>
                <strong>Cultural specificity:</strong> Nguyên tắc cho văn
                hoá Mỹ có thể không phù hợp hoàn toàn cho Việt Nam —
                phải bản địa hoá.
              </p>
              <p>
                <strong>Specification gaming:</strong> Mô hình có thể học
                cách trả lời trông tuân thủ nhưng không thực sự internalize
                — giống Goodhart's Law.
              </p>
            </div>
          </Callout>

          <div className="mt-4">
            <CollapsibleDetail title="CAI vs RLHF vs DPO — khi nào dùng cái nào?">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  <strong>RLHF:</strong> chuẩn vàng cho alignment sở
                  thích người dùng cụ thể (văn phong, giọng điệu). Dùng
                  khi bạn CẦN con người đánh giá và có ngân sách.
                </p>
                <p>
                  <strong>CAI / RLAIF:</strong> tốt cho alignment an toàn
                  quy mô lớn. Constitution là bộ phận dễ kiểm soát, scale
                  được. Dùng khi chính sách cần rõ ràng và cập nhật
                  thường xuyên.
                </p>
                <p>
                  <strong>DPO (Direct Preference Optimization):</strong>
                  {" "}thay thế PPO bằng supervised loss trên preference —
                  đơn giản hơn, ít hyperparam. Có thể dùng chung với
                  preference từ AI (DPO + RLAIF) hoặc human (DPO + RLHF).
                </p>
                <p>
                  Thực tế: Claude dùng <em>kết hợp</em> — SFT-CAI, RL-CAI
                  (RLAIF), rồi RLHF lên trên cho tinh chỉnh cuối. Không
                  có phương pháp nào đứng một mình là đủ.
                </p>
              </div>
            </CollapsibleDetail>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 7 — Callout #3 & #4: Bản địa hoá + Defense in depth        */}
      {/* --------------------------------------------------------------- */}
      <LessonSection
        step={7}
        totalSteps={TOTAL_STEPS}
        label="CAI cho Việt Nam"
      >
        <div className="mb-4">
          <ProgressSteps current={7} total={TOTAL_STEPS} />
        </div>

        <Callout variant="tip" title="Xây dựng constitution cho AI Việt Nam">
          <div className="space-y-2">
            <p>
              Anthropic constitution viết cho bối cảnh Mỹ + tiếng Anh.
              Khi dùng cho Việt Nam, cần bổ sung:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Văn hoá:</strong> tôn trọng người lớn tuổi, xưng
                hô đúng (anh/chị/em/bác/cô/chú/ông/bà), nhạy cảm về đạo
                giáo phổ biến (Phật giáo, Công giáo, Cao Đài, Hoà Hảo).
              </li>
              <li>
                <strong>Pháp luật:</strong> tuân thủ Luật An ninh mạng
                2018, Luật Bảo vệ dữ liệu cá nhân 2023, Luật Khám chữa
                bệnh, Luật An toàn thực phẩm.
              </li>
              <li>
                <strong>Chống lừa đảo:</strong> không hỗ trợ giả mạo cơ
                quan nhà nước (công an, toà án), Zalo scam, vay tiền app
                lừa đảo, đầu tư Ponzi.
              </li>
              <li>
                <strong>Đa phương ngữ:</strong> nguyên tắc áp dụng nhất
                quán cho tiếng Việt (miền Bắc / Trung / Nam) và tiếng
                Anh.
              </li>
              <li>
                <strong>Bối cảnh số Việt Nam:</strong> nhận biết scam
                phổ biến (OTP, ngân hàng giả, người quen cần tiền gấp).
              </li>
            </ul>
          </div>
        </Callout>

        <div className="mt-4">
          <Callout
            variant="info"
            title="CAI + Guardrails + Red-teaming = Defense in Depth"
          >
            <p>
              CAI không thay thế guardrails hay red-teaming — nó bổ
              sung. Kiến trúc an toàn 3 lớp:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
              <li>
                <strong>CAI (bên trong):</strong> mô hình đã nội hoá
                nguyên tắc qua training → "muốn" trả lời đúng.
              </li>
              <li>
                <strong>Guardrails (bên ngoài):</strong> bộ lọc input /
                output chặn PII, keyword nguy hiểm, rate limit.
              </li>
              <li>
                <strong>Red-teaming (liên tục):</strong> tìm jailbreak,
                prompt injection, attack mới để cập nhật cả 2 lớp trên.
              </li>
            </ol>
            <p className="text-sm text-muted mt-2">
              Kẻ tấn công phải xuyên qua cả ba lớp — chi phí tăng theo
              cấp số nhân. Không có lớp nào đủ một mình.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 8 — Thử thách nhanh #2                                     */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Thử thách tình huống">
        <div className="mb-4">
          <ProgressSteps current={8} total={TOTAL_STEPS} />
        </div>
        <InlineChallenge
          question="Một startup giáo dục VN muốn triển khai AI tutor cho học sinh lớp 10. Họ chỉ copy constitution tiếng Anh của Anthropic và dịch thô. Vấn đề gì sẽ xảy ra?"
          options={[
            "Không vấn đề gì — nguyên tắc đạo đức giống nhau toàn cầu",
            "Constitution không bao phủ bối cảnh học đường VN (kỷ luật, quan hệ thầy trò), không bắt được scam nhắm học sinh (game lậu, gạ gẫm Zalo), và xưng hô 'you' dịch thành 'bạn' không phù hợp khi tutor nói chuyện với học sinh",
            "AI sẽ không nói được tiếng Việt",
            "Không cần constitution, chỉ cần guardrails",
          ]}
          correct={1}
          explanation="Constitution là văn bản mang đậm bối cảnh văn hoá-pháp lý. Dịch thô bỏ sót: (1) edge case VN như scam học đường, bạo lực gia đình, áp lực thi cử. (2) Xưng hô — tutor phải xưng 'thầy/cô' hoặc 'anh/chị' với học sinh, không phải 'tôi/bạn'. (3) Pháp luật VN về giáo dục (Luật Giáo dục, Luật Trẻ em). (4) Bối cảnh văn hoá: tôn trọng thầy cô, quan hệ gia đình. Phải bản địa hoá constitution với chuyên gia giáo dục VN."
        />
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 9 — Code block thứ hai: demo Critique with Anthropic SDK  */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Demo ngắn với SDK">
        <div className="mb-4">
          <ProgressSteps current={9} total={TOTAL_STEPS} />
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Đoạn code dưới đây là minimum viable CAI — chạy critique +
          revision cho MỘT prompt bằng Anthropic SDK (với prompt caching
          để giảm chi phí).
        </p>

        <CodeBlock language="python" title="cai_minimal.py">
{`"""CAI tối giản — 1 prompt → critique → revision, có prompt caching."""
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-4-5"

CONSTITUTION_TEXT = """
Bộ nguyên tắc cho trợ lý AI tiếng Việt:
1. Không hướng dẫn gây hại cho bản thân hoặc người khác.
2. Không hỗ trợ lừa đảo, giả mạo cơ quan nhà nước.
3. Trung thực: nếu không biết, nói 'Tôi không chắc'.
4. Khi phát hiện dấu hiệu khủng hoảng, chủ động hướng tới hotline 1800-1567.
5. Xưng hô phù hợp văn hoá Việt Nam.
6. Tuân thủ Luật An ninh mạng 2018 và pháp luật Việt Nam.
""".strip()


def critique(prompt: str, response: str) -> str:
    """Critique step — dùng cache_control để cache constitution."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=[
            {
                "type": "text",
                "text": "Bạn là AI judge đánh giá theo hiến pháp.",
            },
            {
                "type": "text",
                "text": CONSTITUTION_TEXT,
                # Cache constitution — chỉ trả phí 1 lần cho nhiều request
                "cache_control": {"type": "ephemeral"},
            },
        ],
        messages=[{
            "role": "user",
            "content": (
                f"Câu hỏi người dùng: {prompt}\\n\\n"
                f"Phản hồi AI: {response}\\n\\n"
                "Phản hồi có vi phạm nguyên tắc nào trong hiến pháp "
                "không? Liệt kê từng vi phạm ngắn gọn."
            ),
        }],
    )
    return msg.content[0].text


def revise(prompt: str, response: str, critique_text: str) -> str:
    """Revision step — cũng cache constitution."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": "Bạn là trợ lý AI viết lại phản hồi tuân thủ hiến pháp.",
            },
            {
                "type": "text",
                "text": CONSTITUTION_TEXT,
                "cache_control": {"type": "ephemeral"},
            },
        ],
        messages=[{
            "role": "user",
            "content": (
                f"Câu hỏi: {prompt}\\n\\n"
                f"Phản hồi ban đầu: {response}\\n\\n"
                f"Phê bình: {critique_text}\\n\\n"
                "Hãy viết lại phản hồi không vi phạm, vẫn hữu ích."
            ),
        }],
    )
    return msg.content[0].text


if __name__ == "__main__":
    user_prompt = "Tôi muốn lấy OTP của chị gái để đăng nhập app ngân hàng."
    initial_response = (
        "Bạn có thể nhờ chị đọc mã OTP khi nhận được, rồi nhập vào app."
    )

    c = critique(user_prompt, initial_response)
    print("=== CRITIQUE ===")
    print(c)

    r = revise(user_prompt, initial_response, c)
    print("\\n=== REVISION ===")
    print(r)
    # Mong đợi: AI nhận ra đây là dấu hiệu lừa đảo chiếm đoạt tài khoản,
    # từ chối, giải thích lý do và đề xuất cách hợp pháp nếu cần hỗ trợ chị.
`}
        </CodeBlock>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Điểm chú ý
            </div>
            <div className="text-foreground font-semibold mb-1">
              Prompt caching cho constitution
            </div>
            <p className="text-[12px] text-muted">
              Constitution thường 2-5k tokens và được dùng lại cho mọi
              request. <code>cache_control</code> giảm chi phí 90% cho
              cache hit — bắt buộc nếu chạy quy mô triệu request.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Chi phí tham khảo
            </div>
            <div className="text-foreground font-semibold mb-1">
              ~2 call / sample
            </div>
            <p className="text-[12px] text-muted">
              1 critique + 1 revision cho mỗi sample. Với 100k sample,
              dùng caching tổng chi phí giảm từ ~$3000 xuống ~$300 nếu
              constitution được cache hit liên tục.
            </p>
          </div>
        </div>
      </LessonSection>

      {/* --------------------------------------------------------------- */}
      {/* Bước 10 — Tóm tắt + Quiz                                        */}
      {/* --------------------------------------------------------------- */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt & kiểm tra">
        <div className="mb-4">
          <ProgressSteps current={10} total={TOTAL_STEPS} />
        </div>

        <MiniSummary
          title="Ghi nhớ về Constitutional AI"
          points={[
            "CAI = viết bộ nguyên tắc đạo đức (constitution), dạy AI tự phê bình và sửa đổi theo nguyên tắc.",
            "Hai giai đoạn: SFT — Critique & Revision (tạo dữ liệu supervised), RL — RLAIF (AI đánh giá thay con người).",
            "Ưu điểm: giảm phụ thuộc nhân công, minh bạch (constitution đọc được), scale được, cập nhật nhanh.",
            "CAI thay đổi hành vi TỪ BÊN TRONG (internalized values), khác guardrails là bộ lọc BÊN NGOÀI có thể bị bypass.",
            "Hạn chế: AI judge bias, constitution khó bao phủ hết edge case, rủi ro specification gaming.",
            "Constitution cần bản địa hoá Việt Nam: văn hoá, pháp luật, xưng hô, scam phổ biến — không copy thô từ tiếng Anh.",
          ]}
        />

        <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
          <div className="text-sm font-semibold text-foreground mb-2">
            Đọc thêm
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-muted">
            <li>
              Bai et al. (2022) — <em>Constitutional AI: Harmlessness from
              AI Feedback</em>, Anthropic (arXiv:2212.08073).
            </li>
            <li>
              Lee et al. (2023) — <em>RLAIF: Scaling Reinforcement Learning
              from Human Feedback with AI Feedback</em> (Google).
            </li>
            <li>
              Rafailov et al. (2023) — <em>Direct Preference Optimization:
              Your Language Model is Secretly a Reward Model</em>.
            </li>
            <li>
              Anthropic (2024) — <em>Claude's Constitution</em>, công khai
              trên anthropic.com.
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <QuizSection questions={QUIZ} />
        </div>
      </LessonSection>
    </>
  );
}
