"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileArchive,
  FileText,
  TrendingDown,
  TreePine,
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
  InlineChallenge,
  Callout,
  MiniSummary,
  StepReveal,
  TopicLink,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "information-theory-in-compression",
  title: "Information Theory in Data Compression",
  titleVi: "Lý thuyết thông tin trong nén file",
  description:
    "Vì sao file .txt toàn chữ 'a' nén rất nhỏ còn file ngẫu nhiên gần như không nén được? Entropy Shannon đặt giới hạn — Huffman tiến gần nó.",
  category: "classic-ml",
  tags: ["entropy", "compression", "information-theory", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["information-theory"],
  vizType: "interactive",
  applicationOf: "information-theory",
  featuredApp: {
    name: "JPEG / ZIP / H.265",
    productFeature: "Data Compression Standards",
    company: "ISO / ITU-T",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "A Mathematical Theory of Communication",
      publisher: "Claude E. Shannon, Bell System Technical Journal",
      url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
      date: "1948-07",
      kind: "paper",
    },
    {
      title: "How Claude Shannon Invented the Future",
      publisher: "Quanta Magazine",
      url: "https://www.quantamagazine.org/how-claude-shannons-information-theory-invented-the-future-20201222/",
      date: "2020-12",
      kind: "news",
    },
    {
      title: "JPEG Standard (ISO/IEC 10918-1)",
      publisher: "International Organization for Standardization",
      url: "https://www.w3.org/Graphics/JPEG/itu-t81.pdf",
      date: "1992-09",
      kind: "documentation",
    },
    {
      title: "High Efficiency Video Coding (H.265/HEVC)",
      publisher: "ITU-T Recommendation H.265",
      url: "https://www.itu.int/rec/T-REC-H.265",
      date: "2013-04",
      kind: "documentation",
    },
    {
      title: "A Universal Algorithm for Sequential Data Compression (LZ77)",
      publisher:
        "Abraham Lempel & Jacob Ziv, IEEE Transactions on Information Theory",
      url: "https://ieeexplore.ieee.org/document/1055714",
      date: "1977-05",
      kind: "paper",
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

/* ─────────────────────────────────────────────────────────────
   HUFFMAN CODES (giả lập — cho nén 6 ký tự A, B, C, D, E, F)
   ───────────────────────────────────────────────────────────── */
const ALPHABET = ["A", "B", "C", "D", "E", "F"] as const;
type Letter = (typeof ALPHABET)[number];

// Bốn phân phối đầu vào khác nhau
type DistMode = "peaked" | "skewed" | "uniform" | "random";

const DISTS: Record<DistMode, { label: string; probs: number[]; note: string }> = {
  peaked: {
    label: "Một ký tự chiếm 80%",
    probs: [0.8, 0.08, 0.05, 0.04, 0.02, 0.01],
    note: "Ví dụ: file toàn chữ 'a', chèn rất ít ký tự khác.",
  },
  skewed: {
    label: "Lệch vừa",
    probs: [0.45, 0.25, 0.15, 0.08, 0.05, 0.02],
    note: "Giống tần suất chữ cái trong tiếng Việt/Anh.",
  },
  uniform: {
    label: "Đồng đều",
    probs: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
    note: "Ký tự nào cũng xuất hiện như nhau — khó nén.",
  },
  random: {
    label: "Gần như ngẫu nhiên",
    probs: [0.17, 0.17, 0.17, 0.17, 0.16, 0.16],
    note: "Tệp dữ liệu đã được mã hoá ngẫu nhiên — entropy đỉnh.",
  },
};

/* Huffman codes cho 4 phân phối — đã tính sẵn để ổn định UI */
const HUFFMAN_CODES: Record<DistMode, Record<Letter, string>> = {
  peaked: { A: "0", B: "10", C: "110", D: "1110", E: "11110", F: "11111" },
  skewed: { A: "0", B: "10", C: "110", D: "1110", E: "11110", F: "11111" },
  uniform: { A: "000", B: "001", C: "010", D: "011", E: "10", F: "11" },
  random: { A: "000", B: "001", C: "010", D: "011", E: "10", F: "11" },
};

/* Fixed 3-bit encoding để so sánh (không có Huffman) */
const FIXED_CODES: Record<Letter, string> = {
  A: "000",
  B: "001",
  C: "010",
  D: "011",
  E: "100",
  F: "101",
};

function log2(x: number) {
  return Math.log(x + 1e-12) / Math.log(2);
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * log2(p);
  }
  return h;
}

function avgLen(probs: number[], codes: string[]): number {
  let total = 0;
  for (let i = 0; i < probs.length; i++) {
    total += probs[i] * codes[i].length;
  }
  return total;
}

/* ─────────────────────────────────────────────────────────────
   HUFFMAN BUILDER DEMO
   ───────────────────────────────────────────────────────────── */
function HuffmanBuilder() {
  const [mode, setMode] = useState<DistMode>("peaked");
  const dist = DISTS[mode];
  const codes = HUFFMAN_CODES[mode];
  const fixedCodesArr = ALPHABET.map((l) => FIXED_CODES[l]);
  const huffmanCodesArr = ALPHABET.map((l) => codes[l]);

  const H = useMemo(() => entropy(dist.probs), [dist.probs]);
  const avgHuffman = useMemo(
    () => avgLen(dist.probs, huffmanCodesArr),
    [dist.probs, huffmanCodesArr],
  );
  const avgFixed = useMemo(
    () => avgLen(dist.probs, fixedCodesArr),
    [dist.probs, fixedCodesArr],
  );

  // Mô phỏng file 1000 ký tự
  const fileSize = 1000;
  const sizeNoCompress = fileSize * avgFixed;
  const sizeHuffman = fileSize * avgHuffman;
  const saving = 1 - sizeHuffman / sizeNoCompress;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {/* Chọn phân phối */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DISTS) as DistMode[]).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {DISTS[m].label}
            </button>
          );
        })}
      </div>
      <p className="text-xs italic text-muted">{dist.note}</p>

      {/* Bảng tần suất + mã */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-surface/50 text-tertiary">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Ký tự</th>
              <th className="px-3 py-2 text-left font-medium">Tần suất</th>
              <th className="px-3 py-2 text-left font-medium">Mã Huffman</th>
              <th className="px-3 py-2 text-left font-medium">Số bit mã</th>
              <th className="px-3 py-2 text-left font-medium">Mã cố định 3-bit</th>
            </tr>
          </thead>
          <tbody>
            {ALPHABET.map((letter, i) => {
              const p = dist.probs[i];
              const huffman = codes[letter];
              return (
                <motion.tr
                  key={letter}
                  layout
                  className="bg-card"
                  transition={{ duration: 0.15 }}
                >
                  <td className="px-3 py-2 font-bold text-foreground">{letter}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-surface">
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          animate={{ width: `${p * 100}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <span className="font-mono text-tertiary">
                        {(p * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-accent">{huffman}</td>
                  <td className="px-3 py-2 font-mono text-muted">
                    {huffman.length} bit
                  </td>
                  <td className="px-3 py-2 font-mono text-muted">
                    {FIXED_CODES[letter]} (3 bit)
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bộ ba so sánh */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBox
          label="Entropy H(X)"
          sub="Giới hạn Shannon"
          value={`${H.toFixed(2)} bit/kt`}
          color="#2563eb"
        />
        <StatBox
          label="Trung bình mã Huffman"
          sub="Kết quả thực tế"
          value={`${avgHuffman.toFixed(2)} bit/kt`}
          color="#16a34a"
        />
        <StatBox
          label="Mã cố định 3-bit"
          sub="Không nén"
          value={`${avgFixed.toFixed(2)} bit/kt`}
          color="#9ca3af"
        />
      </div>

      {/* File size simulator */}
      <div className="rounded-lg border border-border bg-surface/40 p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Nếu file có 1000 ký tự:
        </p>
        <div className="space-y-3">
          <BarRow
            label="Không nén (mã 3-bit/kt)"
            value={sizeNoCompress}
            maxValue={sizeNoCompress}
            color="#9ca3af"
            unit="bit"
          />
          <BarRow
            label="Dùng Huffman"
            value={sizeHuffman}
            maxValue={sizeNoCompress}
            color="#16a34a"
            unit="bit"
          />
        </div>
        <p className="mt-3 text-xs text-muted leading-relaxed">
          Tiết kiệm được{" "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            {(saving * 100).toFixed(0)}%
          </strong>{" "}
          — và khoảng cách giữa mã Huffman và entropy chính là &quot;khoảng dự phòng
          không thể thu hẹp thêm&quot; mà Shannon đã chứng minh.
        </p>
      </div>
    </div>
  );
}

function StatBox({
  label,
  sub,
  value,
  color,
}: {
  label: string;
  sub: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="text-xs font-semibold" style={{ color }}>
        {label}
      </div>
      <div className="text-[10px] text-tertiary">{sub}</div>
      <div className="mt-2 font-mono text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

function BarRow({
  label,
  value,
  maxValue,
  color,
  unit,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {value.toFixed(0)} {unit}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ENCODING LIVE — demo thực sự encode/decode
   ───────────────────────────────────────────────────────────── */
function EncodingLiveDemo() {
  const [text, setText] = useState("AAAABBC");
  const [mode] = useState<DistMode>("peaked");
  const codes = HUFFMAN_CODES[mode];

  const normalised = text
    .toUpperCase()
    .split("")
    .filter((c): c is Letter => (ALPHABET as readonly string[]).includes(c));

  const bits = normalised.map((c) => codes[c]).join("");
  const noCompressBits = normalised.map((c) => FIXED_CODES[c]).join("");

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">
          Nhập chuỗi (chỉ A–F)
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
          placeholder="VD: AAAABBCF"
          aria-label="Chuỗi ký tự để mã hoá"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <FileText size={12} /> Không nén (3 bit/kt)
          </div>
          <p className="break-all font-mono text-xs text-foreground">
            {noCompressBits || "(chuỗi trống)"}
          </p>
          <p className="mt-2 text-[11px] text-tertiary">
            Tổng: <strong>{noCompressBits.length}</strong> bit
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <FileArchive size={12} /> Dùng Huffman
          </div>
          <p className="break-all font-mono text-xs text-foreground">
            {bits || "(chuỗi trống)"}
          </p>
          <p className="mt-2 text-[11px] text-tertiary">
            Tổng: <strong>{bits.length}</strong> bit
            {noCompressBits.length > 0 && bits.length > 0 && (
              <span>
                {" "}
                · tiết kiệm{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {(
                    ((noCompressBits.length - bits.length) / noCompressBits.length) *
                    100
                  ).toFixed(0)}
                  %
                </strong>
              </span>
            )}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {normalised.length > 0 && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-surface/40 p-3 text-[11px] leading-relaxed text-muted"
          >
            <strong className="text-foreground">Cách đọc:</strong> mỗi ký tự được thay
            bằng chuỗi bit theo bảng mã Huffman ở trên. A (phổ biến nhất) được gán mã
            ngắn nhất (<code className="font-mono text-accent">0</code>), còn F (hiếm
            nhất) có mã dài (
            <code className="font-mono text-accent">11111</code>).
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HUFFMAN TREE STEP REVEAL
   ───────────────────────────────────────────────────────────── */
function TreeStepA() {
  // Bước 1: mỗi ký tự là một lá — hiển thị tần suất
  const leaves = [
    { label: "A", f: 45, x: 40, y: 120 },
    { label: "B", f: 13, x: 110, y: 120 },
    { label: "C", f: 12, x: 180, y: 120 },
    { label: "D", f: 16, x: 250, y: 120 },
    { label: "E", f: 9, x: 320, y: 120 },
    { label: "F", f: 5, x: 390, y: 120 },
  ];
  return (
    <svg viewBox="0 0 440 160" className="w-full">
      {leaves.map((leaf) => (
        <g key={leaf.label}>
          <circle cx={leaf.x} cy={leaf.y} r={18} fill="#2563eb" />
          <text
            x={leaf.x}
            y={leaf.y + 4}
            textAnchor="middle"
            fontSize={13}
            fontWeight="bold"
            fill="#ffffff"
          >
            {leaf.label}
          </text>
          <text
            x={leaf.x}
            y={leaf.y + 36}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-muted"
          >
            {leaf.f}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function TreeStepB() {
  // Bước 2: ghép 2 lá hiếm nhất thành một nút (E + F = 14)
  return (
    <svg viewBox="0 0 440 180" className="w-full">
      {/* A, B, C, D còn ở dưới */}
      {[
        { label: "A", x: 40, y: 140, f: 45 },
        { label: "B", x: 110, y: 140, f: 13 },
        { label: "C", x: 180, y: 140, f: 12 },
        { label: "D", x: 250, y: 140, f: 16 },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={16} fill="#2563eb" />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight="bold"
            fill="#ffffff"
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + 34}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-muted"
          >
            {n.f}%
          </text>
        </g>
      ))}
      {/* E, F chìm xuống */}
      {[
        { label: "E", x: 320, y: 140, f: 9 },
        { label: "F", x: 390, y: 140, f: 5 },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={14} fill="#64748b" />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize={11}
            fontWeight="bold"
            fill="#ffffff"
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + 30}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-muted"
          >
            {n.f}%
          </text>
        </g>
      ))}
      {/* Nút ghép E+F (14) */}
      <line x1={320} y1={122} x2={355} y2={80} stroke="#8b5cf6" strokeWidth={1.5} />
      <line x1={390} y1={122} x2={355} y2={80} stroke="#8b5cf6" strokeWidth={1.5} />
      <circle cx={355} cy={70} r={14} fill="#8b5cf6" />
      <text
        x={355}
        y={74}
        textAnchor="middle"
        fontSize={11}
        fontWeight="bold"
        fill="#ffffff"
      >
        14
      </text>
      <text
        x={355}
        y={50}
        textAnchor="middle"
        fontSize={9}
        fill="currentColor"
        className="text-muted"
      >
        E + F
      </text>
    </svg>
  );
}

function TreeStepC() {
  // Bước 3: toàn bộ cây hoàn chỉnh — tất cả nút trong được vẽ
  return (
    <svg viewBox="0 0 480 240" className="w-full">
      {/* Lá */}
      {[
        { label: "A", x: 40, y: 200, code: "0" },
        { label: "D", x: 140, y: 200, code: "10" },
        { label: "B", x: 240, y: 200, code: "110" },
        { label: "C", x: 340, y: 200, code: "1110" },
        { label: "E", x: 400, y: 200, code: "11110" },
        { label: "F", x: 460, y: 200, code: "11111" },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={16} fill="#2563eb" />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight="bold"
            fill="#ffffff"
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + 32}
            textAnchor="middle"
            fontSize={9}
            fontFamily="monospace"
            fill="#dc2626"
          >
            {n.code}
          </text>
        </g>
      ))}
      {/* Gốc */}
      <circle cx={240} cy={30} r={14} fill="#16a34a" />
      <text
        x={240}
        y={34}
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
        fill="#ffffff"
      >
        gốc
      </text>
      {/* Các nút trung gian */}
      {[
        { x: 340, y: 170, f: 55 },
        { x: 400, y: 140, f: 14 },
        { x: 430, y: 170, f: 9 },
        { x: 340, y: 100, f: 38 },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={10} fill="#8b5cf6" />
        </g>
      ))}
      {/* Cành */}
      {[
        [240, 30, 40, 200, "0"], // gốc → A
        [240, 30, 340, 100, "1"], // gốc → nút phải
        [340, 100, 140, 200, "0"], // → D
        [340, 100, 340, 170, "1"], // → nút dưới
        [340, 170, 240, 200, "0"], // → B
        [340, 170, 400, 140, "1"], // → nút E+F nhánh
        [400, 140, 340, 200, "0"], // → C
        [400, 140, 430, 170, "1"], // → E/F
        [430, 170, 400, 200, "0"], // → E
        [430, 170, 460, 200, "1"], // → F
      ].map((edge, i) => {
        const [x1, y1, x2, y2, label] = edge as [number, number, number, number, string];
        return (
          <g key={`edge-${i}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b5cf6" strokeWidth={1.2} />
            <text
              x={(x1 + x2) / 2 + 4}
              y={(y1 + y2) / 2}
              fontSize={9}
              fontFamily="monospace"
              fill="#dc2626"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ
   ───────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Vì sao một file .txt chứa toàn chữ 'a' có thể nén nhỏ hơn hẳn so với một file toàn ký tự ngẫu nhiên?",
    options: [
      "Vì file chữ 'a' được lưu ở định dạng đặc biệt",
      "Vì entropy rất thấp (gần như không có bất ngờ) — thuật toán có thể thay 'aaaa...' bằng vài bit mô tả 'lặp n lần'",
      "Vì file ngẫu nhiên luôn bị lỗi",
      "Vì chữ 'a' chiếm ít byte hơn trên máy tính",
    ],
    correct: 1,
    explanation:
      "File toàn chữ 'a' có entropy cực thấp (gần 0) — rất dễ đoán kết quả tiếp theo. Thuật toán nén lợi dụng sự dư thừa đó để thay bằng mã ngắn. File ngẫu nhiên có entropy cao gần cực đại, không có gì để 'dự đoán', nên gần như không nén được — đúng theo giới hạn Shannon.",
  },
  {
    question:
      "Huffman coding gán mã như thế nào để đạt trung bình ngắn nhất?",
    options: [
      "Mã ngắn cho ký tự HIẾM, mã dài cho ký tự PHỔ BIẾN",
      "Mã ngắn cho ký tự PHỔ BIẾN, mã dài cho ký tự HIẾM",
      "Mã dài cho mọi ký tự để đảm bảo an toàn",
      "Ngẫu nhiên",
    ],
    correct: 1,
    explanation:
      "Ý tưởng cốt lõi: nếu ký tự xuất hiện thường xuyên, bạn nên dành chuỗi bit ngắn cho nó để tổng độ dài nhỏ. Ký tự hiếm có thể nhận mã dài mà không ảnh hưởng trung bình nhiều. Đây là nguyên lý của mã Morse (E = '.', Z = '--..').",
  },
  {
    question: "Entropy Shannon đặt giới hạn gì cho bài toán nén?",
    options: [
      "Giới hạn trên — không nén được nhỏ hơn H bit/ký tự (lossless)",
      "Giới hạn trên — có thể nén tuỳ ý nhỏ",
      "Không liên quan đến nén",
      "Chỉ áp dụng cho video",
    ],
    correct: 0,
    explanation:
      "Shannon chứng minh: với nén không mất mát, số bit trung bình ngắn nhất cho mỗi ký tự không thể nhỏ hơn entropy H(X) của nguồn. Đây là sàn lý thuyết — Huffman tiệm cận nhưng không vượt qua được.",
  },
  {
    question:
      "Một phân phối có entropy H = 1.8 bit/kt. Bạn dùng Huffman và đạt 1.85 bit/kt trung bình. Có thể nén tốt hơn nữa không?",
    options: [
      "Có, xuống 0 bit/kt nếu chạy nhiều lần",
      "Rất ít dư địa — chỉ có thể tiến tới 1.8 bit/kt, khoảng cách đang rất nhỏ",
      "Không, Huffman đã là giới hạn tuyệt đối",
      "Tuỳ CPU và dung lượng ổ cứng",
    ],
    correct: 1,
    explanation:
      "Giới hạn Shannon là 1.8 bit/kt. Huffman đang ở 1.85 — chỉ còn 0.05 bit dư địa. Các kỹ thuật như arithmetic coding có thể thu hẹp thêm, nhưng không thể đi dưới 1.8. Đây là lý do mọi thuật toán nén hiện đại (ZIP, JPEG, H.265) đều dùng entropy làm mốc.",
  },
];

/* ═══════════════ MAIN ═══════════════ */
export default function InformationTheoryInCompression() {
  return (
    <>
      <ApplicationLayout metadata={metadata} parentTitleVi="Lý thuyết thông tin">
        <ApplicationHero
          parentTitleVi="Lý thuyết thông tin"
          topicSlug="information-theory-in-compression"
        >
          <p>
            &quot;Sao file .txt toàn chữ &lsquo;a&rsquo; lại nhỏ hơn hẳn file toàn chữ
            ngẫu nhiên?&quot; — đây là câu hỏi đánh thẳng vào bản chất của nén dữ liệu.
            Câu trả lời nằm trong một bài báo 1948 của Claude Shannon: mọi phân phối
            dữ liệu đều có một <strong>giới hạn nén lý thuyết</strong> đo bằng entropy,
            và không thuật toán nào vượt qua được giới hạn đó mà không mất thông tin.
          </p>
          <p>
            Dưới đây là một bộ mã Huffman sống. Chọn một kiểu phân phối đầu vào — bạn sẽ
            thấy độ dài mã trung bình thay đổi, và kích thước file sau nén dịch chuyển
            theo thời gian thực.
          </p>
          <div className="not-prose mt-5">
            <HuffmanBuilder />
          </div>
        </ApplicationHero>

        <ApplicationProblem topicSlug="information-theory-in-compression">
          <p>
            Mỗi ngày internet truyền hàng exabyte dữ liệu. Không nén, băng thông sẽ sập,
            ổ cứng nhanh đầy, điện thoại chụp ảnh xong không còn chỗ lưu. Câu hỏi lớn:{" "}
            <strong>làm sao biểu diễn cùng một lượng thông tin bằng ít bit hơn?</strong>
          </p>
          <p>
            Với nén không mất mát (lossless — ZIP), mọi bit phải giữ nguyên. Với nén có
            mất mát (lossy — JPEG, H.265), câu hỏi là: bỏ đến mức nào thì mắt/tai người
            không nhận ra? Cả hai hướng đều dùng entropy làm la bàn.
          </p>
          <div className="not-prose mt-5">
            <EncodingLiveDemo />
          </div>
        </ApplicationProblem>

        <ApplicationMechanism
          parentTitleVi="Lý thuyết thông tin"
          topicSlug="information-theory-in-compression"
        >
          <Beat step={1}>
            <p>
              <strong>Đếm tần suất ký tự.</strong> Bước đầu tiên của mọi thuật toán nén:
              nhìn dữ liệu và đếm xem mỗi ký tự (hoặc chuỗi byte) xuất hiện bao nhiêu
              lần. Từ đó suy ra xác suất — càng lệch, càng có dư địa để nén. File toàn
              &lsquo;a&rsquo; có xác suất 99% cho &lsquo;a&rsquo;, nghĩa là entropy ≈ 0
              — gần như không có gì để &quot;bất ngờ&quot;.
            </p>
          </Beat>

          <Beat step={2}>
            <p>
              <strong>Xây cây Huffman — ký tự phổ biến được gán mã ngắn.</strong>{" "}
              Thuật toán bắt đầu từ sáu ký tự độc lập, ghép hai ký tự hiếm nhất thành
              một nút, lặp lại cho đến khi còn một gốc duy nhất. Đường đi từ gốc xuống
              lá cho ta mã của mỗi ký tự — đi trái = &lsquo;0&rsquo;, đi phải =
              &lsquo;1&rsquo;.
            </p>
            <div className="not-prose mt-4">
              <StepReveal
                labels={[
                  "Bước 1: Mỗi ký tự là một lá",
                  "Bước 2: Ghép hai ký tự hiếm nhất",
                  "Bước 3: Lặp đến khi còn một gốc",
                ]}
              >
                {[
                  <div
                    key="t1"
                    className="space-y-2 rounded-xl border border-border bg-surface/50 p-4"
                  >
                    <p className="text-sm text-foreground leading-relaxed">
                      Khởi đầu: 6 ký tự A, B, C, D, E, F với tần suất biết trước. Mỗi
                      ký tự là một <em>lá</em> riêng lẻ.
                    </p>
                    <TreeStepA />
                  </div>,
                  <div
                    key="t2"
                    className="space-y-2 rounded-xl border border-border bg-surface/50 p-4"
                  >
                    <p className="text-sm text-foreground leading-relaxed">
                      Hai ký tự hiếm nhất là E (9%) và F (5%). Ghép chúng thành một
                      nút &quot;E + F&quot; mang tổng tần suất 14%. Giờ ta còn 5 nút
                      cần ghép.
                    </p>
                    <TreeStepB />
                  </div>,
                  <div
                    key="t3"
                    className="space-y-2 rounded-xl border border-border bg-surface/50 p-4"
                  >
                    <p className="text-sm text-foreground leading-relaxed">
                      Lặp lại cho đến khi còn một gốc duy nhất. Đi từ gốc xuống mỗi lá
                      — chuỗi &lsquo;0&rsquo;/&lsquo;1&rsquo; ta đi qua chính là mã
                      Huffman của ký tự đó.
                    </p>
                    <TreeStepC />
                  </div>,
                ]}
              </StepReveal>
            </div>
          </Beat>

          <Beat step={3}>
            <p>
              <strong>Huffman tiệm cận entropy Shannon.</strong> Shannon đặt giới hạn:
              không thể nén nhỏ hơn H(X) bit/ký tự trung bình. Huffman đạt được một
              giá trị rất gần với H — thường chỉ lớn hơn một chút. Đó là lý do Huffman
              được gọi là &quot;tối ưu gần toàn cục&quot; cho mã có độ dài nguyên.
            </p>
          </Beat>

          <Beat step={4}>
            <p>
              <strong>ZIP = LZ77 + Huffman.</strong> LZ77 tìm chuỗi lặp lại và thay
              bằng tham chiếu ngược (&quot;đi lùi N byte, copy M byte&quot;). Huffman
              sau đó nén bảng chữ cái thô đã giảm dư thừa. Hai tầng bổ sung cho nhau,
              tiến rất gần giới hạn lý thuyết cho mọi loại văn bản.
            </p>
          </Beat>

          <Beat step={5}>
            <p>
              <strong>JPEG &amp; H.265 — nén có mất mát.</strong> Với ảnh/video, ta
              không cần khôi phục từng bit. JPEG chia ảnh thành khối 8×8, chuyển sang
              miền tần số (DCT), và <em>lượng tử hoá</em> thô các thành phần tần số cao
              mà mắt ít nhạy. H.265 làm tương tự cho video + mã hoá số học (CABAC). Cả
              hai đều dùng entropy để biết &quot;bỏ được bao nhiêu mà không ai nhận
              ra&quot;.
            </p>
          </Beat>
        </ApplicationMechanism>

        <ApplicationMetrics
          sources={metadata.sources!}
          topicSlug="information-theory-in-compression"
        >
          <Metric
            value="JPEG đạt tỷ lệ nén 10:1 — ảnh 12 MB còn 1,2 MB mà mắt thường không phân biệt"
            sourceRef={3}
          />
          <Metric
            value="H.265 giảm 50% băng thông so với H.264 ở cùng chất lượng video"
            sourceRef={4}
          />
          <Metric
            value="Entropy Shannon đặt giới hạn lý thuyết tuyệt đối cho mọi phương pháp nén"
            sourceRef={1}
          />
          <Metric
            value="LZ77 + Huffman trong ZIP nén không mất mát, tiến gần giới hạn entropy"
            sourceRef={5}
          />
        </ApplicationMetrics>

        <ApplicationCounterfactual
          parentTitleVi="Lý thuyết thông tin"
          topicSlug="information-theory-in-compression"
        >
          <p>
            Không có lý thuyết thông tin của Shannon, các kỹ sư sẽ thiết kế thuật toán
            nén mà <em>không biết giới hạn nằm ở đâu</em> — như đào vàng mà không biết
            mỏ sâu bao nhiêu. Họ không biết khi nào đã đạt tối ưu, khi nào còn có thể
            cải thiện.
          </p>
          <p>
            Entropy cho biết chính xác bao nhiêu bit là đủ và bao nhiêu là dư thừa. Nhờ
            vậy Huffman biết cách gán mã ngắn cho ký tự phổ biến, JPEG biết bỏ được bao
            nhiêu chi tiết, H.265 biết xác suất nào cần ước lượng. Internet như chúng
            ta biết — ảnh tải nhanh, video không giật, file gửi gọn — đều bắt nguồn từ
            một bài báo 78 trang năm 1948.
          </p>

          <div className="not-prose mt-5">
            <Callout variant="insight" title="Một phép đo đổi hẳn ngành truyền thông">
              Trước 1948, không ai biết cách đo &quot;lượng thông tin&quot; bằng một
              con số. Shannon đề xuất entropy — và lập tức cả lĩnh vực viễn thông,
              mã hoá, lưu trữ có chung một ngôn ngữ. Hôm nay, khi bạn gửi một tin nhắn
              qua Wi-Fi, nén một ảnh selfie, hay xem Netflix 4K không giật, bạn đang
              hưởng thành quả trực tiếp của một biểu thức đơn giản:{" "}
              <span className="font-mono">H = −Σ p log p</span>.
            </Callout>
          </div>
        </ApplicationCounterfactual>
      </ApplicationLayout>

      {/* ━━━ THỬ THÁCH + QUIZ ━━━ */}
      <section className="mb-10 space-y-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TreePine size={16} className="text-accent" /> Kiểm tra nhanh
        </div>
        <InlineChallenge
          question="Một ảnh chỉ chứa 2 màu xen kẽ đều đặn (như bàn cờ). Dùng Huffman, trung bình mỗi pixel cần bao nhiêu bit?"
          options={[
            "Khoảng 1 bit — 2 màu đồng đều, entropy = 1",
            "0.5 bit vì có thể nén một nửa",
            "8 bit như ảnh màu thông thường",
            "Không xác định",
          ]}
          correct={0}
          explanation="2 màu với phân phối 50/50 → entropy H = 1 bit. Huffman đạt đúng 1 bit/pixel (A = '0', B = '1'). Ảnh bàn cờ không 'nén thêm' được ở mức pixel độc lập — phải chuyển sang nén chuỗi (RLE) để khai thác cấu trúc lặp."
        />

        <InlineChallenge
          question="File gốc 1 MB. Sau khi nén ZIP còn 200 KB. Tỷ lệ nén là bao nhiêu?"
          options={[
            "5:1 — kích thước ban đầu gấp 5 lần kết quả",
            "1:5",
            "200%",
            "Không thể tính",
          ]}
          correct={0}
          explanation="Tỷ lệ nén = kích thước gốc / kích thước nén = 1000 KB / 200 KB = 5. Ghi là 5:1. Với văn bản thông thường, 3:1–5:1 là bình thường; ảnh JPEG 10:1; video H.265 50:1 hoặc hơn."
        />
      </section>

      <section className="mb-10">
        <MiniSummary
          title="4 điều rút ra"
          points={[
            "Entropy Shannon = giới hạn sàn cho nén không mất mát — không thuật toán nào xuống dưới được.",
            "Huffman gán mã ngắn cho ký tự phổ biến, mã dài cho ký tự hiếm — tiệm cận giới hạn Shannon.",
            "ZIP = LZ77 (tìm chuỗi lặp) + Huffman — hai tầng bổ sung cho nhau.",
            "JPEG/H.265 là nén có mất mát: bỏ bớt chi tiết ít nhạy cảm với mắt/tai, vẫn dùng entropy làm chỉ dẫn.",
          ]}
        />

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground/85 leading-relaxed">
          <TrendingDown size={18} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <strong>Quay lại lý thuyết:</strong>{" "}
            <TopicLink slug="information-theory">
              Entropy, cross-entropy và KL divergence
            </TopicLink>{" "}
            — hiểu sâu hơn ba thước đo mà mọi thuật toán nén đều dùng làm chuẩn.
          </div>
        </div>
      </section>

      <QuizSection questions={quizQuestions} />
    </>
  );
}
