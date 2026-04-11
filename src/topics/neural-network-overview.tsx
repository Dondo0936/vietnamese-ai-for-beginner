"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "neural-network-overview", title: "Neural Network Overview", titleVi: "Tổng quan mạng nơ-ron — Bộ não nhân tạo", description: "Cái nhìn toàn cảnh về mạng nơ-ron nhân tạo: từ cấu trúc, cách học, đến các kiến trúc phổ biến nhất.", category: "foundations", tags: ["neural-network", "overview", "deep-learning", "architecture"], difficulty: "beginner", relatedSlugs: ["perceptron", "mlp", "backpropagation", "activation-functions"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function NeuralNetworkOverviewTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Neural network 'học' bằng cách nào?", options: ["Lập trình từng quy tắc thủ công", "Điều chỉnh weights (trọng số) thông qua backpropagation để giảm loss function — giống điều chỉnh núm âm thanh để nghe hay nhất", "Copy dữ liệu từ internet"], correct: 1, explanation: "Neural network = tập hợp weights. Training = tìm weights tối ưu. Backpropagation tính gradient của loss theo từng weight → gradient descent điều chỉnh weights → loss giảm dần → model đúng dần. Như điều chỉnh 1 triệu núm âm thanh cùng lúc!" },
    { question: "Tại sao cần activation function (ReLU, sigmoid)?", options: ["Để tính nhanh hơn", "Không có activation → mạng chỉ là phép nhân ma trận (tuyến tính) → không học được non-linear patterns", "Để giảm overfitting"], correct: 1, explanation: "Linear(Linear(x)) = Linear(x) — bao nhiêu layers cũng chỉ là 1 phép biến đổi tuyến tính. Activation function (ReLU, tanh) thêm non-linearity → mạng có thể học bất kỳ function nào (Universal Approximation Theorem). ReLU: max(0, x) — đơn giản, hiệu quả." },
    { question: "Deep Learning khác Machine Learning thế nào?", options: ["Hoàn toàn khác nhau", "Deep Learning LÀ Machine Learning, nhưng dùng neural networks nhiều layers (deep) → tự học features thay vì cần feature engineering thủ công", "Deep Learning không cần data"], correct: 1, explanation: "ML truyền thống: feature engineering thủ công → model. DL: raw data → neural network tự học features (layers đầu học edges, layers giữa học shapes, layers sau học concepts). Trade-off: DL cần NHIỀU data hơn nhưng không cần feature engineering." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Não con người có 86 tỷ neuron, mỗi neuron kết nối 7000 neuron khác. Neural network nhân tạo bắt chước điều gì?" options={["Copy chính xác bộ não", "Lấy ý tưởng: nhiều đơn vị đơn giản (neurons) kết nối thành mạng → xử lý thông tin phức tạp. Nhưng đơn giản hơn não rất nhiều", "Không liên quan đến não"]} correct={1} explanation="Neural network lấy CẢM HỨNG từ não: nhiều neurons đơn giản kết nối → xử lý phức tạp. Nhưng artificial neuron đơn giản hơn nhiều: chỉ là weighted sum + activation function. Sức mạnh đến từ NHIỀU neurons kết hợp, giống kiến trúc bắt chước tự nhiên nhưng không giống hoàn toàn.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Cấu trúc Neural Network</text>
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Neural network chỉ là: <strong>nhiều phép nhân ma trận + activation functions</strong>. Sức mạnh không từ 1 neuron mà từ <strong>hàng triệu neurons kết nối</strong>{" "}— giống đàn kiến: 1 con yếu, cả đàn làm được mọi thứ. Training = điều chỉnh hàng triệu 'núm âm thanh' (weights) để output đúng!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Neural network 3 layers, mỗi layer 100 neurons. Có bao nhiêu parameters (weights + biases)? Input size 10, output size 2." options={["302 (10+100+100+100+2)", "10*100 + 100 + 100*100 + 100 + 100*2 + 2 = 11,302", "1 triệu"]} correct={1} explanation="Layer 1: 10x100 weights + 100 biases = 1100. Layer 2: 100x100 + 100 = 10100. Layer 3: 100x2 + 2 = 202. Tổng: 11,302 parameters. GPT-4 có ~1.8 NGHÌN TỶ parameters — gấp 160 triệu lần! Mỗi parameter là 1 'núm âm thanh' cần điều chỉnh." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Neural Network</strong>{" "}là mô hình gồm nhiều layers neurons kết nối, học bằng cách điều chỉnh weights để giảm loss.</p>
          <p><strong>Forward pass (1 neuron):</strong></p>
          <LaTeX block>{"z = \\sum_{i=1}^{n} w_i x_i + b \\quad \\text{(weighted sum)}"}</LaTeX>
          <LaTeX block>{"a = \\sigma(z) \\quad \\text{(activation: ReLU, sigmoid, tanh)}"}</LaTeX>
          <p><strong>Training loop:</strong></p>
          <LaTeX block>{"\\theta_{t+1} = \\theta_t - \\eta \\cdot \\nabla_\\theta \\mathcal{L}(\\theta) \\quad \\text{(gradient descent)}"}</LaTeX>
          <Callout variant="tip" title="Universal Approximation Theorem">Neural network với 1 hidden layer đủ rộng có thể xấp xỉ BẤT KỲ function nào. Nhưng trong thực tế, nhiều layers (deep) hiệu quả hơn: mỗi layer học mức abstraction cao hơn (edges → shapes → objects).</Callout>
          <p><strong>Các kiến trúc phổ biến:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>MLP:</strong>{" "}Fully connected. Tốt cho tabular data</li>
            <li><strong>CNN:</strong>{" "}Convolution. Tốt cho ảnh, video</li>
            <li><strong>RNN/LSTM:</strong>{" "}Recurrence. Tốt cho sequence (trước Transformer)</li>
            <li><strong>Transformer:</strong>{" "}Attention. Tốt cho text, multimodal — kiến trúc chủ đạo hiện nay</li>
          </ul>
          <CodeBlock language="python" title="Neural Network cơ bản với PyTorch">{`import torch
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
    loss = criterion(output, y_train)    # Tính loss
    loss.backward()                       # Backpropagation
    optimizer.step()                      # Update weights
    optimizer.zero_grad()`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Neural network = nhiều layers neurons. Mỗi neuron: weighted sum + activation function.", "Training: backpropagation tính gradient → gradient descent điều chỉnh weights → giảm loss.", "Activation (ReLU) thêm non-linearity — không có thì mạng chỉ là phép nhân ma trận.", "Deep Learning = neural networks nhiều layers → tự học features, không cần feature engineering.", "4 kiến trúc: MLP (tabular), CNN (ảnh), RNN (sequence), Transformer (text, multimodal)."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
