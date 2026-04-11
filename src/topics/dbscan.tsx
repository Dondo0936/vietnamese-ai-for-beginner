"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "dbscan",
  title: "DBSCAN",
  titleVi: "Phân cụm dựa trên mật độ",
  description: "Thuật toán phân cụm tìm vùng mật độ cao, tự xác định số cụm và phát hiện nhiễu",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning", "density"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means", "pca", "knn"],
  vizType: "interactive",
};

/* ── Data ── */
type Pt = { x: number; y: number };

function dist(a: Pt, b: Pt) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const DATA: Pt[] = [
  /* Cluster 1: dense circle top-left */
  { x: 80, y: 80 }, { x: 100, y: 60 }, { x: 60, y: 100 }, { x: 90, y: 110 },
  { x: 110, y: 90 }, { x: 70, y: 70 }, { x: 95, y: 75 },
  /* Cluster 2: arc/crescent bottom */
  { x: 200, y: 220 }, { x: 230, y: 240 }, { x: 260, y: 250 }, { x: 290, y: 240 },
  { x: 320, y: 220 }, { x: 250, y: 260 }, { x: 215, y: 235 },
  /* Cluster 3: tight group right */
  { x: 400, y: 100 }, { x: 420, y: 130 }, { x: 380, y: 120 }, { x: 410, y: 80 },
  { x: 430, y: 110 },
  /* Noise */
  { x: 250, y: 50 }, { x: 450, y: 260 }, { x: 30, y: 250 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899"];

/* DBSCAN implementation */
function runDBSCAN(pts: Pt[], eps: number, minPts: number): number[] {
  const n = pts.length;
  const labels = new Array(n).fill(-1); // -1 = unvisited, -2 = noise
  let cluster = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;
    const neighbors = pts.map((p, j) => ({ j, d: dist(pts[i], p) })).filter((x) => x.d <= eps && x.j !== i);

    if (neighbors.length < minPts - 1) {
      labels[i] = -2; // noise
      continue;
    }

    labels[i] = cluster;
    const queue = neighbors.map((x) => x.j);

    while (queue.length > 0) {
      const qi = queue.shift()!;
      if (labels[qi] === -2) labels[qi] = cluster; // noise becomes border
      if (labels[qi] !== -1 && labels[qi] !== -2) continue; // already processed
      labels[qi] = cluster;

      const qNeighbors = pts.map((p, j) => ({ j, d: dist(pts[qi], p) })).filter((x) => x.d <= eps && x.j !== qi);
      if (qNeighbors.length >= minPts - 1) {
        qNeighbors.forEach((x) => { if (labels[x.j] === -1 || labels[x.j] === -2) queue.push(x.j); });
      }
    }
    cluster++;
  }
  return labels;
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function DbscanTopic() {
  const [epsilon, setEpsilon] = useState(55);
  const [minPts, setMinPts] = useState(3);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const labels = useMemo(() => runDBSCAN(DATA, epsilon, minPts), [epsilon, minPts]);
  const numClusters = useMemo(() => new Set(labels.filter((l) => l >= 0)).size, [labels]);
  const numNoise = useMemo(() => labels.filter((l) => l < 0).length, [labels]);

  /* Point type classification */
  const pointTypes = useMemo(() => {
    return DATA.map((p, i) => {
      const neighbors = DATA.filter((q, j) => j !== i && dist(p, q) <= epsilon);
      if (labels[i] < 0) return "noise";
      if (neighbors.length >= minPts - 1) return "core";
      return "border";
    });
  }, [labels, epsilon, minPts]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "So với K-Means, ưu điểm chính của DBSCAN là gì?",
      options: [
        "Chạy nhanh hơn K-Means",
        "Không cần chọn số cụm trước, phát hiện cụm hình dạng bất kỳ, loại bỏ noise",
        "Luôn cho kết quả chính xác hơn K-Means",
      ],
      correct: 1,
      explanation: "DBSCAN tự tìm số cụm dựa trên mật độ, phát hiện cụm hình bán nguyệt/xoắn ốc (K-Means chỉ tìm cụm hình cầu), và đánh dấu noise. Nhưng cần tune ε và minPts!",
    },
    {
      question: "Epsilon (ε) quá lớn thì sao?",
      options: [
        "Tất cả điểm thành noise",
        "Tất cả điểm gộp thành 1 cụm duy nhất",
        "Số cụm tăng lên",
      ],
      correct: 1,
      explanation: "ε lớn → vùng lân cận rộng → mọi điểm là neighbor của nhau → gộp hết thành 1 cụm. ε nhỏ → mỗi điểm cô lập → toàn noise. Cần ε 'vừa đủ'!",
    },
    {
      question: "DBSCAN gặp khó khăn khi nào?",
      options: [
        "Khi dữ liệu có noise",
        "Khi các cụm có mật độ rất khác nhau (1 cụm dày, 1 cụm thưa)",
        "Khi dữ liệu chiều thấp (2D-3D)",
      ],
      correct: 1,
      explanation: "Cùng 1 giá trị ε: cụm dày → tìm tốt, cụm thưa → bị coi là noise. HDBSCAN giải quyết bằng cách tự điều chỉnh ε theo vùng.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Nhìn bản đồ Hà Nội ban đêm từ vệ tinh: có cụm đèn sáng (khu dân cư), vùng tối (đồng ruộng), và vài đèn lẻ (nhà riêng). Bạn muốn phân nhóm các đèn. Dùng K-Means có ổn không?"
          options={[
            "Dùng K-Means được — chọn K = số khu dân cư",
            "Không — vì cụm có hình dạng bất kỳ, số cụm chưa biết, và có đèn lẻ (noise)",
            "K-Means luôn tốt — không cần thuật toán khác",
          ]}
          correct={1}
          explanation="K-Means cần biết K trước và chỉ tìm cụm hình cầu. Khu dân cư có hình dạng bất kỳ, đèn lẻ là noise. DBSCAN tìm cụm dựa trên MẬT ĐỘ — hoàn hảo cho bài toán này!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt <strong className="text-foreground">epsilon (bán kính)</strong>{" "}
          để thay đổi vùng lân cận. Di chuột vào điểm để thấy vùng ε. Quan sát điểm nào là lõi, biên, hay noise.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-border bg-background">
              {/* Epsilon circle for hovered point */}
              {hoveredIdx >= 0 && (
                <motion.circle
                  cx={DATA[hoveredIdx].x} cy={DATA[hoveredIdx].y} r={epsilon}
                  fill={labels[hoveredIdx] >= 0 ? COLORS[labels[hoveredIdx] % COLORS.length] : "#666"}
                  opacity={0.08}
                  stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3"
                  initial={{ r: 0 }} animate={{ r: epsilon }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              )}

              {/* Connection lines for hovered point's neighbors */}
              {hoveredIdx >= 0 && DATA.map((p, j) => {
                if (j === hoveredIdx) return null;
                const d = dist(DATA[hoveredIdx], p);
                if (d > epsilon) return null;
                return (
                  <line key={`conn-${j}`}
                    x1={DATA[hoveredIdx].x} y1={DATA[hoveredIdx].y} x2={p.x} y2={p.y}
                    stroke="#f59e0b" strokeWidth={0.8} opacity={0.3}
                  />
                );
              })}

              {/* Data points */}
              {DATA.map((p, i) => {
                const cluster = labels[i];
                const isNoise = cluster < 0;
                const type = pointTypes[i];
                const color = isNoise ? "#666" : COLORS[cluster % COLORS.length];
                return (
                  <g key={i}>
                    {/* Core point: filled circle. Border: smaller. Noise: X marker */}
                    {isNoise ? (
                      <g opacity={0.5}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(-1)}
                      >
                        <line x1={p.x - 4} y1={p.y - 4} x2={p.x + 4} y2={p.y + 4} stroke="#999" strokeWidth={2} />
                        <line x1={p.x + 4} y1={p.y - 4} x2={p.x - 4} y2={p.y + 4} stroke="#999" strokeWidth={2} />
                      </g>
                    ) : (
                      <circle
                        cx={p.x} cy={p.y}
                        r={type === "core" ? 6 : 4}
                        fill={color}
                        stroke={hoveredIdx === i ? "#fbbf24" : "#fff"}
                        strokeWidth={type === "core" ? 2 : 1.5}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(-1)}
                      />
                    )}
                  </g>
                );
              })}

              {/* Stats */}
              <text x={10} y={18} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
                Cụm: {numClusters} | Noise: {numNoise}
              </text>
              <text x={10} y={34} fontSize={10} fill="currentColor" className="text-muted">
                ε = {epsilon}, minPts = {minPts}
              </text>

              {/* Legend */}
              <circle cx={400} cy={14} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
              <text x={410} y={18} fontSize={9} fill="currentColor" className="text-muted">Lõi (core)</text>
              <circle cx={400} cy={30} r={3.5} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
              <text x={410} y={34} fontSize={9} fill="currentColor" className="text-muted">Biên (border)</text>
              <g>
                <line x1={397} y1={42} x2={403} y2={48} stroke="#999" strokeWidth={1.5} />
                <line x1={403} y1={42} x2={397} y2={48} stroke="#999" strokeWidth={1.5} />
              </g>
              <text x={410} y={49} fontSize={9} fill="currentColor" className="text-muted">Noise</text>
            </svg>

            {/* Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-20 text-xs font-medium text-muted">Epsilon (ε)</label>
                <input type="range" min={20} max={120} value={epsilon}
                  onChange={(e) => setEpsilon(Number(e.target.value))} className="flex-1 accent-accent" />
                <span className="w-8 text-center text-xs font-bold text-accent">{epsilon}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-xs font-medium text-muted">MinPts</label>
                <input type="range" min={2} max={6} value={minPts}
                  onChange={(e) => setMinPts(Number(e.target.value))} className="flex-1 accent-accent" />
                <span className="w-8 text-center text-xs font-bold text-accent">{minPts}</span>
              </div>
            </div>

            <p className="text-xs text-muted">
              Thử ε rất nhỏ (20) → toàn noise. Thử ε rất lớn (120) → 1 cụm duy nhất. Tìm giá trị &quot;vừa đủ&quot;!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>DBSCAN</strong>{" "}
            tìm cụm bằng MẬT ĐỘ: điểm lõi có ≥ minPts láng giềng trong bán kính ε. Cụm = nhóm điểm lõi kết nối nhau. Điểm lẻ loi = noise. Không cần biết số cụm trước!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dữ liệu có 2 cụm: cụm A rất dày (100 điểm/cm²), cụm B rất thưa (5 điểm/cm²). DBSCAN với 1 giá trị ε có phân được cả hai không?"
          options={[
            "Có — DBSCAN xử lý tốt mọi mật độ",
            "Không — ε nhỏ bỏ sót cụm B, ε lớn gộp cả hai. Cần HDBSCAN",
            "Tuỳ vào minPts",
          ]}
          correct={1}
          explanation="Đây là hạn chế lớn nhất của DBSCAN: 1 giá trị ε cho toàn bộ dữ liệu. HDBSCAN (Hierarchical DBSCAN) thử nhiều ε và chọn tối ưu cho từng vùng → giải quyết mật độ khác nhau."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>DBSCAN</strong>{" "}
            (Density-Based Spatial Clustering of Applications with Noise) phân cụm dựa trên hai tham số:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>ε (epsilon):</strong>{" "}Bán kính vùng lân cận</li>
            <li><strong>minPts:</strong>{" "}Số điểm tối thiểu trong vùng ε để là điểm lõi</li>
          </ul>

          <p><strong>Ba loại điểm:</strong></p>
          <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
            <li><strong>Core point:</strong>{" "}<LaTeX>{"|N_\\varepsilon(p)| \\geq \\text{minPts}"}</LaTeX> — có đủ láng giềng</li>
            <li><strong>Border point:</strong>{" "}Trong vùng ε của core point nhưng tự nó không đủ láng giềng</li>
            <li><strong>Noise point:</strong>{" "}Không phải core cũng không phải border</li>
          </ol>

          <p><strong>Thuật toán:</strong></p>
          <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
            <li>Chọn điểm chưa xét. Nếu là core → bắt đầu cụm mới</li>
            <li>Lan cụm: thêm tất cả core points kết nối (density-reachable) vào cụm</li>
            <li>Thêm border points vào cụm gần nhất</li>
            <li>Đánh dấu điểm còn lại là noise</li>
          </ol>

          <LaTeX block>{"N_\\varepsilon(p) = \\{q \\in D \\mid d(p, q) \\leq \\varepsilon\\}"}</LaTeX>

          <Callout variant="tip" title="Chọn ε bằng k-distance plot">
            Tính khoảng cách đến láng giềng thứ k (k = minPts) cho mỗi điểm, sắp xếp tăng dần, vẽ đồ thị. Điểm &quot;khuỷu tay&quot; (elbow) chính là ε tối ưu.
          </Callout>

          <CodeBlock language="python" title="DBSCAN với scikit-learn">
{`from sklearn.cluster import DBSCAN, HDBSCAN
from sklearn.preprocessing import StandardScaler
import numpy as np

X = np.random.randn(300, 2)
# Thêm 3 cụm
X[:100] += [2, 2]
X[100:200] += [-2, -2]
X[200:250] += [2, -2]

# QUAN TRỌNG: Chuẩn hoá trước DBSCAN!
X_scaled = StandardScaler().fit_transform(X)

# DBSCAN
db = DBSCAN(eps=0.5, min_samples=5)
labels = db.fit_predict(X_scaled)
print(f"DBSCAN: {len(set(labels)) - (1 if -1 in labels else 0)} cụm, "
      f"{(labels == -1).sum()} noise")

# HDBSCAN (tốt hơn — tự chọn eps)
hdb = HDBSCAN(min_cluster_size=10)
labels_h = hdb.fit_predict(X_scaled)
print(f"HDBSCAN: {len(set(labels_h)) - (1 if -1 in labels_h else 0)} cụm")`}
          </CodeBlock>

          <Callout variant="warning" title="DBSCAN vs K-Means">
            K-Means: cần K, chỉ cụm hình cầu, gán mọi điểm. DBSCAN: tự tìm K, cụm hình bất kỳ, loại noise. Nhưng DBSCAN chậm hơn O(n²) và nhạy với ε khi mật độ không đồng đều.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "DBSCAN tìm cụm dựa trên mật độ: vùng dày = cụm, vùng thưa = noise.",
          "Hai tham số: ε (bán kính) và minPts (điểm tối thiểu). Ba loại điểm: core, border, noise.",
          "Ưu: không cần K, cụm hình bất kỳ, phát hiện noise. Nhược: nhạy với ε, mật độ không đều.",
          "k-distance plot giúp chọn ε. HDBSCAN tự điều chỉnh ε — nên dùng HDBSCAN khi có thể!",
          "LUÔN chuẩn hoá dữ liệu trước DBSCAN — vì thuật toán dùng khoảng cách.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
