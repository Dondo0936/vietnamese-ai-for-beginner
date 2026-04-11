"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "neural-network-overview", title: "Neural Network Overview", titleVi: "Tong quan mang no-ron — Bo nao nhan tao", description: "Cai nhin toan canh ve mang no-ron nhan tao: tu cau truc, cach hoc, den cac kien truc pho bien nhat.", category: "foundations", tags: ["neural-network", "overview", "deep-learning", "architecture"], difficulty: "beginner", relatedSlugs: ["perceptron", "mlp", "backpropagation", "activation-functions"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function NeuralNetworkOverviewTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Neural network 'hoc' bang cach nao?", options: ["Lap trinh tung quy tac thu cong", "Dieu chinh weights (trong so) thong qua backpropagation de giam loss function — giong dieu chinh nui am thanh de nghe hay nhat", "Cop du lieu tu internet"], correct: 1, explanation: "Neural network = tap hop weights. Training = tim weights toi uu. Backpropagation tinh gradient cua loss theo tung weight → gradient descent dieu chinh weights → loss giam dan → model dung dan. Nhu dieu chinh 1 trieu nui am thanh cung luc!" },
    { question: "Tai sao can activation function (ReLU, sigmoid)?", options: ["De tinh nhanh hon", "Khong co activation → mang chi la phep nhan ma tran (tuyen tinh) → khong hoc duoc non-linear patterns", "De giam overfitting"], correct: 1, explanation: "Linear(Linear(x)) = Linear(x) — bao nhieu layers cung chi la 1 phep bien doi tuyen tinh. Activation function (ReLU, tanh) them non-linearity → mang co the hoc bat ky function nao (Universal Approximation Theorem). ReLU: max(0, x) — don gian, hieu qua." },
    { question: "Deep Learning khac Machine Learning the nao?", options: ["Hoan toan khac nhau", "Deep Learning LA Machine Learning, nhung dung neural networks nhieu layers (deep) → tu hoc features thay vi can feature engineering thu cong", "Deep Learning khong can data"], correct: 1, explanation: "ML truyen thong: feature engineering thu cong → model. DL: raw data → neural network tu hoc features (layers dau hoc edges, layers giua hoc shapes, layers sau hoc concepts). Trade-off: DL can NHIEU data hon nhung khong can feature engineering." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Nao con nguoi co 86 ty neuron, moi neuron ket noi 7000 neuron khac. Neural network nhan tao bat chuoc dieu gi?" options={["Copy chinh xac bo nao", "Lay y tuong: nhieu don vi don gian (neurons) ket noi thanh mang → xu ly thong tin phuc tap. Nhung don gian hon nao rat nhieu", "Khong lien quan den nao"]} correct={1} explanation="Neural network lay CAM HUNG tu nao: nhieu neurons don gian ket noi → xu ly phuc tap. Nhung artificial neuron don gian hon nhieu: chi la weighted sum + activation function. Suc manh den tu NHIEU neurons ket hop, giong kiên truc bat chuoc tu nhien nhung khong giong hoan toan.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Cau truc Neural Network</text>
              {/* Input layer */}
              {[0,1,2].map(i => (<g key={`i${i}`}><circle cx={80} cy={50+i*40} r={14} fill="#3b82f6" opacity={0.8} /><text x={80} y={54+i*40} textAnchor="middle" fill="white" fontSize={8}>x{i+1}</text></g>))}
              <text x={80} y={175} textAnchor="middle" fill="#3b82f6" fontSize={9}>Input</text>
              {/* Hidden layer */}
              {[0,1,2,3].map(i => (<g key={`h${i}`}><circle cx={250} cy={35+i*35} r={14} fill="#f59e0b" opacity={0.8} /><text x={250} y={39+i*35} textAnchor="middle" fill="white" fontSize={8}>h{i+1}</text></g>))}
              <text x={250} y={175} textAnchor="middle" fill="#f59e0b" fontSize={9}>Hidden</text>
              {/* Output */}
              {[0,1].map(i => (<g key={`o${i}`}><circle cx={420} cy={60+i*50} r={14} fill="#22c55e" opacity={0.8} /><text x={420} y={64+i*50} textAnchor="middle" fill="white" fontSize={8}>y{i+1}</text></g>))}
              <text x={420} y={175} textAnchor="middle" fill="#22c55e" fontSize={9}>Output</text>
              {/* Connections (simplified) */}
              {[0,1,2].map(i => [0,1,2,3].map(j => (<line key={`c1${i}${j}`} x1={94} y1={50+i*40} x2={236} y2={35+j*35} stroke="#475569" strokeWidth={0.5} opacity={0.3} />)))}
              {[0,1,2,3].map(i => [0,1].map(j => (<line key={`c2${i}${j}`} x1={264} y1={35+i*35} x2={406} y2={60+j*50} stroke="#475569" strokeWidth={0.5} opacity={0.3} />)))}
              {/* Formula */}
              <text x={540} y={80} textAnchor="middle" fill="#94a3b8" fontSize={8}>y = f(Wx + b)</text>
              <text x={540} y={95} textAnchor="middle" fill="#94a3b8" fontSize={7}>W: weights</text>
              <text x={540} y={107} textAnchor="middle" fill="#94a3b8" fontSize={7}>b: bias</text>
              <text x={540} y={119} textAnchor="middle" fill="#94a3b8" fontSize={7}>f: activation</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Neural network chi la: <strong>nhieu phep nhan ma tran + activation functions</strong>. Suc manh khong tu 1 neuron ma tu <strong>hang trieu neurons ket noi</strong>{" "}— giong dan kien: 1 con yeu, ca dan lam duoc moi thu. Training = dieu chinh hang trieu 'nui am thanh' (weights) de output dung!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Neural network 3 layers, moi layer 100 neurons. Co bao nhieu parameters (weights + biases)? Input size 10, output size 2." options={["302 (10+100+100+100+2)", "10*100 + 100 + 100*100 + 100 + 100*2 + 2 = 11,302", "1 trieu"]} correct={1} explanation="Layer 1: 10x100 weights + 100 biases = 1100. Layer 2: 100x100 + 100 = 10100. Layer 3: 100x2 + 2 = 202. Tong: 11,302 parameters. GPT-4 co ~1.8 NGHIN TY parameters — gap 160 trieu lan! Moi parameter la 1 'nui am thanh' can dieu chinh." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Neural Network</strong>{" "}la mo hinh gom nhieu layers neurons ket noi, hoc bang cach dieu chinh weights de giam loss.</p>
          <p><strong>Forward pass (1 neuron):</strong></p>
          <LaTeX block>{"z = \\sum_{i=1}^{n} w_i x_i + b \\quad \\text{(weighted sum)}"}</LaTeX>
          <LaTeX block>{"a = \\sigma(z) \\quad \\text{(activation: ReLU, sigmoid, tanh)}"}</LaTeX>
          <p><strong>Training loop:</strong></p>
          <LaTeX block>{"\\theta_{t+1} = \\theta_t - \\eta \\cdot \\nabla_\\theta \\mathcal{L}(\\theta) \\quad \\text{(gradient descent)}"}</LaTeX>
          <Callout variant="tip" title="Universal Approximation Theorem">Neural network voi 1 hidden layer du rong co the xap xi BAT KY function nao. Nhung trong thuc te, nhieu layers (deep) hieu qua hon: moi layer hoc muc abstraction cao hon (edges → shapes → objects).</Callout>
          <p><strong>Cac kien truc pho bien:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>MLP:</strong>{" "}Fully connected. Tot cho tabular data</li>
            <li><strong>CNN:</strong>{" "}Convolution. Tot cho anh, video</li>
            <li><strong>RNN/LSTM:</strong>{" "}Recurrence. Tot cho sequence (truoc Transformer)</li>
            <li><strong>Transformer:</strong>{" "}Attention. Tot cho text, multimodal — kien truc chu dao hien nay</li>
          </ul>
          <CodeBlock language="python" title="Neural Network co ban voi PyTorch">{`import torch
import torch.nn as nn

class SimpleNN(nn.Module):
    def __init__(self, input_size=10, hidden=100, output=2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, hidden),  # Layer 1
            nn.ReLU(),                       # Activation
            nn.Linear(hidden, hidden),       # Layer 2
            nn.ReLU(),
            nn.Linear(hidden, output),       # Output layer
        )

    def forward(self, x):
        return self.net(x)

model = SimpleNN()
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")
# 11,302 parameters

# Training loop
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(100):
    output = model(X_train)              # Forward
    loss = criterion(output, y_train)    # Tinh loss
    loss.backward()                       # Backpropagation
    optimizer.step()                      # Update weights
    optimizer.zero_grad()`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Neural network = nhieu layers neurons. Moi neuron: weighted sum + activation function.", "Training: backpropagation tinh gradient → gradient descent dieu chinh weights → giam loss.", "Activation (ReLU) them non-linearity — khong co thi mang chi la phep nhan ma tran.", "Deep Learning = neural networks nhieu layers → tu hoc features, khong can feature engineering.", "4 kien truc: MLP (tabular), CNN (anh), RNN (sequence), Transformer (text, multimodal)."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
