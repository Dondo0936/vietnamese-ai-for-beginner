"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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

/* ──────────────────────────────────────────────────────────────
 * Metadata
 * ────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "faiss",
  title: "FAISS",
  titleVi: "FAISS - Tìm kiếm tương tự siêu nhanh",
  description:
    "Thư viện mã nguồn mở của Meta dùng để tìm kiếm vector tương tự hiệu quả trên quy mô lớn.",
  category: "search-retrieval",
  tags: ["faiss", "vector-search", "indexing", "meta"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "rag"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * Kiểu dữ liệu và hằng số toàn cục
 * ────────────────────────────────────────────────────────────── */
type IndexType = "flat" | "ivf" | "hnsw";

interface Vector2D {
  id: number;
  x: number;
  y: number;
  cluster: number;
}

interface ClusterInfo {
  id: number;
  cx: number;
  cy: number;
  color: string;
  label: string;
}

interface SearchResult {
  id: number;
  x: number;
  y: number;
  cluster: number;
  dist: number;
  visited: boolean;
}

/* ──────────────────────────────────────────────────────────────
 * Sinh 200 điểm 2D quanh 5 cụm "ngầm"
 * Mỗi cụm tương trưng cho một chủ đề văn bản (pháp luật, công
 * nghệ, y tế, giáo dục, tài chính) trong bối cảnh chatbot tiếng
 * Việt. Bộ dữ liệu cố định - dùng tham số Park-Miller-like tạo
 * pseudo-random deterministic để SSR và CSR khớp nhau.
 * ────────────────────────────────────────────────────────────── */
const CLUSTERS: ClusterInfo[] = [
  { id: 0, cx: 0.2, cy: 0.75, color: "#3b82f6", label: "Pháp luật" },
  { id: 1, cx: 0.78, cy: 0.72, color: "#ef4444", label: "Công nghệ" },
  { id: 2, cx: 0.82, cy: 0.25, color: "#f59e0b", label: "Y tế" },
  { id: 3, cx: 0.25, cy: 0.22, color: "#22c55e", label: "Giáo dục" },
  { id: 4, cx: 0.52, cy: 0.5, color: "#a855f7", label: "Tài chính" },
];

function seeded(seed: number) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function buildDataset(): Vector2D[] {
  const rnd = seeded(42);
  const out: Vector2D[] = [];
  let id = 0;
  // 40 điểm mỗi cụm × 5 cụm = 200 điểm
  for (const c of CLUSTERS) {
    for (let i = 0; i < 40; i++) {
      // Gaussian xấp xỉ bằng Box-Muller rút gọn
      const u1 = Math.max(1e-6, rnd());
      const u2 = rnd();
      const mag = Math.sqrt(-2 * Math.log(u1)) * 0.06;
      const ang = 2 * Math.PI * u2;
      const x = Math.min(0.98, Math.max(0.02, c.cx + mag * Math.cos(ang)));
      const y = Math.min(0.98, Math.max(0.02, c.cy + mag * Math.sin(ang)));
      out.push({ id: id++, x, y, cluster: c.id });
    }
  }
  return out;
}

const DATASET: Vector2D[] = buildDataset();

/* ──────────────────────────────────────────────────────────────
 * Đồ thị HNSW "giả lập" (layer 0):
 * Với 200 điểm, kết nối mỗi điểm với ~M=6 hàng xóm gần nhất. Đây
 * là graph được dùng để đi bộ greedy lên query.
 * ────────────────────────────────────────────────────────────── */
const M = 6;

function buildHnswGraph(points: Vector2D[]): number[][] {
  return points.map((p) => {
    const dists = points
      .map((q, j) => ({
        j,
        d: (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y),
      }))
      .filter((o) => o.j !== p.id)
      .sort((a, b) => a.d - b.d)
      .slice(0, M)
      .map((o) => o.j);
    return dists;
  });
}

const HNSW_GRAPH: number[][] = buildHnswGraph(DATASET);

/* ──────────────────────────────────────────────────────────────
 * Hàm tìm kiếm - mô phỏng 3 kiểu index
 * ────────────────────────────────────────────────────────────── */
function l2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function searchFlat(qx: number, qy: number, k: number): SearchResult[] {
  const scored: SearchResult[] = DATASET.map((p) => ({
    ...p,
    dist: l2(qx, qy, p.x, p.y),
    visited: true,
  }));
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, k);
}

function searchIvf(
  qx: number,
  qy: number,
  k: number,
  nprobe: number,
): { topK: SearchResult[]; visited: number[]; probedClusters: number[] } {
  const centDists = CLUSTERS.map((c) => ({
    id: c.id,
    d: l2(qx, qy, c.cx, c.cy),
  })).sort((a, b) => a.d - b.d);
  const probed = centDists.slice(0, Math.max(1, Math.min(nprobe, 5))).map((c) => c.id);

  const candidates = DATASET.filter((p) => probed.includes(p.cluster)).map((p) => ({
    ...p,
    dist: l2(qx, qy, p.x, p.y),
    visited: true,
  }));
  candidates.sort((a, b) => a.dist - b.dist);

  return {
    topK: candidates.slice(0, k),
    visited: candidates.map((c) => c.id),
    probedClusters: probed,
  };
}

