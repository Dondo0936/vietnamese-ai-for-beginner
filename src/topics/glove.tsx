"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "glove",
  title: "GloVe",
  titleVi: "GloVe - Biểu diễn vector toàn cục",
  description:
    "Phương pháp học biểu diễn từ dựa trên ma trận đồng xuất hiện toàn cục, kết hợp ưu điểm của phương pháp toàn cục và cục bộ.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["word2vec", "word-embeddings", "bag-of-words"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const WORDS_ROW = ["phở", "ngon", "Hà Nội", "bún", "chả", "xe máy"];
const MATRIX = [
  [0, 8, 5, 4, 3, 0],
  [8, 0, 3, 6, 5, 0],
  [5, 3, 0, 3, 2, 4],
  [4, 6, 3, 0, 7, 0],
  [3, 5, 2, 7, 0, 0],
  [0, 0, 4, 0, 0, 0],
];

const QUIZ: QuizQuestion[] = [
  {
    question: "GloVe khác Word2Vec ở điểm cốt lõi nào?",
    options: [
      "GloVe dùng neural network sâu hơn",
      "GloVe dùng thống kê đồng xuất hiện TOÀN CỤC, Word2Vec dùng cửa sổ CỤC BỘ",
      "GloVe chỉ dùng cho tiếng Anh",
      "GloVe không tạo word embeddings",
    ],
    correct: 1,
    explanation:
      "Word2Vec nhìn từng cửa sổ cục bộ (local). GloVe xây ma trận đồng xuất hiện toàn cục (global) rồi phân tích — kết hợp ưu điểm cả hai trường phái.",
  },
  {
    question: "Trong ma trận đồng xuất hiện, giá trị X(phở, ngon) = 8 có nghĩa gì?",
    options: [
      "'Phở' và 'ngon' giống nhau 80%",
      "'Phở' và 'ngon' xuất hiện gần nhau 8 lần trong toàn bộ dữ liệu",
      "'Phở' có 8 ký tự",
      "'Ngon' xuất hiện 8 lần trong dữ liệu",
    ],
    correct: 1,
    explanation:
      "Ma trận đồng xuất hiện đếm số lần hai từ xuất hiện gần nhau (trong cửa sổ) trên TOÀN BỘ dữ liệu. X(phở, ngon) = 8 → phở và ngon rất thường đi cùng nhau!",
  },
  {
    question: "GloVe tối ưu hàm mất mát nào?",
    options: [
      "Cross-entropy loss",
      "Tích vô hướng vector ≈ logarithm số lần đồng xuất hiện",
      "Mean squared error trên xác suất từ",
      "Contrastive loss",
    ],
    correct: 1,
    explanation:
      "GloVe muốn: w_i · w_j ≈ log(X_ij). Nếu phở và ngon đồng xuất hiện nhiều (X=8), tích vô hướng vector của chúng phải lớn → vector gần nhau.",
  },
];

