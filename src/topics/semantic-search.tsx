"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  MatchPairs,
  ToggleCompare,
  Callout,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";
import { Search, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata: TopicMeta = {
  slug: "semantic-search",
  title: "Semantic Search",
  titleVi: "Tìm kiếm theo ý nghĩa",
  description:
    "Tìm tài liệu theo NGHĨA thay vì khớp từ khoá — tra nội quy, hợp đồng, báo cáo mà không phải gõ đúng từng chữ.",
  category: "search-retrieval",
  tags: ["semantic", "search", "embedding", "nlp"],
  difficulty: "intermediate",
  relatedSlugs: ["bm25", "hybrid-search", "embedding-model"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════
   DỮ LIỆU — KHO TÀI LIỆU VĂN PHÒNG
   8 tài liệu, 3 cụm chủ đề công sở:
     • Nghỉ phép & phúc lợi   (id 0..3)
     • Quy trình khách hàng   (id 4..5)
     • Ngoài chủ đề           (id 6..7)
   Vector 2D được chọn thủ công để minh hoạ "vocabulary mismatch".
   ══════════════════════════════════════════════════════════════ */

interface Doc {
  id: number;
  text: string;
  embed: [number, number];
  keywordTokens: string[];
}

const DOCS: Doc[] = [
  {
    id: 0,
    text: "Nội quy nghỉ phép: 14 ngày phép có lương mỗi năm",
    embed: [0.82, 0.58],
    keywordTokens: ["nội", "quy", "nghỉ", "phép", "14", "ngày", "có", "lương", "mỗi", "năm"],
  },
  {
    id: 1,
    text: "Annual leave policy: 14 paid days per calendar year",
    embed: [0.78, 0.62],
    keywordTokens: ["annual", "leave", "policy", "14", "paid", "days", "per", "calendar", "year"],
  },
  {
    id: 2,
    text: "Chính sách ngày nghỉ có lương và thủ tục xin phép",
    embed: [0.80, 0.55],
    keywordTokens: ["chính", "sách", "ngày", "nghỉ", "có", "lương", "thủ", "tục", "xin", "phép"],
  },
  {
    id: 3,
    text: "Hướng dẫn dành cho nhân viên mới về thời gian off work",
    embed: [0.75, 0.60],
    keywordTokens: ["hướng", "dẫn", "nhân", "viên", "mới", "thời", "gian", "off", "work"],
  },
  {
    id: 4,
    text: "Quy trình xử lý khiếu nại khách hàng qua tổng đài",
    embed: [0.58, 0.78],
    keywordTokens: ["quy", "trình", "xử", "lý", "khiếu", "nại", "khách", "hàng", "qua", "tổng", "đài"],
  },
  {
    id: 5,
    text: "SOP chăm sóc khách hàng: phản hồi trong 2 giờ làm việc",
    embed: [0.52, 0.70],
    keywordTokens: ["sop", "chăm", "sóc", "khách", "hàng", "phản", "hồi", "trong", "2", "giờ", "làm", "việc"],
  },
  {
    id: 6,
    text: "Báo cáo doanh thu quý 4 năm 2025 đạt 185 tỷ đồng",
    embed: [-0.72, 0.30],
    keywordTokens: ["báo", "cáo", "doanh", "thu", "quý", "4", "năm", "2025", "đạt", "185", "tỷ", "đồng"],
  },
  {
    id: 7,
    text: "Thị trường dược phẩm Việt Nam 2025 đạt 7,2 tỷ USD",
    embed: [-0.60, -0.55],
    keywordTokens: ["thị", "trường", "dược", "phẩm", "việt", "nam", "2025", "đạt", "7", "2", "tỷ", "usd"],
  },
];

/**
 * 4 câu truy vấn kiểu dân văn phòng:
 *  - 'xin nghỉ phép năm nay'   → chỉ semantic bắt được doc 0..3
 *  - 'annual leave policy'     → ngược lại, keyword trúng doc 1, semantic trúng cả cụm
 *  - 'xử lý phàn nàn'          → semantic bắt doc 4,5; keyword thấy 0
 *  - 'pharma market size'      → tiếng Anh → chỉ semantic tìm ra doc 7 tiếng Việt
 */
const QUERIES: Record<
  string,
  { tokens: string[]; embed: [number, number]; label: string }
> = {
  "xin nghỉ phép năm nay": {
    tokens: ["xin", "nghỉ", "phép", "năm", "nay"],
    embed: [0.78, 0.60],
    label: "Nhân viên gõ câu tiếng Việt thông dụng",
  },
  "annual leave policy": {
    tokens: ["annual", "leave", "policy"],
    embed: [0.80, 0.56],
    label: "Đồng nghiệp nước ngoài gõ tiếng Anh",
  },
  "xử lý phàn nàn": {
    tokens: ["xử", "lý", "phàn", "nàn"],
    embed: [0.56, 0.74],
    label: "Trưởng nhóm CSKH hỏi quy trình",
  },
  "pharma market size Vietnam": {
    tokens: ["pharma", "market", "size", "vietnam"],
    embed: [-0.70, -0.50],
    label: "Marketer dược hỏi bằng tiếng Anh",
  },
};

/* ══════════════════════════════════════════════════════════════
   CÔNG CỤ TÍNH TOÁN (chỉ dùng TS thuần, KHÔNG hiển thị công thức)
   ══════════════════════════════════════════════════════════════ */

function norm(v: [number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function cosine(a: [number, number], b: [number, number]): number {
  const n = norm(a) * norm(b);
  if (n === 0) return 0;
  return (a[0] * b[0] + a[1] * b[1]) / n;
}

function keywordScore(qTokens: string[], dTokens: string[]): number {
  let s = 0;
  for (const t of qTokens) if (dTokens.includes(t)) s += 1;
  return s;
}

function topK<T>(arr: T[], k: number, score: (t: T) => number): T[] {
  return [...arr].sort((a, b) => score(b) - score(a)).slice(0, k);
}

/* ══════════════════════════════════════════════════════════════
   PIPELINE LADDER — helper render 1 cột số bước đơn giản
   ══════════════════════════════════════════════════════════════ */
function PipelineLadder({
  color,
  steps,
  note,
}: {
  color: string;
  steps: string[];
  note: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      {steps.map((s, i) => (
        <div
          key={i}
          className="rounded border border-border bg-background p-2"
        >
          <span className={`text-[11px] font-semibold ${color}`}>
            {i + 1}.{" "}
          </span>
          {s}
        </div>
      ))}
      <p className="mt-2 text-[11px] text-muted">{note}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BỘ QUIZ — 8 CÂU, KHÔNG CODE, KHÔNG CÔNG THỨC
   ══════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn gõ 'xin nghỉ phép' trong hệ thống tìm kiếm nội bộ. Tại sao tìm kiếm ngữ nghĩa vẫn trả về 'annual leave policy' dù không chứa từ nào trùng?",
    options: [
      "Vì hệ thống tự dịch từng từ sang tiếng Anh",
      "Vì mô hình embedding đặt hai câu cùng nghĩa gần nhau trong không gian số — không cần ký tự trùng",
      "Vì có bảng mapping tay giữa từ khoá",
      "Vì trùng ngẫu nhiên",
    ],
    correct: 1,
    explanation:
      "Embedding được huấn luyện để câu cùng nghĩa (dù ngôn ngữ khác) có vector gần nhau. Đây là lý do tìm kiếm ngữ nghĩa giải quyết được 'vocabulary mismatch' — khoảng cách từ vựng mà tìm kiếm từ khoá bó tay.",
  },
  {
    question:
      "Bạn cần tra chính xác số hợp đồng 'HD-2025-008'. Tìm kiếm theo ý nghĩa có phù hợp không?",
    options: [
      "Có — semantic luôn tốt hơn keyword",
      "KHÔNG — mã hợp đồng là chuỗi ký tự cụ thể, tìm theo TỪ KHOÁ chính xác phù hợp hơn. Semantic coi mã như token chung chung và dễ trả nhầm",
      "Tuỳ bộ nhớ của AI",
      "Có nếu dùng GPT-4",
    ],
    correct: 1,
    explanation:
      "Mã hợp đồng, SKU, tên model hiếm là 'nghĩa riêng' — từ khoá khớp chính xác vượt trội. Semantic coi 'HD-2025-008' như một token mờ, khó giữ ký tự chuẩn. Hybrid (keyword + semantic) là giải pháp chuẩn.",
  },
  {
    question:
      "Trưởng nhóm hỏi: 'Nên dùng tìm kiếm ngữ nghĩa hay từ khoá cho kho tài liệu công ty?'",
    options: [
      "Chỉ semantic vì hiện đại",
      "Chỉ keyword vì đơn giản",
      "Hybrid: keyword bắt mã hợp đồng / tên sản phẩm chính xác; semantic bắt câu hỏi tự nhiên, đồng nghĩa — ghép cả hai vượt trội mỗi cách riêng",
      "Không cần tìm kiếm, chỉ dùng filter",
    ],
    correct: 2,
    explanation:
      "Tài liệu công ty vừa có mã chính xác (hợp đồng, SKU, số báo cáo) vừa có mô tả tự do (điều khoản, quy trình). Hybrid tận dụng cả hai loại — chuẩn trong mọi sản phẩm tìm kiếm nghiêm túc.",
  },
  {
    question:
      "Nhân viên nước ngoài tra tài liệu công ty tiếng Việt bằng câu tiếng Anh 'vacation days allowed'. Tìm kiếm ngữ nghĩa ứng xử thế nào?",
    options: [
      "Không tìm ra vì khác ngôn ngữ",
      "Yêu cầu dịch sang tiếng Việt",
      "Tìm ra đúng tài liệu nếu dùng embedding đa ngôn ngữ (như BGE-M3) — vì vector của hai câu cùng nghĩa ở hai ngôn ngữ vẫn gần nhau",
      "Chạy chậm hơn 10 lần",
    ],
    correct: 2,
    explanation:
      "Các mô hình embedding đa ngữ (BGE-M3, multilingual-E5) được huấn luyện để câu cùng nghĩa ở nhiều ngôn ngữ có vector gần nhau. Đây là lý do công ty đa quốc gia triển khai semantic search để bớt phụ thuộc ngôn ngữ.",
  },
  {
    question:
      "Điểm cosine giữa câu hỏi và tài liệu là 0.88. Ý nghĩa đúng là gì?",
    options: [
      "Rất giống — gần như giống 88%",
      "Số tuyệt đối không có nghĩa cố định. 0.88 ở mô hình A có thể là 'rất liên quan', ở mô hình B chỉ là 'trung bình'. Phải so sánh tương đối và calibrate trên dữ liệu thực",
      "Luôn là 'không liên quan'",
      "Là tỷ lệ phần trăm giống nhau",
    ],
    correct: 1,
    explanation:
      "Phân phối điểm cosine phụ thuộc từng embedding model và corpus. Đừng dùng 0.8 như ngưỡng cứng. Hãy thu thập bộ câu hỏi + đáp án đúng, chạy và quan sát khoảng điểm thực tế trước khi đặt ngưỡng.",
  },
  {
    question:
      "Tại sao cần cắt tài liệu dài (PDF 100 trang) thành đoạn nhỏ trước khi embed?",
    options: [
      "Để lưu trữ nhẹ hơn",
      "Để bảo mật",
      "Vì nếu nhét cả PDF vào 1 vector = 'trung bình ý' quá mờ, truy xuất không chính xác được phần người dùng cần",
      "Vì AI sợ file lớn",
    ],
    correct: 2,
    explanation:
      "Một vector duy nhất cho 100 trang = toạ độ 'trung bình' mọi ý — truy xuất thường miss. Cắt 300-800 chữ mỗi đoạn giúp mỗi vector giữ đúng một ý cụ thể. Thêm overlap 10-20% để không cắt ngang.",
  },
  {
    question:
      "Công ty bạn mới 500 tài liệu, chưa đến 200 người dùng. Có nên đầu tư hệ thống semantic search phức tạp?",
    options: [
      "Nên — càng sớm càng tốt",
      "Bắt đầu đơn giản: pgvector + embedding đa ngữ mã nguồn mở. Sau vài tháng dùng, đo nhu cầu thực tế mới mở rộng. Không cần Pinecone + cross-encoder từ đầu",
      "Không bao giờ cần",
      "Chỉ khi có GPU",
    ],
    correct: 1,
    explanation:
      "Quy mô nhỏ: pgvector trên Postgres bạn đã có, embedding BGE-M3 mã nguồn mở, không cần re-ranker. Sau khi dùng thật, log lại câu truy vấn → tối ưu dần. Over-engineering sớm thường phí thời gian.",
  },
  {
    type: "fill-blank",
    question:
      "Tìm kiếm ngữ nghĩa dùng một {blank} để chuyển câu hỏi và tài liệu thành vector, rồi xếp hạng theo {blank} — càng gần hướng, càng giống nghĩa.",
    blanks: [
      {
        answer: "embedding model",
        accept: ["mô hình embedding", "embedding", "bi-encoder"],
      },
      {
        answer: "cosine",
        accept: ["cosine similarity", "độ tương đồng cosine", "cosine sim"],
      },
    ],
    explanation:
      "Mô hình embedding (bi-encoder) sinh vector dense; cosine đo góc giữa hai vector, giá trị gần 1 khi cùng hướng. Đây là kỹ thuật chuẩn trong mọi vector database.",
  },
];

/* ══════════════════════════════════════════════════════════════
   COMPONENT: HEATMAP ĐIỂM TƯƠNG ĐỒNG
   Hiển thị ma trận (query × doc) bằng ô màu + số — KHÔNG công thức
   ══════════════════════════════════════════════════════════════ */

function SimilarityHeatmap() {
  const queries = Object.keys(QUERIES);
  const cells = useMemo(() => {
    return queries.map((q) => {
      const qData = QUERIES[q];
      return DOCS.map((d) => cosine(qData.embed, d.embed));
    });
  }, [queries]);

  function colorFor(value: number): string {
    // value in [-1, 1]
    if (value > 0.8) return "bg-green-600 text-white";
    if (value > 0.5) return "bg-green-400 text-green-950";
    if (value > 0.2) return "bg-green-200 text-green-900";
    if (value > -0.1) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    if (value > -0.4) return "bg-rose-200 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
    return "bg-rose-400 text-rose-950 dark:bg-rose-700/70 dark:text-rose-100";
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Bản đồ &quot;độ liên quan&quot;: 4 câu hỏi × 8 tài liệu
        </p>
        <p className="text-[11px] text-muted">
          Xanh đậm = rất liên quan. Xám = không liên quan. Đỏ = trái chủ đề.
          Số trong ô là điểm gần-xa (cosine), không cần nhớ công thức — chỉ
          đọc màu.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-1 text-left font-semibold text-muted">
                Câu hỏi \ Tài liệu
              </th>
              {DOCS.map((d) => (
                <th
                  key={d.id}
                  className="p-1 text-center text-[10px] font-normal text-muted"
                  style={{ minWidth: 44 }}
                  title={d.text}
                >
                  #{d.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queries.map((q, qi) => (
              <tr key={q}>
                <td className="sticky left-0 z-10 bg-card p-1 pr-3 text-left font-medium text-foreground">
                  <div className="max-w-[14rem] truncate">{q}</div>
                </td>
                {cells[qi].map((v, di) => (
                  <td key={di} className="p-0.5 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (qi * DOCS.length + di) * 0.015 }}
                      className={`flex h-8 w-10 items-center justify-center rounded font-mono text-[10px] ${colorFor(
                        v,
                      )}`}
                      title={`${v.toFixed(2)}`}
                    >
                      {v.toFixed(2)}
                    </motion.div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
        <span className="rounded bg-green-600 px-1.5 py-0.5 text-white">
          rất liên quan
        </span>
        <span className="rounded bg-green-400 px-1.5 py-0.5 text-green-950">
          liên quan
        </span>
        <span className="rounded bg-green-200 px-1.5 py-0.5 text-green-900">
          hơi liên quan
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          trung lập
        </span>
        <span className="rounded bg-rose-200 px-1.5 py-0.5 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">
          khác chủ đề
        </span>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-background/50 p-3 text-[11px] leading-relaxed text-muted">
        <strong className="text-foreground">Đọc bản đồ:</strong> hàng 1 &quot;xin
        nghỉ phép năm nay&quot; xanh đậm ở cột #0, #1, #2, #3 — cả bốn tài
        liệu về phép dù dùng từ vựng khác nhau (tiếng Việt, tiếng Anh,
        &quot;off work&quot;). Hàng 4 &quot;pharma market&quot; xanh cột #7
        &quot;thị trường dược&quot;, xám/đỏ phần còn lại — ngôn ngữ khác, ý
        khớp.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function SemanticSearchTopic() {
  const [selectedQuery, setSelectedQuery] = useState<keyof typeof QUERIES>(
    "xin nghỉ phép năm nay",
  );
  const [mode, setMode] = useState<"keyword" | "semantic">("semantic");
  const [k, setK] = useState(3);

  const q = QUERIES[selectedQuery];

  const keywordResults = useMemo(() => {
    return DOCS.map((d) => ({
      doc: d,
      score: keywordScore(q.tokens, d.keywordTokens),
    }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }, [q, k]);

  const semanticResults = useMemo(() => {
    const scored = DOCS.map((d) => ({
      doc: d,
      score: cosine(q.embed, d.embed),
    }));
    return topK(scored, k, (r) => r.score);
  }, [q, k]);

  const activeResults =
    mode === "keyword" ? keywordResults : semanticResults;

  const rankById = useMemo(() => {
    const m = new Map<number, number>();
    activeResults.forEach((r, idx) => m.set(r.doc.id, idx + 1));
    return m;
  }, [activeResults]);

  /** Chuyển toạ độ 2D → pixel trên SVG scatter */
  const toPx = useCallback((v: [number, number]): [number, number] => {
    const x = 40 + ((v[0] + 1) / 2) * 420;
    const y = 300 - (40 + ((v[1] + 1) / 2) * 260);
    return [x, y];
  }, []);

  const [qx, qy] = toPx(q.embed);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═════ 1. DỰ ĐOÁN ═════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn gõ 'xin nghỉ phép' trong hệ thống tài liệu nội bộ. Có một file tên 'annual leave policy' — không chứa chữ nào trong câu bạn gõ. Hệ thống tìm kiếm theo TỪ KHOÁ có tìm ra file này không?"
          options={[
            "Có — vì hệ thống thông minh",
            "KHÔNG — tìm theo từ khoá chỉ khớp ký tự, không có chữ nào trùng thì điểm bằng 0",
            "Có nếu file phổ biến",
          ]}
          correct={1}
          explanation="Tìm theo từ khoá (BM25, grep) chấm điểm bằng số từ trùng. 'xin', 'nghỉ', 'phép' đều không có trong 'annual leave policy' → điểm 0 → bỏ qua. Đây gọi là 'vocabulary mismatch' — và là lý do tìm kiếm ngữ nghĩa ra đời."
        />
      </LessonSection>

      {/* ═════ 2. ẨN DỤ ═════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                <Search className="h-3.5 w-3.5" />
                Tìm theo từ khoá
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                Như <strong>nhân viên thư viện mới</strong>: bạn phải đọc đúng
                tên sách in trên bìa. Nói &quot;sách về nghỉ phép&quot; là
                họ đứng yên, vì không có chữ nào khớp bìa.
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tìm theo ý nghĩa
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                Như <strong>thủ thư lâu năm</strong>: bạn nói &quot;một quyển
                về nghỉ phép&quot;, cô ấy chạy ngay sang kệ &quot;annual leave
                policy&quot;, &quot;chính sách phép năm&quot;, &quot;off
                work&quot; — dù từ bạn dùng không có trên bìa.
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Điểm mấu chốt: &quot;ý nghĩa&quot; của câu sống trong một{" "}
            <strong>không gian vector</strong>. Hai câu cùng nghĩa → hai điểm
            gần nhau. Dưới đây bạn sẽ thấy không gian đó.
          </p>
        </div>
      </LessonSection>

      {/* ═════ 3. VISUALIZATION ═════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ─── A. Heatmap cosine không cần công thức ─── */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-foreground">
              A. Bản đồ độ liên quan (không cần hiểu công thức)
            </p>
            <SimilarityHeatmap />
          </div>

          {/* ─── B. Side-by-side keyword vs semantic ─── */}
          <div className="mb-6 border-t border-border pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              B. Cùng một câu hỏi — từ khoá vs ngữ nghĩa trả về khác nhau
            </p>

            {/* Thanh điều khiển */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border bg-background p-1">
                {(
                  [
                    { id: "keyword" as const, label: "Từ khoá" },
                    { id: "semantic" as const, label: "Ngữ nghĩa" },
                  ]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      mode === m.id
                        ? m.id === "keyword"
                          ? "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <label className="ml-2 flex items-center gap-2 text-xs text-muted">
                Số kết quả:
                <select
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Chọn truy vấn */}
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] text-muted">
                Chọn câu truy vấn:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(QUERIES).map((qKey) => (
                  <button
                    key={qKey}
                    type="button"
                    onClick={() =>
                      setSelectedQuery(qKey as keyof typeof QUERIES)
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedQuery === qKey
                        ? "bg-accent text-white"
                        : "border border-border bg-card text-muted hover:text-foreground"
                    }`}
                    title={QUERIES[qKey].label}
                  >
                    {qKey}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] italic text-muted">
                {QUERIES[selectedQuery].label}
              </p>
            </div>

            {/* Scatter 2D */}
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Không gian ý nghĩa (đã chiếu về 2D — tài liệu gần nhau = ý gần
                nhau)
              </p>
              <svg viewBox="0 0 500 320" className="w-full">
                <line
                  x1={40}
                  y1={300}
                  x2={460}
                  y2={300}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                />
                <line
                  x1={40}
                  y1={40}
                  x2={40}
                  y2={300}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                />
                <text
                  x={250}
                  y={315}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  opacity={0.6}
                >
                  cụm phép / phúc lợi ← → cụm báo cáo doanh thu
                </text>
                <text
                  x={15}
                  y={170}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  opacity={0.6}
                  transform="rotate(-90 15 170)"
                >
                  cụm CSKH / quy trình ← → khác
                </text>

                {mode === "semantic" && (
                  <circle
                    cx={qx}
                    cy={qy}
                    r={90}
                    fill="#3b82f6"
                    opacity={0.08}
                    stroke="#3b82f6"
                    strokeOpacity={0.3}
                    strokeDasharray="4 3"
                  />
                )}

                {DOCS.map((d) => {
                  const [x, y] = toPx(d.embed);
                  const rank = rankById.get(d.id);
                  const isTop = rank !== undefined;
                  const sim =
                    mode === "semantic"
                      ? cosine(q.embed, d.embed)
                      : keywordScore(q.tokens, d.keywordTokens) /
                        Math.max(1, q.tokens.length);
                  return (
                    <g key={d.id}>
                      {mode === "semantic" && (
                        <line
                          x1={qx}
                          y1={qy}
                          x2={x}
                          y2={y}
                          stroke="#3b82f6"
                          strokeWidth={Math.max(0, sim) * 3}
                          opacity={Math.max(0, sim) * 0.9}
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isTop ? 10 : 6}
                        fill={
                          isTop
                            ? mode === "semantic"
                              ? "#3b82f6"
                              : "#ef4444"
                            : "#64748b"
                        }
                        opacity={isTop ? 1 : 0.55}
                        stroke={isTop ? "white" : "none"}
                        strokeWidth={isTop ? 1.5 : 0}
                      />
                      {isTop && (
                        <text
                          x={x}
                          y={y + 3}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={700}
                          fill="white"
                        >
                          {rank}
                        </text>
                      )}
                      <text
                        x={x}
                        y={y - 14}
                        textAnchor="middle"
                        fontSize={11}
                        fill="currentColor"
                        opacity={isTop ? 0.95 : 0.55}
                      >
                        {d.text.length > 28
                          ? d.text.slice(0, 28) + "…"
                          : d.text}
                      </text>
                    </g>
                  );
                })}

                <motion.circle
                  cx={qx}
                  cy={qy}
                  r={12}
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth={2}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <text
                  x={qx}
                  y={qy - 18}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#f59e0b"
                >
                  câu hỏi
                </text>
              </svg>
              <p className="mt-2 text-[11px] text-muted">
                Chấm cam = câu hỏi. Chấm số = top-{k} kết quả. Ở chế độ ngữ
                nghĩa, đường nối dày = rất liên quan. Ở chế độ từ khoá, chỉ
                tài liệu có chữ khớp mới sáng.
              </p>
            </div>

            {/* Bảng kết quả 2 cột */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      mode === "semantic" ? "bg-blue-500" : "bg-red-500"
                    }`}
                  />
                  Chế độ hiện tại:{" "}
                  {mode === "semantic" ? "Ngữ nghĩa" : "Từ khoá"}
                </p>
                {activeResults.length === 0 ? (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-2 dark:border-red-700 dark:bg-red-900/20">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                        Không có tài liệu nào khớp
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                      Đây chính là &quot;vocabulary mismatch&quot; mà tìm kiếm
                      ngữ nghĩa sinh ra để giải quyết.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {activeResults.map((r, i) => (
                      <li
                        key={r.doc.id}
                        className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2"
                      >
                        <span
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            backgroundColor:
                              mode === "semantic" ? "#3b82f6" : "#ef4444",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-[13px] text-foreground">
                            {r.doc.text}
                          </p>
                          <p className="text-[10px] text-muted">
                            {mode === "semantic"
                              ? `điểm ngữ nghĩa = ${r.score.toFixed(2)}`
                              : `${r.score} từ khoá khớp`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      mode === "semantic" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  So sánh: chế độ còn lại sẽ trả về
                </p>
                {(mode === "semantic" ? keywordResults : semanticResults)
                  .length === 0 ? (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-2 dark:border-red-700 dark:bg-red-900/20">
                    <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                      Không tìm ra gì — bằng chứng ưu thế của tìm kiếm ngữ
                      nghĩa khi từ vựng khác nhau.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {(mode === "semantic"
                      ? keywordResults
                      : semanticResults
                    ).map((r, i) => (
                      <li
                        key={r.doc.id}
                        className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2 opacity-80"
                      >
                        <span
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            backgroundColor:
                              mode === "semantic" ? "#ef4444" : "#3b82f6",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-[13px] text-foreground">
                            {r.doc.text}
                          </p>
                          <p className="text-[10px] text-muted">
                            {mode === "semantic"
                              ? `${r.score} từ khoá khớp`
                              : `điểm ngữ nghĩa = ${r.score.toFixed(2)}`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* ─── C. Ghép cặp: intent → category ─── */}
          <div className="mb-6 border-t border-border pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              C. Ghép ý người dùng với loại tài liệu phù hợp
            </p>
            <MatchPairs
              instruction="Ghép ý định của nhân viên với nhóm tài liệu công ty mà hệ thống sẽ trả về khi tìm kiếm ngữ nghĩa."
              pairs={[
                { left: "Cần xin off cuối tháng để về quê", right: "Nội quy nghỉ phép / annual leave policy" },
                { left: "Khách phàn nàn giao hàng chậm", right: "SOP xử lý khiếu nại / quy trình CSKH" },
                { left: "Cần số liệu báo cáo gửi sếp", right: "Báo cáo tài chính / doanh thu quý" },
                { left: "Nghiên cứu đối thủ trong ngành dược", right: "Báo cáo thị trường dược phẩm" },
              ]}
            />
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═════ 4. AHA ═════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Ý nghĩa có toạ độ.</strong> Mỗi câu trở thành một điểm
            trong không gian số — hai câu cùng nghĩa ở gần nhau, bất kể ngôn
            ngữ, chính tả, hay từ ngữ. Tìm kiếm ngữ nghĩa chỉ là việc &quot;đo
            khoảng cách&quot; từ câu hỏi đến mọi tài liệu, rồi trả về top gần
            nhất.
          </p>
          <p className="mt-2 text-sm text-muted">
            Đây là nền móng cho{" "}
            <TopicLink slug="vector-databases">vector database</TopicLink>,{" "}
            <TopicLink slug="rag">RAG</TopicLink>, và mọi hệ thống chatbot
            doanh nghiệp hiện đại.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═════ 5. THỬ THÁCH ═════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-3">
          <InlineChallenge
            question="Nhân viên gõ tên model sản phẩm cụ thể 'MBP-M4-512GB' để tra chính sách bảo hành. Tìm kiếm ngữ nghĩa phù hợp không?"
            options={[
              "Phù hợp — AI hiểu mã sản phẩm",
              "KHÔNG tốt cho mã chính xác — cần kết hợp tìm từ khoá để giữ đúng ký tự. Chỉ dùng semantic dễ trả nhầm model khác",
              "Tuỳ ngân sách",
            ]}
            correct={1}
            explanation="Mã sản phẩm, số hợp đồng, tên model hiếm là 'exact match' — keyword mạnh hơn semantic. Giải pháp chuẩn: hybrid (keyword + semantic) cho phép lấy cả hai lợi thế."
          />
          <div className="h-2" />
          <InlineChallenge
            question="Bạn có 5 triệu tài liệu nội bộ. Phòng IT hỏi: 'chấm điểm từng cặp câu hỏi-tài liệu bằng AI chính xác nhất có khả thi?'"
            options={[
              "Có — với GPU đủ mạnh",
              "KHÔNG — 5 triệu lần chấm cho MỖI câu hỏi là hàng giờ. Phải lọc 2 tầng: tìm nhanh 100 ứng viên, rồi chấm kỹ 100 đó",
              "Có nếu dùng LLM",
            ]}
            correct={1}
            explanation="Chấm chính xác (cross-encoder) ~ 10ms/cặp × 5 triệu = 14 giờ cho một câu hỏi. Kiến trúc chuẩn: tìm kiếm ngữ nghĩa nhanh lấy top-100 (dưới 50ms) → cross-encoder rerank top-100 xuống top-5 (thêm ~1s). Đây là công thức 'retrieve then rerank'."
          />
        </div>
      </LessonSection>

      {/* ═════ 6. GIẢI THÍCH ═════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection topicSlug={metadata.slug}>
          <div className="rounded-xl border border-accent/30 bg-accent-light/30 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              <strong>Tìm kiếm ngữ nghĩa</strong> tìm tài liệu theo <em>ý
              nghĩa</em> thay vì khớp ký tự. Một{" "}
              <TopicLink slug="embedding-model">mô hình embedding</TopicLink>{" "}
              chuyển mọi câu thành vector nhiều chiều; xếp hạng theo độ gần
              về hướng (cosine) và trả về top-K gần nhất.
            </p>
          </div>

          {/* So sánh 2 cột: Keyword vs Semantic */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Từ khoá vs Ngữ nghĩa — mỗi phương pháp mạnh ở đâu?
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
                Từ khoá (BM25, grep)
              </p>
              <ul className="space-y-1 text-xs leading-relaxed text-foreground">
                <li>• Khớp mã sản phẩm, số hợp đồng, tên riêng hiếm — CỰC MẠNH</li>
                <li>• Nhanh, rẻ, dễ giải thích kết quả</li>
                <li>• Yếu khi câu hỏi dùng từ khác tài liệu</li>
                <li>• Không hiểu ngôn ngữ chéo (VN ↔ EN)</li>
                <li>• Không hiểu đồng nghĩa, paraphrase</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                Ngữ nghĩa (vector search)
              </p>
              <ul className="space-y-1 text-xs leading-relaxed text-foreground">
                <li>• Hiểu đồng nghĩa: &quot;xin phép&quot; ↔ &quot;annual leave&quot;</li>
                <li>• Chéo ngôn ngữ nếu dùng embedding đa ngữ</li>
                <li>• Tha thứ lỗi chính tả, cách diễn đạt tự nhiên</li>
                <li>• Yếu ở mã chính xác, tên hiếm</li>
                <li>• Cần mô hình embedding + hạ tầng vector DB</li>
              </ul>
            </div>
          </div>

          {/* ToggleCompare pipeline */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Pipeline tìm kiếm ngữ nghĩa — 1 tầng vs 2 tầng
          </h3>
          <ToggleCompare
            labelA="1 tầng (đơn giản)"
            labelB="2 tầng (có rerank)"
            description="Công ty nhỏ bắt đầu từ 1 tầng. Khi chất lượng kết quả quan trọng, thêm tầng 2."
            childA={
              <PipelineLadder
                color="text-blue-600"
                steps={[
                  "Embed câu hỏi → vector",
                  "Vector DB tìm top-5 gần nhất (bi-encoder, <50ms)",
                  "Trả về ngay cho người dùng",
                ]}
                note="Nhanh, rẻ, đủ dùng cho POC và dưới 1M tài liệu."
              />
            }
            childB={
              <PipelineLadder
                color="text-purple-600"
                steps={[
                  "Embed câu hỏi → vector",
                  "Vector DB lấy 100 ứng viên (nhanh, thô)",
                  "Cross-encoder đọc từng cặp (câu hỏi, tài liệu) → chấm lại",
                  "Giữ top-5 có điểm cao nhất → trả về",
                ]}
                note="Tăng chất lượng 5-15 điểm MRR. Chậm hơn vài trăm ms. Đáng cho sản phẩm có người dùng thật."
              />
            }
          />

          {/* Ghép cặp */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Tình huống nào chọn cách tìm kiếm nào?
          </h3>
          <MatchPairs
            instruction="Ghép mỗi tình huống với cách tìm kiếm phù hợp nhất."
            pairs={[
              { left: "Tra đúng số hợp đồng HD-2025-008", right: "Từ khoá (khớp chính xác)" },
              { left: "Hỏi 'chính sách nghỉ phép' nhưng file tên 'annual leave'", right: "Ngữ nghĩa (hiểu đồng nghĩa, chéo ngôn ngữ)" },
              { left: "Kho có cả mã SKU và mô tả tự do về sản phẩm", right: "Hybrid (từ khoá + ngữ nghĩa) — ghép cả hai" },
              { left: "Lấy top-100 rồi chọn kỹ top-5 chất lượng", right: "Retrieve then rerank (bi-encoder + cross-encoder)" },
            ]}
          />

          {/* Callouts */}
          <Callout variant="insight" title="Bi-encoder vs Cross-encoder">
            <p>
              <strong>Bi-encoder</strong> mã hoá câu hỏi và tài liệu RIÊNG RẼ,
              cho ra 2 vector. Tài liệu có thể mã hoá sẵn và lưu vào vector DB
              → truy vấn cực nhanh. Dùng ở tầng 1.
            </p>
            <p className="mt-1">
              <strong>Cross-encoder</strong> ghép cả cặp (câu hỏi, tài liệu) đưa
              vào AI → chấm 1 điểm liên quan. Chính xác hơn đáng kể vì AI
              &quot;đọc đồng thời&quot; cả hai. Nhưng không precompute được →
              đắt, chỉ dùng ở tầng 2 (rerank).
            </p>
          </Callout>

          <Callout variant="info" title="Các mô hình embedding phổ biến 2026">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>OpenAI text-embedding-3:</strong> API dễ dùng, đa
                ngôn ngữ, chất lượng tốt.
              </li>
              <li>
                <strong>BGE-M3 (BAAI):</strong> mã nguồn mở, hỗ trợ tiếng Việt
                rất tốt, chạy local được.
              </li>
              <li>
                <strong>Cohere embed-v3:</strong> 100+ ngôn ngữ, có
                &quot;compressed embeddings&quot; tiết kiệm bộ nhớ.
              </li>
              <li>
                <strong>Multilingual E5:</strong> mã nguồn mở, mạnh cho
                retrieval thuần text.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Cạm bẫy thường gặp">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Mismatch model:</strong> mã hoá tài liệu bằng model A,
                mã hoá câu hỏi bằng model B → điểm vô nghĩa. Luôn cùng một
                model.
              </li>
              <li>
                <strong>Bỏ qua chunking:</strong> nhét PDF 50 trang vào 1 vector
                = trung bình ý, độ chính xác tụt. Chunk 500-1000 chữ +
                overlap.
              </li>
              <li>
                <strong>Quên metadata filter:</strong> semantic có thể trả về
                tài liệu &quot;hết hạn&quot;, &quot;private&quot;. Lọc metadata
                trước/sau khi tìm.
              </li>
              <li>
                <strong>Tin cosine tuyệt đối:</strong> 0.80 mô hình A ≠ 0.80 mô
                hình B. Calibrate trên tập đánh giá.
              </li>
              <li>
                <strong>Không dùng hybrid khi có tên riêng:</strong> mã sản
                phẩm, SKU cần keyword. Semantic không thôi dễ miss.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Khi nào KHÔNG cần tìm kiếm ngữ nghĩa?">
            - Câu hỏi luôn là mã sản phẩm / ID / tên model chính xác.
            <br />
            - Kho nhỏ (&lt; vài nghìn tài liệu) và người dùng hài lòng với tìm
            từ khoá.
            <br />
            - Yêu cầu độ trễ &lt; 10ms trên CPU cũ, ngân sách cực thấp.
          </Callout>

          {/* Ứng dụng */}
          <h3 className="mt-5 text-base font-semibold text-foreground">
            Ứng dụng thực tế cho dân văn phòng
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {([
              ["Chatbot hỏi đáp tài liệu công ty", "Nhân viên hỏi tự nhiên, bot đọc đúng đoạn trong nội quy / handbook."],
              ["Tìm hợp đồng, email cũ", "'Hợp đồng với bên A về giao hàng chậm' → ra đúng văn bản dù tên file không khớp."],
              ["Tổng hợp báo cáo ngành", "Marketer có 50 PDF báo cáo → hỏi xu hướng, tìm đúng đoạn trả lời."],
              ["Thương mại điện tử", "'Quà cho bạn gái thích cắm trại' → semantic bắt ý, keyword khớp brand."],
              ["Tìm kiếm chéo ngôn ngữ", "Query tiếng Việt → tài liệu tiếng Anh vẫn trả đúng nhờ embedding đa ngữ."],
              ["Phát hiện trùng lặp tin tức", "Tìm bài trùng ý (plagiarism, dedup) tốt hơn khớp từ rất nhiều."],
            ] as const).map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border bg-card p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="h-3.5 w-3.5 text-accent" />
                  {t}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>

          <CollapsibleDetail title="Đánh giá chất lượng tìm kiếm — chỉ số nào?">
            <ul className="list-disc list-inside space-y-1.5 text-sm leading-relaxed">
              <li>
                <strong>Recall@k:</strong> top-k có bao nhiêu % tài liệu đúng — đo &quot;không miss&quot;.
              </li>
              <li>
                <strong>Precision@k:</strong> top-k có bao nhiêu % thật sự liên quan — đo &quot;không nhiễu&quot;.
              </li>
              <li>
                <strong>MRR:</strong> trung bình 1/hạng của kết quả đúng đầu tiên. Phù hợp khi chỉ cần 1 đáp án.
              </li>
              <li>
                <strong>nDCG@k:</strong> điểm có trọng số theo vị trí, thưởng kết quả đúng ở hạng cao. Chuẩn tìm kiếm web.
              </li>
              <li>
                <strong>Latency p95/p99:</strong> đuôi độ trễ. p99 &lt; 300ms cho UX chấp nhận được.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi phí vận hành — lưu ý trước khi scale">
            <ul className="list-disc list-inside space-y-1.5 text-sm leading-relaxed">
              <li>
                <strong>Bộ nhớ:</strong> 10M vector × 1024 chiều ≈ 40 GB. Product quantization giảm còn 2-4 GB.
              </li>
              <li>
                <strong>Inference:</strong> OpenAI/Cohere tính theo token; BGE-M3 local miễn phí nhưng cần 12-16 GB VRAM.
              </li>
              <li>
                <strong>Re-indexing:</strong> đổi model = mã hoá lại toàn bộ kho. Version hoá index, có plan migrate.
              </li>
              <li>
                <strong>Cập nhật nóng:</strong> tài liệu đổi cần upsert vector. Đa số vector DB hỗ trợ, có giới hạn tần suất.
              </li>
            </ul>
          </CollapsibleDetail>

          <h3 className="mt-5 text-base font-semibold text-foreground">
            Thuật ngữ liên quan
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <TopicLink slug="bm25">BM25</TopicLink> — nền tảng tìm theo từ
              khoá, bổ trợ cho semantic trong hybrid.
            </li>
            <li>
              <TopicLink slug="embedding-model">Embedding Model</TopicLink> —
              bộ não của semantic search, quyết định chất lượng vector.
            </li>
            <li>
              <TopicLink slug="vector-databases">Vector Databases</TopicLink> —
              nơi lưu và truy vấn vector quy mô lớn (pgvector, Qdrant,
              Pinecone, Milvus).
            </li>
            <li>
              <TopicLink slug="hybrid-search">Hybrid Search</TopicLink> — công
              thức ghép từ khoá + ngữ nghĩa + rerank.
            </li>
            <li>
              <TopicLink slug="chunking">Chunking</TopicLink> — cắt tài liệu
              dài thành đoạn trước khi mã hoá.
            </li>
            <li>
              <TopicLink slug="rag">RAG</TopicLink> — ứng dụng cờ hiệu: dùng
              semantic search để đưa tri thức vào prompt.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ═════ 7. TÓM TẮT ═════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về tìm kiếm ngữ nghĩa"
          points={[
            "Tìm kiếm ngữ nghĩa = tìm theo Ý NGHĨA thay vì chữ: chuyển câu thành vector, đo khoảng cách, trả top-K gần nhất.",
            "Giải quyết 'vocabulary mismatch': 'xin nghỉ phép' vẫn tìm ra 'annual leave policy' dù không trùng chữ nào.",
            "Kém ở mã chính xác (SKU, số hợp đồng, tên riêng hiếm) — đây là địa hạt của tìm từ khoá. Hybrid ghép cả hai thường vượt trội.",
            "Pipeline 2 tầng chuẩn: bi-encoder lấy top-100 nhanh → cross-encoder rerank chính xác → top-5 cuối.",
            "Luôn dùng cùng mô hình embedding cho tài liệu và câu hỏi. Chunking hợp lý là bắt buộc với tài liệu dài.",
            "Là bước tra cứu cốt lõi của RAG, chatbot nội bộ, thương mại điện tử và tìm kiếm chéo ngôn ngữ.",
          ]}
        />
      </LessonSection>

      {/* ═════ 8. QUIZ ═════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

export const __internals = { cosine, keywordScore };