function searchHnsw(
  qx: number,
  qy: number,
  k: number,
  efSearch: number,
): { topK: SearchResult[]; visited: number[]; path: number[] } {
  // Điểm vào cố định: điểm gần centroid cụm 4 (trung tâm).
  const entry = 4 * 40; // id điểm đầu của cụm 4 (tài chính)
  const visited = new Set<number>();
  const path: number[] = [];

  // Greedy descent + ef-based beam trên 1 layer (mô phỏng rút gọn).
  const ef = Math.max(1, Math.min(efSearch, 64));
  const frontier: { id: number; d: number }[] = [
    { id: entry, d: l2(qx, qy, DATASET[entry].x, DATASET[entry].y) },
  ];
  const best: { id: number; d: number }[] = [frontier[0]];
  visited.add(entry);
  path.push(entry);

  let steps = 0;
  while (frontier.length > 0 && steps < 200) {
    frontier.sort((a, b) => a.d - b.d);
    const current = frontier.shift();
    if (!current) break;
    // Nếu current đã xa hơn best[ef-1] thì dừng
    const worstBest = best.length >= ef ? best[best.length - 1].d : Infinity;
    if (current.d > worstBest && best.length >= ef) break;

    for (const nb of HNSW_GRAPH[current.id]) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      path.push(nb);
      const d = l2(qx, qy, DATASET[nb].x, DATASET[nb].y);
      frontier.push({ id: nb, d });
      best.push({ id: nb, d });
      best.sort((a, b) => a.d - b.d);
      if (best.length > ef) best.pop();
    }
    steps++;
  }

  const topK = best.slice(0, k).map((b) => {
    const p = DATASET[b.id];
    return { ...p, dist: b.d, visited: true };
  });

  return { topK, visited: Array.from(visited), path };
}

/* ──────────────────────────────────────────────────────────────
 * Chấm điểm recall vs brute-force (dùng làm "ground truth")
 * ────────────────────────────────────────────────────────────── */
function computeRecall(truth: SearchResult[], got: SearchResult[]): number {
  if (truth.length === 0) return 1;
  const truthSet = new Set(truth.map((t) => t.id));
  const hits = got.filter((g) => truthSet.has(g.id)).length;
  return hits / truth.length;
}