/* ── Main Component ── */
export default function GloveTopic() {
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

  const maxVal = useMemo(() => {
    let m = 0;
    for (const row of MATRIX) {
      for (const v of row) {
        if (v > m) m = v;
      }
    }
    return m;
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Nếu đếm tất cả sách tiếng Việt, cặp từ nào sẽ xuất hiện CÙNG NHAU nhiều nhất?`}
          options={['"phở" và "xe máy"', '"phở" và "ngon"', '"xe máy" và "ngon"']}
          correct={1}
          explanation={`"Phở" và "ngon" rất hay đi cùng nhau trong văn bản tiếng Việt! GloVe dựa trên ý tưởng này: đếm tần suất ĐI CÙNG NHAU của mọi cặp từ trên toàn bộ dữ liệu, rồi dùng thống kê đó để tạo word embeddings.`}
        />
      </LessonSection>

      {/* ── Step 2: Co-occurrence Matrix ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Đây là bước đầu tiên của GloVe: xây dựng ma trận đồng xuất hiện. Mỗi ô cho biết 2 từ xuất hiện gần nhau bao nhiêu lần. Di chuột qua ô để xem chi tiết!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Matrix */}
            <div className="overflow-x-auto">
              <table className="mx-auto">
                <thead>
                  <tr>
                    <th className="px-2 py-1"></th>
                    {WORDS_ROW.map((w) => (
                      <th key={w} className="px-2 py-1 text-xs font-bold text-accent text-center">{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WORDS_ROW.map((rowWord, ri) => (
                    <tr key={rowWord}>
                      <td className="px-2 py-1 text-xs font-bold text-accent text-right">{rowWord}</td>
                      {MATRIX[ri].map((val, ci) => {
                        const isHovered = hoveredCell && hoveredCell[0] === ri && hoveredCell[1] === ci;
                        const isDiag = ri === ci;
                        const intensity = val / maxVal;
                        return (
                          <td key={ci}
                            className="px-1 py-1"
                            onMouseEnter={() => setHoveredCell([ri, ci])}
                            onMouseLeave={() => setHoveredCell(null)}>
                            <div className={`w-12 h-10 rounded flex items-center justify-center text-xs font-bold transition-all cursor-default ${
                              isDiag ? "bg-surface text-muted" : isHovered ? "ring-2 ring-accent scale-110" : ""
                            }`}
                              style={isDiag ? {} : { backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.7})`, color: val > 4 ? "white" : "#94a3b8" }}>
                              {isDiag ? "-" : val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hover info */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center min-h-[48px]">
              {hoveredCell && hoveredCell[0] !== hoveredCell[1] ? (
                <p className="text-sm text-foreground">
                  <strong className="text-accent">{WORDS_ROW[hoveredCell[0]]}</strong>{" "}
                  và <strong className="text-accent">{WORDS_ROW[hoveredCell[1]]}</strong>{" "}
                  xuất hiện gần nhau <strong className="text-accent">{MATRIX[hoveredCell[0]][hoveredCell[1]]}</strong> lần.{" "}
                  {MATRIX[hoveredCell[0]][hoveredCell[1]] >= 6
                    ? "Rất thường đi cùng nhau!"
                    : MATRIX[hoveredCell[0]][hoveredCell[1]] >= 3
                    ? "Khá thường gặp cùng nhau."
                    : MATRIX[hoveredCell[0]][hoveredCell[1]] === 0
                    ? "Hiếm khi đi cùng nhau."
                    : "Đôi khi đi cùng nhau."}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Di chuột qua ô bất kỳ để xem mối quan hệ giữa hai từ. Giá trị cao = hay đi cùng nhau.
                </p>
              )}
            </div>

            {/* Key insight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-center">
                <p className="text-xs text-green-500 font-semibold">Gần nhau</p>
                <p className="text-sm text-foreground mt-1">
                  phở + ngon = <strong className="text-green-500">8</strong>
                </p>
                <p className="text-xs text-muted">→ vector gần nhau</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
                <p className="text-xs text-red-500 font-semibold">Xa nhau</p>
                <p className="text-sm text-foreground mt-1">
                  phở + xe máy = <strong className="text-red-500">0</strong>
                </p>
                <p className="text-xs text-muted">→ vector xa nhau</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>GloVe</strong>{" "}
            = Global Vectors. Nó xây bảng thống kê {'"ai đi cùng ai"'} trên TOÀN BỘ dữ liệu, rồi tìm vector sao cho tích vô hướng = log(số lần đi cùng).
          </p>
          <p className="text-sm text-muted mt-1">
            Giống thám tử: Word2Vec theo dõi từng cuộc gặp riêng lẻ, GloVe lập bảng tổng hợp {'"ai gặp ai bao nhiêu lần trong cả năm"'} rồi phân tích mối quan hệ.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Trong ma trận, 'bún' và 'chả' đồng xuất hiện 7 lần, nhưng 'bún' và 'xe máy' = 0 lần. GloVe sẽ tạo embeddings thế nào?"
          options={[
            "vector('bún') và vector('chả') gần nhau, vector('bún') và vector('xe máy') xa nhau",
            "Tất cả vector bằng nhau",
            "Không thể xác định",
          ]}
          correct={0}
          explanation="GloVe muốn: w_bún · w_chả ≈ log(7) = 1.95 (lớn) và w_bún · w_xe_máy ≈ log(0+1) = 0 (nhỏ). Nên bún gần chả, xa xe máy!"
        />
      </LessonSection>

      {/* ── Step 5: GloVe vs Word2Vec ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh">
        <ToggleCompare
          labelA="Word2Vec (cục bộ)"
          labelB="GloVe (toàn cục)"
          description="Hai triết lý khác nhau dẫn đến cùng kết quả: word embeddings chất lượng cao."
          childA={
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Cách học:</strong>{" "}
                  Duyệt từng cửa sổ cục bộ, dự đoán từ dựa trên ngữ cảnh.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Ưu điểm:</strong>{" "}
                  Đơn giản, hiệu quả với tập dữ liệu nhỏ-vừa.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Nhược điểm:</strong>{" "}
                  Không tận dụng thống kê toàn cục, kết quả phụ thuộc vào thứ tự duyệt.
                </p>
              </div>
              <div className="rounded bg-blue-500/10 p-2 text-xs text-blue-400 text-center">
                Giống đọc sách lần lượt, học từng trang
              </div>
            </div>
          }
          childB={
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Cách học:</strong>{" "}
                  Xây ma trận đồng xuất hiện toàn cục, phân tích cùng lúc.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Ưu điểm:</strong>{" "}
                  Tận dụng thống kê toàn cục, ổn định, song song hóa tốt.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Nhược điểm:</strong>{" "}
                  Ma trận rất lớn với từ vựng lớn, tốn bộ nhớ.
                </p>
              </div>
              <div className="rounded bg-purple-500/10 p-2 text-xs text-purple-400 text-center">
                Giống lập bảng tổng kết rồi phân tích cùng lúc
              </div>
            </div>
          }
        />
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>GloVe</strong>{" "}
            (Global Vectors for Word Representation, Stanford 2014) kết hợp hai trường phái: phân tích ma trận toàn cục (như LSA) và học cửa sổ cục bộ (như Word2Vec).
          </p>

          <Callout variant="insight" title="Hàm mất mát GloVe">
            <p>GloVe tối ưu để tích vô hướng vector xấp xỉ logarithm đồng xuất hiện:</p>
            <LaTeX display>{`J = \\sum_{i,j=1}^{V} f(X_{ij}) \\left( \\mathbf{w}_i^{\\top} \\tilde{\\mathbf{w}}_j + b_i + \\tilde{b}_j - \\log X_{ij} \\right)^2`}</LaTeX>
            <p className="mt-2 text-sm">
              Trong đó <LaTeX>{`X_{ij}`}</LaTeX>{" "}
              là số lần từ i và j đồng xuất hiện, <LaTeX>{`f(X_{ij})`}</LaTeX>{" "}
              là hàm trọng số để giảm ảnh hưởng của cặp xuất hiện quá nhiều.
            </p>
          </Callout>

          <Callout variant="info" title="Hàm trọng số f(x)">
            <LaTeX display>{`f(x) = \\begin{cases} (x/x_{\\max})^{\\alpha} & \\text{nếu } x < x_{\\max} \\\\ 1 & \\text{nếu } x \\geq x_{\\max} \\end{cases}`}</LaTeX>
            <p className="mt-2 text-sm">
              Với <LaTeX>{`x_{\\max} = 100`}</LaTeX>{" "}
              và <LaTeX>{`\\alpha = 0.75`}</LaTeX>. Cặp từ đồng xuất hiện ít được đánh trọng số nhỏ hơn (vì thống kê không đáng tin cậy).
            </p>
          </Callout>

          <CodeBlock language="python" title="glove_demo.py">
{`# Sử dụng GloVe pre-trained
import numpy as np

# Tải GloVe vectors (glove.6B.100d.txt)
embeddings = {}
with open("glove.6B.100d.txt", "r") as f:
    for line in f:
        values = line.split()
        word = values[0]
        vector = np.array(values[1:], dtype="float32")
        embeddings[word] = vector

# Cosine similarity
def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# So sánh
print(cosine_sim(embeddings["king"], embeddings["queen"]))
# 0.75 — rất gần!

print(cosine_sim(embeddings["king"], embeddings["car"]))
# 0.15 — rất xa!

# Phép tính vector
result = embeddings["king"] - embeddings["man"] + embeddings["woman"]
# Tìm từ gần result nhất → "queen" (0.71)`}
          </CodeBlock>

          <Callout variant="tip" title="Khi nào dùng GloVe vs Word2Vec?">
            <p>
              <strong>GloVe:</strong>{" "}
              Dữ liệu lớn, cần embeddings ổn định, có sẵn pre-trained (6B, 42B tokens).{" "}
              <strong>Word2Vec:</strong>{" "}
              Dữ liệu nhỏ-vừa, cần huấn luyện tùy chỉnh, dùng Skip-gram cho từ hiếm. Cả hai đều là nền tảng cho NLP hiện đại.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về GloVe"
          points={[
            "GloVe xây ma trận đồng xuất hiện TOÀN CỤC — đếm số lần mọi cặp từ đi cùng nhau.",
            "Mục tiêu: w_i · w_j ≈ log(X_ij) — tích vô hướng xấp xỉ log đồng xuất hiện.",
            "Kết hợp ưu điểm LSA (toàn cục) + Word2Vec (cục bộ) → embeddings ổn định.",
            "Pre-trained GloVe (Stanford): 6B tokens, 400K từ, kích thước 50-300 chiều.",
            "Hạn chế: mỗi từ chỉ có 1 vector (không phân biệt nghĩa khác nhau) — BERT giải quyết điều này.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
