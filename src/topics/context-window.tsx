"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  LessonSection,
  MatchPairs,
  ToggleCompare,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// METADATA — giữ nguyên slug, category, tags, relatedSlugs để registry
// không phải thay đổi theo lần viết lại này.
// ─────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "context-window",
  title: "Context Window",
  titleVi: "Cửa sổ ngữ cảnh",
  description:
    "Giới hạn số lượng token mà mô hình có thể xử lý cùng lúc — ảnh hưởng đến khả năng hiểu và nhớ ngữ cảnh.",
  category: "llm-concepts",
  tags: ["context-window", "tokens", "attention", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["self-attention", "multi-head-attention", "llm-overview", "tokenization"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────
// DATA — Các mốc context window của mô hình phổ biến.
// Dùng cho "Thước đo token" và "So sánh mô hình".
// ─────────────────────────────────────────────────────────────────────
type Model = {
  label: string;
  tokens: number;
  pages: number;
  color: string;
  vendor: string;
  vd: string;
};

const MODELS: Model[] = [
  {
    label: "GPT-3.5 miễn phí",
    tokens: 4_000,
    pages: 6,
    color: "#EF4444",
    vendor: "OpenAI",
    vd: "vừa đủ một trang email dài",
  },
  {
    label: "GPT-4o",
    tokens: 128_000,
    pages: 200,
    color: "#F59E0B",
    vendor: "OpenAI",
    vd: "đọc được một tiểu luận dài",
  },
  {
    label: "Claude 3.5 / 4",
    tokens: 200_000,
    pages: 310,
    color: "#8B5CF6",
    vendor: "Anthropic",
    vd: "ngốn gọn một hợp đồng 300 trang",
  },
  {
    label: "Gemini 1.5 Pro",
    tokens: 2_000_000,
    pages: 3_100,
    color: "#3B82F6",
    vendor: "Google",
    vd: "nuốt cả tủ hồ sơ pháp lý",
  },
];

// Đoạn văn bản mẫu cho Thước đo token — bật/tắt từng phần tài liệu.
type DocChunk = {
  id: string;
  label: string;
  tokens: number;
  desc: string;
};

const DOC_CHUNKS: DocChunk[] = [
  { id: "mail", label: "Một email dài", tokens: 800, desc: "vài đoạn tóm tắt cuộc họp" },
  { id: "proposal", label: "Đề xuất dự án", tokens: 4_500, desc: "khoảng 7 trang A4" },
  { id: "report", label: "Báo cáo quý", tokens: 18_000, desc: "30 trang kèm bảng biểu" },
  { id: "contract", label: "Hợp đồng thương mại", tokens: 55_000, desc: "85 trang điều khoản" },
  { id: "handbook", label: "Sổ tay nhân sự", tokens: 130_000, desc: "200 trang quy định" },
  { id: "archive", label: "Kho email 2 năm", tokens: 520_000, desc: "mọi thư đã gửi / nhận" },
];

// Dữ liệu cho Needle-in-a-Haystack (đơn giản hóa cho người văn phòng):
// bảng tỷ lệ AI "tìm lại đúng một câu" theo độ dài tài liệu + vị trí câu đó.
type NiahRow = { docLabel: string; tokens: number; beginPct: number; middlePct: number; endPct: number };

const NIAH_ROWS: NiahRow[] = [
  { docLabel: "1 trang (≈ 500 token)", tokens: 500, beginPct: 98, middlePct: 98, endPct: 98 },
  { docLabel: "15 trang (≈ 10K token)", tokens: 10_000, beginPct: 96, middlePct: 88, endPct: 94 },
  { docLabel: "150 trang (≈ 100K token)", tokens: 100_000, beginPct: 91, middlePct: 62, endPct: 88 },
  { docLabel: "500 trang (≈ 330K token)", tokens: 330_000, beginPct: 86, middlePct: 44, endPct: 82 },
];

// ─────────────────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Context window là gì, nói theo cách dễ hiểu nhất cho người dùng văn phòng?",
    options: [
      "Là tốc độ AI trả lời — càng cao càng tốt",
      "Là 'trí nhớ ngắn hạn' của AI trong một lần chat: AI chỉ đọc được bấy nhiêu chữ, vượt quá là quên phần cũ",
      "Là kích cỡ ổ cứng mà công ty AI phải mua thêm",
      "Là số câu hỏi bạn được phép gửi mỗi ngày",
    ],
    correct: 1,
    explanation:
      "Context window = trí nhớ ngắn hạn. Đó là số lượng chữ AI có thể 'nhìn thấy' cùng một lúc — cả phần bạn gửi lẫn phần AI trả lời đều được tính vào đây.",
  },
  {
    question:
      "Bạn dán một cuốn sổ tay nhân sự 500 trang vào ChatGPT miễn phí (GPT-3.5, 4.000 token ≈ 6 trang). Điều gì xảy ra?",
    options: [
      "AI đọc hết và tóm tắt chính xác toàn bộ cuốn sổ",
      "AI báo lỗi ngay lập tức, không đọc gì cả",
      "AI chỉ 'nhìn thấy' khoảng 6 trang đầu (hoặc vài trang cuối), phần còn lại bị cắt — tóm tắt sẽ thiếu",
      "AI tự động upload file lên đám mây rồi đọc dần",
    ],
    correct: 2,
    explanation:
      "ChatGPT miễn phí cắt bớt phần vượt context window. Bản tóm tắt bạn nhận được chỉ dựa trên phần AI thực sự đọc — phần bị cắt 'không tồn tại' trong mắt AI.",
  },
  {
    question:
      "Khi bạn chat với AI liên tục cả buổi, rồi hỏi lại 'tên tôi là gì tôi đã nói ở đầu nhé'. AI quên. Lý do có khả năng cao nhất là:",
    options: [
      "AI cố tình giấu để bạn phải trả tiền",
      "Tổng chữ trong cuộc chat đã vượt context window, phần đầu (có tên bạn) bị đẩy ra ngoài",
      "AI đã bị ngắt kết nối internet một lúc",
      "Bạn phải bật tính năng 'ghi nhớ' mới mong AI nhớ được",
    ],
    correct: 1,
    explanation:
      "AI không lưu cuộc chat lâu dài — nó chỉ 'thấy' đoạn nằm trong cửa sổ. Khi cuộc chat quá dài, lượt cũ nhất sẽ bị cắt để nhường chỗ cho lượt mới.",
  },
  {
    question:
      "Bạn phải tóm tắt báo cáo tài chính 800 trang. Cách nào đáng tin nhất hiện nay?",
    options: [
      "Dán toàn bộ 800 trang vào ChatGPT miễn phí và bấm gửi",
      "Chia báo cáo thành nhiều phần vừa cỡ context (ví dụ mỗi phần 50 trang), tóm tắt từng phần, rồi gộp tóm tắt lại — hoặc dùng mô hình context lớn như Claude/Gemini",
      "Chụp ảnh màn hình từng trang rồi gửi liên tiếp thật nhanh",
      "In ra giấy rồi scan lại, AI sẽ đọc kỹ hơn",
    ],
    correct: 1,
    explanation:
      "Hai chiến lược chuẩn: (a) chunking — chia nhỏ để vừa context, (b) chọn mô hình có context đủ lớn. 800 trang ≈ 520K token, vượt Claude 200K, nên vẫn phải chia, hoặc dùng Gemini 1.5 / Claude 1M beta.",
  },
  {
    question:
      "Khi tài liệu rất dài, AI thường đọc phần nào kỹ nhất?",
    options: [
      "Phần giữa tài liệu",
      "Phần đầu và phần cuối — phần giữa dễ bị 'lơ'",
      "Phần có nhiều hình ảnh",
      "Phần cuối cùng, bao giờ cũng kỹ nhất",
    ],
    correct: 1,
    explanation:
      "Hiện tượng 'lost in the middle': AI chú ý kỹ đầu và cuối hơn phần giữa. Khi viết prompt, hãy đặt câu hỏi quan trọng ở đầu hoặc cuối, đừng chôn vùi giữa tài liệu dài.",
  },
  {
    question:
      "Chiến lược RAG (truy xuất tài liệu) khác chunking thường ở điểm nào?",
    options: [
      "RAG cắt nhỏ tài liệu rồi tóm tắt từng phần",
      "RAG giữ toàn bộ tài liệu trong một kho; mỗi khi bạn hỏi, hệ thống chỉ lấy vài đoạn liên quan nhất và chèn vào prompt",
      "RAG là tên khác của context window",
      "RAG chỉ dùng cho ảnh, không dùng cho văn bản",
    ],
    correct: 1,
    explanation:
      "RAG (Retrieval-Augmented Generation) giống 'thư viện có người tra cứu': tài liệu nằm ở ngoài, chỉ những đoạn liên quan nhất mới được nạp vào context. Nhờ đó bạn vẫn hỏi được trên kho tri thức rất lớn.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function ContextWindowTopic() {
  // Thước đo token — chọn mô hình + bật/tắt các phần tài liệu
  const [modelIdx, setModelIdx] = useState<number>(1); // mặc định GPT-4o (128K)
  const [chunksOn, setChunksOn] = useState<Record<string, boolean>>({
    mail: true,
    proposal: true,
    report: true,
    contract: false,
    handbook: false,
    archive: false,
  });

  // Prompt Budgeter — ngân sách token theo từng khối
  const [sysTokens, setSysTokens] = useState<number>(1_500);
  const [historyTokens, setHistoryTokens] = useState<number>(6_000);
  const [docTokens, setDocTokens] = useState<number>(25_000);
  const [outputReserve, setOutputReserve] = useState<number>(4_000);
  const [budgetModelIdx, setBudgetModelIdx] = useState<number>(2); // mặc định Claude 200K

  // NIAH — chọn một hàng để highlight
  const [niahRowIdx, setNiahRowIdx] = useState<number>(2);

  const model = MODELS[modelIdx];
  const budgetModel = MODELS[budgetModelIdx];

  const totalUsed = useMemo(
    () =>
      DOC_CHUNKS.filter((c) => chunksOn[c.id]).reduce((s, c) => s + c.tokens, 0),
    [chunksOn]
  );
  const usedPct = Math.min(100, (totalUsed / model.tokens) * 100);
  const overflow = totalUsed > model.tokens;

  const toggleChunk = useCallback((id: string) => {
    setChunksOn((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const budgetTotal = sysTokens + historyTokens + docTokens + outputReserve;
  const budgetPct = Math.min(100, (budgetTotal / budgetModel.tokens) * 100);
  const budgetOverflow = budgetTotal > budgetModel.tokens;
  const budgetPieces = [
    { key: "sys", label: "Lời dặn đầu (system prompt)", value: sysTokens, color: "#60A5FA" },
    { key: "hist", label: "Lịch sử hội thoại trước đó", value: historyTokens, color: "#34D399" },
    { key: "doc", label: "Tài liệu bạn dán vào", value: docTokens, color: "#F59E0B" },
    { key: "out", label: "Dự phòng cho câu trả lời", value: outputReserve, color: "#A78BFA" },
  ];

  const niahRow = NIAH_ROWS[niahRowIdx];

  // ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 1 — HOOK / DỰ ĐOÁN                                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán trước">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={8}
            labels={[
              "Dự đoán",
              "Ẩn dụ",
              "Thước đo token",
              "Khoảnh khắc Aha",
              "Thử thách",
              "Giải thích sâu",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn dán 200 trang tài liệu vào ChatGPT miễn phí và hỏi 'Tóm tắt giúp tôi'. Theo bạn, AI sẽ làm gì?"
          options={[
            "Tóm tắt chính xác toàn bộ 200 trang",
            "Chỉ đọc phần đầu rồi tóm tắt sai — phần cuối bị bỏ qua",
            "Báo lỗi 'Tài liệu quá dài', không làm gì cả",
            "Đọc 200 trang xong tự chia ra, tóm tắt mỗi phần",
          ]}
          correct={1}
          explanation="ChatGPT miễn phí dùng context window rất nhỏ (khoảng 4–8K token, tức 6–12 trang A4). Phần vượt quá bị cắt âm thầm — AI vẫn trả ra một bản tóm tắt, nhưng chỉ dựa trên phần đầu. Đây là vấn đề bạn không 'thấy' mà lại thường xuyên gặp."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Hôm nay bạn sẽ học chính xác AI có thể &quot;thấy&quot; được bao nhiêu chữ trong
            một lần chat, mô hình nào chứa được bao nhiêu, và làm sao để tài liệu dài
            không bị âm thầm cắt mất.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 2 — ẨN DỤ / ĐỊNH NGHĨA THÂN THIỆN                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Hình dung cho dễ">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              Hình dung 1
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>Context window</strong> giống <strong>bàn làm việc</strong> của AI.
              Bạn đặt tài liệu, câu hỏi, lịch sử hội thoại lên đó. Khi bàn đầy, tờ cũ
              nhất bị đẩy rơi xuống sàn — AI <em>không còn nhìn thấy</em> nữa.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              Hình dung 2
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Hoặc giống <strong>trí nhớ ngắn hạn</strong> của con người. Bạn chỉ giữ
              được một lượng thông tin nhất định trong đầu trước khi cái mới đẩy cái
              cũ ra. AI cũng vậy — mỗi mô hình có một dung lượng riêng.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              Hình dung 3
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Đơn vị đo là <strong>token</strong> — một mẩu chữ nhỏ. Tiếng Việt thường
              tốn nhiều token hơn tiếng Anh vì có dấu. Một trang A4 điển hình khoảng{" "}
              <strong>600–700 token</strong>.
            </p>
          </div>
        </div>

        <Callout variant="info" title="Token: chính xác nó là gì?">
          Token là đơn vị nhỏ hơn cả từ. Ví dụ:
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded bg-surface px-3 py-2">
              <div className="font-mono text-foreground">&quot;hello&quot;</div>
              <div className="text-tertiary mt-1">1 token</div>
            </div>
            <div className="rounded bg-surface px-3 py-2">
              <div className="font-mono text-foreground">&quot;ngôi sao&quot;</div>
              <div className="text-tertiary mt-1">≈ 2–3 token</div>
            </div>
            <div className="rounded bg-surface px-3 py-2">
              <div className="font-mono text-foreground">&quot;cà phê sữa đá&quot;</div>
              <div className="text-tertiary mt-1">≈ 5 token</div>
            </div>
            <div className="rounded bg-surface px-3 py-2">
              <div className="font-mono text-foreground">1 trang A4</div>
              <div className="text-tertiary mt-1">≈ 600–700 token</div>
            </div>
          </div>
          <p className="mt-3">
            Không cần đếm chính xác. Chỉ cần nhớ quy đổi thô: <strong>1 trang ≈ 700
            token, 100 trang ≈ 70K token</strong>.
          </p>
        </Callout>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 3 — TRỰC QUAN HÓA 1: THƯỚC ĐO TOKEN                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Tự tay đo thử">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ──────────────── DEMO 1: THƯỚC ĐO TOKEN ──────────────── */}
          <LessonSection label="Demo 1 — Thước đo token của từng mô hình">
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Chọn một mô hình AI. Bật/tắt các loại tài liệu bạn muốn &quot;nhét&quot;
              vào cuộc chat. Nếu thanh màu chuyển đỏ là vượt ngân sách — phần cuối
              sẽ bị AI cắt âm thầm.
            </p>

            {/* Bộ chọn mô hình */}
            <div className="mb-4 flex flex-wrap gap-2">
              {MODELS.map((m, i) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setModelIdx(i)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                    modelIdx === i
                      ? "border-accent bg-accent-light text-accent-dark"
                      : "border-border bg-card text-foreground hover:bg-surface"
                  }`}
                  style={modelIdx === i ? { borderColor: m.color } : undefined}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-tertiary mt-0.5">
                    {m.tokens.toLocaleString("vi-VN")} token · {m.pages} trang
                  </div>
                </button>
              ))}
            </div>

            {/* Thanh ngân sách */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  Ngân sách của {model.label}
                </span>
                <span className="font-mono text-foreground">
                  {totalUsed.toLocaleString("vi-VN")} /{" "}
                  {model.tokens.toLocaleString("vi-VN")} token ({usedPct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: overflow ? "#DC2626" : model.color,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${usedPct}%` }}
                  transition={{ duration: 0.45 }}
                />
              </div>
              {overflow && (
                <div className="mt-2 rounded-lg border border-red-400/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  Đã vượt ngân sách {(totalUsed - model.tokens).toLocaleString("vi-VN")}{" "}
                  token. AI sẽ cắt phần cuối, tóm tắt sẽ thiếu hoặc sai.
                </div>
              )}
            </div>

            {/* Danh sách tài liệu */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {DOC_CHUNKS.map((c) => {
                const on = chunksOn[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChunk(c.id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      on
                        ? "border-accent bg-accent-light text-accent-dark"
                        : "border-border bg-card text-foreground hover:bg-surface"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-tertiary mt-0.5">{c.desc}</div>
                    </div>
                    <div className="ml-2 text-right">
                      <div className="font-mono">
                        {c.tokens.toLocaleString("vi-VN")}
                      </div>
                      <div className="text-tertiary">token</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Callout variant="tip" title="Cách dùng nhanh">
              Chọn <strong>GPT-3.5 miễn phí</strong> rồi bật &quot;Hợp đồng thương
              mại&quot; — bạn sẽ thấy thanh đỏ ngay. Đổi sang <strong>Claude 3.5</strong>{" "}
              thì còn rộng rãi. Đổi sang <strong>Gemini 1.5 Pro</strong> thì thừa
              mứa — nhưng thừa mứa không có nghĩa là miễn phí, xem cảnh báo ở Bước 6.
            </Callout>
          </LessonSection>

          {/* ──────────────── DEMO 2: KIM TRONG ĐỐNG RƠM ──────────────── */}
          <LessonSection label="Demo 2 — Tìm kim trong đống rơm: AI nhớ đến đâu?">
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Hãy tưởng tượng bạn giấu một câu bí mật (&quot;mật khẩu wifi văn phòng
              là <em>cafesang2025</em>&quot;) vào đầu, giữa, hoặc cuối của một tài liệu
              dài, rồi hỏi AI tìm lại. Dưới đây là điểm thành công thực nghiệm.
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {NIAH_ROWS.map((r, i) => (
                <button
                  key={r.docLabel}
                  type="button"
                  onClick={() => setNiahRowIdx(i)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    niahRowIdx === i
                      ? "border-accent bg-accent-light text-accent-dark font-semibold"
                      : "border-border bg-card text-foreground hover:bg-surface"
                  }`}
                >
                  {r.docLabel}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "begin", label: "Giấu ở ĐẦU", score: niahRow.beginPct },
                { key: "middle", label: "Giấu ở GIỮA", score: niahRow.middlePct },
                { key: "end", label: "Giấu ở CUỐI", score: niahRow.endPct },
              ].map((cell) => {
                // hue: đỏ 0 → xanh 120
                const hue = Math.round((cell.score / 100) * 120);
                return (
                  <div
                    key={cell.key}
                    className="rounded-xl border border-border p-4 text-center"
                    style={{
                      background: `hsl(${hue}, 70%, 92%)`,
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-tertiary">
                      {cell.label}
                    </div>
                    <motion.div
                      className="mt-1 text-2xl font-bold"
                      style={{ color: `hsl(${hue}, 65%, 30%)` }}
                      animate={{ scale: [0.92, 1] }}
                      transition={{ duration: 0.3 }}
                      key={`${cell.key}-${niahRowIdx}`}
                    >
                      {cell.score}%
                    </motion.div>
                    <div className="text-[11px] text-tertiary mt-1">
                      tỷ lệ AI tìm lại đúng
                    </div>
                  </div>
                );
              })}
            </div>

            <ToggleCompare
              labelA="Với tài liệu NGẮN"
              labelB="Với tài liệu DÀI"
              description="Thay đổi tùy theo tài liệu ngắn hay dài — quan sát khác biệt."
              childA={
                <div className="text-sm leading-relaxed">
                  Khi tài liệu ngắn (dưới 10 trang), AI tìm lại thông tin gần như hoàn
                  hảo dù bạn giấu ở đâu. <strong>Yên tâm đặt câu hỏi tự nhiên.</strong>
                </div>
              }
              childB={
                <div className="text-sm leading-relaxed">
                  Khi tài liệu lên tới hàng trăm trang, AI đọc kỹ phần đầu và phần cuối,
                  còn phần giữa dễ bị &quot;lơ&quot; (xuống tới 40–60% trong một số thử
                  nghiệm). <strong>Bí kíp: đặt câu hỏi quan trọng ở đầu hoặc cuối
                  prompt, đừng chôn ở giữa.</strong>
                </div>
              }
            />

            <Callout variant="warning" title='"Lost in the middle" — hiện tượng thật'>
              Nhiều bài nghiên cứu (Liu và cộng sự, 2023) đã xác nhận: dù mô hình
              &quot;chứa&quot; được cả triệu token, chất lượng đọc phần giữa vẫn yếu.
              Context lớn không đồng nghĩa với đọc kỹ mọi ngóc ngách.
            </Callout>
          </LessonSection>

          {/* ──────────────── DEMO 3: PROMPT BUDGETER ──────────────── */}
          <LessonSection label="Demo 3 — Bảng cân đối prompt: cái gì chiếm bao nhiêu?">
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Mỗi lần bạn chat, có 4 khoản luôn cùng nằm trong context. Kéo slider
              để thấy khoản nào ngốn nhiều nhất — và khi nào ngân sách bị vượt.
            </p>

            {/* Chọn mô hình cho budgeter */}
            <div className="mb-3 flex flex-wrap gap-2">
              {MODELS.map((m, i) => (
                <button
                  key={`bm-${m.label}`}
                  type="button"
                  onClick={() => setBudgetModelIdx(i)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    budgetModelIdx === i
                      ? "border-accent bg-accent-light text-accent-dark font-semibold"
                      : "border-border bg-card text-foreground hover:bg-surface"
                  }`}
                  style={budgetModelIdx === i ? { borderColor: m.color } : undefined}
                >
                  {m.label} ({m.tokens.toLocaleString("vi-VN")})
                </button>
              ))}
            </div>

            {/* Stack bar */}
            <div className="mb-4 rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted">Tổng đang dùng</span>
                <span
                  className={`font-mono font-semibold ${
                    budgetOverflow ? "text-red-600 dark:text-red-400" : "text-foreground"
                  }`}
                >
                  {budgetTotal.toLocaleString("vi-VN")} /{" "}
                  {budgetModel.tokens.toLocaleString("vi-VN")} token (
                  {budgetPct.toFixed(1)}%)
                </span>
              </div>
              <div
                className={`flex h-5 w-full overflow-hidden rounded-full ${
                  budgetOverflow ? "ring-2 ring-red-500" : ""
                } bg-surface`}
              >
                {budgetPieces.map((p) => {
                  const w = Math.min(100, (p.value / budgetModel.tokens) * 100);
                  return (
                    <motion.div
                      key={p.key}
                      className="h-full"
                      style={{ background: p.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${w}%` }}
                      transition={{ duration: 0.3 }}
                      title={`${p.label}: ${p.value.toLocaleString("vi-VN")} token`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                {budgetPieces.map((p) => (
                  <span key={p.key} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-3 rounded-sm"
                      style={{ background: p.color }}
                    />
                    <span className="text-muted">
                      {p.label}:{" "}
                      <span className="font-mono text-foreground">
                        {p.value.toLocaleString("vi-VN")}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
              {budgetOverflow && (
                <div className="mt-2 rounded-lg border border-red-400/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  Ngân sách âm! Bạn cần giảm tài liệu, rút gọn lịch sử, hoặc đổi mô
                  hình có context lớn hơn.
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-3">
              {[
                {
                  label: "Lời dặn đầu (system prompt)",
                  value: sysTokens,
                  set: setSysTokens,
                  min: 0,
                  max: 5_000,
                  step: 100,
                  hint: "Phần đặt vai trò, quy tắc cho AI",
                },
                {
                  label: "Lịch sử hội thoại trước đó",
                  value: historyTokens,
                  set: setHistoryTokens,
                  min: 0,
                  max: 60_000,
                  step: 500,
                  hint: "Các lượt chat đã xảy ra trong cùng phiên",
                },
                {
                  label: "Tài liệu bạn dán vào lần này",
                  value: docTokens,
                  set: setDocTokens,
                  min: 0,
                  max: 500_000,
                  step: 1_000,
                  hint: "Email, báo cáo, hợp đồng — cái bạn paste",
                },
                {
                  label: "Dự phòng cho câu trả lời của AI",
                  value: outputReserve,
                  set: setOutputReserve,
                  min: 500,
                  max: 20_000,
                  step: 500,
                  hint: "Phải có chỗ cho AI viết trả lời — thường 2–8K",
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-foreground font-medium">{s.label}</span>
                    <span className="font-mono text-accent">
                      {s.value.toLocaleString("vi-VN")} token
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="w-full h-2 cursor-pointer rounded-full bg-surface accent-accent"
                  />
                  <div className="text-[10px] text-tertiary">{s.hint}</div>
                </div>
              ))}
            </div>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 4 — KHOẢNH KHẮC AHA                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <strong>Context window</strong> là một chiếc bàn có diện tích cố định, không
          phải bộ nhớ vô hạn. Mọi thứ bạn gửi — câu hỏi, tài liệu, lịch sử —{" "}
          <strong>cùng phải nằm trên bàn một lúc</strong> với phần trả lời của AI.
          Khi bàn đầy, tờ cũ rơi xuống và <em>AI không còn thấy nó nữa</em>, nhưng
          AI vẫn trả lời trông có vẻ tự tin như thường.
        </AhaMoment>

        <Callout variant="tip" title="Quy tắc ngón tay cái cho dân văn phòng">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>1 trang A4 ≈ 700 token.</strong> 100 trang ≈ 70K token.
            </li>
            <li>
              <strong>Luôn dành ≥ 30% ngân sách cho câu trả lời.</strong> Input chiếm
              tối đa 70%.
            </li>
            <li>
              <strong>Đặt câu hỏi quan trọng ở đầu hoặc cuối prompt,</strong> đừng
              chôn giữa tài liệu dài.
            </li>
          </ul>
        </Callout>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 5 — THỬ THÁCH                                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử áp dụng">
        <InlineChallenge
          question="Sếp đưa bạn một PDF 500 trang (≈ 350K token) và bảo: 'Tóm tắt cho anh trong 1 đoạn'. Bạn chọn chiến lược nào?"
          options={[
            "Dán thẳng toàn bộ 500 trang vào ChatGPT miễn phí rồi bấm gửi — được gì hay đó",
            "Chia 500 trang thành 10 phần (mỗi phần 50 trang), dùng Claude 3.5 / GPT-4o tóm tắt từng phần, rồi gộp 10 bản tóm tắt nhỏ thành 1 bản tóm tắt cuối",
            "Chụp ảnh từng trang rồi upload liên tiếp",
            "Đọc lướt bằng mắt, không cần AI nữa",
          ]}
          correct={1}
          explanation="350K token vượt mọi mô hình phổ thông (Claude 200K cũng chưa đủ). Chiến lược 'chia nhỏ — tóm mỗi phần — gộp lại' (map-reduce) là cách chuẩn. Hoặc bạn có thể dùng Gemini 1.5 Pro (2M token) để đọc trong một lần, nhưng vẫn nên tóm theo phần để AI đọc kỹ hơn (nhớ vụ 'lost in the middle'!)."
        />

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Bạn hãy nối: chiến lược nào hợp với tình huống nào?
          </h4>
          <MatchPairs
            instruction="Chọn một mục bên cột A, rồi chọn mục phù hợp bên cột B để nối."
            pairs={[
              {
                left: "Tài liệu 3 trang, hỏi nhanh 1 câu",
                right:
                  "Dán thẳng vào ChatGPT — ngân sách đủ rộng, không cần mẹo gì",
              },
              {
                left: "Báo cáo 80 trang, cần bản tóm tắt 1 đoạn",
                right:
                  "Dùng mô hình context lớn (Claude / GPT-4o) trong một lần prompt",
              },
              {
                left: "500 trang hợp đồng, cần trích vài điều khoản",
                right:
                  "Chia nhỏ tài liệu rồi tóm tắt theo phần, sau đó gộp lại",
              },
              {
                left: "Kho 10.000 email CSKH, hỏi tự do suốt tuần",
                right:
                  "Dùng RAG: lưu email vào kho vector, chỉ truy xuất đoạn liên quan mỗi lần hỏi",
              },
            ]}
          />
        </div>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 6 — GIẢI THÍCH SÂU (KHÔNG CODE, KHÔNG MATH)              */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug={metadata.slug}>
          {/* So sánh context window các mô hình dưới dạng thanh màu */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Các mô hình phổ biến 2025: ai chứa được bao nhiêu trang?
            </h3>
            <p className="text-sm text-muted mb-4">
              Thang log, chứ không phải tuyến tính — vì GPT-3.5 (4K) tới Gemini 1.5
              (2M) chênh tới <strong>500 lần</strong>. Hàng số bên phải là ước tính
              quy đổi ra trang A4.
            </p>
            <div className="space-y-3">
              {MODELS.map((m) => {
                const maxLog = Math.log10(MODELS[MODELS.length - 1].tokens);
                const wPct = Math.max(8, (Math.log10(m.tokens) / maxLog) * 100);
                return (
                  <div key={m.label}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">
                        {m.label}{" "}
                        <span className="text-xs text-tertiary">· {m.vendor}</span>
                      </span>
                      <span className="text-xs text-muted">
                        {m.tokens.toLocaleString("vi-VN")} token ≈{" "}
                        <strong className="text-foreground">
                          {m.pages.toLocaleString("vi-VN")}
                        </strong>{" "}
                        trang · {m.vd}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: m.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${wPct}%` }}
                        transition={{ duration: 0.55 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 chiến lược xử lý tài liệu dài */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-foreground mb-1">
              4 cách xử lý tài liệu vượt ngân sách
            </h3>
            <p className="text-sm text-muted mb-4">
              Khi tài liệu của bạn vượt context của mô hình đang dùng. Không có
              cách duy nhất đúng — tùy tình huống.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  name: "1. Chia nhỏ (Chunking)",
                  when: "Khi có thể tóm từng phần rồi gộp",
                  how: "Cắt tài liệu thành phần 20–50 trang, tóm mỗi phần, rồi gộp các bản tóm tắt thành tóm tắt cuối.",
                  pros: "Đơn giản, không cần công cụ đặc biệt.",
                  cons: "Có thể mất mối liên kết xuyên suốt giữa các phần.",
                  color: "#F59E0B",
                },
                {
                  name: "2. Đổi mô hình context lớn",
                  when: "Khi cần đọc cả tài liệu trong một lần",
                  how: "Chuyển sang Claude 3.5 (200K), Gemini 1.5 Pro (1–2M) hoặc Claude 1M beta.",
                  pros: "Đơn giản, AI có bối cảnh đầy đủ.",
                  cons: "Đắt hơn (theo token) và phần giữa vẫn dễ 'bị lơ'.",
                  color: "#8B5CF6",
                },
                {
                  name: "3. RAG (có thư viện riêng)",
                  when: "Khi kho tri thức rất lớn, hỏi đi hỏi lại",
                  how: "Lưu tài liệu vào một kho vector, mỗi câu hỏi hệ thống chỉ lấy vài đoạn liên quan nhất để nạp vào prompt.",
                  pros: "Kho có thể rộng vô hạn, chi phí thấp mỗi lần hỏi.",
                  cons: "Cần tool riêng (Notion AI, Claude Projects, ChatGPT 'Custom GPTs', v.v.).",
                  color: "#3B82F6",
                },
                {
                  name: "4. Tóm tắt cuốn chiếu (Rolling summary)",
                  when: "Khi cuộc chat kéo dài nhiều tiếng, nhiều lượt",
                  how: "Cứ sau mỗi 10–15 lượt, nhờ AI tóm lại bối cảnh đến giờ thành vài dòng, rồi dùng đoạn đó thay cho lịch sử gốc.",
                  pros: "Giữ được mạch ngữ cảnh mà không tràn ngân sách.",
                  cons: "Chi tiết nhỏ có thể rơi rụng sau mỗi lần tóm tắt.",
                  color: "#10B981",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="rounded-xl border border-border bg-card p-4"
                  style={{ borderLeft: `4px solid ${s.color}` }}
                >
                  <div className="text-sm font-semibold text-foreground">{s.name}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                    Khi nào dùng
                  </div>
                  <div className="text-xs text-foreground">{s.when}</div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                    Cách làm
                  </div>
                  <div className="text-xs text-muted leading-relaxed">{s.how}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded bg-green-50 dark:bg-green-950/30 px-2 py-1 text-green-800 dark:text-green-300">
                      + {s.pros}
                    </div>
                    <div className="rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-amber-800 dark:text-amber-300">
                      − {s.cons}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Callout variant="warning" title="Cái bẫy âm thầm: AI không báo khi cắt">
            Khác với &quot;lỗi quá dung lượng&quot;, context window bị vượt{" "}
            <strong>không hiện cảnh báo cho người dùng phổ thông</strong>. Bạn dán
            tài liệu 500 trang, bấm gửi — AI vẫn trả lời trơn tru như không có gì.
            Chỉ khi bạn kiểm tra thật kỹ mới phát hiện nó đang tóm tắt 60 trang đầu
            và &quot;bịa mơ hồ&quot; về phần còn lại.
          </Callout>

          <Callout variant="info" title="Tiếng Việt tốn token hơn tiếng Anh">
            Tokenizer của hầu hết mô hình được huấn luyện chủ yếu với tiếng Anh, nên
            các ký tự có dấu của tiếng Việt thường bị chia nhỏ hơn. Một câu tiếng
            Việt 10 chữ thường ngốn khoảng 18–25 token, trong khi câu tiếng Anh cùng
            nội dung chỉ 12–15 token. Quy đổi thô: ngân sách context &quot;thực
            dùng&quot; cho tiếng Việt chỉ khoảng <strong>60–70% con số ghi trên
            nhãn</strong>.
          </Callout>

          <CollapsibleDetail title="Vì sao context lớn hơn lại đắt hơn nhiều lần?">
            <p className="text-sm">
              Mỗi lần xử lý, mô hình phải so khớp <strong>mỗi token với mọi token
              khác</strong> trong cửa sổ. Gấp đôi context thì lượng so khớp tăng gấp
              bốn. Đó là lý do các nhà cung cấp tính tiền theo số token input —
              và vì sao một prompt 200K token có thể đắt gấp vài trăm lần một
              prompt 2K token. Khi bạn làm dự án dùng AI ở quy mô công ty, con số
              này nhân với số lượt truy cập mỗi ngày là chi phí thực.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Claude Projects, ChatGPT GPTs, NotebookLM — tự xử lý context giúp bạn?">
            <p className="text-sm">
              Ba sản phẩm phổ biến này đều âm thầm áp dụng các chiến lược ở trên
              (RAG, chunking, rolling summary). Khi bạn upload PDF 500 trang vào
              Claude Projects hay NotebookLM, hệ thống không nhét trọn 500 trang
              vào mỗi prompt — nó lưu vào kho và chỉ truy xuất đoạn liên quan khi
              bạn hỏi. Đây là lý do chất lượng thường ổn định hơn so với việc tự
              copy-paste toàn bộ tài liệu vào khung chat.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title='Khi AI "quên" — vì sao nó vẫn trả lời rất tự tin?'>
            <p className="text-sm">
              Mô hình ngôn ngữ không biết mình đang quên. Nó chỉ đoán chữ tiếp theo
              dựa trên phần đang &quot;thấy&quot;. Khi phần đầu cuộc chat bị cắt
              (tên bạn, yêu cầu ban đầu, hướng dẫn quan trọng), AI vẫn tiếp tục sinh
              câu trả lời mượt mà — nhưng có thể sai bối cảnh hoàn toàn. Đây là lý
              do cho những câu chuyện &quot;AI đổi giọng giữa chừng&quot; hoặc
              &quot;quên tên tôi sau 100 lượt chat&quot;.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 7 — TÓM TẮT                                               */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Ghim vào đầu">
        <MiniSummary
          title="5 điều cần nhớ về Context Window"
          points={[
            "Context window là 'bàn làm việc' của AI — mọi thứ bạn gửi + phần AI trả lời cùng nằm trên bàn một lúc. Vượt ngân sách là tờ cũ bị đẩy xuống.",
            "Quy đổi thô dễ nhớ: 1 trang A4 ≈ 700 token; 100 trang ≈ 70K token. Tiếng Việt tốn thêm ~30% so với tiếng Anh.",
            "Các mốc 2025: GPT-3.5 miễn phí 4K (≈ 6 trang), GPT-4o 128K (200 trang), Claude 3.5 200K (310 trang), Gemini 1.5 Pro 2M (3.100 trang).",
            "AI đọc kỹ phần đầu và phần cuối của tài liệu dài hơn phần giữa ('lost in the middle'). Đặt câu hỏi trọng yếu ở đầu hoặc cuối.",
            "Khi tài liệu vượt ngân sách: chia nhỏ (chunking), đổi mô hình context lớn, dùng RAG (Claude Projects / NotebookLM), hoặc tóm tắt cuốn chiếu.",
          ]}
        />
      </LessonSection>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BƯỚC 8 — KIỂM TRA                                              */}
      {/* ════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra hiểu biết">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
