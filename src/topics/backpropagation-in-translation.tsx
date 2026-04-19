"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages,
  ArrowRight,
  ArrowLeft,
  Target,
  Gauge,
  Sparkles,
  Layers,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Globe,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "backpropagation-in-translation",
  title: "Backpropagation in Translation",
  titleVi: "Lan truyền ngược — khi Google Translate học từ lỗi",
  description:
    "Mỗi câu dịch sai là một lần Google Translate tự chỉnh trọng số. Xem một cặp câu Anh–Việt đi qua forward, loss, backward và update.",
  category: "neural-fundamentals",
  tags: ["backpropagation", "translation", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["backpropagation"],
  vizType: "interactive",
  applicationOf: "backpropagation",
  featuredApp: {
    name: "Google Translate",
    productFeature: "Neural Machine Translation",
    company: "Google LLC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Google's Neural Machine Translation System: Bridging the Gap between Human and Machine Translation",
      publisher: "arXiv (Google Research)",
      url: "https://arxiv.org/abs/1609.08144",
      date: "2016-09",
      kind: "paper",
    },
    {
      title: "A Neural Network for Machine Translation, at Production Scale",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/a-neural-network-for-machine-translation-at-production-scale/",
      date: "2016-09",
      kind: "engineering-blog",
    },
    {
      title: "Recent Advances in Google Translate",
      publisher: "Google Research Blog",
      url: "https://research.google/blog/recent-advances-in-google-translate/",
      date: "2020-06",
      kind: "engineering-blog",
    },
    {
      title: "Attention Is All You Need",
      publisher: "arXiv (Google Brain / NeurIPS 2017)",
      url: "https://arxiv.org/abs/1706.03762",
      date: "2017-06",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Một cặp câu, một bước học" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — ba cặp câu Anh → Việt
   Mỗi cặp có: bản dịch hiện tại (weights chưa hoàn hảo),
   bản dịch đích (ground truth), và xác suất của top-4 lựa chọn
   cho token đầu tiên của câu đích.
   ──────────────────────────────────────────────────────────── */

interface TokenProbability {
  token: string;
  prob: number;
  isCorrect: boolean;
  note: string;
}

interface TranslationPair {
  id: "love" | "morning" | "market";
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  predicted: string;
  firstTokenDistribution: TokenProbability[];
  loss: number;
  lossNote: string;
  gradientLayers: {
    name: string;
    correction: number;
    note: string;
  }[];
}

const TRANSLATION_PAIRS: TranslationPair[] = [
  {
    id: "love",
    source: "I love you",
    sourceLabel: "câu tiếng Anh đầu vào",
    target: "Tôi yêu bạn",
    targetLabel: "bản dịch đúng do con người viết",
    predicted: "Tôi yêu em",
    firstTokenDistribution: [
      { token: "Tôi", prob: 0.72, isCorrect: true, note: "đúng chủ ngữ" },
      { token: "Anh", prob: 0.14, isCorrect: false, note: "cũng hợp nhưng lệch" },
      { token: "Em", prob: 0.08, isCorrect: false, note: "lệch ngôi" },
      { token: "Mình", prob: 0.06, isCorrect: false, note: "thân mật, sai ngữ cảnh" },
    ],
    loss: 0.34,
    lossNote:
      "Token đầu đã đúng (Tôi). Token thứ hai sai nhẹ (em thay vì bạn) → loss trung bình thấp.",
    gradientLayers: [
      { name: "Embedding", correction: 0.08, note: "chỉnh nhẹ nhúng của 'you'" },
      { name: "Encoder L1-L4", correction: 0.12, note: "lớp thấp bắt cú pháp, ít sai" },
      { name: "Encoder L5-L8", correction: 0.24, note: "lớp cao giữ ngữ nghĩa tình cảm" },
      { name: "Attention", correction: 0.55, note: "phải học nối 'you' với 'bạn' thay vì 'em'" },
      { name: "Decoder L1-L4", correction: 0.38, note: "sinh từ sai — gradient mạnh vào đây" },
      { name: "Decoder L5-L8", correction: 0.62, note: "lớp gần output nhận chỉnh sửa lớn nhất" },
      { name: "Softmax head", correction: 0.81, note: "phải đẩy xác suất 'bạn' lên, 'em' xuống" },
    ],
  },
  {
    id: "morning",
    source: "Good morning, teacher",
    sourceLabel: "câu tiếng Anh đầu vào",
    target: "Chào buổi sáng, thầy giáo",
    targetLabel: "bản dịch đúng",
    predicted: "Chào sáng, giáo viên",
    firstTokenDistribution: [
      { token: "Chào", prob: 0.64, isCorrect: true, note: "đúng từ mở đầu" },
      { token: "Xin", prob: 0.2, isCorrect: false, note: "trang trọng quá" },
      { token: "Buổi", prob: 0.1, isCorrect: false, note: "nhảy sang danh từ" },
      { token: "Good", prob: 0.06, isCorrect: false, note: "chưa dịch xong" },
    ],
    loss: 0.58,
    lossNote:
      "Sai cấu trúc 'buổi sáng' và chọn 'giáo viên' thay vì 'thầy giáo' (kính ngữ) → loss cao hơn.",
    gradientLayers: [
      { name: "Embedding", correction: 0.11, note: "tinh chỉnh nhúng của 'teacher'" },
      { name: "Encoder L1-L4", correction: 0.18, note: "cú pháp cụm 'good morning'" },
      { name: "Encoder L5-L8", correction: 0.31, note: "ngữ cảnh lớp học, kính ngữ" },
      { name: "Attention", correction: 0.72, note: "phải học 'teacher' → 'thầy giáo' (không phải giáo viên)" },
      { name: "Decoder L1-L4", correction: 0.54, note: "thiếu 'buổi' trong cụm 'buổi sáng'" },
      { name: "Decoder L5-L8", correction: 0.79, note: "phải sinh đúng thứ tự nhiều token" },
      { name: "Softmax head", correction: 0.92, note: "đẩy 'thầy giáo' cao hơn 'giáo viên'" },
    ],
  },
  {
    id: "market",
    source: "She goes to the market",
    sourceLabel: "câu tiếng Anh đầu vào",
    target: "Cô ấy đi chợ",
    targetLabel: "bản dịch đúng",
    predicted: "Bà đi thị trường",
    firstTokenDistribution: [
      { token: "Cô", prob: 0.31, isCorrect: true, note: "đúng nhưng xác suất thấp" },
      { token: "Bà", prob: 0.42, isCorrect: false, note: "đang đứng đầu — sai tuổi tác" },
      { token: "Chị", prob: 0.18, isCorrect: false, note: "hợp văn cảnh khác" },
      { token: "Nó", prob: 0.09, isCorrect: false, note: "quá suồng sã" },
    ],
    loss: 0.87,
    lossNote:
      "Sai ngay token đầu ('Bà' thay vì 'Cô ấy'), sai 'thị trường' (dịch từ điển) thay vì 'chợ' → loss cao.",
    gradientLayers: [
      { name: "Embedding", correction: 0.22, note: "nhúng 'she' và 'market' lệch khỏi mục tiêu" },
      { name: "Encoder L1-L4", correction: 0.35, note: "cú pháp chủ-động-tân đúng, ít chỉnh" },
      { name: "Encoder L5-L8", correction: 0.58, note: "lớp cao phải nhớ 'market' thường là 'chợ' ở câu đời thường" },
      { name: "Attention", correction: 0.88, note: "phải học 'she' → 'cô ấy' thay vì 'bà' — chỉnh mạnh" },
      { name: "Decoder L1-L4", correction: 0.82, note: "token đầu tiên sai → gradient lớn" },
      { name: "Decoder L5-L8", correction: 0.91, note: "phải thay đổi phân phối cho cả hai vị trí" },
      { name: "Softmax head", correction: 0.98, note: "đẩy 'Cô' lên đỉnh, 'Bà' xuống sâu" },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────── */

function findPairById(
  id: TranslationPair["id"],
): TranslationPair {
  return TRANSLATION_PAIRS.find((p) => p.id === id) ?? TRANSLATION_PAIRS[0];
}

function lossBand(loss: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (loss < 0.4) {
    return { label: "Sai nhẹ", color: "#10b981", bg: "#10b98118" };
  }
  if (loss < 0.7) {
    return { label: "Sai vừa", color: "#f59e0b", bg: "#f59e0b18" };
  }
  return { label: "Sai nặng", color: "#ef4444", bg: "#ef444418" };
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function BackpropagationInTranslation() {
  const [pairId, setPairId] = useState<TranslationPair["id"]>("love");
  const pair = useMemo(() => findPairById(pairId), [pairId]);
  const band = lossBand(pair.loss);

  const [phase, setPhase] = useState<
    "idle" | "forward" | "loss" | "backward" | "update"
  >("idle");

  function runOneStep() {
    setPhase("forward");
    setTimeout(() => setPhase("loss"), 900);
    setTimeout(() => setPhase("backward"), 1800);
    setTimeout(() => setPhase("update"), 3000);
  }

  function resetRun() {
    setPhase("idle");
  }

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Lan truyền ngược"
    >
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero
        parentTitleVi="Lan truyền ngược"
        topicSlug={metadata.slug}
      >
        <p>
          Bạn gõ <strong>&ldquo;Xin chào&rdquo;</strong> vào Google Translate và
          ngay lập tức nhận được <strong>&ldquo;Hello&rdquo;</strong>. Đằng sau
          khoảnh khắc đó là hàng triệu cặp câu Anh-Việt mà mô hình đã nhìn qua
          trong lúc huấn luyện. Mỗi cặp là một <strong>cơ hội mắc lỗi</strong>{" "}
          — và mỗi lỗi là một lần thuật toán <em>lan truyền ngược</em> đi đánh
          dấu lại hàng triệu trọng số bên trong mạng nơ-ron.
        </p>
        <p>
          Bài này cho bạn theo dõi <strong>đúng một cặp câu</strong> đi từ đầu
          vào đến đầu ra, xem mô hình dự đoán sai chỗ nào, rồi nhìn gradient
          (mũi tên sửa lỗi) chảy ngược qua từng lớp. Sau khi cập nhật, cùng cặp
          câu đó sẽ cho kết quả tốt hơn một chút. Nhân chuyện nhỏ đó lên hàng
          tỉ lần → ra hệ thống Google Translate.
        </p>

        <div className="not-prose my-5 rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Một mẫu dữ liệu trong 36 triệu cặp câu Anh-Việt
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                Nguồn (EN)
              </p>
              <p className="text-base font-semibold text-foreground">
                &ldquo;I love you&rdquo;
              </p>
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-muted mx-auto" />
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Đích (VI)
              </p>
              <p className="text-base font-semibold text-foreground">
                &ldquo;Tôi yêu bạn&rdquo;
              </p>
            </div>
          </div>
          <p className="text-xs text-muted italic leading-relaxed">
            Mạng nơ-ron 16 lớp (8 encoder + 8 decoder) lần đầu tiên có thể dịch
            cả câu trọn vẹn thay vì dịch từng cụm rời rạc. Toàn bộ mạng đó được
            huấn luyện bằng một thuật toán duy nhất: lan truyền ngược.
          </p>
        </div>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <p>
          Trước năm 2016, Google Translate ghép từng cụm từ lại với nhau theo
          phương pháp thống kê. Bản dịch thường{" "}
          <strong>đứt gãy giữa câu</strong>, mất ngữ cảnh, và đặc biệt kém với
          cặp ngôn ngữ xa nhau như Anh-Việt. Giải pháp hiển nhiên: một mạng
          nơ-ron 16 lớp đọc toàn bộ câu nguồn, rồi sinh ra câu đích trọn vẹn.
        </p>
        <p>
          Nhưng mạng đó có <strong>hàng trăm triệu trọng số</strong>. Không ai
          chỉnh tay được. Cần một thuật toán tự động: nhìn vào lỗi dịch ở đầu
          ra, rồi quay ngược về <em>từng trọng số</em> và nói chính xác nó phải
          nhích bao nhiêu theo hướng nào. Thuật toán đó chính là{" "}
          <strong>lan truyền ngược</strong>.
        </p>

        <div className="not-prose my-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-sky-500">
            <p className="text-sm font-bold text-foreground">16 lớp sâu</p>
            <p className="text-xs text-muted leading-snug">
              8 lớp encoder LSTM + 8 lớp decoder LSTM, mỗi lớp 1.024 nút. Gradient
              phải chảy ngược qua tất cả mà không bị triệt tiêu.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-violet-500">
            <p className="text-sm font-bold text-foreground">
              Hàng trăm triệu trọng số
            </p>
            <p className="text-xs text-muted leading-snug">
              Không thể thử từng trọng số một. Cần một thuật toán tính gradient
              cho tất cả cùng lúc trong một lần duyệt ngược.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-rose-500">
            <p className="text-sm font-bold text-foreground">
              36 triệu cặp câu
            </p>
            <p className="text-xs text-muted leading-snug">
              Mỗi cặp là một bước học. Cần vòng lặp forward-loss-backward-update
              chạy ổn định hàng tỉ lần không phân kỳ.
            </p>
          </div>
        </div>
      </ApplicationProblem>

      {/* ━━━ MECHANISM ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Lan truyền ngược"
        topicSlug={metadata.slug}
      >
        <Beat step={1}>
          <p>
            <strong>Chọn một cặp câu từ dữ liệu.</strong> Hệ thống bốc ngẫu
            nhiên một cặp (câu nguồn, câu đích) từ kho 36 triệu cặp song ngữ.
            Câu nguồn đi vào encoder, câu đích giữ lại làm &ldquo;đáp án&rdquo;.
            Lúc này mô hình chưa biết câu đích — nó phải tự đoán.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Forward — encoder nén câu nguồn, decoder sinh câu đích.</strong>{" "}
            8 lớp LSTM encoder đọc &ldquo;I love you&rdquo; rồi nén thành một
            chuỗi vector ngữ nghĩa. 8 lớp LSTM decoder lần lượt sinh ra từng
            token của câu đích. Tại mỗi bước, decoder cho ra phân phối xác suất
            trên toàn bộ từ vựng tiếng Việt.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Loss — so với bản dịch đúng.</strong> Token do mô hình dự
            đoán được so với token đúng bằng cross-entropy. Nếu mô hình tự tin
            sai (ví dụ đẩy &ldquo;em&rdquo; lên 0.7 thay vì &ldquo;bạn&rdquo;),
            loss lớn. Loss của câu = tổng loss trên tất cả các token của câu đích.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Backward — gradient chảy ngược qua 16 lớp.</strong> Bắt đầu
            từ loss, thuật toán backprop đi ngược qua softmax head, decoder
            (lớp cao → lớp thấp), attention, rồi encoder. Mỗi trọng số nhận về
            một con số: &ldquo;bạn đang đóng góp bao nhiêu vào lỗi này?&rdquo;.
            Kết nối tắt (residual) giữ gradient không bị triệt tiêu khi qua
            nhiều lớp.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Update — trọng số nhích theo gradient.</strong> Mỗi trọng
            số <em>w</em> được cập nhật bằng công thức đơn giản: trừ đi tốc độ
            học nhân với gradient. Lớp softmax head và decoder cao (gần đầu ra)
            thường nhận chỉnh sửa mạnh nhất vì gần loss. Lớp encoder thấp (gần
            đầu vào) chỉnh nhẹ. Gradient được cắt ngưỡng ở 5,0 để tránh bùng nổ.
          </p>
        </Beat>

        {/* ══════════════════════════════════════════════════════
           REVEAL — TOY TRANSLATION DEMO with confidence scores
           ══════════════════════════════════════════════════════ */}
        <li className="mt-8">
          <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Thử nghiệm: chọn một cặp câu, xem mô hình sai chỗ nào
                </h3>
                <p className="text-xs text-muted">
                  Đây là một mô hình rút gọn. Phân phối xác suất là minh họa,
                  nhưng logic loss-gradient-update đúng như trong GNMT thật.
                </p>
              </div>
            </div>

            {/* Pair selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {TRANSLATION_PAIRS.map((p) => {
                const active = p.id === pairId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPairId(p.id);
                      resetRun();
                    }}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      active
                        ? "border-accent bg-card"
                        : "border-border bg-card hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`h-2 w-2 rounded-full ${active ? "bg-accent" : "bg-border"}`}
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Cặp câu {p.id === "love" ? "A" : p.id === "morning" ? "B" : "C"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      &ldquo;{p.source}&rdquo;
                    </p>
                    <p className="text-xs text-muted mt-1">
                      đích: &ldquo;{p.target}&rdquo;
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Two-column: input on left, output on right */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                    Nguồn (EN)
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    &ldquo;{pair.source}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted mt-1 italic">
                    {pair.sourceLabel}
                  </p>
                </div>
                <ArrowRight className="hidden md:block h-5 w-5 text-muted mx-auto" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                    Mô hình dự đoán
                  </p>
                  <p className="text-base font-semibold text-amber-700 dark:text-amber-300">
                    &ldquo;{pair.predicted}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted mt-1 italic">
                    weights hiện tại chưa hoàn hảo
                  </p>
                </div>
              </div>

              {/* Target row */}
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Đáp án đúng (con người viết)
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    &ldquo;{pair.target}&rdquo;
                  </p>
                </div>
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* First token distribution */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">
                  Phân phối xác suất cho token đầu tiên
                </p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Tại mỗi bước, decoder cho ra một xác suất trên toàn bộ từ vựng
                tiếng Việt. Dưới đây là top-4 ứng viên cho token mở đầu.
              </p>
              <div className="space-y-2">
                {pair.firstTokenDistribution.map((t) => {
                  const barColor = t.isCorrect ? "#10b981" : "#94a3b8";
                  const isMax = Math.max(
                    ...pair.firstTokenDistribution.map((x) => x.prob),
                  );
                  const isTop = t.prob === isMax;
                  return (
                    <div
                      key={t.token}
                      className={`rounded-lg border p-2.5 flex items-center gap-3 ${
                        t.isCorrect
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10"
                          : "border-border bg-surface/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 w-24 shrink-0">
                        {t.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted" />
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {t.token}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-surface relative overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: barColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${t.prob * 100}%` }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-1 leading-tight italic">
                          {t.note}
                        </p>
                      </div>
                      <div className="w-16 text-right">
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: t.isCorrect ? "#10b981" : "#6b7280" }}
                        >
                          {(t.prob * 100).toFixed(0)}%
                        </span>
                        {isTop && !t.isCorrect && (
                          <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold">
                            đang chọn
                          </p>
                        )}
                        {isTop && t.isCorrect && (
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            đang chọn
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loss bar */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{
                backgroundColor: band.bg,
                borderColor: band.color + "55",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" style={{ color: band.color }} />
                  <p className="text-sm font-semibold text-foreground">
                    Loss cho cặp câu này:{" "}
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: band.color }}
                    >
                      {pair.loss.toFixed(2)}
                    </span>
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: band.color + "22",
                    color: band.color,
                  }}
                >
                  {band.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-card overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: band.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pair.loss * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {pair.lossNote}
              </p>
            </div>

            {/* Run one step */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted leading-relaxed max-w-md">
                Bấm &ldquo;Chạy một bước&rdquo; để thấy gradient chảy ngược qua
                các lớp. Mỗi lớp nhận một &ldquo;liều chỉnh sửa&rdquo; khác
                nhau — lớp gần đầu ra nhận mạnh hơn.
              </p>
              <div className="flex items-center gap-2">
                {phase === "idle" && (
                  <button
                    type="button"
                    onClick={runOneStep}
                    className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Play className="h-4 w-4" />
                    Chạy một bước backprop
                  </button>
                )}
                {phase !== "idle" && (
                  <button
                    type="button"
                    onClick={resetRun}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Chạy lại
                  </button>
                )}
              </div>
            </div>

            {/* Backprop layer animation */}
            <AnimatePresence>
              {phase !== "idle" && (
                <motion.div
                  key="backprop-anim"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <BackpropLayerAnimation
                    pair={pair}
                    phase={phase}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </li>

        {/* ══════════════════════════════════════════════════════
           DEEPEN — StepReveal one training example
           ══════════════════════════════════════════════════════ */}
        <li className="mt-8">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Bên trong một bước huấn luyện — bốn pha không bao giờ đổi
                </h3>
                <p className="text-xs text-muted">
                  Bấm &ldquo;Tiếp tục&rdquo; để theo dõi cặp câu &ldquo;I love
                  you&rdquo; đi hết vòng lặp.
                </p>
              </div>
            </div>

            <StepReveal
              labels={[
                "1 · Forward — sinh bản dịch tạm",
                "2 · Loss — đo sai lệch",
                "3 · Backward — gradient chảy ngược",
                "4 · Update — trọng số nhích",
              ]}
            >
              <TrainingStepCard
                kind="forward"
                title="Forward — encoder nén, decoder sinh"
                description="Câu 'I love you' được tách thành ba wordpiece. 8 lớp LSTM encoder đọc lần lượt, tạo ra ba vector ngữ cảnh. 8 lớp LSTM decoder bắt đầu sinh token tiếng Việt: đầu tiên là 'Tôi' (xác suất 0.72 — đúng), sau đó là 'yêu' (đúng), rồi 'em' (xác suất 0.51 — SAI, nên là 'bạn')."
              />
              <TrainingStepCard
                kind="loss"
                title="Loss — cross-entropy đo sai lệch"
                description="So chuỗi dự đoán 'Tôi yêu em' với đáp án 'Tôi yêu bạn'. Cross-entropy phạt mạnh khi mô hình TỰ TIN SAI. Token thứ ba sai → loss cho token này cao, hai token đầu đúng → loss gần 0. Loss tổng của câu = 0.34."
              />
              <TrainingStepCard
                kind="backward"
                title="Backward — chain rule đi ngược 16 lớp"
                description="Gradient bắt đầu từ loss. Softmax head nhận chỉnh sửa MẠNH NHẤT (0.81) — phải đẩy 'bạn' lên, 'em' xuống. Qua decoder (từ lớp cao xuống thấp), rồi attention, rồi encoder. Mỗi lớp nhân với đạo hàm cục bộ của mình — đó là chain rule."
              />
              <TrainingStepCard
                kind="update"
                title="Update — trọng số nhích một chút"
                description="Mỗi trọng số w nhích theo công thức: w mới = w cũ − (tốc độ học × gradient). Với GNMT, tốc độ học ban đầu 1e-4, giảm dần theo thời gian. Sau bước này, nếu cho câu 'I love you' vào lại, xác suất 'bạn' sẽ cao hơn một chút so với 'em'. Một chút thôi — nhưng nhân với 36 triệu cặp câu = mô hình biết dịch."
              />
            </StepReveal>
          </div>
        </li>

        {/* ══════════════════════════════════════════════════════
           CHALLENGE — mini-batch of 32 sentence pairs
           ══════════════════════════════════════════════════════ */}
        <li className="mt-8">
          <InlineChallenge
            question="Google huấn luyện GNMT không dùng từng cặp câu một, mà gộp 32 cặp thành MỘT mini-batch rồi backprop trung bình gradient. Lợi ích chính của cách này là gì?"
            options={[
              "Giảm số lần forward pass xuống 32 lần ít hơn — tiết kiệm bộ nhớ GPU",
              "Trung bình gradient khử đi nhiễu của từng câu riêng lẻ — hướng cập nhật ổn định hơn, đồng thời khai thác được song song trên GPU",
              "Mô hình học nhanh hơn 32 lần vì mỗi bước là một batch thay vì một câu",
              "Mini-batch cho phép chain rule bỏ qua các lớp không quan trọng",
            ]}
            correct={1}
            explanation="Gradient từ MỘT cặp câu luôn nhiễu — ví dụ một cặp ngắn chỉ có 3 từ sẽ kéo toàn bộ weights theo chiều hướng của riêng 3 từ đó, nhưng chưa chắc đúng với 36 triệu cặp còn lại. Trung bình gradient của 32 cặp khử bớt nhiễu, cho ra HƯỚNG GẦN VỚI GRADIENT THẬT của toàn bộ tập dữ liệu. Thêm vào đó, GPU có thể xử lý 32 cặp song song — gần như không tốn thời gian thêm. Đây cũng là lý do batch size là một siêu tham số cực kỳ quan trọng: quá nhỏ → gradient nhiễu, quá to → ít bước cập nhật trong một epoch và dễ bị cực tiểu phẳng."
          />
        </li>

        {/* ══════════════════════════════════════════════════════
           GRADIENT DEPTH — one more visual: how corrections
           distribute across layers
           ══════════════════════════════════════════════════════ */}
        <li className="mt-8">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Gradient không phân phối đều — lớp nào nhận nhiều chỉnh sửa nhất?
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Cùng cặp câu bạn đang xem, các lớp khác nhau nhận các mức &ldquo;liều
              chỉnh&rdquo; khác nhau. Lớp gần output (nơi loss phát sinh) thường
              nhận gradient lớn, lớp gần input thường nhận gradient nhỏ — đó là
              lý do mạng sâu không kết nối tắt dễ bị &ldquo;biến mất
              gradient&rdquo; ở lớp thấp.
            </p>
            <GradientMagnitudeChart pair={pair} />
          </div>
        </li>

        {/* ══════════════════════════════════════════════════════
           SUMMARY + REDIRECT
           ══════════════════════════════════════════════════════ */}
        <li className="mt-8">
          <MiniSummary
            title="Bốn điều cần nhớ về backprop trong dịch máy"
            points={[
              "Mỗi cặp câu Anh-Việt là một bài học: forward sinh dự đoán → loss đo sai → backward trôi ngược → update nhích weights.",
              "Gradient của lớp gần output thường lớn; lớp gần input nhỏ. Kết nối tắt giữ gradient không bị triệt tiêu khi qua 16 lớp.",
              "Mini-batch 32 cặp câu khử nhiễu gradient, tận dụng GPU song song — cân bằng giữa ổn định và tốc độ.",
              "Không có backprop, không có Google Translate như hôm nay: 36 triệu cặp câu × hàng trăm triệu trọng số không thể chỉnh tay.",
            ]}
          />
          <div className="mt-4">
            <Callout variant="insight" title="Trở lại lý thuyết">
              Muốn hiểu tại sao chain rule lại tính được gradient cho hàng triệu
              trọng số trong một lần duyệt ngược, quay về bài{" "}
              <TopicLink slug="backpropagation">Lan truyền ngược</TopicLink>.
            </Callout>
          </div>
        </li>
      </ApplicationMechanism>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="Giảm 60% lỗi dịch so với dịch thống kê (đánh giá bởi con người)"
          sourceRef={1}
        />
        <Metric
          value="26,30 BLEU trên WMT'14 Anh→Đức và 41,16 BLEU trên Anh→Pháp"
          sourceRef={1}
        />
        <Metric
          value="Mô hình lai Transformer-RNN (2020) cải thiện +5 BLEU trung bình trên hơn 100 ngôn ngữ"
          sourceRef={3}
        />
        <Metric
          value="Huấn luyện trên 96 GPU NVIDIA K80 trong khoảng 6 ngày, gradient được cắt ngưỡng 5,0"
          sourceRef={1}
        />
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Lan truyền ngược"
        topicSlug={metadata.slug}
      >
        <p>
          Nếu không có lan truyền ngược, không có cách nào tính gradient qua 16
          lớp LSTM với hàng trăm triệu trọng số. Google sẽ phải tiếp tục dùng
          dịch thống kê, với lỗi dịch cao hơn 60% và bản dịch đứt gãy giữa câu.
        </p>
        <p>
          Hơn <strong>500 triệu người dùng</strong> Google Translate mỗi ngày sẽ
          nhận bản dịch kém hơn đáng kể. Học sinh làm bài tập, khách du lịch
          đọc thực đơn, bác sĩ đọc hồ sơ bệnh nhân nước ngoài — tất cả đều nhận
          một trải nghiệm tệ hơn rất nhiều.
        </p>
        <p className="mt-3">
          <strong>Bài học rút ra:</strong> sức mạnh của backprop không nằm ở
          một cặp câu đơn lẻ. Mỗi lần lan truyền ngược chỉ chỉnh weights một
          chút xíu. Nhưng lặp lại hàng tỉ lần trên 36 triệu cặp câu, mô hình
          học được cấu trúc ngữ pháp, kính ngữ, cách dịch thành ngữ, và cả
          sắc thái văn hóa. Đó là phép màu của thuật toán: đơn giản mỗi bước,
          kỳ diệu khi nhân lên.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT — Backprop layer animation
   Shows 16 layers and gradient chevrons flowing right → left
   as phase changes.
   ──────────────────────────────────────────────────────────── */

function BackpropLayerAnimation({
  pair,
  phase,
}: {
  pair: TranslationPair;
  phase: "idle" | "forward" | "loss" | "backward" | "update";
}) {
  const forwardActive = phase === "forward";
  const lossActive = phase === "loss";
  const backwardActive = phase === "backward";
  const updateActive = phase === "update";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-foreground">
          {forwardActive && "Pha 1 · Forward — dữ liệu chảy xuôi"}
          {lossActive && "Pha 2 · Loss — đo sai lệch ở cuối chuỗi"}
          {backwardActive && "Pha 3 · Backward — gradient chảy ngược"}
          {updateActive && "Pha 4 · Update — weights nhích một chút"}
        </p>
        <div className="flex items-center gap-1">
          {(["forward", "loss", "backward", "update"] as const).map((p) => {
            const isActive = phase === p;
            const isPast =
              (phase === "loss" && p === "forward") ||
              (phase === "backward" && (p === "forward" || p === "loss")) ||
              (phase === "update" &&
                (p === "forward" || p === "loss" || p === "backward"));
            return (
              <div
                key={p}
                className="h-1.5 w-6 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? "var(--accent)"
                    : isPast
                      ? "var(--accent)"
                      : "var(--border)",
                  opacity: isActive ? 1 : isPast ? 0.5 : 1,
                }}
              />
            );
          })}
        </div>
      </div>

      <svg viewBox="0 0 680 220" className="w-full" role="img" aria-label="Mạng 16 lớp với gradient chảy ngược">
        <title>
          Encoder 8 lớp (trái) và decoder 8 lớp (phải). Mũi tên xanh = forward,
          mũi tên cam = backward, dấu tick xanh lá = update.
        </title>

        {/* Input label */}
        <text x={20} y={20} fontSize={11} fill="var(--text-secondary)">
          Input EN
        </text>
        <text x={340} y={20} fontSize={11} fill="var(--text-secondary)">
          Sinh token VI
        </text>
        <text x={580} y={20} fontSize={11} fill="var(--text-secondary)" textAnchor="end">
          Loss
        </text>

        {/* 16 layers: 8 encoder (blue) + 8 decoder (purple) */}
        {Array.from({ length: 16 }, (_, i) => {
          const isEncoder = i < 8;
          const cx = 40 + i * 38;
          const isForwardActive = forwardActive;
          const backwardIndex = 15 - i;
          const isBackwardHighlighted =
            backwardActive && backwardIndex <= Math.floor((Date.now() / 180) % 16);
          const baseColor = isEncoder ? "#3b82f6" : "#8b5cf6";
          return (
            <g key={i}>
              <rect
                x={cx - 14}
                y={70}
                width={28}
                height={60}
                rx={5}
                fill={baseColor}
                opacity={
                  isForwardActive ? 0.18 + (i / 16) * 0.4 : updateActive ? 0.4 : 0.22
                }
                stroke={baseColor}
                strokeWidth={1.3}
              />
              <text
                x={cx}
                y={100}
                textAnchor="middle"
                fontSize={8}
                fill={isEncoder ? "#1e3a8a" : "#4c1d95"}
                fontFamily="monospace"
                fontWeight={600}
              >
                {isEncoder ? `E${i + 1}` : `D${i - 7}`}
              </text>
            </g>
          );
        })}

        {/* Forward arrows */}
        {forwardActive &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={`fwd-${i}`}
              cy={100}
              r={4}
              fill="#3b82f6"
              initial={{ cx: 30 }}
              animate={{ cx: 640 }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Infinity,
                delay: i * 0.35,
              }}
            />
          ))}

        {/* Loss marker */}
        {(lossActive || backwardActive || updateActive) && (
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <rect
              x={612}
              y={75}
              width={50}
              height={50}
              rx={8}
              fill="#ef4444"
              opacity={0.2}
              stroke="#ef4444"
              strokeWidth={1.5}
            />
            <text
              x={637}
              y={98}
              textAnchor="middle"
              fontSize={10}
              fill="#b91c1c"
              fontWeight={700}
            >
              L
            </text>
            <text
              x={637}
              y={114}
              textAnchor="middle"
              fontSize={9}
              fill="#b91c1c"
              fontFamily="monospace"
            >
              {pair.loss.toFixed(2)}
            </text>
          </motion.g>
        )}

        {/* Backward gradient arrows */}
        {backwardActive &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.g key={`bwd-${i}`}>
              <motion.circle
                cy={145}
                r={4}
                fill="#f59e0b"
                initial={{ cx: 630 }}
                animate={{ cx: 20 }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            </motion.g>
          ))}

        {backwardActive && (
          <>
            <text
              x={20}
              y={160}
              fontSize={10}
              fill="#f59e0b"
              fontWeight={600}
            >
              ∂L/∂w
            </text>
            <text
              x={340}
              y={178}
              textAnchor="middle"
              fontSize={10}
              fill="#f59e0b"
              fontStyle="italic"
            >
              chain rule: mỗi lớp nhân đạo hàm cục bộ vào gradient truyền ngược
            </text>
          </>
        )}

        {/* Update tick markers */}
        {updateActive &&
          Array.from({ length: 16 }, (_, i) => {
            const cx = 40 + i * 38;
            const magnitude =
              i < 8
                ? pair.gradientLayers[Math.min(i / 2, 2) | 0]?.correction ?? 0.2
                : pair.gradientLayers[
                    Math.min(3 + (i - 8) / 2, 6) | 0
                  ]?.correction ?? 0.5;
            const dotSize = 2 + magnitude * 6;
            return (
              <motion.circle
                key={`upd-${i}`}
                cx={cx}
                cy={60}
                r={dotSize}
                fill="#22c55e"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              />
            );
          })}

        {updateActive && (
          <text
            x={340}
            y={50}
            textAnchor="middle"
            fontSize={10}
            fill="#16a34a"
            fontStyle="italic"
            fontWeight={600}
          >
            w ← w − η · ∂L/∂w   (đốm càng to = chỉnh càng mạnh)
          </text>
        )}

        {/* Axis labels */}
        <text
          x={170}
          y={200}
          textAnchor="middle"
          fontSize={10}
          fill="#1e3a8a"
          fontWeight={600}
        >
          ← 8 lớp Encoder (mã hóa câu nguồn)
        </text>
        <text
          x={510}
          y={200}
          textAnchor="middle"
          fontSize={10}
          fill="#4c1d95"
          fontWeight={600}
        >
          8 lớp Decoder (sinh câu đích) →
        </text>
      </svg>

      {/* Phase captions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="rounded-lg bg-surface/60 border border-border p-3 text-xs text-foreground/85 leading-relaxed flex items-start gap-2"
        >
          {forwardActive && (
            <>
              <ArrowRight className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
              <span>
                Câu <strong>&ldquo;{pair.source}&rdquo;</strong> đi qua 8 lớp
                encoder thành chuỗi vector ngữ nghĩa, rồi 8 lớp decoder sinh
                từng token tiếng Việt. Kết quả tạm:{" "}
                <strong>&ldquo;{pair.predicted}&rdquo;</strong>.
              </span>
            </>
          )}
          {lossActive && (
            <>
              <Gauge className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                So với đáp án <strong>&ldquo;{pair.target}&rdquo;</strong> bằng
                cross-entropy. Loss = <strong>{pair.loss.toFixed(2)}</strong> —
                con số này trở thành điểm xuất phát cho backward pass.
              </span>
            </>
          )}
          {backwardActive && (
            <>
              <ArrowLeft className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Chain rule đi ngược từ loss qua softmax head, decoder, attention,
                encoder. Mỗi lớp biết đạo hàm cục bộ của mình và nhân nó với
                gradient truyền từ lớp sau — kết quả: một con số ∂L/∂w cho mỗi
                trọng số.
              </span>
            </>
          )}
          {updateActive && (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Mỗi trọng số nhích một chút: w ← w − η·∂L/∂w. Với cặp câu này,
                lớp gần output (softmax + decoder cao) nhận chỉnh mạnh nhất
                (đốm to). Lớp thấp của encoder chỉ chỉnh nhẹ.
              </span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT — Gradient magnitude bar chart across layers
   ──────────────────────────────────────────────────────────── */

function GradientMagnitudeChart({ pair }: { pair: TranslationPair }) {
  const maxCorrection = Math.max(
    ...pair.gradientLayers.map((l) => l.correction),
  );

  return (
    <div className="space-y-2">
      {pair.gradientLayers.map((layer, i) => {
        const percent = (layer.correction / maxCorrection) * 100;
        const color =
          i < 2 ? "#3b82f6" : i < 4 ? "#8b5cf6" : i < 6 ? "#ec4899" : "#f97316";
        return (
          <div
            key={layer.name}
            className="rounded-lg border border-border bg-surface/40 p-2.5 flex items-center gap-3"
          >
            <div className="w-36 shrink-0">
              <p className="text-xs font-semibold text-foreground">
                {layer.name}
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-surface overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full flex items-center justify-end pr-1.5"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                >
                  {percent > 30 && (
                    <span className="text-[9px] font-bold text-white tabular-nums">
                      {layer.correction.toFixed(2)}
                    </span>
                  )}
                </motion.div>
              </div>
              <p className="text-[10px] text-muted mt-0.5 leading-tight italic">
                {layer.note}
              </p>
            </div>
            <div className="w-16 text-right">
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color }}
              >
                {layer.correction.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted italic leading-relaxed pt-1">
        Mẫu hình chung: <strong>softmax head &gt; decoder cao &gt; attention &gt; decoder thấp &gt; encoder cao &gt; encoder thấp &gt; embedding</strong>
        . Lớp gần đầu ra gần loss hơn → gradient ít bị nhân với nhiều đạo hàm
        cục bộ → ít bị suy giảm.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT — Training step card (rendered inside StepReveal)
   ──────────────────────────────────────────────────────────── */

function TrainingStepCard({
  kind,
  title,
  description,
}: {
  kind: "forward" | "loss" | "backward" | "update";
  title: string;
  description: string;
}) {
  const iconFor = {
    forward: <ArrowRight className="h-4 w-4 text-sky-500" />,
    loss: <Gauge className="h-4 w-4 text-amber-500" />,
    backward: <ArrowLeft className="h-4 w-4 text-violet-500" />,
    update: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  }[kind];

  const accentColor = {
    forward: "#3b82f6",
    loss: "#f59e0b",
    backward: "#8b5cf6",
    update: "#22c55e",
  }[kind];

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {iconFor}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">
        {description}
      </p>

      {/* Mini flow diagram */}
      <div className="rounded-lg bg-card border border-border p-3">
        <svg viewBox="0 0 440 70" className="w-full" role="img" aria-label={`Bước ${kind}`}>
          <title>Bước {kind} — minh họa dòng chảy dữ liệu.</title>

          <rect
            x={20}
            y={22}
            width={70}
            height={26}
            rx={5}
            fill={accentColor + "22"}
            stroke={accentColor}
          />
          <text
            x={55}
            y={40}
            textAnchor="middle"
            fontSize={10}
            fill={accentColor}
            fontWeight={700}
          >
            {kind === "forward" && "I love you"}
            {kind === "loss" && "Tôi yêu em"}
            {kind === "backward" && "Loss = 0.34"}
            {kind === "update" && "∂L/∂w"}
          </text>

          <rect
            x={350}
            y={22}
            width={70}
            height={26}
            rx={5}
            fill={accentColor + "33"}
            stroke={accentColor}
          />
          <text
            x={385}
            y={40}
            textAnchor="middle"
            fontSize={10}
            fill={accentColor}
            fontWeight={700}
          >
            {kind === "forward" && "Tôi yêu em"}
            {kind === "loss" && "L = 0.34"}
            {kind === "backward" && "∂L/∂w ∀ w"}
            {kind === "update" && "w_new"}
          </text>

          {/* Moving dots in correct direction */}
          {[0, 1, 2].map((i) => {
            const goBackward = kind === "backward";
            return (
              <motion.circle
                key={i}
                cy={35}
                r={4}
                fill={accentColor}
                initial={{ cx: goBackward ? 350 : 90 }}
                animate={{ cx: goBackward ? 90 : 350 }}
                transition={{
                  duration: 1.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            );
          })}

          <text
            x={220}
            y={16}
            textAnchor="middle"
            fontSize={9}
            fill="var(--text-tertiary)"
            fontStyle="italic"
          >
            {kind === "forward" && "qua 8 encoder + 8 decoder LSTM"}
            {kind === "loss" && "cross-entropy trên mỗi token"}
            {kind === "backward" && "chain rule ngược qua 16 lớp"}
            {kind === "update" && "w − η · gradient, η ≈ 1e-4"}
          </text>
        </svg>
      </div>
    </div>
  );
}
