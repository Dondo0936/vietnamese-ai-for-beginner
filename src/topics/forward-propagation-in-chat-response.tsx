"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Keyboard, Scissors, Boxes, Layers, BarChart3, Dice5,
  Clock, Cpu, Sparkles, AlertTriangle, MessageSquare,
  ArrowRight, RotateCcw, Play,
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
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "forward-propagation-in-chat-response",
  title: "Forward Propagation in Chat Response",
  titleVi: "Lan truyền thuận trong trợ lý chat",
  description:
    "Bạn gõ một câu, 20 mili-giây sau ChatGPT đáp. Mở từng giai đoạn của lượt lan truyền thuận để thấy điều gì xảy ra trong khoảnh khắc đó.",
  category: "neural-fundamentals",
  tags: ["forward-propagation", "inference", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["forward-propagation"],
  vizType: "interactive",
  applicationOf: "forward-propagation",
  featuredApp: {
    name: "ChatGPT",
    productFeature: "Token Generation",
    company: "OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "ChatGPT's Technical Foundations: Transformers to RLHF",
      publisher: "IntuitionLabs",
      url: "https://intuitionlabs.ai/articles/key-innovations-behind-chatgpt",
      date: "2023-06", kind: "engineering-blog",
    },
    {
      title: "All About Transformer Inference: How to Scale Your Model",
      publisher: "JAX ML — The Scaling Book",
      url: "https://jax-ml.github.io/scaling-book/inference/",
      date: "2024-01", kind: "documentation",
    },
    {
      title: "Attention Is All You Need",
      publisher: "Vaswani et al., NeurIPS 2017",
      url: "https://arxiv.org/abs/1706.03762",
      date: "2017-06", kind: "paper",
    },
    {
      title: "The Full GPT Architecture: Understanding the End-to-End Forward Pass",
      publisher: "Shreyash Mogaveera (Medium)",
      url: "https://medium.com/@shreyashmogaveera/the-full-gpt-architecture-understanding-the-end-to-end-forward-pass-538acfb6238d",
      date: "2024-03", kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: năm giai đoạn của một lượt lan truyền thuận
   ──────────────────────────────────────────────────────────── */

type StageId = "input" | "tokenize" | "embed" | "transformer" | "softmax" | "sample";

interface Stage {
  id: StageId;
  label: string;
  subLabel: string;
  tagline: string;
  icon: typeof Keyboard;
  color: string;
  description: string;
  miniViz: "input" | "tokenize" | "embed" | "transformer" | "softmax" | "sample";
}

const STAGES: Stage[] = [
  {
    id: "input", label: "Bạn gõ câu hỏi", subLabel: "Input",
    tagline: "Chuỗi ký tự còn thô", icon: Keyboard, color: "#0ea5e9",
    description:
      "Câu hỏi của bạn lúc này vẫn là dãy ký tự — chưa phải con số. Trước khi mô hình đọc được, cần chuyển nó sang thứ mạng nơ-ron hiểu: các con số.",
    miniViz: "input",
  },
  {
    id: "tokenize", label: "Tách thành token", subLabel: "Tokenize",
    tagline: "Cắt câu thành mảnh nhỏ", icon: Scissors, color: "#6366f1",
    description:
      "Câu bị cắt thành các mảnh gọi là token — có thể là một từ, một nửa từ, hoặc vài ký tự. Mỗi token được gán một mã số duy nhất trong từ điển của mô hình.",
    miniViz: "tokenize",
  },
  {
    id: "embed", label: "Nhúng thành vector", subLabel: "Embed",
    tagline: "Gắn ý nghĩa vào toạ độ", icon: Boxes, color: "#8b5cf6",
    description:
      "Mỗi mã số token được thay bằng một mảng hàng ngàn con số gọi là embedding. Các token có ý nghĩa tương tự nhau sẽ nằm gần nhau trong không gian này.",
    miniViz: "embed",
  },
  {
    id: "transformer", label: "Đi qua các tầng Transformer", subLabel: "Transformer layers",
    tagline: "Trộn ngữ cảnh, nhiều lần", icon: Layers, color: "#ec4899",
    description:
      "Chồng mấy chục tới hàng trăm tầng Transformer lần lượt trộn thông tin giữa các token qua cơ chế chú ý. Sau mỗi tầng, vector của mỗi token ngày càng biết rõ vị trí của mình trong câu.",
    miniViz: "transformer",
  },
  {
    id: "softmax", label: "Dựng phân phối xác suất", subLabel: "Softmax",
    tagline: "Chấm điểm mọi token có thể", icon: BarChart3, color: "#f59e0b",
    description:
      "Tầng cuối biến vector ra thành một danh sách điểm số — mỗi token trong từ điển một điểm. Softmax nén chúng lại thành xác suất: tổng 100%, token nào hợp ngữ cảnh hơn sẽ có điểm cao hơn.",
    miniViz: "softmax",
  },
  {
    id: "sample", label: "Bốc thăm token tiếp theo", subLabel: "Sampling",
    tagline: "Chọn một token để gõ ra", icon: Dice5, color: "#10b981",
    description:
      "Hệ thống bốc thăm một token dựa trên các xác suất vừa tính. Token được gõ ra màn hình, rồi chu trình quay lại đầu: gắn vào đầu vào, chạy lần nữa cho token kế tiếp.",
    miniViz: "sample",
  },
];

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: một lượt sinh token cụ thể, cho phần DEEPEN
   ──────────────────────────────────────────────────────────── */

interface TokenSlot {
  text: string;
  id: number;
}

const DEMO_PROMPT_TOKENS: TokenSlot[] = [
  { text: "Chào", id: 7342 }, { text: " bạn", id: 1184 },
  { text: ",", id: 11 }, { text: " hôm", id: 3098 },
  { text: " nay", id: 652 }, { text: " thời", id: 4417 },
  { text: " tiết", id: 5086 },
];

interface CandidateToken {
  text: string;
  logit: number;
}

const CANDIDATE_TOKENS: CandidateToken[] = [
  { text: " thế", logit: 6.8 },
  { text: " ra", logit: 6.2 },
  { text: " như", logit: 5.1 },
  { text: " sao", logit: 4.6 },
  { text: " đẹp", logit: 3.9 },
  { text: " mưa", logit: 3.2 },
  { text: " bánh", logit: 0.4 },
  { text: " xe", logit: 0.1 },
];

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ: card một giai đoạn trong pipeline
   ──────────────────────────────────────────────────────────── */

function StageCard({
  stage, index, isActive, onClick,
}: {
  stage: Stage; index: number; isActive: boolean; onClick: () => void;
}) {
  const Icon = stage.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
        isActive ? "border-transparent text-white shadow-md" : "border-border bg-card hover:bg-surface"
      }`}
      style={{ backgroundColor: isActive ? stage.color : undefined }}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white/25 text-white" : "bg-surface text-muted"}`}>
          {index + 1}
        </span>
        <Icon size={14} className={isActive ? "text-white" : "text-muted"} />
      </div>
      <div>
        <p className={`text-xs font-semibold leading-tight ${isActive ? "text-white" : "text-foreground"}`}>
          {stage.label}
        </p>
        <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-muted"}`}>
          {stage.tagline}
        </p>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: input (dãy ký tự)
   ──────────────────────────────────────────────────────────── */

function MiniVizInput() {
  const phrase = "Chào bạn, hôm nay thời tiết";
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Bạn gõ một chuỗi ký tự vào ô chat
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap gap-[2px] font-mono text-sm text-foreground">
          {phrase.split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="inline-block rounded bg-card border border-border px-[3px] py-[1px]"
            >
              {ch === " " ? "␣" : ch}
            </motion.span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Mô hình không hiểu chữ cái. Nó chỉ biết các con số. Giai đoạn kế tiếp sẽ chuyển
        chuỗi này thành các mã số mà mô hình có trong từ điển của mình.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: tokenize
   ──────────────────────────────────────────────────────────── */

function MiniVizTokenize() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Chuỗi ký tự được cắt thành token, mỗi token có một mã số
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {DEMO_PROMPT_TOKENS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="flex flex-col items-center"
            >
              <span className="rounded-md border border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30 px-2.5 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300 whitespace-pre">
                {t.text}
              </span>
              <span className="mt-1 text-[10px] font-mono text-tertiary tabular-nums">#{t.id}</span>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Thuật toán BPE (Byte Pair Encoding) chọn cách cắt sao cho các cụm hay gặp như{" "}
          <strong>&ldquo; bạn&rdquo;</strong> hay <strong>&ldquo; tiết&rdquo;</strong>{" "}
          đều là một token duy nhất. Một tiếng trong tiếng Việt có dấu thường tốn một
          token, dấu câu là một token riêng.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: embed (ma trận hàng ngàn cột thu gọn)
   ──────────────────────────────────────────────────────────── */

function MiniVizEmbed() {
  const rows = DEMO_PROMPT_TOKENS.slice(0, 4);
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Mỗi token trở thành một dãy vài nghìn con số (embedding)
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <div className="space-y-1">
          {rows.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.07 }}
              className="flex items-center gap-2"
            >
              <span className="w-16 rounded-md border border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300 text-center whitespace-pre">
                {t.text.trim() || t.text}
              </span>
              <ArrowRight size={12} className="shrink-0 text-muted" />
              <div className="flex gap-[2px]">
                {Array.from({ length: 14 }).map((__, j) => {
                  const raw = Math.sin((t.id + j * 13.1) * 0.7) * 0.5 + 0.5;
                  const hue = Math.round(260 + raw * 80);
                  return (
                    <div
                      key={j}
                      className="w-[6px] rounded-sm"
                      style={{
                        height: `${6 + raw * 18}px`,
                        backgroundColor: `hsl(${hue}, 70%, 55%)`,
                      }}
                    />
                  );
                })}
                <span className="text-[10px] text-tertiary ml-1 self-end">
                  ... × 4.096
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Mỗi thanh là một chiều. Vector thật có khoảng{" "}
          <strong>4.096 chiều</strong> — quá dài để vẽ hết. Ý nghĩa của token được rải
          khắp cả nghìn con số, không chiều nào mang ý nghĩa riêng lẻ.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: transformer layers (attention heatmap gợi ý)
   ──────────────────────────────────────────────────────────── */

function MiniVizTransformer() {
  const size = 6;
  const attention = useMemo(() => {
    const grid: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        if (j > i) {
          row.push(0);
        } else {
          const base = Math.exp(-(i - j) * 0.6);
          const noise = Math.abs(Math.sin((i + 1) * 7.1 + (j + 1) * 3.3));
          row.push(base * (0.6 + noise * 0.4));
        }
      }
      const sum = row.reduce((a, b) => a + b, 0) || 1;
      grid.push(row.map((v) => v / sum));
    }
    return grid;
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Mỗi tầng trộn thông tin giữa các token bằng cơ chế chú ý
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <div className="flex gap-2 items-start">
          <div className="grow max-w-[260px]">
            <p className="text-[11px] font-semibold text-foreground mb-1">
              Bản đồ chú ý của tầng đang chọn
            </p>
            <div
              className="grid gap-[2px] rounded-lg border border-border bg-card p-2"
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {attention.map((row, i) =>
                row.map((value, j) => {
                  const opacity = value === 0 ? 0.05 : 0.15 + value * 2;
                  return (
                    <motion.div
                      key={`a-${i}-${j}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: Math.min(opacity, 1) }}
                      transition={{ duration: 0.3, delay: (i * size + j) * 0.015 }}
                      className="aspect-square rounded-sm"
                      style={{
                        backgroundColor: "#ec4899",
                      }}
                    />
                  );
                }),
              )}
            </div>
            <div className="flex justify-between text-[9px] text-tertiary mt-1">
              <span>→ Token đang xử lý</span>
              <span>↓ Token được nhìn</span>
            </div>
          </div>

          <div className="grow space-y-1">
            <p className="text-[11px] font-semibold text-foreground mb-1">
              Chồng tầng
            </p>
            {Array.from({ length: 8 }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.05 }}
                className="h-[10px] rounded-sm"
                style={{
                  backgroundColor: "#ec4899",
                  opacity: 0.18 + idx * 0.08,
                  width: `${60 + (idx % 3) * 10}%`,
                }}
              />
            ))}
            <p className="text-[10px] text-tertiary pt-1">
              GPT-4 dùng khoảng 96 tầng kiểu này, chồng lên nhau. Mỗi tầng trộn lại một
              lần nữa.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Ô càng hồng đậm nghĩa là token hàng đó đang &ldquo;nhìn&rdquo; token cột đó
          nhiều. Nửa trên-phải luôn mờ vì token không được phép xem tương lai (đặc điểm
          cơ bản của mô hình sinh văn bản).
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: softmax (logits → xác suất)
   ──────────────────────────────────────────────────────────── */

function MiniVizSoftmax() {
  const logits = CANDIDATE_TOKENS.map((c) => c.logit);
  const probs = softmax(logits);

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Logit của 8 token hàng đầu được bóp thành xác suất
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="space-y-1.5">
          {CANDIDATE_TOKENS.map((c, i) => {
            const prob = probs[i];
            const width = prob * 100;
            return (
              <motion.div
                key={c.text}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center gap-2"
              >
                <span className="w-16 shrink-0 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 text-xs font-mono text-amber-700 dark:text-amber-300 text-center whitespace-pre py-0.5">
                  {c.text}
                </span>
                <div className="grow relative h-4 bg-card rounded-md border border-border overflow-hidden">
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    style={{ backgroundColor: "#f59e0b", opacity: 0.3 + prob * 1.5 }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-[11px] font-mono text-foreground tabular-nums">
                  {(prob * 100).toFixed(1)}%
                </span>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-muted leading-relaxed mt-3">
          Trong từ điển GPT-4 có khoảng 100.000 token; đây chỉ là 8 token đầu bảng. Phần
          còn lại có xác suất gần 0 và gần như không bao giờ được chọn.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI VIZ: sampling
   ──────────────────────────────────────────────────────────── */

function MiniVizSample() {
  const [runs, setRuns] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);
  const reduceMotion = useReducedMotion();
  const probs = useMemo(() => softmax(CANDIDATE_TOKENS.map((c) => c.logit)), []);

  function roll() {
    if (rolling) return;
    setRolling(true);
    const r = Math.random();
    let acc = 0;
    let next = CANDIDATE_TOKENS[CANDIDATE_TOKENS.length - 1].text;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) { next = CANDIDATE_TOKENS[i].text; break; }
    }
    setTimeout(() => {
      setRuns((prev) => [...prev, next].slice(-6));
      setRolling(false);
    }, reduceMotion ? 0 : 350);
  }

  const counts: Record<string, number> = {};
  runs.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
        Mô hình bốc thăm một token theo phân phối xác suất
      </p>
      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button" onClick={roll} disabled={rolling}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Dice5 size={14} />
            Bốc một token
          </button>
          <button
            type="button" onClick={() => setRuns([])}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={12} />
            Xoá
          </button>
          <span className="text-xs text-tertiary">{runs.length}/6 lần bốc gần nhất</span>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[36px]">
          <AnimatePresence mode="popLayout">
            {runs.map((token, i) => (
              <motion.span
                key={`${token}-${i}`}
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="rounded-md border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30 px-2.5 py-1 text-sm font-mono text-emerald-700 dark:text-emerald-300 whitespace-pre"
              >
                {token}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        {runs.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <p className="text-[11px] font-semibold text-foreground">
              Thống kê 6 lần bốc gần nhất
            </p>
            {Object.entries(counts).map(([token, n]) => (
              <div key={token} className="flex items-center gap-2 text-xs">
                <span className="w-16 rounded bg-surface border border-border px-2 font-mono text-foreground text-center whitespace-pre">
                  {token}
                </span>
                <div className="grow h-2 rounded-full bg-surface overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(n / runs.length) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-muted tabular-nums">{n}/{runs.length}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted leading-relaxed">
          Bấm nhiều lần: token có xác suất cao (như <strong>&ldquo; thế&rdquo;</strong>{" "}
          hay <strong>&ldquo; ra&rdquo;</strong>) xuất hiện thường xuyên hơn, nhưng đôi
          khi mô hình &ldquo;rẽ&rdquo; sang hướng khác — đó là lý do chạy cùng một câu
          hai lần có thể cho câu trả lời khác nhau.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   STAGE PICKER: cái khung chính của REVEAL
   ──────────────────────────────────────────────────────────── */

function PipelineExplorer() {
  const [activeId, setActiveId] = useState<StageId>("tokenize");
  const activeStage = useMemo(() => STAGES.find((s) => s.id === activeId) ?? STAGES[0], [activeId]);
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage.id);

  return (
    <div className="not-prose space-y-4">
      <p className="text-xs text-muted leading-relaxed">
        Mỗi khối dưới đây là một giai đoạn của lượt lan truyền thuận. Bấm để mở mini-viz
        tương ứng.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STAGES.map((stage, i) => (
          <StageCard key={stage.id} stage={stage} index={i} isActive={stage.id === activeId} onClick={() => setActiveId(stage.id)} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rounded-xl border bg-card p-5"
          style={{ borderLeft: `4px solid ${activeStage.color}` }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: activeStage.color }}>
                Giai đoạn: {activeStage.subLabel}
              </p>
              <h3 className="text-base font-semibold text-foreground mt-0.5">
                {activeStage.label}
              </h3>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: activeStage.color + "22", color: activeStage.color }}
            >
              {activeIndex + 1}/{STAGES.length}
            </span>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed mb-4">
            {activeStage.description}
          </p>

          {activeStage.miniViz === "input" && <MiniVizInput />}
          {activeStage.miniViz === "tokenize" && <MiniVizTokenize />}
          {activeStage.miniViz === "embed" && <MiniVizEmbed />}
          {activeStage.miniViz === "transformer" && <MiniVizTransformer />}
          {activeStage.miniViz === "softmax" && <MiniVizSoftmax />}
          {activeStage.miniViz === "sample" && <MiniVizSample />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   HERO: đếm ngược 20ms + nhịp sinh token
   ──────────────────────────────────────────────────────────── */

const HERO_TOKENS = [" Thời", " tiết", " hôm", " nay", " nắng", " ráo", ",", " nhiệt", " độ", " khoảng", " 28", " độ", "."];

function LatencyHero() {
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!running) return;
    if (idx >= HERO_TOKENS.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setIdx((x) => x + 1), reduceMotion ? 0 : 220);
    return () => clearTimeout(t);
  }, [running, idx, reduceMotion]);

  function start() {
    setIdx(0);
    setRunning(true);
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-border bg-surface/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">Mô phỏng: ChatGPT đáp lại</span>
        </div>
        <button
          type="button" onClick={start} disabled={running}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Play size={12} />
          {running ? "Đang sinh..." : idx > 0 ? "Chạy lại" : "Gõ câu hỏi"}
        </button>
      </div>
      <div className="rounded-lg border border-border bg-card px-3 py-2 mb-3">
        <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wide mb-0.5">Bạn</p>
        <p className="text-sm text-foreground">Chào bạn, hôm nay thời tiết thế nào?</p>
      </div>
      <div className="flex items-center gap-2 mb-2 text-[11px] text-tertiary">
        <Clock size={12} />
        <span>
          Mỗi token mới mất khoảng <strong className="text-foreground">20 mili-giây</strong>{" "}
          — chạy qua toàn bộ mạng nơ-ron GPT-4
        </span>
      </div>
      <div className="rounded-lg border border-dashed border-accent/40 bg-accent-light/40 px-3 py-2 min-h-[52px]">
        <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wide mb-0.5">ChatGPT</p>
        <div className="flex flex-wrap gap-[2px] text-sm text-foreground font-medium">
          <AnimatePresence>
            {HERO_TOKENS.slice(0, idx).map((t, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-pre"
              >
                {t}
              </motion.span>
            ))}
          </AnimatePresence>
          {running && idx < HERO_TOKENS.length && (
            <motion.span
              aria-hidden
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="inline-block w-2 h-4 rounded-sm bg-accent/70 ml-0.5 self-center"
            />
          )}
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed mt-3">
        Mỗi từ xuất hiện là một <strong>lượt lan truyền thuận</strong> đi xuyên qua
        hàng trăm tỉ tham số. Trong 20 mili-giây đó, mô hình làm rất nhiều việc — và
        phần tiếp theo mở ra từng bước.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   BEAT 4 — KV CACHE mini animation
   ──────────────────────────────────────────────────────────── */

function KvCacheDemo() {
  const [mode, setMode] = useState<"cached" | "naive">("cached");
  const cells = Array.from({ length: 9 });
  const modeBtn = (key: "naive" | "cached", label: string, cls: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        mode === key ? cls : "border-border bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="not-prose rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Cpu size={14} className="text-accent" />
        <span className="text-xs font-semibold text-foreground">
          Bộ nhớ đệm KV: so sánh hai cách tính
        </span>
      </div>
      <div className="flex gap-2">
        {modeBtn("naive", "Không có cache (tính lại tất cả)", "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300")}
        {modeBtn("cached", "Có cache (chỉ tính token mới)", "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300")}
      </div>
      <div className="flex items-center gap-1 justify-center flex-wrap">
        {cells.map((_, i) => {
          const isNewToken = i === cells.length - 1;
          const isComputed = mode === "naive" || isNewToken;
          return (
            <motion.div
              key={i}
              animate={{ scale: isComputed ? 1.05 : 1, opacity: isComputed ? 1 : 0.55 }}
              transition={{ duration: 0.25 }}
              className={`flex h-10 w-10 items-center justify-center rounded-md border text-[10px] font-semibold ${
                isComputed
                  ? isNewToken
                    ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "border-red-400 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "border-border bg-card text-muted"
              }`}
            >
              {isNewToken ? "mới" : `#${i + 1}`}
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {mode === "naive" ? (
          <>
            <strong className="text-red-600 dark:text-red-400">Đỏ = phải tính lại</strong>.
            Không có cache, mỗi token mới buộc mô hình chạy lại cả 9 token từ đầu. Câu
            trả lời 200 từ &rArr; lặp hàng chục nghìn lần.
          </>
        ) : (
          <>
            <strong className="text-emerald-600 dark:text-emerald-400">Xanh = chỉ tính token mới</strong>
            . Các token cũ đã lưu key và value — chỉ cần tính cho token thứ 9, tiết kiệm
            hàng tỉ phép tính mỗi bước.
          </>
        )}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DEEPEN — StepReveal qua một bước sinh token
   ──────────────────────────────────────────────────────────── */

function SingleStepReveal() {
  const focusTokens = DEMO_PROMPT_TOKENS;
  return (
    <div className="not-prose">
      <StepReveal
        labels={[
          "1. Có chuỗi token hiện tại",
          "2. Embedding co lại từng vector",
          "3. Attention liếc nhìn ngữ cảnh",
          "4. Tầng cuối cho logits",
          "5. Bốc thăm token tiếp theo",
        ]}
      >
        {[
          <div key="s1" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Đầu vào của lượt forward pass này
            </p>
            <div className="flex flex-wrap gap-1.5">
              {focusTokens.map((t, i) => (
                <span key={i} className="rounded-md border border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-900/30 px-2 py-0.5 text-sm text-sky-700 dark:text-sky-300 whitespace-pre">
                  {t.text}
                </span>
              ))}
              <span className="flex items-center px-1 text-xs text-tertiary">
                + ? (cần sinh token kế tiếp)
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Mô hình nhận vào tất cả token đã có cho tới lúc này — vừa là câu hỏi của
              bạn, vừa là các token mà chính nó vừa sinh ra.
            </p>
          </div>,
          <div key="s2" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Mỗi token biến thành một vector đặc trưng
            </p>
            <div className="space-y-1">
              {focusTokens.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 rounded-md border border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/30 text-xs text-violet-700 dark:text-violet-300 text-center py-0.5 whitespace-pre">
                    {t.text}
                  </span>
                  <ArrowRight size={12} className="text-muted" />
                  <div className="flex gap-[2px]">
                    {Array.from({ length: 18 }).map((__, j) => {
                      const raw = Math.sin((t.id + j * 7.3) * 0.9) * 0.5 + 0.5;
                      return (
                        <div
                          key={j}
                          className="w-[4px] rounded-sm"
                          style={{ height: `${6 + raw * 16}px`, backgroundColor: "#8b5cf6", opacity: 0.5 + raw * 0.5 }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-tertiary italic">
                ... đọc tương tự cho các token còn lại
              </p>
            </div>
          </div>,
          <div key="s3" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Token mới &ldquo;liếc&rdquo; qua các token trước
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {focusTokens.map((t, i) => {
                const w = [0.05, 0.07, 0.04, 0.18, 0.2, 0.16, 0.3][i] ?? 0.1;
                return (
                  <div key={i} className="flex flex-col items-center" title={`Attention ${(w * 100).toFixed(0)}%`}>
                    <span
                      className="rounded-md px-2 py-0.5 text-xs text-foreground whitespace-pre"
                      style={{ backgroundColor: `rgba(236, 72, 153, ${0.15 + w * 1.8})`, borderColor: "#ec4899", borderWidth: 1 }}
                    >
                      {t.text}
                    </span>
                    <span className="text-[9px] text-tertiary mt-0.5 tabular-nums">
                      {(w * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Tầng chú ý phát hiện: để đoán từ tiếp theo,{" "}
              <strong>&ldquo; tiết&rdquo;</strong> và <strong>&ldquo; thời&rdquo;</strong>{" "}
              là hai token quan trọng nhất — chúng được &ldquo;soi&rdquo; nhiều nhất.
            </p>
          </div>,
          <div key="s4" className="rounded-xl border border-border bg-surface/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Mô hình chấm điểm mọi token có thể
            </p>
            <div className="space-y-1">
              {CANDIDATE_TOKENS.slice(0, 6).map((c) => (
                <div key={c.text} className="flex items-center gap-2 text-xs">
                  <span className="w-16 rounded bg-card border border-border text-foreground font-mono text-center whitespace-pre py-0.5">
                    {c.text}
                  </span>
                  <div className="grow h-3 rounded-full bg-surface overflow-hidden">
                    <div className="h-full" style={{ width: `${(c.logit / 8) * 100}%`, backgroundColor: "#f59e0b" }} />
                  </div>
                  <span className="w-10 text-right text-muted tabular-nums">
                    {c.logit.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Con số thô này gọi là <strong>logit</strong>. Càng cao nghĩa là token
              càng hợp ngữ cảnh theo kinh nghiệm của mô hình.
            </p>
          </div>,
          <div key="s5" className="rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Sau softmax và bốc thăm &rArr; token mới được chọn
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {focusTokens.map((t, i) => (
                <span key={i} className="rounded-md border border-border bg-card px-2 py-0.5 text-sm text-foreground/70 whitespace-pre">
                  {t.text}
                </span>
              ))}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-md border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 whitespace-pre"
              >
                {" thế"}
              </motion.span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Token <strong>&ldquo; thế&rdquo;</strong> được gắn vào cuối chuỗi. Lượt
              forward pass tiếp theo bắt đầu — lần này chuỗi đã dài thêm một token.
              Quay lại bước 1, lặp lại cho tới khi mô hình sinh ra token dừng.
            </p>
          </div>,
        ]}
      </StepReveal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function ForwardPropagationInChatResponse() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Lan truyền thuận">
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero
        parentTitleVi="Lan truyền thuận"
        topicSlug="forward-propagation-in-chat-response"
      >
        <p>
          Bạn gõ <strong>&ldquo;Chào bạn&rdquo;</strong> vào ChatGPT (trợ lý chat của
          OpenAI). Khoảng <strong>20 mili-giây</strong> sau, token đầu tiên hiện ra.
          Rồi từng token kế tiếp, cứ đều đặn hơn chục mili-giây một cái. Câu trả lời
          dài 200 từ xuất hiện trong chưa tới 5 giây.
        </p>
        <p>
          Trong mỗi 20 mili-giây đó, dữ liệu của bạn chạy xuyên qua{" "}
          <strong>hàng trăm tỉ tham số</strong> — con số mà mô hình đã học từ hàng
          ngàn tỉ từ văn bản. Quá trình này gọi là <em>lan truyền thuận</em> (forward
          propagation): dữ liệu đi một chiều từ đầu vào qua các tầng, tới đầu ra, không
          quay lại. Bài này mở ra từng bước của một lượt lan truyền đó.
        </p>

        <LatencyHero />
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug="forward-propagation-in-chat-response">
        <p>
          ChatGPT cần đọc lại toàn bộ đoạn hội thoại đã có, rồi đoán token tiếp theo
          hợp nhất. Với mỗi token mới, quá trình lặp lại — nghĩa là một câu trả lời 200
          từ cần khoảng <strong>250 – 300 lượt lan truyền</strong>.
        </p>
        <p>
          Mỗi lượt đi qua <strong>hàng chục tới hàng trăm tầng Transformer</strong> (khối
          mạng chuyên xử lý chuỗi), thực hiện hàng trăm tỉ phép tính nhân-cộng. Nhưng
          người dùng chỉ chịu được vài giây chờ — nếu lâu hơn, trải nghiệm chat thời gian
          thực sẽ không dùng được.
        </p>
        <p>
          Thêm một vấn đề nhức hơn: <strong>cửa sổ ngữ cảnh</strong> (context window)
          có giới hạn. Mô hình chỉ nhớ được một số token nhất định trong một lần gọi —
          vài nghìn tới vài trăm nghìn tuỳ phiên bản. Vì sao? Phần Deepen sẽ dẫn bạn
          tới đáp án qua một câu đố nhỏ.
        </p>
      </ApplicationProblem>

      {/* ━━━ MECHANISM — pipeline explorer + Beats ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Lan truyền thuận"
        topicSlug="forward-propagation-in-chat-response"
      >
        <li className="not-prose">
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              Pipeline tương tác — bấm mở từng giai đoạn
            </p>
          </div>
          <PipelineExplorer />
        </li>

        <Beat step={1}>
          <p>
            <strong>Tokenize.</strong> Câu hỏi được cắt thành các mảnh nhỏ gọi là
            token. Ví dụ <em>&ldquo;Chào bạn, hôm nay thời tiết&rdquo;</em> thành{" "}
            <em>[&ldquo;Chào&rdquo;, &ldquo; bạn&rdquo;, &ldquo;,&rdquo;,
            &ldquo; hôm&rdquo;, &ldquo; nay&rdquo;, &ldquo; thời&rdquo;,
            &ldquo; tiết&rdquo;]</em>. Mỗi token có một mã số riêng trong từ điển của
            mô hình.
          </p>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>Embed.</strong> Mỗi mã số được thay bằng một <em>vector
            embedding</em> — mảng vài nghìn con số mang ý nghĩa của token đó. Đây là
            dạng &ldquo;ngôn ngữ&rdquo; duy nhất mà mạng nơ-ron hiểu được. Mô hình cộng
            thêm một vector vị trí để biết thứ tự các token trong câu.
          </p>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Transformer.</strong> Chồng vector đi qua hàng chục đến hàng trăm
            tầng Transformer. Trong mỗi tầng, cơ chế <em>chú ý</em> (attention) để mỗi
            token &ldquo;nhìn&rdquo; các token khác và trộn thông tin. Sau đó là mạng
            feed-forward xử lý thêm. Vector của mỗi token ngày càng giàu ngữ cảnh hơn.
          </p>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Softmax &amp; sampling.</strong> Tầng cuối cho ra một danh sách
            điểm số (logit) trên toàn bộ từ điển. Softmax biến logit thành xác suất —
            tổng 100%. Hệ thống bốc thăm một token theo xác suất này (nhiệt độ càng
            cao, càng sẵn sàng chọn token ít phổ biến). Token mới được gắn vào chuỗi và
            chu trình lặp lại cho token tiếp theo.
          </p>
        </Beat>

        <Beat step={5}>
          <p>
            <strong>KV Cache — mẹo giúp nhanh hơn rất nhiều.</strong> Thay vì tính lại
            từ đầu cho mỗi token, hệ thống lưu các khoá (key) và giá trị (value) của
            các token cũ vào bộ nhớ đệm. Chỉ cần tính phần gia tăng cho token mới — tiết
            kiệm hàng tỉ phép tính mỗi bước.
          </p>
          <KvCacheDemo />
        </Beat>

        <Callout variant="insight" title="Nhìn từ xa">
          Tất cả các bước trên là <strong>một lượt lan truyền thuận duy nhất</strong> —
          dữ liệu chảy một chiều qua mạng để cho ra một token. Câu trả lời bạn thấy là
          hàng trăm lượt như vậy nối đuôi nhau, mỗi lượt &ldquo;dán&rdquo; thêm một
          token vào cuối.
        </Callout>
      </ApplicationMechanism>

      {/* ━━━ DEEPEN — StepReveal một lượt sinh token ━━━ */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          Mở bên trong một lượt sinh token
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-5">
          Theo chân một token được sinh ra. Mỗi bước bấm{" "}
          <em>Tiếp tục</em> để mở thêm một công đoạn. Dữ liệu dùng ở đây là câu gõ dở{" "}
          <em>&ldquo;Chào bạn, hôm nay thời tiết&rdquo;</em> — mô hình đang cố đoán từ
          tiếp theo.
        </p>

        <SingleStepReveal />

        <div className="mt-6">
          <InlineChallenge
            question="Vì sao cửa sổ ngữ cảnh (context window) của mô hình lại có giới hạn, không thể vô hạn?"
            options={[
              "Vì tiếng Việt không có đủ từ để lấp đầy cửa sổ lớn hơn",
              "Vì mỗi token mới cần liếc qua mọi token đã có. Số cặp cần xử lý tăng theo bình phương số token — càng dài càng chậm và tốn bộ nhớ rất nhanh",
              "Vì mô hình được huấn luyện trên câu ngắn nên không đoán được câu dài",
              "Vì máy chủ của OpenAI chỉ bật mỗi lần 4.096 token để tiết kiệm điện",
            ]}
            correct={1}
            explanation="Trong cơ chế chú ý, mỗi token phải so sánh với mọi token trước đó — số phép tính tăng theo bình phương độ dài chuỗi. Thêm nữa, bộ nhớ cho KV cache cũng phình ra theo cửa sổ. Các phiên bản mới dùng kỹ thuật giảm độ phức tạp này, nhưng ngay cả khi đó vẫn có giới hạn phần cứng cứng."
          />
        </div>
      </section>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="forward-propagation-in-chat-response"
      >
        <Metric
          value="Mỗi lượt lan truyền thuận thực hiện khoảng 2N phép nhân-cộng với N là số tham số phi-embedding"
          sourceRef={2}
        />
        <Metric
          value="KV Cache giúp lượt lan truyền cho token mới chỉ cần xử lý 1 token thay vì toàn bộ chuỗi"
          sourceRef={2}
        />
        <Metric
          value="Kiến trúc Transformer gốc cho phép song song hoá hoàn toàn trên GPU, khác hẳn mạng hồi quy tuần tự trước đó"
          sourceRef={3}
        />
        <Metric
          value="Một câu trả lời trung bình 200 từ cần khoảng 250 – 300 lượt lan truyền thuận liên tiếp"
          sourceRef={4}
        />
      </ApplicationMetrics>

      {/* ━━━ CONNECT / MINI SUMMARY ━━━ */}
      <section className="mb-10">
        <MiniSummary
          title="Ba điều đáng nhớ"
          points={[
            "Mỗi token ChatGPT gõ ra là một lượt lan truyền thuận xuyên qua pipeline: tokenize → embed → transformer → softmax → sample.",
            "Nhiệt độ (temperature) điều chỉnh bước sampling — thấp thì chọn chắc, cao thì dám chọn token hiếm.",
            "KV Cache và song song hoá GPU là lý do một lượt lan truyền qua hàng trăm tỉ tham số kết thúc trong khoảng 20 mili-giây.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Muốn xem bên dưới kỹ hơn?">
            Bài lý thuyết <strong>Lan truyền thuận</strong> mở từng lớp của mạng nơ-ron
            nhỏ và cho bạn kéo từng đầu vào. Nó chính là phiên bản &ldquo;thu nhỏ&rdquo;
            của thứ đang chạy bên trong ChatGPT mà bạn vừa xem.
          </Callout>
        </div>
      </section>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Lan truyền thuận"
        topicSlug="forward-propagation-in-chat-response"
      >
        <p>
          Nếu không có lan truyền thuận — tức là không có cơ chế đưa dữ liệu có hệ
          thống qua các tầng — mạng nơ-ron sẽ không biết biến đầu vào thành đầu ra.
          Không có lan truyền thuận, không có ChatGPT.
        </p>
        <p>
          Nếu có lan truyền thuận nhưng <strong>không có KV Cache và GPU song song
          hoá</strong>, mỗi token mới sẽ phải tính lại từ đầu toàn bộ chuỗi. Một câu trả
          lời 200 token sẽ chậm gấp hàng trăm lần — thay vì vài giây, bạn phải chờ vài
          phút. Trải nghiệm chat thời gian thực sẽ biến mất.
        </p>

        <div className="not-prose mt-5 rounded-xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={16}
              className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Mặt trái của tốc độ
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Tốc độ sinh token nhanh tới mức người dùng dễ tin tưởng quá. Mô hình đôi
                khi &ldquo;bốc thăm&rdquo; trúng một token ít phổ biến và rẽ cả câu trả
                lời sang hướng sai — đây là nguyên nhân gốc của hiện tượng ảo giác
                (hallucination). Nhanh không đồng nghĩa đúng.
              </p>
            </div>
          </div>
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
