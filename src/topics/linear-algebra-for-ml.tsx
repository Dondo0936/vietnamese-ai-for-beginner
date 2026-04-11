"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "linear-algebra-for-ml", title: "Linear Algebra for ML", titleVi: "Dai so tuyen tinh cho ML", description: "Vector, ma tran, phep nhan ma tran va tri rieng — nen tang toan hoc cho moi mo hinh AI", category: "math-foundations", tags: ["vectors", "matrices", "eigenvalues"], difficulty: "beginner", relatedSlugs: ["pca", "word-embeddings", "neural-network-overview"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function LinearAlgebraForMLTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Tai sao neural network la 'chi la phep nhan ma tran'?", options: ["Khong dung", "Moi layer: output = activation(W * input + b). W la ma tran weights, input la vector. Forward pass = chuoi phep nhan ma tran + activation", "Chi dung cho CNN"], correct: 1, explanation: "Layer 1: h = ReLU(W1 * x + b1). Layer 2: y = softmax(W2 * h + b2). W1 la ma tran (128x784), x la vector (784), h la vector (128). Toan bo neural network = chuoi mat mul + activation. Day la ly do GPU (gioi mat mul) tot cho AI!" },
    { question: "Eigenvalues/eigenvectors dung cho gi trong ML?", options: ["Khong dung", "PCA: tim eigenvectors cua covariance matrix → huong co nhieu variance nhat → giam chieu giu thong tin", "Chi dung cho physics"], correct: 1, explanation: "PCA: covariance matrix C = X^T * X / n. Eigendecomposition: C = V * Lambda * V^T. Eigenvectors V = huong chinh cua data (principal components). Eigenvalues Lambda = bao nhieu variance moi huong. Chon top-k eigenvectors → giam chieu tu 1000 xuong 50 giu 95% thong tin!" },
    { question: "Dot product (tich vo huong) dung cho gi trong AI?", options: ["Chi la phep toan co ban", "Do TUONG TU giua 2 vectors: cosine similarity = dot(a,b) / (|a|*|b|). Dung trong: attention, embedding similarity, recommendation", "Tinh dien tich"], correct: 1, explanation: "Dot product = do goc giua 2 vectors. Vectors cung huong → dot product lon (tuong tu). Vuong goc → 0 (khong lien quan). Nguoc huong → am (doi lap). Attention: Q*K^T = do tuong tu giua query va key. Embedding search: cosine(user, item) → recommendation." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="GPT-4 co 1.8 nghin ty tham so, stored trong matrices. Moi lan sinh 1 token, can nhan hang trieu matrices. GPU gioi gi ma lam duoc?" options={["GPU gioi graphics", "GPU gioi NHAN MA TRAN SONG SONG — va neural network CHI LA chuoi phep nhan ma tran. Day la ly do GPU tot cho AI!", "GPU nhanh hon CPU o moi thu"]} correct={1} explanation="Neural network = chuoi matrix multiplication. GPU co hang nghin cores chay song song → nhan ma tran cuc nhanh (10-100x nhanh hon CPU). Day khong phai tinh co — linear algebra la NGON NGU cua AI. Hieu linear algebra = hieu cach AI hoat dong!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Moi thu trong AI la <strong>linear algebra</strong>: Embedding = <strong>vector</strong>. Neural network = <strong>matrix multiplication</strong>. Attention = <strong>dot product</strong>. PCA = <strong>eigendecomposition</strong>. GPU = <strong>matrix multiplication accelerator</strong>. Hieu linear algebra = hieu 80% cua AI!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Ma tran W co size (128, 784). Input vector x co size (784,). Output y = W @ x co size gi?" options={["(784,)", "(128,) — ma tran (128, 784) nhan vector (784,) → vector (128,). Giam tu 784 features xuong 128 features", "(128, 784)"]} correct={1} explanation="Matrix multiplication: (m, n) @ (n,) → (m,). W (128, 784) @ x (784,) → y (128,). Ma tran W 'bien doi' vector 784 chieu thanh vector 128 chieu. Day chinh la 1 layer neural network: giam dimensionality, trich xuat features!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Linear Algebra</strong>{" "}la ngon ngu cua AI — vector, ma tran, va cac phep toan tren chung.</p>
        <p><strong>Vector (1D):</strong></p>
        <LaTeX block>{"\\mathbf{x} = [x_1, x_2, ..., x_n] \\in \\mathbb{R}^n \\quad \\text{(diem trong khong gian n chieu)}"}</LaTeX>
        <p><strong>Matrix multiplication (core cua neural network):</strong></p>
        <LaTeX block>{"\\mathbf{y} = W\\mathbf{x} + \\mathbf{b} \\quad W \\in \\mathbb{R}^{m \\times n}, \\mathbf{x} \\in \\mathbb{R}^n \\rightarrow \\mathbf{y} \\in \\mathbb{R}^m"}</LaTeX>
        <p><strong>Dot product (tuong tu):</strong></p>
        <LaTeX block>{"\\text{cosine}(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\|\\mathbf{a}\\| \\|\\mathbf{b}\\|} \\quad \\text{(do tuong tu giua 2 vectors)}"}</LaTeX>
        <p><strong>Eigendecomposition (PCA):</strong></p>
        <LaTeX block>{"A\\mathbf{v} = \\lambda \\mathbf{v} \\quad \\text{(eigenvector } \\mathbf{v} \\text{ khong doi huong khi nhan A)}"}</LaTeX>
        <Callout variant="tip" title="Attention = Linear Algebra">Transformer Attention: Q, K, V la matrices. Attention = softmax(Q * K^T / sqrt(d)) * V. Toan bo chi la matrix operations! Self-attention = moi token 'hoi' tat ca tokens khac bang dot product.</Callout>
        <CodeBlock language="python" title="Linear Algebra co ban voi NumPy">{`import numpy as np

# Vector (embedding)
x = np.array([0.1, 0.5, -0.3, 0.8])  # 4D embedding

# Matrix multiplication (1 neural network layer)
W = np.random.randn(3, 4)  # Weight matrix (3, 4)
b = np.zeros(3)             # Bias
y = W @ x + b               # Output (3,) — giam tu 4D xuong 3D

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

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Moi thu trong AI la linear algebra: embedding = vector, NN = mat mul, attention = dot product.", "Matrix multiplication (m,n)@(n,k)=(m,k): core operation cua neural networks.", "Dot product do tuong tu: cosine similarity dung trong embedding search, attention, recommendation.", "Eigendecomposition: PCA tim huong co nhieu variance nhat → giam chieu giu thong tin.", "GPU gioi mat mul song song → tot cho AI. Hieu linear algebra = hieu 80% AI."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
