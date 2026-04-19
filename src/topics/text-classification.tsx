"use client";

import { Fragment, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Tag,
  Tags,
  Inbox,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  Wallet,
  Wrench,
  Layers,
  GitBranch,
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  MailCheck,
  Filter,
  CheckCircle2,
  CircleDashed,
  MessageCircle,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  ToggleCompare,
  MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "text-classification",
  title: "Text Classification",
  titleVi: "Phân loại văn bản",
  description:
    "AI đọc tin nhắn rồi gán nhãn — giống nhân viên thư phòng ngày xưa phân loại thư nhưng nhanh hơn triệu lần. Cốt lõi của chatbot, bộ lọc spam, hệ thống hỗ trợ khách hàng.",
  category: "nlp",
  tags: ["nlp", "classification", "supervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis", "text-classification-in-support-routing"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ── Danh mục cho live classifier ───────────────────────────────── */
type Category = {
  id: string;
  label: string;
  color: string;
  icon: typeof Inbox;
  keywords: string[];
  hint: string;
};

const CATEGORIES: Category[] = [
  {
    id: "support",
    label: "Hỗ trợ kỹ thuật",
    color: "#3b82f6",
    icon: Wrench,
    keywords: [
      "lỗi", "không vào được", "bị treo", "không hoạt động", "sập", "crash",
      "không mở được", "hỏng", "pass", "đăng nhập", "cài đặt", "app", "ứng dụng",
    ],
    hint: "App / phần mềm / đăng nhập / cài đặt",
  },
  {
    id: "complaint",
    label: "Khiếu nại",
    color: "#ef4444",
    icon: ShieldAlert,
    keywords: [
      "thất vọng", "tệ", "bực", "yêu cầu bồi thường", "khiếu nại", "khiếu kiện",
      "thô lỗ", "chậm", "sai hàng", "không ai", "không ai trả lời",
    ],
    hint: "Phàn nàn dịch vụ / thái độ / bồi thường",
  },
  {
    id: "refund",
    label: "Hoàn tiền / đổi trả",
    color: "#f59e0b",
    icon: RotateCcw,
    keywords: [
      "hoàn tiền", "refund", "đổi trả", "trả lại", "trả hàng", "hủy đơn",
      "hủy gói", "cancel", "trả tiền",
    ],
    hint: "Đổi trả / hoàn tiền / huỷ đơn",
  },
  {
    id: "billing",
    label: "Thanh toán",
    color: "#a855f7",
    icon: Wallet,
    keywords: [
      "thanh toán", "hóa đơn", "invoice", "thẻ", "chuyển khoản", "trừ tiền",
      "phí", "charge", "gia hạn", "subscription",
    ],
    hint: "Hóa đơn / thẻ / trừ tiền / gia hạn",
  },
  {
    id: "question",
    label: "Câu hỏi chung",
    color: "#22c55e",
    icon: HelpCircle,
    keywords: [
      "hỏi", "có", "được không", "bao nhiêu", "size", "cho mình",
      "cho tôi", "khi nào", "ở đâu", "giờ mở",
    ],
    hint: "Hỏi thông tin, giờ mở cửa, còn hàng…",
  },
];

type CategoryScore = { id: string; score: number };

function classifyMessage(text: string): CategoryScore[] {
  const lower = text.toLowerCase();
  const scores = CATEGORIES.map((c) => {
    let hit = 0;
    for (const k of c.keywords) {
      if (lower.includes(k)) hit++;
    }
    return { id: c.id, score: hit };
  });
  const total = scores.reduce((s, x) => s + x.score, 0);
  if (total === 0) {
    // fallback: đều
    return scores.map((s) => ({ ...s, score: 0.2 }));
  }
  return scores.map((s) => ({ ...s, score: s.score / total }));
}

/* ── Multi-label ví dụ ──────────────────────────────────────────── */
const MULTI_LABEL_EXAMPLES = [
  {
    text: "App bị lỗi đăng nhập, mất tiền trong thẻ mà chưa được hoàn lại",
    flat: ["Hỗ trợ kỹ thuật"],
    hierarchical: ["Hỗ trợ kỹ thuật", "Thanh toán", "Hoàn tiền / đổi trả"],
  },
  {
    text: "Hãng giao sai đơn, mình muốn đổi trả và cần bồi thường phí ship",
    flat: ["Khiếu nại"],
    hierarchical: ["Khiếu nại", "Hoàn tiền / đổi trả"],
  },
  {
    text: "Shop còn size M không ạ? Nếu có thì ship về quận 7 mất bao lâu?",
    flat: ["Câu hỏi chung"],
    hierarchical: ["Câu hỏi chung"],
  },
];

/* ── Active learning demo ───────────────────────────────────────── */
type UnlabeledItem = { id: number; text: string; trueLabel: string };
const UNLABELED: UnlabeledItem[] = [
  { id: 1, text: "App crash ngay khi mở camera", trueLabel: "Hỗ trợ kỹ thuật" },
  { id: 2, text: "Muốn hoàn tiền đơn hàng #4521", trueLabel: "Hoàn tiền / đổi trả" },
  { id: 3, text: "Bị trừ 2 lần tiền gia hạn Premium", trueLabel: "Thanh toán" },
  { id: 4, text: "Còn khuyến mãi cuối tuần không shop?", trueLabel: "Câu hỏi chung" },
  { id: 5, text: "Thái độ nhân viên rất tệ, đòi bồi thường", trueLabel: "Khiếu nại" },
  { id: 6, text: "Không đăng nhập được dù đã đổi mật khẩu", trueLabel: "Hỗ trợ kỹ thuật" },
];

/* ── Quiz ───────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Phân loại văn bản khác phân tích cảm xúc ở điểm nào?",
    options: [
      "Không khác nhau",
      "Phân loại văn bản gán BẤT KỲ nhãn nào (thể thao, intent, spam…), phân tích cảm xúc chỉ gán tích cực/tiêu cực",
      "Phân tích cảm xúc khó hơn phân loại",
      "Phân loại không dùng deep learning",
    ],
    correct: 1,
    explanation:
      "Phân tích cảm xúc là MỘT DẠNG riêng của phân loại văn bản (nhãn = cảm xúc). Phân loại tổng quát hơn: chủ đề, ý định, ngôn ngữ, spam/không spam, mức độ khẩn cấp…",
  },
  {
    question: "Email tới hộp thư công ty: 'BẠN ĐÃ TRÚNG 1 TỶ! Click link nhận ngay'. AI sẽ phân loại vào đâu?",
    options: [
      "Thư quan trọng",
      "Spam — đây là ứng dụng phân loại văn bản kinh điển",
      "Thư nội bộ",
      "Thư marketing hợp lệ",
    ],
    correct: 1,
    explanation:
      "Lọc spam là ứng dụng đầu tiên và phổ biến nhất của phân loại văn bản. Gmail lọc hàng tỷ email mỗi ngày với độ chính xác > 99%.",
  },
  {
    question: "Một khách hỏi 'Đơn #1234 của tôi đâu rồi ạ?'. Chatbot phải gán intent nào?",
    options: [
      "Khiếu nại",
      "Tra cứu đơn hàng — intent classification",
      "Yêu cầu hoàn tiền",
      "Hỏi khuyến mãi",
    ],
    correct: 1,
    explanation:
      "'Đơn #1234 đâu rồi' → intent = tra cứu đơn. Chatbot có thể tự động trả lời trạng thái mà không cần chuyển cho nhân viên. Đó là lý do Intercom / Zendesk tiết kiệm 30–45% thời gian phản hồi.",
  },
  {
    question: "Precision = 95%, Recall = 60%. Điều này nghĩa là gì với bộ lọc spam?",
    options: [
      "Bộ lọc hoàn hảo",
      "Cứ 100 email bị gắn nhãn spam thì 95 đúng, nhưng bỏ sót 40% email spam thật",
      "Bộ lọc sai nhiều",
      "Bộ lọc bắt quá nhiều spam giả",
    ],
    correct: 1,
    explanation:
      "Precision cao = ít thư thường bị đánh nhầm là spam (tốt). Recall thấp = bỏ lọt nhiều spam thật. Với bộ lọc spam, người ta ưu tiên precision cao để không lỡ thư quan trọng.",
  },
  {
    type: "fill-blank",
    question:
      "Phân loại văn bản là bài toán supervised: cần bộ dữ liệu có {blank} (văn bản kèm nhãn) để {blank} mô hình.",
    blanks: [
      { answer: "nhãn", accept: ["labels", "labeled", "có nhãn", "gán nhãn"] },
      { answer: "huấn luyện", accept: ["training", "train", "đào tạo"] },
    ],
    explanation:
      "Workflow: (1) thu thập văn bản → (2) gán nhãn (nhờ con người hoặc rule) → (3) huấn luyện mô hình để học ánh xạ văn bản → nhãn. Chất lượng nhãn quyết định chất lượng mô hình.",
  },
];

/* ───────────────────── Main Component ───────────────────────────── */
export default function TextClassificationTopic() {
  /* ── demo 1: live classifier ───────────── */
  const [message, setMessage] = useState(
    "App không vào được, đã đổi mật khẩu mà vẫn lỗi",
  );
  const scores = useMemo(() => classifyMessage(message), [message]);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topCategory = CATEGORIES.find((c) => c.id === sorted[0].id)!;

  const onChangeMessage = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value),
    [],
  );

  /* ── demo 3: active learning ───────────── */
  const [labeledIds, setLabeledIds] = useState<Set<number>>(new Set([1, 3]));
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());

  // Độ chính xác mô phỏng — càng nhiều nhãn mới càng cao
  const accuracy = Math.min(
    0.95,
    0.55 + (labeledIds.size - wrongIds.size) * 0.07,
  );

  function labelItem(id: number) {
    setLabeledIds((prev) => new Set(prev).add(id));
  }
  function resetActive() {
    setLabeledIds(new Set([1, 3]));
    setWrongIds(new Set());
  }

  const unlabeled = UNLABELED.filter((u) => !labeledIds.has(u.id));

  return (
    <>
      {/* =================================================================
          BƯỚC 1 — DỰ ĐOÁN
          ================================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Một khách nhắn trên fanpage: "Đăng nhập vào app mãi không được, đã thử đổi mật khẩu rồi". Theo bạn, chatbot nên chuyển cho bộ phận nào?`}
          options={[
            "Khiếu nại",
            "Hỗ trợ kỹ thuật",
            "Hoàn tiền / đổi trả",
          ]}
          correct={1}
          explanation="Khách đang gặp trục trặc kỹ thuật, chưa phàn nàn thái độ hay xin tiền. AI phải nhận ra INTENT = hỗ trợ kỹ thuật và chuyển đúng đội. Bài học hôm nay là: làm thế nào máy gắn đúng nhãn chỉ từ vài chục chữ."
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 2 — ẨN DỤ: nhân viên thư phòng
          ================================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Thời ông bà mình, mọi công ty đều có <strong>nhân viên thư
            phòng</strong>. Bác ấy ngồi giữa đống phong bì: đọc qua vài dòng,
            liếc tem, rồi bỏ vào đúng ngăn — <em>khách hàng</em>, <em>nhà
            cung cấp</em>, <em>hóa đơn</em>, <em>khiếu nại</em>. Ngày mấy nghìn
            lá thư. Phân loại văn bản (text classification) là phiên bản máy
            tính của chính công việc đó — chỉ khác là bác thư phòng xử 2.000
            thư/ngày, còn AI xử 2 triệu tin nhắn/giây.
          </p>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Inbox size={16} className="text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Năm &ldquo;ngăn&rdquo; cho chatbot khách hàng
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border p-3 text-center"
                  style={{
                    borderColor: c.color + "40",
                    backgroundColor: c.color + "10",
                  }}
                >
                  <c.icon
                    size={18}
                    style={{ color: c.color }}
                    className="mx-auto mb-1"
                  />
                  <p
                    className="text-[11px] font-bold"
                    style={{ color: c.color }}
                  >
                    {c.label}
                  </p>
                  <p className="text-[10px] text-muted mt-1">{c.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <Callout variant="insight" title="Rộng hơn bạn nghĩ">
            <p>
              Lọc spam, gán chuyên mục báo VnExpress, phân loại CV ứng viên,
              đánh giá khẩn cấp hay thường cho tin nhắn y tế, phát hiện toxic
              trên mạng xã hội — <strong>tất cả đều là phân loại văn
              bản</strong>. Chỉ khác &ldquo;tập nhãn&rdquo; bạn định nghĩa.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* =================================================================
          BƯỚC 3 — BA DEMO TRỰC QUAN
          ================================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Trực quan hóa">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-10">
            {/* ─── DEMO 1: Live classifier ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 1 · Gõ tin nhắn, xem máy gán nhãn
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Mô phỏng chatbot công ty. Gõ tin nhắn tiếng Việt, xem máy phân
                vào ngăn nào trong 5 ngăn.
              </p>

              <textarea
                value={message}
                onChange={onChangeMessage}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none resize-none"
                placeholder="Ví dụ: 'Mình bị trừ 2 lần phí subscription, hoàn lại giúp với'"
              />

              {/* Kết luận chính */}
              <div
                className="rounded-xl border-2 p-4 flex items-center justify-between"
                style={{
                  borderColor: topCategory.color + "60",
                  backgroundColor: topCategory.color + "10",
                }}
              >
                <div className="flex items-center gap-3">
                  <topCategory.icon size={22} style={{ color: topCategory.color }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      Máy gán nhãn
                    </p>
                    <p
                      className="text-base font-bold"
                      style={{ color: topCategory.color }}
                    >
                      {topCategory.label}
                    </p>
                  </div>
                </div>
                <div
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    color: topCategory.color,
                    backgroundColor: topCategory.color + "20",
                  }}
                >
                  {Math.round(sorted[0].score * 100)}% tin tưởng
                </div>
              </div>

              {/* Thanh xác suất cho từng nhãn */}
              <div className="space-y-2">
                {sorted.map((s) => {
                  const cat = CATEGORIES.find((c) => c.id === s.id)!;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <cat.icon size={14} style={{ color: cat.color }} className="shrink-0" />
                      <span className="w-32 text-xs text-foreground">
                        {cat.label}
                      </span>
                      <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                          animate={{ width: `${Math.max(2, s.score * 100)}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <span
                        className="w-12 text-right text-xs font-bold"
                        style={{ color: cat.color }}
                      >
                        {Math.round(s.score * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── DEMO 2: Multi-label & hierarchical ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tags size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 2 · Một tin nhắn, nhiều nhãn cùng lúc
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Thực tế, một tin nhắn có thể thuộc nhiều ngăn. Máy học với
                nhãn <strong>phẳng</strong> (chỉ chọn 1) sẽ mất thông tin — khi
                chuyển sang <strong>đa nhãn phân cấp</strong>, đội xử lý biết
                đầy đủ hơn.
              </p>

              <ToggleCompare
                labelA="Nhãn phẳng (chọn 1)"
                labelB="Đa nhãn phân cấp"
                description="Cùng một tin nhắn, so sánh hai cách tổ chức nhãn."
                childA={
                  <div className="space-y-3">
                    {MULTI_LABEL_EXAMPLES.map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <p className="text-xs text-foreground">
                          &ldquo;{ex.text}&rdquo;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ex.flat.map((f) => {
                            const cat = CATEGORIES.find((c) => c.label === f)!;
                            return (
                              <span
                                key={f}
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  color: cat.color,
                                  backgroundColor: cat.color + "15",
                                }}
                              >
                                {f}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                }
                childB={
                  <div className="space-y-3">
                    {MULTI_LABEL_EXAMPLES.map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <p className="text-xs text-foreground">
                          &ldquo;{ex.text}&rdquo;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ex.hierarchical.map((f) => {
                            const cat = CATEGORIES.find((c) => c.label === f)!;
                            return (
                              <span
                                key={f}
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  color: cat.color,
                                  backgroundColor: cat.color + "15",
                                }}
                              >
                                {f}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />

              {/* Hierarchical tree */}
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-accent" />
                  <p className="text-xs font-semibold text-foreground">
                    Cây nhãn phân cấp (ví dụ công ty SaaS)
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <TreeRow level={0} label="Hỗ trợ khách hàng" color="#0ea5e9" icon={Inbox} />
                  <TreeRow level={1} label="Kỹ thuật" color="#3b82f6" icon={Wrench} />
                  <TreeRow level={2} label="Đăng nhập" color="#3b82f6" />
                  <TreeRow level={2} label="Cài đặt / app crash" color="#3b82f6" />
                  <TreeRow level={1} label="Thanh toán" color="#a855f7" icon={Wallet} />
                  <TreeRow level={2} label="Thẻ / trừ tiền sai" color="#a855f7" />
                  <TreeRow level={2} label="Gia hạn" color="#a855f7" />
                  <TreeRow level={1} label="Đổi trả / hoàn tiền" color="#f59e0b" icon={RotateCcw} />
                  <TreeRow level={1} label="Khiếu nại" color="#ef4444" icon={ShieldAlert} />
                  <TreeRow level={1} label="Câu hỏi chung" color="#22c55e" icon={HelpCircle} />
                </div>
              </div>
            </div>

            {/* ─── DEMO 3: Active learning ─── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-foreground">
                  Demo 3 · Học chủ động — gán thêm nhãn, xem độ chính xác tăng
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Mô phỏng: bạn là người dán nhãn. Hệ thống đã có 2 tin nhắn có
                nhãn. Nhấn &ldquo;dán nhãn đúng&rdquo; để dạy máy — độ chính
                xác tăng dần.
              </p>

              {/* progress */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MailCheck size={14} className="text-green-500" />
                    <span className="text-xs text-muted">
                      Đã dán nhãn: <strong className="text-foreground">{labeledIds.size}</strong> / {UNLABELED.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-accent">
                    <TrendingUp size={12} />
                    Độ chính xác: {Math.round(accuracy * 100)}%
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-green-400"
                    animate={{ width: `${accuracy * 100}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>
              </div>

              {/* Labeled pool */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã có nhãn ({labeledIds.size})
                </p>
                <div className="space-y-1">
                  <AnimatePresence>
                    {UNLABELED.filter((u) => labeledIds.has(u.id)).map((u) => {
                      const cat = CATEGORIES.find((c) => c.label === u.trueLabel)!;
                      return (
                        <motion.div
                          key={u.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between rounded-lg border border-green-400/30 bg-green-50/40 dark:bg-green-900/10 p-2 text-xs"
                        >
                          <span className="text-foreground">&ldquo;{u.text}&rdquo;</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                            style={{
                              color: cat.color,
                              backgroundColor: cat.color + "15",
                            }}
                          >
                            {u.trueLabel}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Unlabeled pool */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2 flex items-center gap-1">
                  <CircleDashed size={12} /> Chưa có nhãn ({unlabeled.length})
                </p>
                <div className="space-y-1">
                  <AnimatePresence>
                    {unlabeled.map((u) => (
                      <motion.div
                        key={u.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between rounded-lg border border-dashed border-border bg-surface/30 p-2 text-xs"
                      >
                        <span className="text-foreground">&ldquo;{u.text}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => labelItem(u.id)}
                          className="shrink-0 rounded-full bg-accent text-white px-3 py-1 text-[10px] font-semibold hover:opacity-90"
                        >
                          Dán nhãn
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {unlabeled.length === 0 && (
                    <p className="text-xs italic text-muted text-center py-3">
                      Đã dán hết. Mô hình đã học xong bộ này.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetActive}
                  className="text-[11px] text-muted underline hover:text-foreground"
                >
                  Khôi phục ban đầu
                </button>
              </div>

              <Callout variant="tip" title="Vì sao thực tế lại dán thêm nhãn?">
                <p className="text-xs">
                  Mô hình học <strong>càng nhiều nhãn thật càng tốt</strong>.
                  Các công ty lớn chi hàng triệu đô để thuê &ldquo;data
                  labelers&rdquo; (người dán nhãn). Active learning giúp máy tự
                  chọn những mẫu nó thấy <em>mơ hồ nhất</em> để hỏi con người —
                  tiết kiệm 60–80% công dán nhãn.
                </p>
              </Callout>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 4 — AHA
          ================================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            Phân loại văn bản <strong>không phải tìm từ khóa</strong>.
            &ldquo;App bị đơ&rdquo; và &ldquo;phần mềm không phản hồi&rdquo;
            không trùng một chữ nào — nhưng cùng một ý định. AI hiện đại hiểu
            điều đó bằng cách đọc <strong>ý nghĩa</strong>, không phải đếm từ.
          </p>
          <p className="text-sm text-muted mt-2">
            Vì thế bạn chỉ cần đưa vài nghìn ví dụ có nhãn — máy tự học ra khái
            niệm &ldquo;hỗ trợ kỹ thuật&rdquo; kể cả khi khách viết theo cách
            chưa từng thấy.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =================================================================
          BƯỚC 5 — CHALLENGE
          ================================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`Chatbot ngân hàng nhận tin: "Mình mất thẻ, muốn khóa gấp giúp mình nhé 🙏". Intent đúng là?`}
          options={[
            "Câu hỏi chung",
            "Khóa thẻ khẩn cấp (intent cụ thể) — phải route ưu tiên cao",
            "Khiếu nại",
            "Yêu cầu đổi trả",
          ]}
          correct={1}
          explanation="'Mất thẻ' + 'muốn khóa gấp' → intent khóa thẻ, mức độ khẩn cấp cao. AI phân loại đúng sẽ đẩy ticket lên top queue và đội mobile bank xử lý trong vài phút. Intent + urgency thường được phân loại ĐỒNG THỜI trong hệ thống thực."
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 6 — EXPLANATION
          ================================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Phân loại văn bản là bài toán NLP cơ bản nhất và phổ biến nhất. Về
            bản chất: đưa một đoạn văn vào, lấy ra một (hoặc nhiều){" "}
            <strong>nhãn</strong> đã định nghĩa sẵn. Công thức không quan
            trọng với dân văn phòng — cái quan trọng là: biết khi nào dùng gì,
            hiểu các đo lường nào, và tránh những cái bẫy thường gặp.
          </p>

          {/* Ba kỹ thuật */}
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: Filter,
                title: "Rule & Keyword",
                subtitle: "Từ điển & biểu thức",
                desc: "Kê danh sách từ cấm, regex. Nhanh, dễ giải thích, nhưng giòn (khách viết khác là sai).",
                acc: "60–70%",
                color: "#3b82f6",
              },
              {
                icon: Sparkles,
                title: "ML cổ điển",
                subtitle: "Naive Bayes, SVM, Logistic",
                desc: "Học từ vài nghìn ví dụ có nhãn. Đủ tốt cho bộ lọc spam, phân chuyên mục báo, triage ticket đơn giản.",
                acc: "80–90%",
                color: "#a855f7",
              },
              {
                icon: Target,
                title: "BERT / LLM",
                subtitle: "PhoBERT, XLM-R, GPT",
                desc: "Hiểu ý định, đảo ngữ, viết tắt, emoji. Cần ít dữ liệu nhãn hơn nhờ pre-training.",
                acc: "90–97%",
                color: "#22c55e",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-xl border p-4 bg-card"
                style={{ borderColor: t.color + "35" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <t.icon size={16} style={{ color: t.color }} />
                  <p className="text-sm font-bold" style={{ color: t.color }}>
                    {t.title}
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted mb-2">
                  {t.subtitle}
                </p>
                <p className="text-xs text-foreground leading-relaxed">{t.desc}</p>
                <p className="text-[11px] font-bold mt-2" style={{ color: t.color }}>
                  Độ chính xác ~ {t.acc}
                </p>
              </div>
            ))}
          </div>

          {/* Các dạng phân loại */}
          <Callout variant="info" title="Các dạng phân loại thường gặp">
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
              <div className="flex gap-2">
                <GitBranch size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Nhị phân</p>
                  <p className="text-[11px] text-muted">
                    Spam / không spam, Toxic / an toàn, Urgent / normal.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Layers size={14} className="text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Đa lớp</p>
                  <p className="text-[11px] text-muted">
                    Chọn 1 trong N: thể thao / kinh tế / công nghệ / giải trí.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Tags size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Đa nhãn</p>
                  <p className="text-[11px] text-muted">
                    Một bài có thể vừa Thể thao vừa Kinh tế (ví dụ chuyển
                    nhượng cầu thủ triệu đô).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <MessageCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Intent (ý định)</p>
                  <p className="text-[11px] text-muted">
                    Cho chatbot: đặt hàng / hỏi info / khiếu nại / chào hỏi /
                    khóa thẻ…
                  </p>
                </div>
              </div>
            </div>
          </Callout>

          {/* Precision / Recall — visual bars */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Đo lường chất lượng — cách đọc biểu đồ trong báo cáo
              </p>
            </div>

            <MetricBar
              label="Precision (độ chính xác)"
              value={0.95}
              color="#22c55e"
              desc="Trong những tin nhắn bị gán KỸ THUẬT, bao nhiêu % thật sự là kỹ thuật?"
            />
            <MetricBar
              label="Recall (độ phủ)"
              value={0.62}
              color="#f59e0b"
              desc="Trong tất cả tin nhắn KỸ THUẬT thật, bao nhiêu % được AI bắt được?"
            />
            <MetricBar
              label="F1 (cân bằng cả hai)"
              value={0.75}
              color="#3b82f6"
              desc="Trung bình điều hòa — chỉ số tổng hợp dùng để so hai mô hình."
            />

            <div className="text-[11px] text-muted leading-relaxed">
              <strong>Mẹo nhớ:</strong> Precision cao ⇒ ít &ldquo;bắt
              nhầm&rdquo;. Recall cao ⇒ ít &ldquo;bỏ sót&rdquo;. Với spam, chọn
              Precision cao. Với ung thư, chọn Recall cao.
            </div>
          </div>

          {/* Confusion matrix mini */}
          <ConfusionMatrix />

          {/* Pitfalls */}
          <Callout variant="warning" title="Bẫy thường gặp khi triển khai">
            <ul className="list-disc pl-5 space-y-1 text-xs text-foreground mt-1">
              <li>
                <strong>Nhãn thủ công không thống nhất</strong> — 3 nhân viên
                gán 1 tin nhắn ra 3 nhãn. Phải có guideline rõ ràng.
              </li>
              <li>
                <strong>Dữ liệu lệch (class imbalance)</strong> — 95% tin là
                &ldquo;Câu hỏi chung&rdquo;, 5% là &ldquo;Khóa thẻ gấp&rdquo;.
                Mô hình thiên vị và bỏ sót khẩn cấp.
              </li>
              <li>
                <strong>Khái niệm trôi (concept drift)</strong> — khách thay
                đổi cách viết (năm 2024 chưa có &ldquo;Livestream chốt đơn&rdquo;,
                2026 có). Mô hình phải retrain định kỳ.
              </li>
              <li>
                <strong>Bỏ qua tầm quan trọng của metadata</strong> — đôi khi
                giờ gửi (3h sáng) hay channel (email vs fanpage) cũng ảnh
                hưởng nhãn.
              </li>
            </ul>
          </Callout>

          {/* Ứng dụng thực tế — grid */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Dân văn phòng dùng phân loại văn bản ở đâu?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  icon: Mail,
                  title: "Lọc email / spam",
                  desc: "Gmail chặn > 99% spam trước khi vào inbox.",
                  color: "#3b82f6",
                },
                {
                  icon: Inbox,
                  title: "Phân chuyên mục",
                  desc: "VnExpress tự gán bài thể thao / kinh tế / công nghệ.",
                  color: "#a855f7",
                },
                {
                  icon: MessageCircle,
                  title: "Intent chatbot",
                  desc: "Shopee/Tiki chatbot: đặt hàng / hỏi giá / khiếu nại.",
                  color: "#22c55e",
                },
                {
                  icon: ShieldAlert,
                  title: "Moderation",
                  desc: "Phát hiện comment toxic, spam, scam trên fanpage.",
                  color: "#ef4444",
                },
                {
                  icon: AlertTriangle,
                  title: "Triage khẩn cấp",
                  desc: "Ticket nào là cháy (khóa thẻ, sập server), ticket nào chờ được.",
                  color: "#f59e0b",
                },
                {
                  icon: Sparkles,
                  title: "Review CV",
                  desc: "Phân loại CV theo vị trí, loại ngành, mức kinh nghiệm.",
                  color: "#06b6d4",
                },
              ].map((u) => (
                <div
                  key={u.title}
                  className="rounded-xl border p-3 bg-card"
                  style={{ borderColor: u.color + "30" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <u.icon size={14} style={{ color: u.color }} />
                    <p className="text-xs font-bold" style={{ color: u.color }}>
                      {u.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {u.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MatchPairs */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Nối nhanh — tin nhắn thuộc nhãn nào?
            </p>
            <MatchPairs
              instruction="Nối từng tin nhắn với nhãn đúng."
              pairs={[
                { left: '"App bị sập ngay sau khi update lên 3.2"', right: "Hỗ trợ kỹ thuật" },
                { left: '"Mình muốn huỷ đơn và nhận lại tiền"', right: "Hoàn tiền / đổi trả" },
                { left: '"Shop còn size M, màu đen không ạ?"', right: "Câu hỏi chung" },
                { left: '"Nhân viên nói chuyện như ăn cướp, đòi bồi thường"', right: "Khiếu nại" },
                { left: '"Bị trừ 2 lần phí gia hạn Premium"', right: "Thanh toán" },
              ]}
            />
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* =================================================================
          BƯỚC 7 — SUMMARY
          ================================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về phân loại văn bản"
          points={[
            "Phân loại văn bản = gán nhãn cho text — giống nhân viên thư phòng nhưng nhanh hơn triệu lần.",
            "Bốn dạng chính: nhị phân, đa lớp, đa nhãn, và intent — chatbot hiện đại phân loại đồng thời ý định + mức độ khẩn cấp.",
            "Ba kỹ thuật: rule (nhanh, giòn) → ML cổ điển (đủ tốt) → BERT/LLM (hiểu ý nghĩa).",
            "Đọc báo cáo: Precision cao → ít bắt nhầm. Recall cao → ít bỏ sót. F1 cân bằng.",
            "Ứng dụng: lọc spam, chuyên mục báo, intent chatbot, moderation, triage ticket, review CV.",
          ]}
        />
      </LessonSection>

      {/* =================================================================
          BƯỚC 8 — QUIZ
          ================================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}

/* ── Subcomponents ─────────────────────────────────────────────── */

function TreeRow({
  level,
  label,
  color,
  icon: Icon,
}: {
  level: number;
  label: string;
  color: string;
  icon?: typeof Inbox;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft: level * 14 }}>
      {level > 0 && <span className="text-muted">└─</span>}
      {Icon ? (
        <Icon size={12} style={{ color }} />
      ) : (
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className={level === 0 ? "font-semibold text-foreground" : "text-foreground"}>
        {label}
      </span>
    </div>
  );
}

function MetricBar({
  label,
  value,
  color,
  desc,
}: {
  label: string;
  value: number;
  color: string;
  desc: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-5 rounded-full bg-surface overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
      <p className="text-[11px] text-muted mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function ConfusionMatrix() {
  // Ma trận nhầm lẫn mô phỏng cho bộ phân loại 3 nhãn
  const labels = ["Kỹ thuật", "Khiếu nại", "Hoàn tiền"];
  const matrix = [
    [82, 6, 2], // row: thật = Kỹ thuật
    [8, 74, 3], // thật = Khiếu nại
    [4, 5, 76], // thật = Hoàn tiền
  ];
  const max = 90;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={14} className="text-accent" />
        <p className="text-sm font-semibold text-foreground">
          Ma trận nhầm lẫn — đâu là chỗ máy hay nhầm?
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div />
        <div className="grid grid-cols-3 gap-1 text-center">
          {labels.map((l) => (
            <div key={l} className="text-[10px] text-muted">
              dự đoán: <strong className="text-foreground">{l}</strong>
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <Fragment key={i}>
            <div className="text-[10px] text-muted self-center text-right pr-1">
              thật: <strong className="text-foreground">{labels[i]}</strong>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {row.map((v, j) => {
                const ratio = v / max;
                const isDiag = i === j;
                return (
                  <div
                    key={j}
                    className="h-10 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: isDiag
                        ? `rgba(34, 197, 94, ${ratio * 0.85})`
                        : `rgba(239, 68, 68, ${ratio * 0.7})`,
                      color: "white",
                    }}
                  >
                    {v}
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>

      <p className="text-[11px] text-muted mt-3 leading-relaxed">
        Đường chéo (xanh) là đúng. Ô đỏ là nhầm. Ví dụ: 8 tin &ldquo;khiếu
        nại&rdquo; thật bị gán nhầm thành &ldquo;kỹ thuật&rdquo; — khách bực
        bội mô tả lỗi app, đội kỹ thuật xử trước rồi chuyển tiếp.
      </p>
    </div>
  );
}
