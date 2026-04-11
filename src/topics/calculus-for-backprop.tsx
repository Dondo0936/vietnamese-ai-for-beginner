"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "calculus-for-backprop", title: "Calculus for Backpropagation", titleVi: "Giai tich cho lan truyen nguoc", description: "Dao ham, quy tac chuoi va gradient — toan hoc dang sau qua trinh huan luyen mang no-ron", category: "math-foundations", tags: ["derivatives", "chain-rule", "gradient"], difficulty: "intermediate", relatedSlugs: ["backpropagation", "gradient-descent", "loss-functions"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function CalculusForBackpropTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Dao ham f'(x) cho biet gi?", options: ["Gia tri cua f tai x", "TOC DO THAY DOI cua f khi x thay doi. Trong ML: loss thay doi bao nhieu khi weight thay doi 1 chut → huong dieu chinh weight", "Dien tich duoi f"], correct: 1, explanation: "f'(x) = lim (f(x+h) - f(x)) / h. Trong ML: dL/dw = loss thay doi bao nhieu khi weight w thay doi. Gradient descent: w_new = w - lr * dL/dw. Dieu chinh weight NGUOC HUONG gradient → loss giam. Day la cach neural network 'hoc'!" },
    { question: "Chain Rule quan trong cho backprop vi sao?", options: ["De tinh nhanh", "Neural network = chuoi ham: y = f3(f2(f1(x))). Chain rule cho phep tinh dao ham 'NGUOC LAI' qua tung layer ma khong can tinh toan bo", "Chi dung cho RNN"], correct: 1, explanation: "y = f(g(h(x))). dy/dx = dy/dg * dg/dh * dh/dx. Moi layer tinh local gradient, nhan nguoc lai → gradient cho moi weight. 100 layers × local gradient thay vi differentiate ham 100 lop truc tiep. Day la 'back' trong 'backpropagation'!" },
    { question: "Vanishing gradient xay ra khi nao?", options: ["Gradient qua lon", "Chain rule NHAN nhieu gradient nho (vi du sigmoid: max gradient = 0.25). 100 layers: 0.25^100 ≈ 0 → weights dau KHONG DUOC CAP NHAT", "Khi learning rate qua lon"], correct: 1, explanation: "Sigmoid gradient max = 0.25. 50 layers nhan nhau: 0.25^50 ≈ 10^-30 → gradient = 0 → layers dau khong hoc. Giai phap: ReLU (gradient = 1 hoac 0), residual connections (skip connections), batch normalization. Day la ly do ReLU thay the sigmoid cho deep networks." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Neural network co 1 trieu weights. Training = tim gia tri toi uu cho 1 trieu bien so. Lam sao biet dieu chinh moi weight theo huong nao?" options={["Thu random", "Dao ham (gradient): tinh 'huong doc nhat' cho moi weight → dieu chinh nguoc huong doc → loss giam. Backpropagation tinh gradient HIEU QUA cho tat ca weights cung luc", "Dung cong thuc"]} correct={1} explanation="Gradient = 'ban do dia hinh' cua loss landscape. Tai moi diem, gradient chi huong doc nhat (loss tang). Di NGUOC gradient = di huong loss giam nhanh nhat. Backprop = chain rule tinh gradient cho 1 trieu weights HIEU QUA (O(N) thay vi O(N^2) finite differences).">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Gradient descent giong <strong>di xuong nui trong suong mu</strong>: khong nhin thay dinh nhung <strong>cam nhan doc</strong>{" "}(gradient) roi buoc nguoc lai. Chain rule la <strong>chuyen phat nhanh</strong>: moi layer chi can tinh local gradient, <strong>chuyen nguoc</strong>{" "}cho layer truoc. 100 layers × local = efficient. Day la toan dang sau <strong>moi neural network</strong>!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="f(x) = (3x + 2)^2. Tinh f'(x) tai x=1 bang chain rule." options={["f'(1) = 50", "f'(x) = 2(3x+2)*3 = 6(3x+2). f'(1) = 6*(3+2) = 30", "f'(1) = 25"]} correct={1} explanation="Chain rule: f = u^2, u = 3x+2. df/dx = df/du * du/dx = 2u * 3 = 6(3x+2). Tai x=1: f'(1) = 6*5 = 30. Trong neural network: u = linear layer, f = activation. Backprop tinh df/dx bang cach nhan local gradients: df/du (activation grad) * du/dx (linear grad)." /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Calculus for Backpropagation</strong>{" "}— dao ham va chain rule la co che neural network 'hoc' tu data.</p>
        <p><strong>Dao ham (derivative):</strong></p>
        <LaTeX block>{"f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} \\quad \\text{(toc do thay doi)}"}</LaTeX>
        <p><strong>Chain Rule (quy tac chuoi):</strong></p>
        <LaTeX block>{"\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w} \\quad \\text{(nhan local gradients nguoc lai)}"}</LaTeX>
        <p><strong>Gradient Descent:</strong></p>
        <LaTeX block>{"w_{t+1} = w_t - \\eta \\cdot \\frac{\\partial L}{\\partial w_t} \\quad \\text{(di nguoc gradient)}"}</LaTeX>
        <Callout variant="tip" title="Autograd">Trong thuc te, ban KHONG can tinh dao ham thu cong. PyTorch autograd tu dong tinh gradient cho bat ky computation graph nao. loss.backward() tinh gradient cho TAT CA parameters. Ban chi can hieu CONCEPT, khong can tinh tay.</Callout>
        <p><strong>Dao ham cac activation pho bien:</strong></p>
        <LaTeX block>{"\\text{ReLU: } f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases} \\quad \\text{Sigmoid: } f'(x) = f(x)(1 - f(x))"}</LaTeX>
        <CodeBlock language="python" title="Backpropagation thu cong vs autograd">{`import torch

# Autograd: PyTorch tu dong tinh gradient
x = torch.tensor(2.0, requires_grad=True)
y = (3*x + 2)**2  # f(x) = (3x+2)^2
y.backward()       # Tinh gradient tu dong
print(f"df/dx tai x=2: {x.grad}")  # 48.0 = 6*(3*2+2)

# Neural network training (autograd lam tat ca)
model = torch.nn.Linear(784, 10)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

output = model(input_data)           # Forward pass
loss = torch.nn.functional.cross_entropy(output, labels)
loss.backward()                      # Backprop: tinh gradient cho TAT CA weights
optimizer.step()                     # Gradient descent: update weights
optimizer.zero_grad()                # Reset gradients

# Ban chi can goi .backward() — PyTorch tu tinh dao ham
# cho TOAN BO computation graph bang chain rule!`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Dao ham = toc do thay doi. Trong ML: dL/dw = loss thay doi bao nhieu khi weight thay doi.", "Chain rule: nhan local gradients nguoc lai qua tung layer. Day la 'back' trong 'backpropagation'.", "Gradient descent: w_new = w - lr * gradient. Di nguoc huong doc nhat → loss giam.", "Vanishing gradient: sigmoid (max 0.25) nhan nhieu layers → 0. ReLU (gradient 1) giai quyet.", "Autograd (PyTorch): tu dong tinh gradient. Ban chi can hieu concept, khong can tinh tay."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