/* ──────────────────────────────────────────────────────────────
 * Quiz - 8 câu hỏi về FAISS
 * ────────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Flat Index trong FAISS có đặc điểm gì nổi bật nhất?",
    options: [
      "Nhanh nhất nhưng kết quả có thể sai",
      "Chính xác 100% (exact/brute-force) nhưng chậm khi dữ liệu lớn",
      "Chỉ chạy trên GPU chuyên dụng",
      "Tự động phân cụm dữ liệu trước khi lưu",
    ],
    correct: 1,
    explanation:
      "IndexFlatL2/IndexFlatIP so sánh query với MỌI vector trong cơ sở dữ liệu. Vì vậy luôn đúng 100% (exact nearest neighbor) nhưng độ phức tạp O(N) khiến nó chậm khi N đạt hàng triệu. Thường chỉ dùng khi N < 1 triệu hoặc làm 'ground truth' để so sánh recall của các index ANN.",
  },
  {
    question: "IVF tăng tốc tìm kiếm chủ yếu nhờ ý tưởng nào?",
    options: [
      "Nén mỗi vector xuống ít bit hơn để CPU đọc nhanh hơn",
      "Phân vector thành cụm bằng K-means, query chỉ được đối chiếu trong vài cụm gần nhất",
      "Loại bỏ các vector có magnitude nhỏ",
      "Sắp xếp vector theo chiều đầu tiên và nhị phân tìm kiếm",
    ],
    correct: 1,
    explanation:
      "IVF (Inverted File) chạy K-means với nlist cụm. Khi query đến, ta chỉ so sánh với centroid (O(nlist)) và sau đó brute-force trong nprobe cụm gần nhất (O(N/nlist × nprobe)). Nếu nprobe ≪ nlist, ta tiết kiệm tới 2 bậc.",
  },
  {
    question: "Product Quantization (PQ) đem lại lợi ích chính nào?",
    options: [
      "Tăng độ chính xác so với Flat",
      "Giảm bộ nhớ vector từ 768 float (3 KB) xuống ~8-64 byte, vẫn giữ được similarity tương đối",
      "Loại bỏ bước training hoàn toàn",
      "Chuyển dữ liệu sang GPU nhanh hơn",
    ],
    correct: 1,
    explanation:
      "PQ chia mỗi vector thành m sub-vector, quantize mỗi sub-vector về 1 byte (k=256 centroids). Một vector 768-d (3072 byte) trở thành ~m byte. Đổi lại một phần độ chính xác, đổi được 10-100× bộ nhớ và tốc độ đọc cache.",
  },
  {
    question: "HNSW có điểm mạnh gì mà IVF thường không sánh được?",
    options: [
      "Tiết kiệm bộ nhớ hơn nhiều",
      "Không cần training",
      "Recall cực cao ở độ trễ thấp, scaling O(log N) - vàng cho < 10 ms query",
      "Luôn trả về kết quả đúng 100%",
    ],
    correct: 2,
    explanation:
      "HNSW (Hierarchical Navigable Small World) là đồ thị nhiều tầng. Query đi từ tầng cao xuống thấp, mỗi bước chọn hàng xóm gần query hơn. Độ phức tạp ~O(log N), recall thường 95-99% với ef nhỏ. Nhược điểm: tốn RAM (graph overhead) và không nén được tốt như PQ.",
  },
  {
    type: "fill-blank",
    question:
      "FAISS là viết tắt của {blank}. Lớp exact search dùng khoảng cách Euclidean toàn bộ có tên {blank}, còn biến thể dùng inner product là {blank}.",
    blanks: [
      {
        answer: "Facebook AI Similarity Search",
        accept: [
          "facebook ai similarity search",
          "Facebook AI Similarity Search (FAISS)",
        ],
      },
      {
        answer: "IndexFlatL2",
        accept: ["faiss.IndexFlatL2", "indexflatl2"],
      },
      {
        answer: "IndexFlatIP",
        accept: ["faiss.IndexFlatIP", "indexflatip"],
      },
    ],
    explanation:
      "FAISS do Meta (Facebook) phát hành năm 2017. IndexFlatL2 dùng bình phương khoảng cách Euclid, IndexFlatIP dùng tích trong. Với vector chuẩn hoá L2=1, hai độ đo này tương đương (argmax IP = argmin L2).",
  },
  {
    question:
      "Với IVF, nprobe ảnh hưởng thế nào đến recall và độ trễ?",
    options: [
      "nprobe càng cao càng nhanh và càng chính xác",
      "nprobe cao → recall cao hơn nhưng chậm hơn. Đây là trade-off chính cần tuning",
      "nprobe không ảnh hưởng recall",
      "nprobe chỉ ảnh hưởng bộ nhớ, không ảnh hưởng tốc độ",
    ],
    correct: 1,
    explanation:
      "nprobe = số cụm được scan. nprobe=1 là nhanh nhất nhưng recall thấp (nhất là khi query gần biên cụm). nprobe cao → quét nhiều cụm → recall gần 100% nhưng chậm. Người ta thường sweep nprobe ∈ {1,4,8,16,32} và vẽ đường cong Recall@k vs Latency để chọn điểm 'knee'.",
  },
  {
    question:
      "Trong HNSW, tham số efSearch có tác dụng gì?",
    options: [
      "Số hàng xóm M gán cho mỗi node khi build",
      "Chiều cao tối đa của tháp graph",
      "Kích thước danh sách ứng viên động khi query; ef lớn → recall cao, chậm hơn",
      "Số luồng CPU dùng khi build index",
    ],
    correct: 2,
    explanation:
      "HNSW có hai họ tham số: build-time (M, efConstruction) và query-time (efSearch). efSearch là độ rộng beam search tại layer 0. ef=k cho recall thấp, ef=200 cho recall gần 100%. Lưu ý ef phải ≥ k, không thể lấy top-10 với ef=5.",
  },
  {
    question:
      "Tình huống nào KHÔNG phù hợp dùng FAISS làm vector DB sản xuất?",
    options: [
      "Offline batch search 10M vector trong notebook",
      "Semantic search cho chatbot 100K tài liệu, ít khi update",
      "Hệ thống cần thêm/xoá vector liên tục theo thời gian thực + persistence + multi-tenant",
      "Làm baseline recall cho index ANN khác",
    ],
    correct: 2,
    explanation:
      "FAISS là thư viện in-process tối ưu cho batch search. Nó KHÔNG có: lưu trữ persistent tự động, multi-tenant, filter theo metadata, replication. Khi cần các tính năng đó, người ta dùng Qdrant, Weaviate, Milvus, pgvector - vốn cũng dùng FAISS hoặc thuật toán tương tự bên trong.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Palette dùng chung cho SVG
 * ────────────────────────────────────────────────────────────── */
const COLOR_VISITED = "#f97316";
const COLOR_HIT = "#22c55e";
const COLOR_QUERY = "#22d3ee";

/* ──────────────────────────────────────────────────────────────
 * Component chính
 * ────────────────────────────────────────────────────────────── */
