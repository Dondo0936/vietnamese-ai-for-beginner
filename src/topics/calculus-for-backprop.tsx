"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "calculus-for-backprop", title: "Calculus for Backpropagation", titleVi: "Giải tích cho lan truyền ngược", description: "Đạo hàm, quy tắc chuỗi và gradient — toán học đằng sau quá trình huấn luyện mạng nơ-ron", category: "math-foundations", tags: ["derivatives", "chain-rule", "gradient"], difficulty: "intermediate", relatedSlugs: ["backpropagation", "gradient-descent", "loss-functions"], vizType: "interactive", tocSections: [{ id: "explanation", labelVi: "Giải thích" }] };

const TOTAL_STEPS = 6;
export default function CalculusForBackpropTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Đạo hàm f'(x) cho biết gì?", options: ["Giá trị của f tại x", "TỐC ĐỘ THAY ĐỔI của f khi x thay đổi. Trong ML: loss thay đổi bao nhiêu khi weight thay đổi 1 chút → hướng điều chỉnh weight", "Diện tích dưới f"], correct: 1, explanation: "f'(x) = lim (f(x+h) - f(x)) / h. Trong ML: dL/dw = loss thay đổi bao nhiêu khi weight w thay đổi. Gradient descent: w_new = w - lr * dL/dw. Điều chỉnh weight NGƯỢC HƯỚNG gradient → loss giảm. Đây là cách neural network 'học'!" },
    { question: "Chain Rule quan trọng cho backprop vì sao?", options: ["Để tính nhanh", "Neural network = chuỗi hàm: y = f3(f2(f1(x))). Chain rule cho phép tính đạo hàm 'NGƯỢC LẠI' qua từng layer mà không cần tính toàn bộ", "Chỉ dùng cho RNN"], correct: 1, explanation: "y = f(g(h(x))). dy/dx = dy/dg * dg/dh * dh/dx. Mỗi layer tính local gradient, nhân ngược lại → gradient cho mọi weight. 100 layers × local gradient thay vì differentiate hàm 100 lớp trực tiếp. Đây là 'back' trong 'backpropagation'!" },
    { question: "Vanishing gradient xảy ra khi nào?", options: ["Gradient quá lớn", "Chain rule NHÂN nhiều gradient nhỏ (ví dụ sigmoid: max gradient = 0.25). 100 layers: 0.25^100 ≈ 0 → weights đầu KHÔNG ĐƯỢC CẬP NHẬT", "Khi learning rate quá lớn"], correct: 1, explanation: "Sigmoid gradient max = 0.25. 50 layers nhân nhau: 0.25^50 ≈ 10^-30 → gradient = 0 → layers đầu không học. Giải pháp: ReLU (gradient = 1 hoặc 0), residual connections (skip connections), batch normalization. Đây là lý do ReLU thay thế sigmoid cho deep networks." },
    { type: "fill-blank", question: "Cho f(x) = x², đạo hàm f'(x) = {blank}. Áp dụng quy tắc chuỗi: nếu g(x) = (2x + 1)², thì g'(x) = {blank}.", blanks: [{ answer: "2x", accept: ["2*x"] }, { answer: "4(2x + 1)", accept: ["4*(2x+1)", "4(2x+1)", "8x + 4", "8x+4"] }], explanation: "Đạo hàm x² = 2x (quy tắc luỹ thừa). Với g(x) = (2x+1)², áp dụng chain rule: g'(x) = 2(2x+1) × d/dx(2x+1) = 2(2x+1) × 2 = 4(2x+1). Trong neural network, chain rule này tính gradient ngược qua activation và linear layer." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Neural network có 1 triệu weights. Training = tìm giá trị tối ưu cho 1 triệu biến số. Làm sao biết điều chỉnh mỗi weight theo hướng nào?" options={["Thử random", "Đạo hàm (gradient): tính 'hướng dốc nhất' cho mỗi weight → điều chỉnh ngược hướng dốc → loss giảm. Backpropagation tính gradient HIỆU QUẢ cho tất cả weights cùng lúc", "Dùng công thức"]} correct={1} explanation="Gradient = 'bản đồ địa hình' của loss landscape. Tại mỗi điểm, gradient chỉ hướng dốc nhất (loss tăng). Đi NGƯỢC gradient = đi hướng loss giảm nhanh nhất. Backprop = chain rule tính gradient cho 1 triệu weights HIỆU QUẢ (O(N) thay vì O(N^2) finite differences).">
          <p className="text-sm text-muted mt-2">
            Hãy tiếp tục để khám phá toán học đằng sau backpropagation.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Gradient descent giống <strong>đi xuống núi trong sương mù</strong>: không nhìn thấy đỉnh nhưng <strong>cảm nhận dốc</strong>{" "}(gradient) rồi bước ngược lại. Chain rule là <strong>chuyển phát nhanh</strong>: mỗi layer chỉ cần tính local gradient, <strong>chuyển ngược</strong>{" "}cho layer trước. 100 layers × local = efficient. Đây là toán đằng sau <strong>mọi neural network</strong>!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="f(x) = (3x + 2)^2. Tính f'(x) tại x=1 bằng chain rule." options={["f'(1) = 50", "f'(x) = 2(3x+2)*3 = 6(3x+2). f'(1) = 6*(3+2) = 30", "f'(1) = 25"]} correct={1} explanation="Chain rule: f = u^2, u = 3x+2. df/dx = df/du * du/dx = 2u * 3 = 6(3x+2). Tại x=1: f'(1) = 6*5 = 30. Trong neural network: u = linear layer, f = activation. Backprop tính df/dx bằng cách nhân local gradients: df/du (activation grad) * du/dx (linear grad)." />
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Calculus for Backpropagation</strong>{" "}— đạo hàm và chain rule là cơ chế neural network 'học' từ data. Gradient tính ở đây được dùng trực tiếp trong <TopicLink slug="backpropagation">backpropagation</TopicLink> để cập nhật trọng số, và <TopicLink slug="gradient-descent">gradient descent</TopicLink> là thuật toán tối ưu hoá dùng các gradient đó. Về toán học, gradient là một vector — nên <TopicLink slug="linear-algebra-for-ml">đại số tuyến tính</TopicLink> và giải tích bổ trợ nhau. Loss function mà chúng ta lấy đạo hàm cũng có chủ đề riêng: xem <TopicLink slug="loss-functions">loss functions</TopicLink>.</p>
          <p><strong>Đạo hàm (derivative):</strong></p>
          <LaTeX block>{"f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} \\quad \\text{(tốc độ thay đổi)}"}</LaTeX>
          <p><strong>Chain Rule (quy tắc chuỗi):</strong></p>
          <LaTeX block>{"\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w} \\quad \\text{(nhân local gradients ngược lại)}"}</LaTeX>
          <p><strong>Gradient Descent:</strong></p>
          <LaTeX block>{"w_{t+1} = w_t - \\eta \\cdot \\frac{\\partial L}{\\partial w_t} \\quad \\text{(đi ngược gradient)}"}</LaTeX>
          <Callout variant="tip" title="Autograd">Trong thực tế, bạn KHÔNG cần tính đạo hàm thủ công. PyTorch autograd tự động tính gradient cho bất kỳ computation graph nào. loss.backward() tính gradient cho TẤT CẢ parameters. Bạn chỉ cần hiểu CONCEPT, không cần tính tay.</Callout>
          <p><strong>Đạo hàm các activation phổ biến:</strong></p>
          <LaTeX block>{"\\text{ReLU: } f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases} \\quad \\text{Sigmoid: } f'(x) = f(x)(1 - f(x))"}</LaTeX>
          <CodeBlock language="python" title="Backpropagation thủ công vs autograd">{`import torch

# Autograd: PyTorch tự động tính gradient
x = torch.tensor(2.0, requires_grad=True)
y = (3*x + 2)**2  # f(x) = (3x+2)^2
y.backward()       # Tính gradient tự động
print(f"df/dx tại x=2: {x.grad}")  # 48.0 = 6*(3*2+2)

# Neural network training (autograd làm tất cả)
model = torch.nn.Linear(784, 10)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

output = model(input_data)           # Forward pass
loss = torch.nn.functional.cross_entropy(output, labels)
loss.backward()                      # Backprop: tính gradient cho TẤT CẢ weights
optimizer.step()                     # Gradient descent: update weights
optimizer.zero_grad()                # Reset gradients

# Bạn chỉ cần gọi .backward() — PyTorch tự tính đạo hàm
# cho TOÀN BỘ computation graph bằng chain rule!`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Đạo hàm = tốc độ thay đổi. Trong ML: dL/dw = loss thay đổi bao nhiêu khi weight thay đổi.", "Chain rule: nhân local gradients ngược lại qua từng layer. Đây là 'back' trong 'backpropagation'.", "Gradient descent: w_new = w - lr * gradient. Đi ngược hướng dốc nhất → loss giảm.", "Vanishing gradient: sigmoid (max 0.25) nhân nhiều layers → 0. ReLU (gradient 1) giải quyết.", "Autograd (PyTorch): tự động tính gradient. Bạn chỉ cần hiểu concept, không cần tính tay."]} />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
