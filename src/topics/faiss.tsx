"use client";

import { useState, useMemo } from "react";
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

/* ── data ─────────────────────────────────────────────────── */
const VECTORS = [
  { id: 0, coords: [0.2, 0.8], label: "Pháp luật dân sự", cluster: 0 },
  { id: 1, coords: [0.3, 0.7], label: "Luật lao động", cluster: 0 },
  { id: 2, coords: [0.1, 0.9], label: "Bộ luật hình sự", cluster: 0 },
  { id: 3, coords: [0.7, 0.3], label: "Công nghệ AI", cluster: 1 },
  { id: 4, coords: [0.8, 0.2], label: "Machine Learning", cluster: 1 },
  { id: 5, coords: [0.6, 0.4], label: "Data Science", cluster: 1 },
  { id: 6, coords: [0.5, 0.5], label: "Luật công nghệ", cluster: 2 },
  { id: 7, coords: [0.4, 0.6], label: "An ninh mạng", cluster: 2 },
];

const CLUSTER_COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];
const CENTROIDS = [[0.2, 0.8], [0.7, 0.3], [0.45, 0.55]];

const QUIZ: QuizQuestion[] = [
  {
    question: "Flat Index trong FAISS có đặc điểm gì?",
    options: [
      "Nhanh nhất nhưng không chính xác",
      "Chính xác 100% (brute-force) nhưng chậm khi dữ liệu lớn",
      "Chỉ hoạt động trên GPU",
      "Tự động phân cụm dữ liệu",
    ],
    correct: 1,
    explanation: "Flat Index so sánh query với MỌI vector -- đảm bảo tìm đúng nearest neighbor (exact search). Nhưng O(N) nên chậm khi N lớn. Dùng cho dataset < 1M vectors.",
  },
  {
    question: "IVF index tăng tốc bằng cách nào?",
    options: [
      "Nén vector xuống kích thước nhỏ hơn",
      "Phân vector thành cụm (K-means), chỉ tìm trong cụm gần query nhất",
      "Loại bỏ vector có magnitude nhỏ",
      "Sắp xếp vector theo thứ tự",
    ],
    correct: 1,
    explanation: "IVF phân N vector thành K cụm bằng K-means. Khi query đến: tìm cụm gần nhất (so sánh K centroid), rồi chỉ brute-force trong cụm đó. Nhanh gấp ~K lần!",
  },
  {
    question: "Product Quantization (PQ) giúp gì trong FAISS?",
    options: [
      "Tăng chính xác tìm kiếm",
      "Nén vector từ 768-float xuống ~64 bytes, giảm bộ nhớ 10-50x",
      "Tự động huấn luyện embedding model",
      "Chuyển vector sang GPU",
    ],
    correct: 1,
    explanation: "PQ chia vector 768-d thành 8 nhóm x 96-d, mỗi nhóm quantize thành 1 byte (256 centroids). 768 floats (3072 bytes) -> 8 bytes! Giảm bộ nhớ > 100x với chỉ mất chút chính xác.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function FAISSTopic() {
  const [queryX, setQueryX] = useState(0.25);
  const [queryY, setQueryY] = useState(0.75);
  const [indexType, setIndexType] = useState<"flat" | "ivf">("flat");

  const scale = (v: number) => 40 + v * 380;

  const results = useMemo(() => {
    const dists = VECTORS.map((v) => ({
      ...v, dist: Math.sqrt((v.coords[0] - queryX) ** 2 + (v.coords[1] - queryY) ** 2),
    }));
    if (indexType === "flat") return dists.sort((a, b) => a.dist - b.dist).slice(0, 3);
    const centDists = CENTROIDS.map((c, i) => ({ idx: i, dist: Math.sqrt((c[0] - queryX) ** 2 + (c[1] - queryY) ** 2) }));
    const nearestCluster = centDists.sort((a, b) => a.dist - b.dist)[0].idx;
    return dists.filter((v) => v.cluster === nearestCluster).sort((a, b) => a.dist - b.dist).slice(0, 3);
  }, [queryX, queryY, indexType]);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Chatbot pháp luật Việt Nam có 10 triệu văn bản luật đã embed thành vector. Người dùng hỏi 'quyền lao động'. Tìm 10 vector gần nhất bằng brute-force mất 5 giây. Có cách nhanh hơn?"
          options={[
            "Không, phải duyệt hết 10 triệu vector",
            "Phân vector thành cụm, chỉ tìm trong cụm 'pháp luật' -- nhanh gấp 100x",
            "Giảm số văn bản xuống còn 1 triệu",
          ]}
          correct={1}
          explanation="FAISS với IVF index phân 10M vector thành cụm. Query 'quyền lao động' chỉ tìm trong cụm pháp luật (~100K vector) thay vì toàn bộ 10M. Nhanh ~100x với recall > 95%!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["flat", "ivf"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setIndexType(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    indexType === t ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {t === "flat" ? "Flat Index (Duyệt hết)" : "IVF Index (Theo cụm)"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Query X: {queryX.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.05" value={queryX}
                  onChange={(e) => setQueryX(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Query Y: {queryY.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.05" value={queryY}
                  onChange={(e) => setQueryY(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
            </div>

            <svg viewBox="0 0 460 460" className="w-full max-w-lg mx-auto">
              {indexType === "ivf" && CENTROIDS.map((c, i) => (
                <circle key={i} cx={scale(c[0])} cy={scale(1 - c[1])} r="90" fill={CLUSTER_COLORS[i]} opacity={0.08} />
              ))}
              {VECTORS.map((v) => {
                const isResult = results.some((r) => r.id === v.id);
                return (
                  <g key={v.id}>
                    <circle cx={scale(v.coords[0])} cy={scale(1 - v.coords[1])}
                      r={isResult ? 12 : 8} fill={CLUSTER_COLORS[v.cluster]}
                      stroke={isResult ? "#22c55e" : "none"} strokeWidth={isResult ? 2.5 : 0} />
                    <text x={scale(v.coords[0])} y={scale(1 - v.coords[1]) - 14}
                      textAnchor="middle" fill="#94a3b8" fontSize="8">{v.label}</text>
                  </g>
                );
              })}
              <circle cx={scale(queryX)} cy={scale(1 - queryY)} r="10" fill="#22c55e" stroke="white" strokeWidth="2" />
              <text x={scale(queryX)} y={scale(1 - queryY) - 16}
                textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">Query</text>
              {results.map((r) => (
                <line key={r.id}
                  x1={scale(queryX)} y1={scale(1 - queryY)}
                  x2={scale(r.coords[0])} y2={scale(1 - r.coords[1])}
                  stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity={0.6} />
              ))}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm font-medium text-green-500 mb-2">
                {indexType === "flat" ? "Flat: duyệt 8/8 vector" : "IVF: chỉ duyệt cụm gần nhất"} -- Top 3:
              </p>
              {results.map((r, i) => (
                <p key={r.id} className="text-sm text-muted">{i + 1}. {r.label} (d = {r.dist.toFixed(3)})</p>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            FAISS giống <strong>tìm người trong sân vận động 80.000 chỗ</strong>: Flat index hỏi từng người (chính xác nhưng
            mất cả ngày). IVF chia sân thành khu (A, B, C...), đi đến khu gần nhất rồi tìm trong khu đó.
            <strong>{" "}Nhanh gấp 100-1000x, chỉ mất chút chính xác!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="FAISS IVF index có 100 cụm, mỗi cụm 100K vector. Bạn chỉ tìm trong 1 cụm gần nhất (nprobe=1). Kết quả thiếu vì nearest neighbor thật nằm ở cụm bên cạnh. Làm sao?"
          options={[
            "Tăng số cụm lên 1000",
            "Tăng nprobe (tìm trong nhiều cụm hơn, VD: nprobe=5) -- cân bằng tốc độ vs recall",
            "Chuyển sang Flat index",
          ]}
          correct={1}
          explanation="nprobe = số cụm tìm kiếm. nprobe=1 nhanh nhất nhưng recall thấp nhất. nprobe=10 chậm hơn 10x nhưng recall gần 100%. Tuning nprobe là trade-off chính trong FAISS IVF!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>FAISS</strong>{" "}(Facebook AI Similarity Search) là thư viện mã nguồn mở của Meta,
            chuyên tìm kiếm vector tương tự trên quy mô lớn.
          </p>

          <Callout variant="insight" title="Các loại index trong FAISS">
            <div className="space-y-2 text-sm">
              <p><strong>IndexFlatL2 / IndexFlatIP:</strong>{" "}Brute-force. Exact search. Dùng cho &lt; 1M vectors.</p>
              <p><strong>IndexIVFFlat:</strong>{" "}K-means clustering + Flat search trong cụm. Nhanh ~100x.</p>
              <p><strong>IndexIVFPQ:</strong>{" "}IVF + Product Quantization. Giảm bộ nhớ 10-100x. Nhanh + nhẹ.</p>
              <p><strong>IndexHNSWFlat:</strong>{" "}Đồ thị HNSW. Recall cao nhất, nhưng tốn bộ nhớ. O(log N).</p>
            </div>
          </Callout>

          <p><strong>Product Quantization</strong>{" "}nén vector:</p>
          <LaTeX block>{"\\mathbf{x} \\in \\mathbb{R}^d \\rightarrow (q_1, q_2, \\ldots, q_m) \\in \\{1,\\ldots,k\\}^m"}</LaTeX>
          <p className="text-sm text-muted">
            Chia vector d-chiều thành m nhóm, mỗi nhóm quantize thành 1 byte (k=256 centroids).
            Vector 768-d (3072 bytes) -> 8 bytes!
          </p>

          <CodeBlock language="python" title="FAISS: từ Flat đến IVF+PQ">
{`import faiss
import numpy as np

d = 768           # dimension (embedding size)
n = 10_000_000    # 10M vectors (chatbot pháp luật VN)
nq = 1            # 1 query

# Dữ liệu giả lập
xb = np.random.random((n, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

# 1. Flat Index (exact search) -- chậm nhưng chính xác
index_flat = faiss.IndexFlatL2(d)
index_flat.add(xb)
D, I = index_flat.search(xq, k=10)  # ~5 giây cho 10M

# 2. IVF Index (approximate) -- nhanh ~100x
nlist = 1000  # 1000 cụm
quantizer = faiss.IndexFlatL2(d)
index_ivf = faiss.IndexIVFFlat(quantizer, d, nlist)
index_ivf.train(xb)        # K-means training
index_ivf.add(xb)
index_ivf.nprobe = 10       # tìm trong 10 cụm
D, I = index_ivf.search(xq, k=10)  # ~50ms!

# 3. IVF + PQ (approximate + compressed)
m = 8  # 8 sub-vectors
index_ivfpq = faiss.IndexIVFPQ(quantizer, d, nlist, m, 8)
index_ivfpq.train(xb)
index_ivfpq.add(xb)
# Bộ nhớ: 10M x 8 bytes = 80MB (thay vì 30GB!)

# GPU acceleration (nếu có)
res = faiss.StandardGpuResources()
gpu_index = faiss.index_cpu_to_gpu(res, 0, index_flat)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "FAISS: thư viện Meta cho similarity search. Hỗ trợ CPU + GPU, scale tỷ vector.",
          "Flat: exact, chậm. IVF: phân cụm, nhanh ~100x. HNSW: đồ thị, recall cao nhất.",
          "Product Quantization nén vector 100x: 768 floats (3KB) -> 8 bytes!",
          "nprobe (IVF) là trade-off chính: nprobe cao = recall cao nhưng chậm hơn",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