export default function FAISSTopic() {
  // State query point
  const [queryX, setQueryX] = useState(0.45);
  const [queryY, setQueryY] = useState(0.55);
  const [indexType, setIndexType] = useState<IndexType>("flat");
  const [nprobe, setNprobe] = useState(1);
  const [efSearch, setEfSearch] = useState(10);
  const [k, setK] = useState(10);
  const [showEdges, setShowEdges] = useState(false);

  // scale helper
  const W = 520;
  const H = 420;
  const px = useCallback((v: number) => 30 + v * (W - 60), []);
  const py = useCallback((v: number) => 30 + (1 - v) * (H - 60), []);

  // Ground truth + three index results
  const truth = useMemo(() => searchFlat(queryX, queryY, k), [queryX, queryY, k]);

  const flat = useMemo(
    () => ({ topK: truth, visited: DATASET.map((d) => d.id), probedClusters: [] }),
    [truth],
  );

  const ivf = useMemo(
    () => searchIvf(queryX, queryY, k, nprobe),
    [queryX, queryY, k, nprobe],
  );

  const hnsw = useMemo(
    () => searchHnsw(queryX, queryY, k, efSearch),
    [queryX, queryY, k, efSearch],
  );

  const current = useMemo(() => {
    if (indexType === "flat") {
      return {
        topK: flat.topK,
        visited: flat.visited,
        extra: { type: "flat" as const },
      };
    }
    if (indexType === "ivf") {
      return {
        topK: ivf.topK,
        visited: ivf.visited,
        extra: { type: "ivf" as const, probedClusters: ivf.probedClusters },
      };
    }
    return {
      topK: hnsw.topK,
      visited: hnsw.visited,
      extra: { type: "hnsw" as const, path: hnsw.path },
    };
  }, [indexType, flat, ivf, hnsw]);

  const recall = useMemo(
    () => computeRecall(truth, current.topK),
    [truth, current.topK],
  );

  // Chi phí "giả lập" để vẽ trade-off curve (số comparison).
  const cost = useMemo(() => {
    if (indexType === "flat") return DATASET.length;
    if (indexType === "ivf") return CLUSTERS.length + ivf.visited.length; // centroid scan + cluster scan
    return hnsw.visited.length;
  }, [indexType, ivf.visited.length, hnsw.visited.length]);

  // Phần trăm dữ liệu chạm - để render progress bar
  const costPercent = Math.min(100, (cost / DATASET.length) * 100);

  return (
    <>
      {/* ───────────── Bước 1: dự đoán ───────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Chatbot pháp luật Việt Nam lưu 10 triệu điều luật dưới dạng vector 768 chiều. Người dùng hỏi 'quyền lao động nghỉ thai sản'. Brute-force mất 5 giây/query. Khách hàng muốn trả lời dưới 50 ms. Ý tưởng nào thực tế nhất?"
          options={[
            "Không có cách nào nhanh hơn brute-force nếu muốn đúng",
            "Phân vector thành cụm chủ đề, query chỉ quét vài cụm gần nhất - chấp nhận recall ~95%",
            "Giảm dataset xuống còn 1 triệu để chạy brute-force vẫn kịp",
          ]}
          correct={1}
          explanation="Đây chính là triết lý của FAISS: đánh đổi một chút recall (vài phần trăm) để lấy tốc độ 100-1000×. IVF, HNSW, PQ đều là các cách khác nhau để thực hiện đánh đổi này trên quy mô triệu vector."
        >
          {/* ───────────── Bước 2: khám phá trực quan ───────────── */}
          <LessonSection step={2} totalSteps={8} label="Khám phá">
            <VisualizationSection>
              <div className="space-y-5">
                <ProgressSteps
                  current={2}
                  total={8}
                  labels={[
                    "Dự đoán",
                    "Khám phá",
                    "Aha",
                    "Thử thách 1",
                    "Giải thích",
                    "Thử thách 2",
                    "Tóm tắt",
                    "Quiz",
                  ]}
                />

                {/* Chọn loại index */}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { v: "flat", name: "Flat (brute-force)" },
                      { v: "ivf", name: "IVF (phân cụm)" },
                      { v: "hnsw", name: "HNSW (đồ thị)" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setIndexType(o.v)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        indexType === o.v
                          ? "bg-accent text-white"
                          : "bg-card border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {o.name}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowEdges((s) => !s)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      showEdges
                        ? "bg-accent/20 border border-accent text-accent"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                    title="Hiển thị cạnh đồ thị HNSW hoặc đường nối query ↔ top-k"
                  >
                    {showEdges ? "Ẩn cạnh" : "Hiện cạnh"}
                  </button>
                </div>

                {/* Sliders query + k + ef/nprobe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border bg-background/40 p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">
                      Query X: <span className="text-foreground">{queryX.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.02"
                      max="0.98"
                      step="0.01"
                      value={queryX}
                      onChange={(e) => setQueryX(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">
                      Query Y: <span className="text-foreground">{queryY.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.02"
                      max="0.98"
                      step="0.01"
                      value={queryY}
                      onChange={(e) => setQueryY(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">
                      k (số kết quả): <span className="text-foreground">{k}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={k}
                      onChange={(e) => setK(parseInt(e.target.value, 10))}
                      className="w-full accent-accent"
                    />
                  </div>

                  {indexType === "ivf" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted">
                        nprobe (số cụm quét):{" "}
                        <span className="text-foreground">{nprobe}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={nprobe}
                        onChange={(e) => setNprobe(parseInt(e.target.value, 10))}
                        className="w-full accent-accent"
                      />
                    </div>
                  )}

                  {indexType === "hnsw" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted">
                        efSearch (beam size):{" "}
                        <span className="text-foreground">{efSearch}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="64"
                        step="1"
                        value={efSearch}
                        onChange={(e) => setEfSearch(parseInt(e.target.value, 10))}
                        className="w-full accent-accent"
                      />
                    </div>
                  )}

                  {indexType === "flat" && (
                    <div className="text-xs text-muted italic self-end">
                      Flat không có tham số - luôn quét toàn bộ dataset.
                    </div>
                  )}
                </div>

                {/* SVG chính */}
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full max-w-3xl mx-auto bg-background/30 rounded-xl border border-border"
                >
                  {/* Lưới mờ */}
                  <g opacity={0.1}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={`gx${i}`}
                        x1={30 + i * ((W - 60) / 9)}
                        y1={30}
                        x2={30 + i * ((W - 60) / 9)}
                        y2={H - 30}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                      />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={`gy${i}`}
                        x1={30}
                        y1={30 + i * ((H - 60) / 9)}
                        x2={W - 30}
                        y2={30 + i * ((H - 60) / 9)}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                      />
                    ))}
                  </g>

                  {/* Vùng cụm (IVF) */}
                  {indexType === "ivf" &&
                    CLUSTERS.map((c) => {
                      const isProbed = ivf.probedClusters.includes(c.id);
                      return (
                        <g key={`clu${c.id}`}>
                          <circle
                            cx={px(c.cx)}
                            cy={py(c.cy)}
                            r={70}
                            fill={c.color}
                            opacity={isProbed ? 0.18 : 0.05}
                            stroke={c.color}
                            strokeOpacity={isProbed ? 0.7 : 0.25}
                            strokeDasharray={isProbed ? "0" : "4 4"}
                            strokeWidth={isProbed ? 1.4 : 1}
                          />
                          <text
                            x={px(c.cx)}
                            y={py(c.cy) - 76}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill={c.color}
                            opacity={isProbed ? 1 : 0.5}
                          >
                            {c.label}
                            {isProbed ? " (probed)" : ""}
                          </text>
                          <circle
                            cx={px(c.cx)}
                            cy={py(c.cy)}
                            r={3}
                            fill={c.color}
                          />
                        </g>
                      );
                    })}

                  {/* Cạnh HNSW */}
                  {indexType === "hnsw" &&
                    showEdges &&
                    HNSW_GRAPH.map((nbs, i) =>
                      nbs.map((j) =>
                        j > i ? (
                          <line
                            key={`e${i}-${j}`}
                            x1={px(DATASET[i].x)}
                            y1={py(DATASET[i].y)}
                            x2={px(DATASET[j].x)}
                            y2={py(DATASET[j].y)}
                            stroke="#64748b"
                            strokeOpacity={0.18}
                            strokeWidth={0.4}
                          />
                        ) : null,
                      ),
                    )}

                  {/* HNSW path highlight */}
                  {indexType === "hnsw" &&
                    hnsw.path.map((id, i) =>
                      i + 1 < hnsw.path.length ? (
                        <line
                          key={`p${i}`}
                          x1={px(DATASET[id].x)}
                          y1={py(DATASET[id].y)}
                          x2={px(DATASET[hnsw.path[i + 1]].x)}
                          y2={py(DATASET[hnsw.path[i + 1]].y)}
                          stroke={COLOR_VISITED}
                          strokeWidth={1.1}
                          strokeOpacity={0.6}
                        />
                      ) : null,
                    )}

                  {/* Điểm dữ liệu */}
                  {DATASET.map((p) => {
                    const isHit = current.topK.some((t) => t.id === p.id);
                    const isVisited = current.visited.includes(p.id);
                    const base = CLUSTERS[p.cluster].color;
                    let fill = base;
                    let r = 3.2;
                    let stroke = "none";
                    let sw = 0;

                    if (isVisited && !isHit) {
                      fill = COLOR_VISITED;
                      r = 3.5;
                    }
                    if (isHit) {
                      fill = COLOR_HIT;
                      r = 5.5;
                      stroke = "#052e16";
                      sw = 1.2;
                    }

                    return (
                      <circle
                        key={p.id}
                        cx={px(p.x)}
                        cy={py(p.y)}
                        r={r}
                        fill={fill}
                        opacity={isVisited || isHit ? 1 : 0.45}
                        stroke={stroke}
                        strokeWidth={sw}
                      />
                    );
                  })}

                  {/* Cạnh query ↔ hit nếu bật */}
                  {showEdges &&
                    current.topK.map((t) => (
                      <line
                        key={`qh${t.id}`}
                        x1={px(queryX)}
                        y1={py(queryY)}
                        x2={px(t.x)}
                        y2={py(t.y)}
                        stroke={COLOR_HIT}
                        strokeDasharray="3 2"
                        strokeOpacity={0.55}
                        strokeWidth={0.9}
                      />
                    ))}

                  {/* Query */}
                  <motion.circle
                    cx={px(queryX)}
                    cy={py(queryY)}
                    r={10}
                    fill={COLOR_QUERY}
                    stroke="#0f172a"
                    strokeWidth={2}
                    initial={false}
                    animate={{ cx: px(queryX), cy: py(queryY) }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  />
                  <text
                    x={px(queryX)}
                    y={py(queryY) - 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={COLOR_QUERY}
                  >
                    Query
                  </text>
                </svg>

                {/* Bảng số liệu */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      Index
                    </div>
                    <div className="text-lg font-bold text-foreground capitalize">
                      {indexType}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      So sánh
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {cost} / {DATASET.length}
                    </div>
                    <div className="h-1 bg-background/60 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-orange-400"
                        style={{ width: `${costPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      Recall@{k}
                    </div>
                    <div className="text-lg font-bold text-green-500">
                      {(recall * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      Trả về
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {current.topK.length} điểm
                    </div>
                  </div>
                </div>

                {/* Bảng top-k */}
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Top-{k} kết quả (sắp theo khoảng cách):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    {current.topK.map((r, i) => (
                      <div
                        key={r.id}
                        className="rounded-md border border-border/60 bg-card px-2 py-1"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                          style={{ backgroundColor: CLUSTERS[r.cluster].color }}
                        />
                        #{i + 1} · id {r.id} · d={r.dist.toFixed(3)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chú giải ngắn */}
                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_QUERY }}
                    />
                    Query
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_VISITED }}
                    />
                    Đã so sánh (visited)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_HIT }}
                    />
                    Top-k hit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full inline-block bg-slate-500/40" />
                    Không chạm
                  </span>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ───────────── Bước 3: Aha ───────────── */}
          <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                FAISS giống <strong>tìm người quen trong sân vận động 80.000
                chỗ</strong>. Flat hỏi từng người (chính xác tuyệt đối, mất
                cả ngày). IVF chia sân thành khu A, B, C... rồi chỉ đi tới
                vài khu gần nhất. HNSW xây sẵn <em>bản đồ đường đi</em> giữa
                các hàng ghế - bạn đi theo hàng xóm, mỗi bước gần đích hơn.
                Cả ba cùng trả kết quả "đủ gần", nhưng chi phí giảm từ O(N)
                xuống O(N/nlist) hoặc O(log N).{" "}
                <strong>
                  Đó là lý do Meta chạy được tìm kiếm khuôn mặt trên hàng tỷ
                  ảnh chỉ với một cụm GPU.
                </strong>
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ───────────── Bước 4: Thử thách 1 ───────────── */}
          <LessonSection step={4} totalSteps={8} label="Thử thách 1">
            <InlineChallenge
              question="Bạn chạy IVF với nlist=1000, nprobe=1 trên 10 triệu vector. Test thấy 5% query trả kết quả sai hoàn toàn. Điều tra log: mọi lỗi đều rơi vào query 'nằm giữa hai cụm'. Khắc phục hợp lý nhất?"
              options={[
                "Giảm nlist xuống 100 để cụm lớn hơn, ít biên hơn",
                "Tăng nprobe (vd 8-16) để quét cả cụm láng giềng - trả lời được query rìa",
                "Chuyển sang Flat để chính xác 100%",
              ]}
              correct={1}
              explanation="Query ở biên cụm thường có top-k chia đều 2-3 cụm. nprobe=1 sẽ bỏ lỡ các điểm ở cụm kế bên. Tăng nprobe là cách đơn giản và rẻ nhất; chỉ khi nprobe=16 vẫn không đủ thì mới cân nhắc đổi sang IVF-HNSW hoặc HNSW thuần."
            />
          </LessonSection>

          {/* ───────────── Bước 5: Giải thích ───────────── */}
          <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
            <ExplanationSection>
              <p>
                <strong>FAISS</strong> (Facebook AI Similarity Search) là thư
                viện C++ có binding Python cho tìm kiếm vector quy mô lớn.
                Nó thường đứng sau các{" "}
                <TopicLink slug="vector-databases">vector database</TopicLink>,
                chịu trách nhiệm lập chỉ mục và truy vấn các vector sinh ra
                bởi <TopicLink slug="embedding-model">embedding model</TopicLink>.
                Khác với B-tree hay hash, FAISS tối ưu cho{" "}
                <em>approximate nearest neighbor</em> (ANN) nơi recall 95-99%
                là đủ, đổi lại độ trễ nhỏ hơn rất nhiều.
              </p>

              <Callout variant="insight" title="Bốn họ index phổ biến trong FAISS">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>IndexFlatL2 / IndexFlatIP:</strong> brute-force,
                    exact. Dùng cho &lt; 1M vector hoặc làm ground truth.
                  </p>
                  <p>
                    <strong>IndexIVFFlat:</strong> phân cụm K-means + flat
                    search trong cụm. Có tham số{" "}
                    <code className="bg-background/60 px-1 rounded">nlist</code>{" "}
                    (số cụm) và{" "}
                    <code className="bg-background/60 px-1 rounded">nprobe</code>{" "}
                    (số cụm quét).
                  </p>
                  <p>
                    <strong>IndexIVFPQ:</strong> IVF + Product Quantization.
                    Nén vector 10-100×, query vẫn dùng cụm + bảng tra LUT.
                  </p>
                  <p>
                    <strong>IndexHNSWFlat:</strong> đồ thị phân tầng. Không
                    cần training, recall cao nhất trong CPU, nhưng tốn RAM
                    cho graph.
                  </p>
                </div>
              </Callout>

              <p>
                <strong>Product Quantization</strong> (PQ) chia vector thành
                m sub-vector và quantize mỗi sub-vector về 1 trong k tâm:
              </p>
              <LaTeX block>
                {"\\mathbf{x} \\in \\mathbb{R}^{d} \\;\\longrightarrow\\; (q_1, q_2, \\ldots, q_m) \\in \\{1,\\ldots,k\\}^m"}
              </LaTeX>
              <p className="text-sm text-muted">
                Với d=768, m=8, k=256: mỗi vector còn 8 byte (đổi từ 3072
                byte). Khi query, ta tính một bảng tra (LUT) 8×256 với query,
                rồi cộng 8 giá trị cho mỗi vector trong cụm. Nhanh và rất
                cache-friendly.
              </p>

              <p>
                <strong>HNSW</strong> xây đồ thị nhiều tầng. Mỗi node được
                chèn ở tầng ℓ với xác suất{" "}
                <LaTeX>{"P(\\ell) = e^{-\\ell/m_L}"}</LaTeX>. Query bắt đầu ở
                tầng cao nhất rồi greedy xuống dần, ở tầng 0 chạy beam search
                với ef. Tính chất "đồ thị small-world" đảm bảo độ phức tạp
                kỳ vọng O(log N) với số cạnh trung bình trên mỗi node là M.
              </p>

              <Callout variant="warning" title="FAISS không phải vector DB">
                <p className="text-sm">
                  FAISS là <em>thư viện</em> in-process. Bạn add vector,
                  search, nhưng không có metadata filter động, không có
                  multi-tenant, không có replication. Các giải pháp như
                  Milvus (dùng FAISS bên trong), Qdrant, Weaviate, pgvector
                  bù đắp những tính năng này. Nếu bạn đang build chatbot
                  nhỏ - FAISS đủ. Nếu bạn build SaaS phục vụ nhiều khách -
                  bọc FAISS trong một service hoặc chọn vector DB có sẵn.
                </p>
              </Callout>

              <Callout variant="tip" title="Khi nào nên chọn index nào?">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>&lt; 100K vector, RAM dồi dào:</strong> Flat.
                    Không cần tuning, kết quả đúng.
                  </li>
                  <li>
                    <strong>100K - 10M, ưu tiên RAM:</strong> IVFPQ với
                    nlist=sqrt(N), m=8-16.
                  </li>
                  <li>
                    <strong>100K - 10M, ưu tiên độ trễ &lt; 10 ms:</strong>{" "}
                    HNSW (M=16, efSearch=64).
                  </li>
                  <li>
                    <strong>&gt; 100M, phân tán:</strong> IVFPQ + GPU, hoặc
                    dùng vector DB có sharding.
                  </li>
                </ul>
              </Callout>

              <CodeBlock language="python" title="FAISS Python API - từ Flat tới IVFPQ">
{`import faiss
import numpy as np

# ------------------------------------------------------------------
# Bối cảnh: chatbot pháp luật Việt Nam, 10 triệu đoạn văn 768-d
# ------------------------------------------------------------------
d = 768                        # dimension (e.g. BGE-m3 VN)
n = 10_000_000                 # số vector
xb = np.random.random((n, d)).astype("float32")   # dữ liệu mẫu
xq = np.random.random((1, d)).astype("float32")   # 1 query

# ------------------------------------------------------------------
# 1. Flat (exact search) - baseline, chậm nhưng đúng 100%
# ------------------------------------------------------------------
index_flat = faiss.IndexFlatL2(d)
index_flat.add(xb)                              # không cần training
D, I = index_flat.search(xq, k=10)              # ~5 s cho 10M trên CPU

# ------------------------------------------------------------------
# 2. IVFFlat - phân cụm, ~100x nhanh hơn
# ------------------------------------------------------------------
nlist = 1000
quantizer = faiss.IndexFlatL2(d)
index_ivf = faiss.IndexIVFFlat(quantizer, d, nlist)
index_ivf.train(xb[:200_000])                   # K-means trên sample
index_ivf.add(xb)
index_ivf.nprobe = 10                           # quét 10/1000 cụm
D, I = index_ivf.search(xq, k=10)               # ~50 ms, recall ~95%

# ------------------------------------------------------------------
# 3. IVFPQ - IVF + compression, tiết kiệm RAM 50-100x
# ------------------------------------------------------------------
m = 8                                           # 8 sub-vectors
bits = 8                                        # 256 centroids / sub
index_ivfpq = faiss.IndexIVFPQ(quantizer, d, nlist, m, bits)
index_ivfpq.train(xb[:200_000])
index_ivfpq.add(xb)
# RAM: 10M * 8 byte = 80 MB (so với 30 GB của Flat!)
index_ivfpq.nprobe = 16
D, I = index_ivfpq.search(xq, k=10)

# ------------------------------------------------------------------
# 4. HNSW - đồ thị, recall cao nhất trên CPU
# ------------------------------------------------------------------
M = 32                                          # hàng xóm/node
index_hnsw = faiss.IndexHNSWFlat(d, M)
index_hnsw.hnsw.efConstruction = 200            # build-time
index_hnsw.add(xb)                              # không cần train
index_hnsw.hnsw.efSearch = 64                   # query-time
D, I = index_hnsw.search(xq, k=10)              # ~5 ms, recall ~99%

# ------------------------------------------------------------------
# 5. Factory string (khuyên dùng khi làm production)
# ------------------------------------------------------------------
index = faiss.index_factory(d, "IVF1024,PQ16x8", faiss.METRIC_L2)
index.train(xb[:200_000])
index.add(xb)

# ------------------------------------------------------------------
# 6. GPU (nếu có)
# ------------------------------------------------------------------
res = faiss.StandardGpuResources()
gpu_index = faiss.index_cpu_to_gpu(res, 0, index_flat)
D, I = gpu_index.search(xq, k=10)               # ~30x nhanh hơn CPU

# ------------------------------------------------------------------
# 7. Lưu / tải index
# ------------------------------------------------------------------
faiss.write_index(index, "law_vn.index")
loaded = faiss.read_index("law_vn.index")
`}
              </CodeBlock>

              <CodeBlock language="python" title="Benchmark recall vs latency - sweep nprobe">
{`import time
import numpy as np
import faiss

def eval_index(index, xq, gt, k=10, nprobes=(1, 4, 8, 16, 32, 64)):
    """Sweep nprobe, đo recall@k và latency trung bình."""
    results = []
    for np_ in nprobes:
        index.nprobe = np_
        t0 = time.time()
        D, I = index.search(xq, k)
        lat = (time.time() - t0) / len(xq) * 1000   # ms/query
        recall = (I == gt[:, :k]).any(axis=1).mean()
        results.append((np_, recall, lat))
    return results

# ground truth bằng Flat
flat = faiss.IndexFlatL2(d)
flat.add(xb)
_, gt = flat.search(xq, 10)

ivf = faiss.index_factory(d, "IVF1024,Flat")
ivf.train(xb[:200_000])
ivf.add(xb)

for np_, r, lat in eval_index(ivf, xq, gt):
    print(f"nprobe={np_:<3d}  recall={r:.3f}  latency={lat:.2f} ms")

# Ví dụ output:
# nprobe=1    recall=0.612  latency=0.41 ms
# nprobe=4    recall=0.842  latency=1.03 ms
# nprobe=8    recall=0.925  latency=1.72 ms
# nprobe=16   recall=0.974  latency=2.95 ms
# nprobe=32   recall=0.993  latency=5.44 ms
`}
              </CodeBlock>

              <CollapsibleDetail title="Tại sao FAISS lại nhanh đến thế? (chi tiết low-level)">
                <div className="space-y-3 text-sm text-muted">
                  <p>
                    Bên dưới lớp API Python, FAISS là C++ được tối ưu đến
                    từng chu kỳ CPU. Ba yếu tố chính:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>SIMD intrinsics (AVX2/AVX-512):</strong> một
                      lệnh CPU so sánh 8-16 float32 cùng lúc. FAISS có các
                      kernel riêng cho khoảng cách L2 và tích trong, ép
                      compiler sinh AVX.
                    </li>
                    <li>
                      <strong>Cache-friendly memory layout:</strong> vector
                      được lưu contiguous theo dimension major (SoA), giúp
                      prefetch phát huy. Đặc biệt quan trọng với PQ - nơi
                      bảng tra LUT chỉ 256 × m byte, vừa trong L1.
                    </li>
                    <li>
                      <strong>OpenMP / TBB parallel:</strong> khi search
                      batch, mỗi query chạy một thread. Hệ số scaling gần
                      tuyến tính với số core.
                    </li>
                  </ul>
                  <p>
                    Trên GPU, FAISS dùng CUDA custom kernel (không phải cuBLAS
                    đơn thuần) để chèn các phép K-selection (top-k trên
                    warp). Đó là lý do các baseline GPU ANN hiện đại vẫn
                    dùng FAISS làm reference.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Công thức trade-off Recall@k vs Latency">
                <div className="space-y-3 text-sm text-muted">
                  <p>
                    Chi phí trung bình của IVF (bỏ qua overhead centroid):
                  </p>
                  <LaTeX block>
                    {"T_{\\mathrm{IVF}} \\approx \\frac{n_{\\mathrm{probe}}}{n_{\\mathrm{list}}} \\cdot N \\cdot d"}
                  </LaTeX>
                  <p>
                    Còn recall xấp xỉ bằng xác suất top-k thật của query
                    nằm trong nprobe cụm được chọn:
                  </p>
                  <LaTeX block>
                    {"\\mathrm{Recall@}k \\approx 1 - \\left(1 - \\frac{n_{\\mathrm{probe}}}{n_{\\mathrm{list}}}\\right)^{n_{\\mathrm{neigh}}}"}
                  </LaTeX>
                  <p>
                    với <LaTeX>{"n_{\\mathrm{neigh}}"}</LaTeX> là số láng
                    giềng thật sự trong bán kính xét. Hệ quả: tăng gấp đôi
                    nprobe không luôn tăng gấp đôi recall - đường cong bị
                    bão hoà. Đây chính là lý do trade-off có hình "knee".
                  </p>
                </div>
              </CollapsibleDetail>
            </ExplanationSection>
          </LessonSection>

          {/* ───────────── Bước 6: Thử thách 2 ───────────── */}
          <LessonSection step={6} totalSteps={8} label="Thử thách 2">
            <InlineChallenge
              question="Bạn triển khai HNSW với M=8, efSearch=10, k=10 cho 5 triệu vector. Đo recall chỉ đạt 78%. Khách hàng cần ≥ 95%. Phương án tối ưu đầu tiên?"
              options={[
                "Rebuild index với M=32 và efConstruction=200, giữ nguyên efSearch",
                "Giữ graph cũ, chỉ tăng efSearch lên 64-128 (no rebuild, thử ngay)",
                "Chuyển sang IVFFlat với nprobe=64",
              ]}
              correct={1}
              explanation="efSearch là tham số query-time, không cần build lại index. Tăng efSearch lên 64-128 thường đủ để đạt 95-99% recall với chi phí chỉ tăng 4-8×. Nếu vẫn chưa đủ, mới tính chuyện rebuild với M lớn hơn (điều này tốn vài giờ)."
            />
          </LessonSection>

          {/* ───────────── Bước 7: Tóm tắt ───────────── */}
          <LessonSection step={7} totalSteps={8} label="Tóm tắt">
            <MiniSummary
              points={[
                "FAISS là thư viện C++/Python của Meta cho similarity search hàng tỷ vector; hỗ trợ CPU, GPU, batching.",
                "Flat là baseline exact O(N). IVF chia cụm K-means giảm chi phí xuống O(N·nprobe/nlist).",
                "HNSW xây đồ thị phân tầng, đạt ~O(log N) với recall 95-99% chỉ cần tuning efSearch.",
                "Product Quantization (PQ) nén vector 10-100×: 768 float (3 KB) → 8-64 byte/vector.",
                "nprobe (IVF) và efSearch (HNSW) là các 'núm' trade-off chính Recall@k ↔ Latency.",
                "FAISS không thay thế được vector DB khi bạn cần persistence, metadata filter, multi-tenant.",
              ]}
            />
          </LessonSection>

          {/* ───────────── Bước 8: Quiz ───────────── */}
          <LessonSection step={8} totalSteps={8} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
