"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreePine,
  Split,
  Lightbulb,
  Sparkles,
  ListTree,
  Eye,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  LaTeX,
  TopicLink,
  SliderGroup,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════════
 * METADATA
 * ════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "decision-trees",
  title: "Decision Trees",
  titleVi: "Cây quyết định",
  description:
    "Hỏi 20 câu để đoán đồ vật — mỗi câu chia nhỏ khả năng. Cây quyết định làm đúng như vậy, thử tự tay xây một cái xem.",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "interpretable"],
  difficulty: "intermediate",
  relatedSlugs: ["random-forests", "gradient-boosting", "bias-variance"],
  vizType: "interactive",
};

/* ════════════════════════════════════════════════════════════════════
 * DỮ LIỆU MẪU — 24 điểm, 2 đặc trưng, 2 lớp
 * - x1 = "giờ học / tuần", x2 = "điểm kiểm tra gần nhất"
 * - nhãn: qua môn (1) hoặc rớt (0)
 * - ba cụm có chủ ý: học ít + điểm thấp → rớt, học nhiều hoặc điểm cao → qua
 * ════════════════════════════════════════════════════════════════════ */
type Sample = { id: number; hours: number; score: number; pass: 0 | 1 };
type Feature = "hours" | "score";

const DATA: Sample[] = [
  { id: 0, hours: 2, score: 3, pass: 0 },
  { id: 1, hours: 3, score: 4, pass: 0 },
  { id: 2, hours: 4, score: 3, pass: 0 },
  { id: 3, hours: 3, score: 5, pass: 0 },
  { id: 4, hours: 5, score: 4, pass: 0 },
  { id: 5, hours: 6, score: 5, pass: 0 },
  { id: 6, hours: 4, score: 6, pass: 0 },
  { id: 7, hours: 5, score: 6, pass: 0 },
  { id: 8, hours: 7, score: 5, pass: 1 },
  { id: 9, hours: 8, score: 6, pass: 1 },
  { id: 10, hours: 9, score: 5, pass: 1 },
  { id: 11, hours: 7, score: 7, pass: 1 },
  { id: 12, hours: 8, score: 8, pass: 1 },
  { id: 13, hours: 6, score: 8, pass: 1 },
  { id: 14, hours: 5, score: 9, pass: 1 },
  { id: 15, hours: 4, score: 8, pass: 1 },
  { id: 16, hours: 3, score: 9, pass: 1 },
  { id: 17, hours: 9, score: 7, pass: 1 },
  { id: 18, hours: 10, score: 6, pass: 1 },
  { id: 19, hours: 10, score: 8, pass: 1 },
  { id: 20, hours: 2, score: 8, pass: 1 },
  { id: 21, hours: 9, score: 3, pass: 1 },
  { id: 22, hours: 2, score: 6, pass: 0 },
  { id: 23, hours: 6, score: 3, pass: 0 },
];

/* Trục hiển thị: giờ học 0..12, điểm 0..10 */
const X_MAX = 12;
const Y_MAX = 10;

/* ════════════════════════════════════════════════════════════════════
 * GINI + ENTROPY — hai tiêu chí đo độ lẫn lộn của một nút
 * ════════════════════════════════════════════════════════════════════ */
function giniOf(samples: Sample[]): number {
  if (samples.length === 0) return 0;
  const n = samples.length;
  const p1 = samples.filter((s) => s.pass === 1).length / n;
  const p0 = 1 - p1;
  return 1 - (p1 * p1 + p0 * p0);
}

function entropyOf(samples: Sample[]): number {
  if (samples.length === 0) return 0;
  const n = samples.length;
  const p1 = samples.filter((s) => s.pass === 1).length / n;
  const p0 = 1 - p1;
  const term = (p: number) => (p > 0 ? -p * Math.log2(p) : 0);
  return term(p0) + term(p1);
}

/* ════════════════════════════════════════════════════════════════════
 * NODE + TRY-SPLIT
 * ════════════════════════════════════════════════════════════════════ */
interface Node {
  id: string;
  depth: number;
  samples: Sample[];
  feature?: Feature;
  threshold?: number;
  left?: Node;
  right?: Node;
}

function majority(samples: Sample[]): 0 | 1 {
  if (samples.length === 0) return 0;
  const p = samples.filter((s) => s.pass === 1).length;
  return p * 2 >= samples.length ? 1 : 0;
}

function splitSamples(
  samples: Sample[],
  feature: Feature,
  threshold: number,
): { left: Sample[]; right: Sample[] } {
  const left: Sample[] = [];
  const right: Sample[] = [];
  for (const s of samples) {
    if (s[feature] <= threshold) left.push(s);
    else right.push(s);
  }
  return { left, right };
}

function bestSplit(
  samples: Sample[],
  criterion: "gini" | "entropy",
): { feature: Feature; threshold: number; gain: number } | null {
  if (samples.length < 2) return null;
  const impurity = criterion === "gini" ? giniOf : entropyOf;
  const parent = impurity(samples);
  if (parent === 0) return null;

  let best: { feature: Feature; threshold: number; gain: number } | null = null;

  (["hours", "score"] as Feature[]).forEach((feat) => {
    const vals = [...new Set(samples.map((s) => s[feat]))].sort((a, b) => a - b);
    for (let k = 0; k < vals.length - 1; k++) {
      const t = (vals[k] + vals[k + 1]) / 2;
      const { left, right } = splitSamples(samples, feat, t);
      if (left.length === 0 || right.length === 0) continue;
      const after =
        (left.length / samples.length) * impurity(left) +
        (right.length / samples.length) * impurity(right);
      const gain = parent - after;
      if (!best || gain > best.gain + 1e-9) {
        best = { feature: feat, threshold: t, gain };
      }
    }
  });
  return best;
}

function buildTree(
  samples: Sample[],
  depth: number,
  maxDepth: number,
  criterion: "gini" | "entropy",
  idPrefix: string,
): Node {
  const node: Node = {
    id: idPrefix,
    depth,
    samples,
  };
  if (depth >= maxDepth) return node;
  const impurity = criterion === "gini" ? giniOf : entropyOf;
  if (impurity(samples) === 0) return node;
  const split = bestSplit(samples, criterion);
  if (!split) return node;
  const { left: L, right: R } = splitSamples(samples, split.feature, split.threshold);
  if (L.length === 0 || R.length === 0) return node;
  node.feature = split.feature;
  node.threshold = split.threshold;
  node.left = buildTree(L, depth + 1, maxDepth, criterion, idPrefix + "L");
  node.right = buildTree(R, depth + 1, maxDepth, criterion, idPrefix + "R");
  return node;
}

