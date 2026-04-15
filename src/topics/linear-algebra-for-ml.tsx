"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "linear-algebra-for-ml", title: "Linear Algebra for ML", titleVi: "Đại số tuyến tính cho ML", description: "Vector, ma trận, phép nhân ma trận và trị riêng — nền tảng toán học cho mọi mô hình AI", category: "math-foundations", tags: ["vectors", "matrices", "eigenvalues"], difficulty: "beginner", relatedSlugs: ["pca", "word-embeddings", "neural-network-overview"], vizType: "interactive", tocSections: [{ id: "explanation", labelVi: "Giải thích" }] };

const TOTAL_STEPS = 7;
export default function LinearAlgebraForMLTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Tại sao neural network là 'chỉ là phép nhân ma trận'?", options: ["Không đúng", "Mỗi layer: output = activation(W * input + b). W là ma trận weights, input là vector. Forward pass = chuỗi phép nhân ma trận + activation", "Chỉ đúng cho CNN"], correct: 1, explanation: "Layer 1: h = ReLU(W1 * x + b1). Layer 2: y = softmax(W2 * h + b2). W1 là ma trận (128x784), x là vector (784), h là vector (128). Toàn bộ neural network = chuỗi mat mul + activation. Đây là lý do GPU (giỏi mat mul) tốt cho AI!" },
    { question: "Eigenvalues/eigenvectors dùng cho gì trong ML?", options: ["Không dùng", "PCA: tìm eigenvectors của covariance matrix → hướng có nhiều variance nhất → giảm chiều giữ thông tin", "Chỉ dùng cho physics"], correct: 1, explanation: "PCA: covariance matrix C = X^T * X / n. Eigendecomposition: C = V * Lambda * V^T. Eigenvectors V = hướng chính của data (principal components). Eigenvalues Lambda = bao nhiêu variance mỗi hướng. Chọn top-k eigenvectors → giảm chiều từ 1000 xuống 50 giữ 95% thông tin!" },
    { question: "Dot product (tích vô hướng) dùng cho gì trong AI?", options: ["Chỉ là phép toán cơ bản", "Đo TƯƠNG TỰ giữa 2 vectors: cosine similarity = dot(a,b) / (|a|*|b|). Dùng trong: attention, embedding similarity, recommendation", "Tính diện tích"], correct: 1, explanation: "Dot product = đo góc giữa 2 vectors. Vectors cùng hướng → dot product lớn (tương tự). Vuông góc → 0 (không liên quan). Ngược hướng → âm (đối lập). Attention: Q*K^T = đo tương tự giữa query và key. Embedding search: cosine(user, item) → recommendation." },
    { type: "fill-blank", question: "Nhân ma trận A kích thước (3, 4) với ma trận B kích thước (4, 5) cho ra ma trận kết quả kích thước ({blank}).", blanks: [{ answer: "3, 5", accept: ["(3, 5)", "3x5", "3×5"] }], explanation: "Quy tắc nhân ma trận: (m, n) @ (n, k) → (m, k). Số cột của A phải bằng số hàng của B. Ở đây (3, 4) @ (4, 5) → (3, 5). Kích thước kết quả lấy số hàng của A và số cột của B." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="GPT-4 có 1.8 nghìn tỷ tham số, stored trong matrices. Mỗi lần sinh 1 token, cần nhân hàng triệu matrices. GPU giỏi gì mà làm được?" options={["GPU giỏi graphics", "GPU giỏi NHÂN MA TRẬN SONG SONG — và neural network CHỈ LÀ chuỗi phép nhân ma trận. Đây là lý do GPU tốt cho AI!", "GPU nhanh hơn CPU ở mọi thứ"]} correct={1} explanation="Neural network = chuỗi matrix multiplication. GPU có hàng nghìn cores chạy song song → nhân ma trận cực nhanh (10-100x nhanh hơn CPU). Đây không phải tình cờ — linear algebra là NGÔN NGỮ của AI. Hiểu linear algebra = hiểu cách AI hoạt động!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>Mọi thứ trong AI là <strong>linear algebra</strong>: Embedding = <strong>vector</strong>. Neural network = <strong>matrix multiplication</strong>. Attention = <strong>dot product</strong>. PCA = <strong>eigendecomposition</strong>. GPU = <strong>matrix multiplication accelerator</strong>. Hiểu linear algebra = hiểu 80% của AI!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="Ma trận W có size (128, 784). Input vector x có size (784,). Output y = W @ x có size gì?" options={["(784,)", "(128,) — ma trận (128, 784) nhân vector (784,) → vector (128,). Giảm từ 784 features xuống 128 features", "(128, 784)"]} correct={1} explanation="Matrix multiplication: (m, n) @ (n,) → (m,). W (128, 784) @ x (784,) → y (128,). Ma trận W 'biến đổi' vector 784 chiều thành vector 128 chiều. Đây chính là 1 layer neural network: giảm dimensionality, trích xuất features!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Linear Algebra</strong>{" "}là ngôn ngữ của AI — vector, ma trận, và các phép toán trên chúng. Các khái niệm này là nền tảng cho <TopicLink slug="neural-network-overview">mạng nơ-ron</TopicLink>, <TopicLink slug="forward-propagation">lan truyền xuôi</TopicLink>, và cả <TopicLink slug="probability-statistics">xác suất thống kê</TopicLink> — vốn dùng vector để biểu diễn phân phối. Khi học <TopicLink slug="calculus-for-backprop">giải tích cho backprop</TopicLink>, bạn sẽ thấy gradient cũng là một vector.</p>
        <p><strong>Vector (1D):</strong></p>
        <LaTeX block>{"\\mathbf{x} = [x_1, x_2, ..., x_n] \\in \\mathbb{R}^n \\quad \\text{(điểm trong không gian n chiều)}"}</LaTeX>
        <p><strong>Matrix multiplication (core của neural network):</strong></p>
        <LaTeX block>{"\\mathbf{y} = W\\mathbf{x} + \\mathbf{b} \\quad W \\in \\mathbb{R}^{m \\times n}, \\mathbf{x} \\in \\mathbb{R}^n \\rightarrow \\mathbf{y} \\in \\mathbb{R}^m"}</LaTeX>
        <p><strong>Dot product (tương tự):</strong></p>
        <LaTeX block>{"\\text{cosine}(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\|\\mathbf{a}\\| \\|\\mathbf{b}\\|} \\quad \\text{(đo tương tự giữa 2 vectors)}"}</LaTeX>
        <p><strong>Eigendecomposition (PCA):</strong></p>
        <LaTeX block>{"A\\mathbf{v} = \\lambda \\mathbf{v} \\quad \\text{(eigenvector } \\mathbf{v} \\text{ không đổi hướng khi nhân A)}"}</LaTeX>
        <Callout variant="tip" title="Attention = Linear Algebra">Transformer Attention: Q, K, V là matrices. Attention = softmax(Q * K^T / sqrt(d)) * V. Toàn bộ chỉ là matrix operations! Self-attention = mỗi token 'hỏi' tất cả tokens khác bằng dot product.</Callout>
        <CodeBlock language="python" title="Linear Algebra cơ bản với NumPy">{`import numpy as np

# Vector (embedding)
x = np.array([0.1, 0.5, -0.3, 0.8])  # 4D embedding

# Matrix multiplication (1 neural network layer)
W = np.random.randn(3, 4)  # Weight matrix (3, 4)
b = np.zeros(3)             # Bias
y = W @ x + b               # Output (3,) — giảm từ 4D xuống 3D

# Cosine similarity (embedding search)
a = np.array([1, 0, 1])
b = np.array([1, 1, 0])
cosine = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(f"Cosine similarity: {cosine:.3f}")  # 0.5

# Eigendecomposition (PCA)
C = np.cov(X.T)  # Covariance matrix
eigenvalues, eigenvectors = np.linalg.eigh(C)
# Top-k eigenvectors = principal components`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["Mọi thứ trong AI là linear algebra: embedding = vector, NN = mat mul, attention = dot product.", "Matrix multiplication (m,n)@(n,k)=(m,k): core operation của neural networks.", "Dot product đo tương tự: cosine similarity dùng trong embedding search, attention, recommendation.", "Eigendecomposition: PCA tìm hướng có nhiều variance nhất → giảm chiều giữ thông tin.", "GPU giỏi mat mul song song → tốt cho AI. Hiểu linear algebra = hiểu 80% AI."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