/* ════════════════════════════════════════════════════════════════════
 * VẼ SCATTER — dùng chung cho hầu hết demo
 * ════════════════════════════════════════════════════════════════════ */
interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  label: 0 | 1;
  key: string;
}

function collectRegions(node: Node, bounds: Rect, out: Rect[]): void {
  if (!node.feature || node.threshold === undefined) {
    out.push({ ...bounds, label: majority(node.samples), key: node.id });
    return;
  }
  if (node.feature === "hours") {
    const mid = node.threshold;
    collectRegions(node.left!, { ...bounds, x1: mid, key: node.id + "L" }, out);
    collectRegions(node.right!, { ...bounds, x0: mid, key: node.id + "R" }, out);
  } else {
    const mid = node.threshold;
    collectRegions(node.left!, { ...bounds, y1: mid, key: node.id + "L" }, out);
    collectRegions(node.right!, { ...bounds, y0: mid, key: node.id + "R" }, out);
  }
}

const SCATTER_W = 360;
const SCATTER_H = 300;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 34;

function xToPx(hours: number): number {
  return PAD_L + (hours / X_MAX) * (SCATTER_W - PAD_L - PAD_R);
}
function yToPx(score: number): number {
  return SCATTER_H - PAD_B - (score / Y_MAX) * (SCATTER_H - PAD_T - PAD_B);
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 1 — XÂY CÂY BẰNG TAY
 * Người học chọn "chia theo giờ học" hoặc "chia theo điểm",
 * rồi kéo thanh threshold. Cây mọc đúng một tầng. Lặp lại đến depth 3.
 * ════════════════════════════════════════════════════════════════════ */
type ManualStep = {
  path: "root" | "L" | "R" | "LL" | "LR" | "RL" | "RR";
  feature: Feature;
  threshold: number;
};

function applyManualSteps(steps: ManualStep[], allData: Sample[]): Node {
  const root: Node = { id: "root", depth: 0, samples: allData };
  for (const step of steps) {
    const path = step.path;
    let target: Node | null = null;
    if (path === "root") target = root;
    else {
      let cur: Node | undefined = root;
      for (const ch of path) {
        if (!cur) break;
        cur = ch === "L" ? cur.left : cur.right;
      }
      target = cur ?? null;
    }
    if (!target) continue;
    if (target.samples.length < 2) continue;
    const { left, right } = splitSamples(
      target.samples,
      step.feature,
      step.threshold,
    );
    if (left.length === 0 || right.length === 0) continue;
    target.feature = step.feature;
    target.threshold = step.threshold;
    target.left = {
      id: target.id + "L",
      depth: target.depth + 1,
      samples: left,
    };
    target.right = {
      id: target.id + "R",
      depth: target.depth + 1,
      samples: right,
    };
  }
  return root;
}

function listLeaves(node: Node, acc: Node[] = []): Node[] {
  if (!node.feature) {
    acc.push(node);
    return acc;
  }
  if (node.left) listLeaves(node.left, acc);
  if (node.right) listLeaves(node.right, acc);
  return acc;
}

function ManualTreeBuilder() {
  const [steps, setSteps] = useState<ManualStep[]>([]);
  const [feature, setFeature] = useState<Feature>("hours");
  const [threshold, setThreshold] = useState<number>(6);
  const tree = useMemo(() => applyManualSteps(steps, DATA), [steps]);
  const leaves = useMemo(() => listLeaves(tree), [tree]);

  const selectableLeaf = leaves.find(
    (l) => l.depth < 3 && giniOf(l.samples) > 0 && l.samples.length >= 3,
  );
  const [targetLeafId, setTargetLeafId] = useState<string | null>(null);
  const activeLeaf = useMemo(() => {
    if (!targetLeafId) return selectableLeaf ?? null;
    return leaves.find((l) => l.id === targetLeafId) ?? selectableLeaf ?? null;
  }, [leaves, targetLeafId, selectableLeaf]);

  const giniBefore = activeLeaf ? giniOf(activeLeaf.samples) : 0;
  const preview = activeLeaf
    ? splitSamples(activeLeaf.samples, feature, threshold)
    : { left: [], right: [] };
  const giniAfter =
    activeLeaf && activeLeaf.samples.length > 0
      ? (preview.left.length / activeLeaf.samples.length) * giniOf(preview.left) +
        (preview.right.length / activeLeaf.samples.length) * giniOf(preview.right)
      : 0;
  const gainPreview = giniBefore - giniAfter;

  function addSplit() {
    if (!activeLeaf) return;
    if (preview.left.length === 0 || preview.right.length === 0) return;
    const pathRaw = activeLeaf.id === "root" ? "root" : activeLeaf.id.slice(4);
    const path = pathRaw as ManualStep["path"];
    setSteps((prev) => [...prev, { path, feature, threshold }]);
    setTargetLeafId(null);
  }
  function reset() {
    setSteps([]);
    setTargetLeafId(null);
    setThreshold(6);
    setFeature("hours");
  }

  /* Tính vùng quyết định trong scatter */
  const regions = useMemo(() => {
    const out: Rect[] = [];
    collectRegions(
      tree,
      { x0: 0, x1: X_MAX, y0: 0, y1: Y_MAX, label: 0, key: "root" },
      out,
    );
    return out;
  }, [tree]);

  /* Trainset accuracy */
  function predict(s: Sample, n: Node): 0 | 1 {
    if (!n.feature || n.threshold === undefined) return majority(n.samples);
    return s[n.feature] <= n.threshold ? predict(s, n.left!) : predict(s, n.right!);
  }
  const acc =
    DATA.filter((s) => predict(s, tree) === s.pass).length / DATA.length;

  /* Đếm số lá */
  const leafCount = leaves.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter trái — dữ liệu + vùng quyết định */}
        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-accent" />
            <span className="text-xs font-semibold text-foreground">
              Không gian đặc trưng
            </span>
          </div>
          <svg
            viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`}
            className="w-full"
            role="img"
            aria-label={`Scatter 24 điểm, ${leafCount} vùng quyết định, độ chính xác ${Math.round(acc * 100)}%`}
          >
            {/* vùng quyết định nền */}
            {regions.map((r) => {
              const x = xToPx(r.x0);
              const w = xToPx(r.x1) - xToPx(r.x0);
              const y = yToPx(r.y1);
              const h = yToPx(r.y0) - yToPx(r.y1);
              const color = r.label === 1 ? "#10b981" : "#ef4444";
              return (
                <motion.rect
                  key={r.key}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={color}
                  fillOpacity={0.09}
                  stroke={color}
                  strokeOpacity={0.25}
                  strokeWidth={0.8}
                  initial={{ fillOpacity: 0 }}
                  animate={{ fillOpacity: 0.09 }}
                  transition={{ duration: 0.35 }}
                />
              );
            })}
            {/* trục */}
            <line
              x1={PAD_L}
              y1={SCATTER_H - PAD_B}
              x2={SCATTER_W - PAD_R}
              y2={SCATTER_H - PAD_B}
              stroke="currentColor"
              className="text-border"
            />
            <line
              x1={PAD_L}
              y1={PAD_T}
              x2={PAD_L}
              y2={SCATTER_H - PAD_B}
              stroke="currentColor"
              className="text-border"
            />
            {[0, 3, 6, 9, 12].map((v) => (
              <text
                key={`xt-${v}`}
                x={xToPx(v)}
                y={SCATTER_H - PAD_B + 14}
                fontSize={11}
                textAnchor="middle"
                fill="currentColor"
                className="text-muted"
              >
                {v}
              </text>
            ))}
            {[0, 2, 4, 6, 8, 10].map((v) => (
              <text
                key={`yt-${v}`}
                x={PAD_L - 6}
                y={yToPx(v) + 3}
                fontSize={11}
                textAnchor="end"
                fill="currentColor"
                className="text-muted"
              >
                {v}
              </text>
            ))}
            <text
              x={SCATTER_W / 2}
              y={SCATTER_H - 4}
              fontSize={11}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted"
            >
              Giờ học / tuần
            </text>
            <text
              x={10}
              y={SCATTER_H / 2}
              fontSize={11}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted"
              transform={`rotate(-90 10 ${SCATTER_H / 2})`}
            >
              Điểm
            </text>
            {/* đường threshold đang xem trước */}
            {activeLeaf && (
              <>
                {feature === "hours" ? (
                  <line
                    x1={xToPx(threshold)}
                    y1={PAD_T}
                    x2={xToPx(threshold)}
                    y2={SCATTER_H - PAD_B}
                    stroke="#6366f1"
                    strokeDasharray="4 3"
                    strokeWidth={1.6}
                  />
                ) : (
                  <line
                    x1={PAD_L}
                    y1={yToPx(threshold)}
                    x2={SCATTER_W - PAD_R}
                    y2={yToPx(threshold)}
                    stroke="#6366f1"
                    strokeDasharray="4 3"
                    strokeWidth={1.6}
                  />
                )}
              </>
            )}
            {/* các điểm */}
            {DATA.map((s) => {
              const inLeaf = activeLeaf?.samples.includes(s) ?? false;
              return (
                <circle
                  key={s.id}
                  cx={xToPx(s.hours)}
                  cy={yToPx(s.score)}
                  r={inLeaf ? 5 : 3.5}
                  fill={s.pass === 1 ? "#10b981" : "#ef4444"}
                  stroke={inLeaf ? "#fbbf24" : "#fff"}
                  strokeWidth={inLeaf ? 1.8 : 1}
                  opacity={activeLeaf && !inLeaf ? 0.3 : 1}
                />
              );
            })}
          </svg>
          <p className="text-[10px] text-tertiary mt-1 text-center">
            Xanh = qua môn, đỏ = rớt. Đường tím = ngưỡng bạn đang xem trước.
          </p>
        </div>

        {/* Cây phải */}
        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <ListTree size={14} className="text-accent" />
            <span className="text-xs font-semibold text-foreground">
              Cây quyết định hiện tại
            </span>
            <span className="ml-auto text-[10px] text-tertiary">
              {leafCount} lá · acc {Math.round(acc * 100)}%
            </span>
          </div>
          <TreeView
            tree={tree}
            activeId={activeLeaf?.id}
            onPickLeaf={(id) => setTargetLeafId(id)}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">
            Chia nút
          </span>
          {activeLeaf ? (
            <span className="text-xs text-foreground">
              {activeLeaf.id === "root" ? "Gốc" : "Lá " + activeLeaf.id} —{" "}
              <span className="text-muted">{activeLeaf.samples.length} mẫu</span>
            </span>
          ) : (
            <span className="text-xs text-muted">
              Không còn lá nào đủ điều kiện chia — cây đã đạt độ sâu 3.
            </span>
          )}
        </div>
        {activeLeaf && (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFeature("hours")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  feature === "hours"
                    ? "bg-accent text-white border-accent"
                    : "border-border bg-card hover:bg-surface text-foreground"
                }`}
              >
                Chia theo giờ học
              </button>
              <button
                type="button"
                onClick={() => setFeature("score")}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  feature === "score"
                    ? "bg-accent text-white border-accent"
                    : "border-border bg-card hover:bg-surface text-foreground"
                }`}
              >
                Chia theo điểm
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">
                  Ngưỡng ({feature === "hours" ? "giờ học" : "điểm"}) ≤{" "}
                  <strong>{threshold.toFixed(1)}</strong>
                </span>
                <span className="text-[10px] text-tertiary tabular-nums">
                  trái {preview.left.length} · phải {preview.right.length}
                </span>
              </div>
              <input
                type="range"
                min={feature === "hours" ? 1 : 1}
                max={feature === "hours" ? 11 : 9}
                step={0.5}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-accent"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-surface/70 border border-border p-2">
                <div className="text-[10px] text-tertiary uppercase">Gini trước</div>
                <div className="font-semibold text-foreground tabular-nums">
                  {giniBefore.toFixed(3)}
                </div>
              </div>
              <div className="rounded-lg bg-surface/70 border border-border p-2">
                <div className="text-[10px] text-tertiary uppercase">Gini sau</div>
                <div className="font-semibold text-foreground tabular-nums">
                  {giniAfter.toFixed(3)}
                </div>
              </div>
              <div
                className="rounded-lg border p-2"
                style={{
                  borderColor: gainPreview > 0 ? "#10b98160" : "#ef444460",
                  backgroundColor: gainPreview > 0 ? "#10b98115" : "#ef444415",
                }}
              >
                <div className="text-[10px] text-tertiary uppercase">Giảm</div>
                <div
                  className="font-semibold tabular-nums"
                  style={{ color: gainPreview > 0 ? "#059669" : "#b91c1c" }}
                >
                  {gainPreview >= 0 ? "+" : ""}
                  {gainPreview.toFixed(3)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addSplit}
                disabled={preview.left.length === 0 || preview.right.length === 0}
                className="text-xs px-3 py-1.5 rounded-full bg-accent text-white font-semibold disabled:opacity-40"
              >
                <Split size={12} className="inline mr-1" /> Áp dụng split này
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:text-foreground"
              >
                <RotateCcw size={12} className="inline mr-1" /> Làm lại từ đầu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Mini component vẽ cây (dùng trong nhiều demo) */
interface TreeViewProps {
  tree: Node;
  activeId?: string;
  onPickLeaf?: (id: string) => void;
  highlightPath?: string[];
}

function TreeView({ tree, activeId, onPickLeaf, highlightPath }: TreeViewProps) {
  const W_ = 520;
  const levelH = 72;
  const leaves = listLeaves(tree);
  const maxDepth = Math.max(1, ...leaves.map((l) => l.depth));
  const H_ = 40 + maxDepth * levelH + 50;

  const positions = new Map<string, { x: number; y: number }>();
  const leafGap = W_ / (leaves.length + 1);
  leaves.forEach((l, i) => {
    positions.set(l.id, { x: leafGap * (i + 1), y: 30 + l.depth * levelH });
  });
  function place(n: Node) {
    if (!n.feature) return;
    if (n.left) place(n.left);
    if (n.right) place(n.right);
    const lx = positions.get(n.left!.id)?.x ?? 0;
    const rx = positions.get(n.right!.id)?.x ?? 0;
    positions.set(n.id, { x: (lx + rx) / 2, y: 30 + n.depth * levelH });
  }
  place(tree);

  function walk(n: Node, out: Node[] = []): Node[] {
    out.push(n);
    if (n.left) walk(n.left, out);
    if (n.right) walk(n.right, out);
    return out;
  }
  const all = walk(tree);

  return (
    <svg
      viewBox={`0 0 ${W_} ${H_}`}
      className="w-full"
      role="img"
      aria-label={`Cây quyết định, sâu ${maxDepth}, ${leaves.length} lá`}
    >
      {all.map((n) => {
        if (!n.feature) return null;
        const pos = positions.get(n.id);
        const lp = positions.get(n.left!.id);
        const rp = positions.get(n.right!.id);
        if (!pos || !lp || !rp) return null;
        const leftOnPath = highlightPath?.includes(n.left!.id) ?? false;
        const rightOnPath = highlightPath?.includes(n.right!.id) ?? false;
        return (
          <g key={"e-" + n.id}>
            <motion.line
              x1={pos.x}
              y1={pos.y + 16}
              x2={lp.x}
              y2={lp.y - 16}
              stroke={leftOnPath ? "#10b981" : "#10b98166"}
              strokeWidth={leftOnPath ? 2.8 : 1.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.line
              x1={pos.x}
              y1={pos.y + 16}
              x2={rp.x}
              y2={rp.y - 16}
              stroke={rightOnPath ? "#ef4444" : "#ef444466"}
              strokeWidth={rightOnPath ? 2.8 : 1.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={(pos.x + lp.x) / 2 - 8}
              y={(pos.y + lp.y) / 2}
              fontSize={11}
              fill="#10b981"
              fontWeight={600}
            >
              ≤
            </text>
            <text
              x={(pos.x + rp.x) / 2 + 4}
              y={(pos.y + rp.y) / 2}
              fontSize={11}
              fill="#ef4444"
              fontWeight={600}
            >
              &gt;
            </text>
          </g>
        );
      })}
      {all.map((n) => {
        const pos = positions.get(n.id);
        if (!pos) return null;
        const isLeaf = !n.feature;
        const label = majority(n.samples);
        const isActive = n.id === activeId;
        const onPath = highlightPath?.includes(n.id);
        const pCount = n.samples.filter((s) => s.pass === 1).length;
        const fCount = n.samples.length - pCount;
        const canClick =
          isLeaf &&
          onPickLeaf &&
          n.depth < 3 &&
          giniOf(n.samples) > 0 &&
          n.samples.length >= 3;
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            {isLeaf ? (
              <g
                onClick={() => canClick && onPickLeaf(n.id)}
                style={{ cursor: canClick ? "pointer" : "default" }}
              >
                <rect
                  x={pos.x - 34}
                  y={pos.y - 16}
                  width={68}
                  height={32}
                  rx={8}
                  fill={label === 1 ? "#10b981" : "#ef4444"}
                  fillOpacity={isActive ? 0.35 : 0.15}
                  stroke={label === 1 ? "#10b981" : "#ef4444"}
                  strokeWidth={isActive || onPath ? 2.4 : 1.4}
                />
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={label === 1 ? "#059669" : "#b91c1c"}
                >
                  {label === 1 ? "QUA" : "RỚT"}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  className="text-muted"
                >
                  {pCount}/{fCount}
                </text>
              </g>
            ) : (
              <g>
                <rect
                  x={pos.x - 56}
                  y={pos.y - 16}
                  width={112}
                  height={32}
                  rx={8}
                  fill="#6366f1"
                  fillOpacity={0.1}
                  stroke="#6366f1"
                  strokeWidth={onPath ? 2.4 : 1.4}
                />
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#4f46e5"
                >
                  {n.feature === "hours" ? "Giờ" : "Điểm"} ≤ {n.threshold!.toFixed(1)}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  className="text-muted"
                >
                  n = {n.samples.length}
                </text>
              </g>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 2 — SO SÁNH GINI vs ENTROPY & max_depth
 * ════════════════════════════════════════════════════════════════════ */
function ImpurityDepthDemo() {
  const initial = { maxDepth: 3 };
  return (
    <SliderGroup
      title="Thử thay đổi max_depth — xem cây 'mọc' sâu hơn hay bị cắt tỉa"
      sliders={[
        {
          key: "maxDepth",
          label: "max_depth (giới hạn độ sâu)",
          min: 1,
          max: 5,
          step: 1,
          defaultValue: initial.maxDepth,
        },
      ]}
      visualization={(values) => {
        const d = values.maxDepth;
        const treeG = buildTree(DATA, 0, d, "gini", "G");
        const treeE = buildTree(DATA, 0, d, "entropy", "E");

        function leafCount(n: Node): number {
          if (!n.feature) return 1;
          return leafCount(n.left!) + leafCount(n.right!);
        }
        function acc(n: Node): number {
          function p(s: Sample, n: Node): 0 | 1 {
            if (!n.feature || n.threshold === undefined) return majority(n.samples);
            return s[n.feature] <= n.threshold ? p(s, n.left!) : p(s, n.right!);
          }
          return DATA.filter((s) => p(s, n) === s.pass).length / DATA.length;
        }

        return (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                    GINI
                  </span>
                  <span className="text-[10px] text-muted">
                    {leafCount(treeG)} lá · acc {Math.round(acc(treeG) * 100)}%
                  </span>
                </div>
                <TreeView tree={treeG} />
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                    ENTROPY
                  </span>
                  <span className="text-[10px] text-muted">
                    {leafCount(treeE)} lá · acc {Math.round(acc(treeE) * 100)}%
                  </span>
                </div>
                <TreeView tree={treeE} />
              </div>
            </div>
            <p className="text-[11px] text-muted leading-relaxed text-center">
              Gini và Entropy thường cho kết quả rất gần nhau. Khi max_depth lớn hơn, cây sâu
              hơn — accuracy trên tập train tăng nhưng rủi ro overfitting cũng tăng.
            </p>
          </div>
        );
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
 * DEMO 3 — CHẤM ĐIỂM MÀ MÁY TÍNH CHỌN
 * Thuật toán greedy chọn split giảm Gini nhiều nhất — so sánh 3 lựa chọn
 * ════════════════════════════════════════════════════════════════════ */
function ImpurityChoiceChallenge() {
  const options: { feature: Feature; threshold: number; label: string }[] = [
    { feature: "hours", threshold: 5.5, label: "Chia giờ học ≤ 5.5" },
    { feature: "score", threshold: 6.5, label: "Chia điểm ≤ 6.5" },
    { feature: "hours", threshold: 2.5, label: "Chia giờ học ≤ 2.5" },
  ];
  const scored = options.map((o) => {
    const { left, right } = splitSamples(DATA, o.feature, o.threshold);
    const g =
      (left.length / DATA.length) * giniOf(left) +
      (right.length / DATA.length) * giniOf(right);
    return { ...o, giniAfter: g, gain: giniOf(DATA) - g };
  });
  const bestIdx = scored.reduce(
    (best, cur, i) => (cur.gain > scored[best].gain ? i : best),
    0,
  );

  return (
    <InlineChallenge
      question="Lựa chọn chia nào giảm Gini nhiều nhất? (Gini gốc của 24 mẫu là 0.500 — hai lớp cân bằng)"
      options={scored.map(
        (s) => `${s.label} → Gini sau = ${s.giniAfter.toFixed(3)} (giảm ${s.gain.toFixed(3)})`,
      )}
      correct={bestIdx}
      explanation={`Đáp án: ${scored[bestIdx].label}. Máy tính thử TẤT CẢ các khả năng rồi chọn cái giảm Gini nhiều nhất — đó chính là thuật toán của cây quyết định (CART). Lựa chọn C tạo ra một nhánh gần như trống, nên gần như không học được gì.`}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
 * QUIZ
 * ════════════════════════════════════════════════════════════════════ */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Cây quyết định chọn câu hỏi nào tại mỗi nút để chia dữ liệu?",
    options: [
      "Câu hỏi ngẫu nhiên cho đến khi ra kết quả",
      "Câu hỏi giảm Gini (hoặc tăng information gain) nhiều nhất sau khi thử mọi ngưỡng",
      "Câu hỏi về đặc trưng có giá trị trung bình lớn nhất",
      "Câu hỏi do người lập trình viết tay",
    ],
    correct: 1,
    explanation:
      "Thuật toán CART thử tất cả các cặp (đặc trưng, ngưỡng) ứng viên, tính Gini sau khi chia, rồi chọn cặp cho Gini nhỏ nhất — tức giảm độ lẫn lộn nhiều nhất.",
  },
  {
    question:
      "Một nút chứa 100% lớp 'qua môn'. Gini của nút này bằng bao nhiêu?",
    options: ["0", "0.25", "0.5", "1.0"],
    correct: 0,
    explanation:
      "Gini = 1 − Σp². Khi p₁ = 1 thì Gini = 1 − 1² = 0. Nút 'thuần khiết' luôn có Gini = 0. Gini cao nhất (0.5 với 2 lớp) là khi 50/50.",
  },
  {
    question:
      "Cây quyết định quá sâu (max_depth rất lớn) thường gặp vấn đề gì?",
    options: [
      "Chạy chậm khi train, nhưng dự đoán chính xác hơn",
      "Học thuộc cả nhiễu trong dữ liệu huấn luyện (overfitting) — trên dữ liệu mới sẽ sai",
      "Không phân loại được dữ liệu có hai lớp",
      "Bị giới hạn cứng ở độ sâu 10 vì kiến trúc CPU",
    ],
    correct: 1,
    explanation:
      "Cây sâu có thể tạo một nhánh riêng cho từng điểm, 'thuộc lòng' tập huấn luyện. Giải pháp: giới hạn max_depth, tăng min_samples_leaf, hoặc dùng Random Forest.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức Gini impurity cho hai lớp có xác suất p₀ và p₁ là Gini = 1 − ({blank})² − ({blank})².",
    blanks: [
      { answer: "p0", accept: ["p_0", "p0", "p₀"] },
      { answer: "p1", accept: ["p_1", "p1", "p₁"] },
    ],
    explanation:
      "Gini = 1 − Σ pₖ². Với hai lớp, Gini = 1 − p₀² − p₁². Khi p₀ = p₁ = 0.5, Gini đạt giá trị lớn nhất = 0.5.",
  },
  {
    question:
      "Ưu điểm lớn nhất của cây quyết định so với nhiều thuật toán khác là gì?",
    options: [
      "Luôn chính xác hơn mạng nơ-ron",
      "Có thể đọc từng nhánh để giải thích tại sao — ngân hàng, y tế rất cần điều này",
      "Không cần dữ liệu huấn luyện",
      "Chạy nhanh hơn mọi thuật toán trên mọi tập dữ liệu",
    ],
    correct: 1,
    explanation:
      "Cây quyết định tạo ra luật IF–THEN mà con người đọc được. Trong tài chính, y tế — nơi cần giải thích quyết định — đây là lợi thế rất lớn.",
  },
];

/* ════════════════════════════════════════════════════════════════════
 * COMPONENT CHÍNH
 * ════════════════════════════════════════════════════════════════════ */
export default function DecisionTreesTopic() {
  const TOTAL = 8;

  /* Bộ đếm split đang áp dụng — dùng bởi Manual builder */
  const builder = useMemo(() => <ManualTreeBuilder />, []);

  /* Ba câu hỏi demo kiểu '20 câu hỏi' để HOOK */
  const twentyQCtx = useTwentyQuestions();

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK + DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL} label="Hook">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TreePine size={18} className="text-accent" /> Hỏi 20 câu để đoán đồ vật
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hồi nhỏ bạn từng chơi game &ldquo;Tôi đang nghĩ đến một con vật&rdquo; — bạn hỏi
            liên tục: <em>Nó sống trên cạn không?</em> → <em>Có 4 chân không?</em> →{" "}
            <em>Nó có sọc không?</em>. Mỗi câu hỏi <strong>chia đôi khả năng</strong> cho đến
            khi chỉ còn lại một đáp án. <strong>Cây quyết định làm đúng như vậy</strong> —
            chỉ khác là máy tính chọn câu hỏi có ích nhất bằng một công thức thay vì linh cảm.
          </p>
          {twentyQCtx}
        </div>

        <div className="mt-6">
          <PredictionGate
            question="Bạn đưa cho AI 24 học sinh (giờ học, điểm kiểm tra) và bảo nó dự đoán ai qua môn. AI chọn câu hỏi đầu tiên ở gốc cây bằng cách nào?"
            options={[
              "Thử vài câu ngẫu nhiên, chọn câu đầu tiên hoạt động",
              "Hỏi thầy cô xem đặc trưng nào quan trọng",
              "Thử TẤT CẢ các cặp (đặc trưng, ngưỡng) có thể, chọn cái giảm Gini nhiều nhất",
              "Luôn bắt đầu bằng đặc trưng nằm ở cột đầu tiên của dữ liệu",
            ]}
            correct={2}
            explanation="Cây quyết định không đoán — nó thử hết mọi câu hỏi hợp lệ, đo xem câu nào làm dữ liệu 'sạch' nhất sau khi chia, rồi chọn câu đó. Đây là phần brute-force cốt lõi của thuật toán CART."
          >
            <p className="text-sm text-muted mt-4 leading-relaxed">
              Trong phần tiếp theo bạn sẽ tự tay chọn câu hỏi cho cây — và xem máy tính đánh giá
              từng lựa chọn bằng Gini ngay trên biểu đồ.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ / CÁCH ĐỌC CÂY ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL} label="Cách đọc cây">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Một cây có ba loại phần:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-900/15 dark:border-indigo-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Nút câu hỏi
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Mỗi nút bên trong cây là một câu hỏi kiểu{" "}
                <em>&ldquo;đặc trưng X ≤ ngưỡng T?&rdquo;</em>. Nhánh trái (≤) — nhánh phải (&gt;).
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/15 dark:border-emerald-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Lá QUA
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Kết thúc nhánh. Lá xanh = đa số mẫu rơi vào đây thuộc lớp &ldquo;qua môn&rdquo;.
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-900/15 dark:border-red-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Lá RỚT
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Lá đỏ = đa số mẫu ở đây thuộc lớp &ldquo;rớt&rdquo;. Dự đoán cho một điểm mới =
                đi theo câu hỏi đến khi chạm lá.
              </p>
            </div>
          </div>
          <Callout variant="insight" title="Mỗi câu hỏi cắt không gian dữ liệu thành 2 phần">
            Trên biểu đồ scatter, một câu hỏi kiểu &ldquo;giờ học ≤ 5.5&rdquo; là một{" "}
            <strong>đường thẳng đứng</strong>. Một câu hỏi &ldquo;điểm ≤ 6.5&rdquo; là một{" "}
            <strong>đường nằm ngang</strong>. Cả cây sẽ tạo ra những &ldquo;ô chữ nhật&rdquo; tô
            màu — nền xanh là vùng dự đoán qua môn, nền đỏ là vùng rớt.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN: XÂY CÂY + THỬ GINI ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection step={1} label="Thử nghiệm 1 · Tự tay xây cây">
            <p className="text-sm text-muted leading-relaxed mb-3">
              Chọn đặc trưng, kéo ngưỡng, và xem cây mọc ra. Mỗi lần áp dụng một split, cây
              mọc thêm một tầng. Tối đa độ sâu 3 — chính là mức dùng trong thực tế để tránh
              overfitting.
            </p>
            {builder}
          </LessonSection>

          <LessonSection step={2} label="Thử nghiệm 2 · max_depth và tiêu chí">
            <ImpurityDepthDemo />
          </LessonSection>

          <LessonSection step={3} label="Thử thách · Máy tính sẽ chọn split nào?">
            <ImpurityChoiceChallenge />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Cây quyết định <strong>không thông minh hơn bạn</strong> — nó chỉ{" "}
          <strong>chăm chỉ hơn</strong>. Nó thử mọi câu hỏi có thể, đo độ lẫn lộn của dữ liệu
          sau khi chia bằng công thức Gini, và chọn câu hỏi giảm độ lẫn lộn nhiều nhất. Lặp
          lại quy trình đó ở từng nút → bạn có một cây tự mọc ra từ dữ liệu, đọc được từng
          nhánh như đọc một bản thuật toán chẩn đoán của bác sĩ.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL} label="Thử thách">
        <InlineChallenge
          question="Bạn có 2 cây: A (sâu 2, acc_train = 82%, acc_val = 80%) vs B (sâu 8, acc_train = 99%, acc_val = 73%). Chọn cây nào đem ra dùng thật?"
          options={[
            "Cây B — accuracy trên tập train cao hơn",
            "Cây A — val accuracy cao hơn, không bị overfitting",
            "Không có cây nào ổn — cần thử cây sâu hơn nữa",
            "Trung bình kết quả của cả hai cây",
          ]}
          correct={1}
          explanation="Val accuracy là thước đo thật, vì mô hình sẽ gặp dữ liệu mới tương tự val set. Cây A tổng quát tốt hơn. Cây B đã học thuộc nhiễu — khoảng cách giữa train và val là cờ đỏ của overfitting. Luôn chọn theo val/test."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Ở mỗi nút, cây quyết định trả lời đúng một câu:{" "}
            <strong>trong tất cả cách chia, cách nào làm dữ liệu &ldquo;sạch&rdquo; nhất?</strong>{" "}
            Có hai công thức phổ biến để đo độ sạch — cả hai đều nhỏ khi dữ liệu đã gần như
            cùng một lớp.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Công thức 1 — Gini impurity (mặc định của scikit-learn)
          </h4>
          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
            <LaTeX block>{"\\text{Gini} = 1 - \\sum_{k} p_k^2"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Nói bằng tiếng Việt đời thường: &ldquo;Nếu bạn rút ngẫu nhiên 1 mẫu ra, và đoán
              nhãn cho nó bằng cách lại rút ngẫu nhiên 1 mẫu nữa — xác suất đoán sai là bao
              nhiêu?&rdquo;. Dữ liệu thuần một lớp → Gini = 0. Hai lớp cân bằng 50/50 → Gini =
              0.5 (cao nhất).
            </p>
            <GiniVisual />
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Công thức 2 — Entropy (nền tảng lý thuyết thông tin)
          </h4>
          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
            <LaTeX block>{"H = -\\sum_{k} p_k \\log_2 p_k"}</LaTeX>
            <p className="text-xs text-muted leading-relaxed">
              Nói bằng tiếng Việt đời thường: &ldquo;Cần trung bình bao nhiêu câu hỏi yes/no để
              biết chắc nhãn của một mẫu?&rdquo;. Thuần 1 lớp → cần 0 câu, H = 0. 50/50 → cần 1
              câu, H = 1 (cho 2 lớp). Gini và Entropy thường cho cây gần như giống nhau — chọn
              cái nào cũng ổn, scikit-learn mặc định dùng Gini vì nhanh hơn (không có log).
            </p>
          </div>

          <Callout variant="tip" title="Giảm Gini bao nhiêu là đủ?">
            Không có ngưỡng cố định. Cây quyết định <em>dừng</em> khi: (a) đạt max_depth bạn
            đặt, (b) nút đã thuần khiết, hoặc (c) không còn split nào làm giảm Gini đáng kể.
            Trong thực tế, bạn để max_depth cố định nhỏ (2–6) và để thuật toán tự quyết khi
            nào dừng sớm.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Quy trình ở mỗi nút
          </h4>
          <StepReveal
            labels={["Bước 1: liệt kê", "Bước 2: chia thử", "Bước 3: đo Gini", "Bước 4: chọn"]}
          >
            {[
              <div key="s1" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Liệt kê mọi ngưỡng ứng viên.</strong> Với mỗi đặc trưng, sắp xếp các
                  giá trị khác nhau, rồi lấy trung điểm giữa hai giá trị kề nhau làm ngưỡng
                  thử. Nếu đặc trưng có 15 giá trị khác nhau → 14 ngưỡng.
                </p>
              </div>,
              <div key="s2" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Chia dữ liệu theo từng ngưỡng.</strong> Với mỗi cặp (đặc trưng,
                  ngưỡng), tách mẫu thành hai nhánh: trái (≤) và phải (&gt;).
                </p>
              </div>,
              <div key="s3" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Tính Gini có trọng số.</strong>{" "}
                  Gini_sau = (n_trái/n) · Gini(trái) + (n_phải/n) · Gini(phải). Ngưỡng nào cho
                  Gini_sau nhỏ nhất = tốt nhất ở nút này.
                </p>
              </div>,
              <div key="s4" className="rounded-lg border border-border bg-surface/60 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Chọn cặp tốt nhất, đệ quy.</strong> Áp dụng split tốt nhất vào nút,
                  rồi lặp lại toàn bộ quy trình cho hai nút con — cho đến khi dữ liệu sạch
                  hoặc đạt max_depth.
                </p>
              </div>,
            ]}
          </StepReveal>

          <h4 className="text-sm font-semibold text-foreground mt-5">
            Tham số quan trọng cần biết
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
            {[
              {
                name: "max_depth",
                desc: "Giới hạn số tầng của cây. Nhỏ (2–4) → đơn giản, dễ hiểu, ít overfit. Lớn (8+) → accuracy train cao nhưng rủi ro overfit.",
                color: "#6366f1",
              },
              {
                name: "min_samples_leaf",
                desc: "Số mẫu tối thiểu ở mỗi lá. Đặt 10–20 với dataset vừa phải để tránh lá quá nhỏ = lá học thuộc.",
                color: "#0ea5e9",
              },
              {
                name: "criterion",
                desc: "'gini' (mặc định, nhanh) hoặc 'entropy' (gốc lý thuyết thông tin). Hai cái thường cho kết quả rất gần nhau.",
                color: "#10b981",
              },
              {
                name: "ccp_alpha",
                desc: "Cost-complexity pruning — 'phạt' cây lớn. Tăng α → cây nhỏ hơn. Là cách hiện đại để tránh overfit thay cho min_samples.",
                color: "#f59e0b",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-xl border bg-card p-3 space-y-1"
                style={{ borderLeft: `4px solid ${p.color}` }}
              >
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <Callout variant="warning" title="Một cây đơn có variance rất cao">
            Đổi vài điểm trong tập huấn luyện → cây có thể đổi gần như toàn bộ. Đó là lý do
            trong thực tế hiếm khi bạn dùng một cây đơn — mà dùng{" "}
            <TopicLink slug="random-forests">Random Forest</TopicLink> (trung bình hàng trăm
            cây) hoặc <TopicLink slug="gradient-boosting">Gradient Boosting</TopicLink>{" "}
            (XGBoost, LightGBM). Cây đơn chỉ nên dùng khi bạn cần đọc được luật để trình bày
            cho người ngoài chuyên môn.
          </Callout>

          <p className="leading-relaxed mt-4">
            Cây quyết định kết nối với nhiều khái niệm khác:{" "}
            <TopicLink slug="overfitting-underfitting">overfitting/underfitting</TopicLink>{" "}
            giải thích vì sao phải giới hạn độ sâu,{" "}
            <TopicLink slug="bias-variance">đánh đổi bias-variance</TopicLink> là khung lý
            thuyết chung, và khi bạn thấy cây quyết định &ldquo;đọc&rdquo; xong, bạn cũng đã
            sẵn sàng học <TopicLink slug="random-forests">Random Forest</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL} label="Tóm tắt">
        <MiniSummary
          title="4 điều cần nhớ về cây quyết định"
          points={[
            "Cây quyết định = chuỗi câu hỏi 'đặc trưng ≤ ngưỡng?'. Dự đoán = đi theo câu hỏi từ gốc đến khi chạm lá.",
            "Chọn split tốt nhất ở mỗi nút bằng Gini (hoặc Entropy) — thử hết mọi cặp (đặc trưng, ngưỡng), chọn cái giảm độ lẫn lộn nhiều nhất.",
            "Ưu điểm: dễ đọc, không cần chuẩn hóa dữ liệu, xử lý đặc trưng hỗn hợp tự nhiên, robust với outlier.",
            "Nhược điểm: cây sâu = overfit. Kiểm soát bằng max_depth, min_samples_leaf, ccp_alpha; hoặc dùng Random Forest / Boosting để mạnh hơn hẳn.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Muốn xem ngành thật dùng cây quyết định ra sao?">
            Xem ứng dụng chấm điểm tín dụng:{" "}
            <TopicLink slug="decision-trees-in-loan-scoring">
              Cây quyết định trong chấm điểm tín dụng
            </TopicLink>{" "}
            — cách ngân hàng và FICO dùng cây để quyết cho vay hay không, và vì sao tính
            &ldquo;đọc được&rdquo; của cây là yêu cầu pháp lý.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * HOOK PHỤ — MINI GAME "20 CÂU HỎI"
 * Không dùng useContext, chỉ để HOOK section có một tương tác nhỏ đặc biệt.
 * ════════════════════════════════════════════════════════════════════ */
function useTwentyQuestions() {
  const [path, setPath] = useState<string[]>([]);
  const tree = QUESTION_TREE;

  let node: QNode = tree;
  for (const ans of path) {
    const next = ans === "yes" ? node.yes : node.no;
    if (!next) break;
    node = next;
  }

  const isLeaf = !!node.answer;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-amber-500" />
        <span className="text-xs font-semibold text-foreground">
          Thử mini-game: đoán con vật
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={path.join("-") || "root"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="min-h-[70px]"
        >
          {isLeaf ? (
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-sm text-foreground">
                <strong>{node.answer}</strong> — cây đã dẫn bạn qua{" "}
                <span className="text-accent font-semibold">{path.length}</span> câu hỏi!
              </span>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{node.question}</p>
          )}
        </motion.div>
      </AnimatePresence>
      {!isLeaf ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPath((p) => [...p, "yes"])}
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
          >
            <Check size={12} aria-hidden="true" />
            Đúng
          </button>
          <button
            type="button"
            onClick={() => setPath((p) => [...p, "no"])}
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/20"
          >
            <X size={12} aria-hidden="true" />
            Sai
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPath([])}
          className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:text-foreground"
        >
          <RotateCcw size={11} className="inline mr-1" /> Chơi lại
        </button>
      )}
    </div>
  );
}

interface QNode {
  question?: string;
  answer?: string;
  yes?: QNode;
  no?: QNode;
}

const QUESTION_TREE: QNode = {
  question: "Nó sống trên cạn không?",
  yes: {
    question: "Nó có bốn chân không?",
    yes: {
      question: "Nó có sọc vằn không?",
      yes: { answer: "Hổ" },
      no: { answer: "Chó" },
    },
    no: {
      question: "Nó có cánh và bay được không?",
      yes: { answer: "Chim sẻ" },
      no: { answer: "Rắn" },
    },
  },
  no: {
    question: "Nó có vây không?",
    yes: { answer: "Cá" },
    no: { answer: "Sứa" },
  },
};

/* ════════════════════════════════════════════════════════════════════
 * MÔ PHỎNG GINI — biểu đồ dải Gini theo p₁
 * ════════════════════════════════════════════════════════════════════ */
function GiniVisual() {
  const points = useMemo(() => {
    const out: { p: number; g: number; h: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const p = i / 20;
      const g = 1 - (p * p + (1 - p) * (1 - p));
      const ent =
        (p > 0 ? -p * Math.log2(p) : 0) +
        (p < 1 ? -(1 - p) * Math.log2(1 - p) : 0);
      out.push({ p, g, h: ent });
    }
    return out;
  }, []);
  const W_ = 380;
  const H_ = 140;
  const toX = (p: number) => 30 + p * (W_ - 50);
  const toY = (v: number, maxV: number) => H_ - 20 - (v / maxV) * (H_ - 40);
  const pathGini = points
    .map((pt, i) => (i === 0 ? "M" : "L") + toX(pt.p) + "," + toY(pt.g, 1))
    .join(" ");
  const pathEntropy = points
    .map((pt, i) => (i === 0 ? "M" : "L") + toX(pt.p) + "," + toY(pt.h, 1))
    .join(" ");
  const [hover, setHover] = useState<number>(0.5);
  const gHover = 1 - (hover * hover + (1 - hover) * (1 - hover));
  const hHover =
    (hover > 0 ? -hover * Math.log2(hover) : 0) +
    (hover < 1 ? -(1 - hover) * Math.log2(1 - hover) : 0);

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W_} ${H_}`}
        className="w-full"
        role="img"
        aria-label="Đường cong Gini và Entropy theo tỉ lệ lớp 1"
      >
        {/* trục */}
        <line x1={30} y1={H_ - 20} x2={W_ - 20} y2={H_ - 20} stroke="currentColor" className="text-border" />
        <line x1={30} y1={20} x2={30} y2={H_ - 20} stroke="currentColor" className="text-border" />
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={30}
            y1={toY(t, 1)}
            x2={W_ - 20}
            y2={toY(t, 1)}
            stroke="currentColor"
            strokeOpacity={0.06}
          />
        ))}
        {/* Entropy (chia 2 cho dễ nhìn chung trục) — thực tế max = 1 */}
        <path d={pathEntropy} stroke="#a855f7" strokeWidth={1.6} fill="none" />
        <path d={pathGini} stroke="#0ea5e9" strokeWidth={2} fill="none" />
        {/* hover marker */}
        <circle cx={toX(hover)} cy={toY(gHover, 1)} r={4} fill="#0ea5e9" />
        <circle cx={toX(hover)} cy={toY(hHover, 1)} r={4} fill="#a855f7" />
        {/* labels */}
        <text x={W_ - 20} y={H_ - 6} fontSize={11} textAnchor="end" fill="currentColor" className="text-muted">
          p₁ (tỉ lệ lớp 1)
        </text>
        <text x={20} y={18} fontSize={11} fill="currentColor" className="text-muted">
          Độ lẫn lộn
        </text>
      </svg>
      <div className="flex items-center gap-3 text-[10px] text-tertiary">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded bg-sky-500" /> Gini
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded bg-purple-500" /> Entropy
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted">Thử p₁:</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={hover}
          onChange={(e) => setHover(parseFloat(e.target.value))}
          className="flex-1 h-1.5 accent-accent"
        />
        <span className="text-[10px] tabular-nums text-foreground">
          p₁={hover.toFixed(2)} · Gini={gHover.toFixed(3)} · H={hHover.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

