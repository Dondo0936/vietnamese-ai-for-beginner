"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge,
  MiniSummary, CodeBlock, Callout, CollapsibleDetail,
} from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "perceptron",
  title: "Perceptron",
  titleVi: "Perceptron - Nơ-ron nhân tạo đơn giản",
  description:
    "Đơn vị tính toán cơ bản nhất của mạng nơ-ron, mô phỏng cách một nơ-ron sinh học ra quyết định.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["mlp", "activation-functions", "forward-propagation"],
  vizType: "interactive",
};

/* ── Scatter data ── */
const POINTS: { x: number; y: number; cls: 0 | 1 }[] = [
  { x: 70, y: 60, cls: 0 }, { x: 100, y: 80, cls: 0 },
  { x: 60, y: 110, cls: 0 }, { x: 90, y: 50, cls: 0 },
  { x: 120, y: 100, cls: 0 }, { x: 80, y: 90, cls: 0 },
  { x: 250, y: 220, cls: 1 }, { x: 280, y: 190, cls: 1 },
  { x: 230, y: 250, cls: 1 }, { x: 270, y: 240, cls: 1 },
  { x: 300, y: 210, cls: 1 }, { x: 260, y: 270, cls: 1 },
];
const SVG_W = 370;
const SVG_H = 330;

function side(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
}

const MINI_PTS = [
  { x: 25, y: 160, c: 0 }, { x: 40, y: 140, c: 0 }, { x: 55, y: 150, c: 0 },
  { x: 35, y: 170, c: 0 }, { x: 50, y: 130, c: 0 },
  { x: 140, y: 40, c: 1 }, { x: 155, y: 55, c: 1 }, { x: 165, y: 35, c: 1 },
  { x: 150, y: 65, c: 1 }, { x: 170, y: 50, c: 1 },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Perceptron tính kết quả đầu ra bằng cách nào?",
    options: [
      "Nhân tất cả đầu vào với nhau",
      "Tính tổng có trọng số rồi áp dụng hàm bước",
      "Chọn ngẫu nhiên giữa 0 và 1",
      "So sánh từng đầu vào với ngưỡng riêng",
    ],
    correct: 1,
    explanation: "Perceptron tính tổng x1*w1 + x2*w2 + ... + bias, rồi áp dụng hàm bước: nếu tổng > 0 thì xuất 1, ngược lại xuất 0.",
  },
  {
    question: "Bias trong perceptron đóng vai trò gì?",
    options: [
      "Tăng tốc độ huấn luyện",
      "Dịch chuyển đường phân chia (decision boundary)",
      "Giảm nhiễu trong dữ liệu",
      "Xác định số lớp đầu ra",
    ],
    correct: 1,
    explanation: "Bias cho phép dịch chuyển đường phân chia mà không phụ thuộc vào đầu vào, giúp mô hình linh hoạt hơn.",
  },
  {
    question: "Perceptron KHÔNG thể giải quyết bài toán nào sau đây?",
    options: ["AND", "OR", "NOT", "XOR"],
    correct: 3,
    explanation: "XOR không phân tách tuyến tính — không thể vẽ một đường thẳng chia đúng 4 trường hợp. Cần ít nhất 2 lớp (MLP).",
  },
];

/* ── Component ── */
export default function PerceptronTopic() {
  // Step 2 state: classification game
  const [linePoints, setLinePoints] = useState<{ x: number; y: number }[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (gameComplete) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (SVG_W / rect.width);
    const y = (e.clientY - rect.top) * (SVG_H / rect.height);
    setLinePoints((prev) => {
      if (prev.length === 0) return [{ x, y }];
      if (prev.length === 1) { setGameComplete(true); return [prev[0], { x, y }]; }
      return prev;
    });
  }, [gameComplete]);

  const accuracy = useMemo(() => {
    if (linePoints.length < 2) return null;
    const [p1, p2] = linePoints;
    let ok = 0;
    for (const pt of POINTS) {
      if ((side(pt.x, pt.y, p1.x, p1.y, p2.x, p2.y) < 0 ? 0 : 1) === pt.cls) ok++;
    }
    return Math.round((ok / POINTS.length) * 100);
  }, [linePoints]);

  // Step 4 state: perceptron controls
  const [w1, setW1] = useState(0.6);
  const [w2, setW2] = useState(0.4);
  const [bias, setBias] = useState(-0.5);
  const [px1, setPx1] = useState(1);
  const [px2, setPx2] = useState(0);
  const weightedSum = useMemo(() => px1 * w1 + px2 * w2 + bias, [px1, px2, w1, w2, bias]);
  const output = weightedSum > 0 ? 1 : 0;

  const boundaryLine = useMemo(() => {
    if (Math.abs(w2) < 0.01 && Math.abs(w1) < 0.01) return null;
    const solve = (xv: number) => -(w1 * xv + bias) / (w2 || 0.001);
    const mapX = (v: number) => 20 + (v / 100) * 160;
    const mapY = (v: number) => 180 - (v / 100) * 160;
    return { x1: mapX(0), y1: mapY(solve(0)), x2: mapX(100), y2: mapY(solve(100)) };
  }, [w1, w2, bias]);

  // Helper for extended line coords
  const extY = (targetX: number) => {
    if (linePoints.length < 2) return 0;
    const [a, b] = linePoints;
    return a.y + ((b.y - a.y) / (b.x - a.x || 0.001)) * (targetX - a.x);
  };

  return (
    <>
      {/* ── Step 1: HOOK ── */}
      <PredictionGate
        question="Bạn là nhà tuyển dụng. Ứng viên có 3 năm kinh nghiệm và bằng đại học. Bạn sẽ nhận hay từ chối?"
        options={["Nhận", "Từ chối", "Cần thêm thông tin"]}
        correct={2}
        explanation="Thực tế, quyết định phụ thuộc vào mức độ quan trọng (trọng số) bạn gán cho mỗi tiêu chí, và ngưỡng chấp nhận của bạn. Đó chính xác là cách một Perceptron hoạt động: nhận đầu vào, gán trọng số, so với ngưỡng, rồi đưa ra quyết định Có/Không."
      />

      {/* ── Step 2: DISCOVER — Classification Game ── */}
      <section className="my-8 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Thử làm bộ phân loại</h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Hai nhóm điểm: <span className="font-semibold text-blue-500">xanh</span> (A)
            và <span className="font-semibold text-red-500">đỏ</span> (B).{" "}
            <strong>Nhấn 2 điểm trên hình để vẽ đường phân chia.</strong>
          </p>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full max-w-md mx-auto cursor-crosshair rounded-lg bg-background/50 border border-border"
            onClick={handleSvgClick}
          >
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <line x1={i * (SVG_W / 3)} y1={0} x2={i * (SVG_W / 3)} y2={SVG_H} stroke="currentColor" className="text-border" strokeWidth={0.5} />
                <line x1={0} y1={i * (SVG_H / 3)} x2={SVG_W} y2={i * (SVG_H / 3)} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              </g>
            ))}
            {POINTS.map((pt, i) => (
              <motion.circle key={i} cx={pt.x} cy={pt.y} r={8}
                fill={pt.cls === 0 ? "#3b82f6" : "#ef4444"}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }} />
            ))}
            {linePoints.length === 1 && (
              <motion.circle cx={linePoints[0].x} cy={linePoints[0].y} r={5} fill="#a855f7"
                initial={{ scale: 0 }} animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }} />
            )}
            {linePoints.length === 2 && (
              <>
                <motion.line x1={0} y1={extY(0)} x2={SVG_W} y2={extY(SVG_W)}
                  stroke="#a855f7" strokeWidth={2.5} strokeDasharray="6,4"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }} />
                <circle cx={linePoints[0].x} cy={linePoints[0].y} r={4} fill="#a855f7" />
                <circle cx={linePoints[1].x} cy={linePoints[1].y} r={4} fill="#a855f7" />
              </>
            )}
          </svg>
          {accuracy !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
              <p className="text-2xl font-bold text-accent">{accuracy}%</p>
              <p className="text-sm text-muted">
                {accuracy === 100 ? "Hoàn hảo! Bạn phân chia chính xác mọi điểm."
                  : accuracy >= 75 ? "Khá tốt! Đường của bạn chia được phần lớn."
                  : "Thử lại nhé — hãy chia rõ hai nhóm hơn."}
              </p>
              <button type="button" onClick={() => { setLinePoints([]); setGameComplete(false); }}
                className="mt-2 text-sm text-accent hover:underline">Vẽ lại</button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Step 3: REVEAL ── */}
      <AhaMoment>
        <p>
          Đường thẳng bạn vừa vẽ chính là <strong>decision boundary</strong> của
          một <strong>Perceptron</strong> — đơn vị tính toán đơn giản nhất của mạng nơ-ron!
        </p>
        <p className="text-sm text-muted mt-1">
          Perceptron luôn tạo một đường thẳng chia dữ liệu thành 2 nhóm.
          Thay đổi trọng số = xoay đường. Thay đổi bias = dịch đường.
        </p>
      </AhaMoment>

      {/* ── Step 4: DEEPEN — Full Perceptron Visualization ── */}
      <section className="my-8 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Bên trong Perceptron</h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-6">
          {/* Inputs */}
          <div className="flex flex-wrap gap-6">
            {[{ label: "x1 (Kinh nghiệm)", val: px1, set: setPx1 },
              { label: "x2 (Bằng cấp)", val: px2, set: setPx2 }].map(({ label, val, set }) => (
              <div key={label} className="space-y-2">
                <label className="text-sm font-medium text-muted">{label}</label>
                <div className="flex gap-2">
                  {[0, 1].map((v) => (
                    <button key={v} type="button" onClick={() => set(v)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        val === v ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                      }`}>
                      {v === 1 ? "Có (1)" : "Không (0)"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[{ label: "Trọng số w1", value: w1, set: setW1, min: -2, max: 2 },
              { label: "Trọng số w2", value: w2, set: setW2, min: -2, max: 2 },
              { label: "Bias", value: bias, set: setBias, min: -3, max: 3 }].map(({ label, value, set, min, max }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">{label}</label>
                  <span className="font-mono text-sm font-medium text-accent">{value.toFixed(2)}</span>
                </div>
                <input type="range" min={min} max={max} step={0.1} value={value}
                  onChange={(e) => set(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
            ))}
          </div>

          {/* Perceptron diagram */}
          <svg viewBox="0 0 560 220" className="w-full max-w-2xl mx-auto">
            <motion.circle cx="60" cy="70" r="28" fill="#3b82f6" opacity={px1 ? 1 : 0.3} />
            <text x="60" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">x1={px1}</text>
            <motion.circle cx="60" cy="160" r="28" fill="#3b82f6" opacity={px2 ? 1 : 0.3} />
            <text x="60" y="165" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">x2={px2}</text>
            <circle cx="60" cy="20" r="14" fill="#94a3b8" opacity={0.7} />
            <text x="60" y="24" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">b</text>
            {/* Connections */}
            <line x1="88" y1="70" x2="230" y2="110" stroke="#3b82f6" strokeWidth={Math.abs(w1) * 3 + 1} opacity={0.7} />
            <text x="145" y="82" fill="#3b82f6" fontSize="11" fontWeight="bold">w1={w1.toFixed(1)}</text>
            <line x1="88" y1="160" x2="230" y2="120" stroke="#3b82f6" strokeWidth={Math.abs(w2) * 3 + 1} opacity={0.7} />
            <text x="145" y="158" fill="#3b82f6" fontSize="11" fontWeight="bold">w2={w2.toFixed(1)}</text>
            <line x1="74" y1="20" x2="230" y2="105" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" opacity={0.5} />
            {/* Sum node */}
            <circle cx="260" cy="115" r="32" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="260" y="110" textAnchor="middle" fill="#e2e8f0" fontSize="16">&Sigma;</text>
            <text x="260" y="128" textAnchor="middle" fill="#94a3b8" fontSize="10">{weightedSum.toFixed(2)}</text>
            {/* Step function */}
            <line x1="292" y1="115" x2="345" y2="115" stroke="#475569" strokeWidth="2" />
            <rect x="345" y="90" width="55" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <polyline points="355,125 368,125 368,105 390,105" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <text x="372" y="137" textAnchor="middle" fill="#64748b" fontSize="8">step</text>
            {/* Output */}
            <line x1="400" y1="115" x2="440" y2="115" stroke="#475569" strokeWidth="2" />
            <motion.circle cx="470" cy="115" r="28" fill={output === 1 ? "#22c55e" : "#ef4444"}
              animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.3 }} key={output} />
            <text x="470" y="111" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{output}</text>
            <text x="470" y="126" textAnchor="middle" fill="white" fontSize="9">{output === 1 ? "NHẬN" : "TỪ CHỐI"}</text>
          </svg>

          {/* Computation */}
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              ({px1} &times; {w1.toFixed(2)}) + ({px2} &times; {w2.toFixed(2)}) + ({bias.toFixed(2)}) ={" "}
              <strong className={weightedSum > 0 ? "text-green-500" : "text-red-500"}>{weightedSum.toFixed(2)}</strong>
              {weightedSum > 0 ? " > 0 → 1 (NHẬN)" : " ≤ 0 → 0 (TỪ CHỐI)"}
            </p>
          </div>

          {/* Mini scatter with live boundary */}
          <CollapsibleDetail title="Xem đường phân chia thay đổi theo trọng số">
            <p className="text-sm text-muted mb-3">
              Khi bạn thay đổi w1, w2, bias ở trên, đường phân chia (tím) dịch chuyển tương ứng.
            </p>
            <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto rounded-lg bg-background/50 border border-border">
              {MINI_PTS.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={5} fill={p.c === 0 ? "#3b82f6" : "#ef4444"} />
              ))}
              {boundaryLine && (
                <line x1={boundaryLine.x1} y1={boundaryLine.y1} x2={boundaryLine.x2} y2={boundaryLine.y2}
                  stroke="#a855f7" strokeWidth={2} strokeDasharray="4,3" />
              )}
            </svg>
          </CollapsibleDetail>
        </div>
      </section>

      {/* ── Step 5: CHALLENGE ── */}
      <InlineChallenge
        question="Perceptron có thể phân loại dữ liệu XOR (dữ liệu không thể chia bằng một đường thẳng) không?"
        options={["Có", "Không"]}
        correct={1}
        explanation="Perceptron chỉ tạo được đường thẳng (linearly separable). XOR cần đường cong → cần nhiều lớp (MLP)!"
      />

      {/* ── Step 6: EXPLAIN ── */}
      <ExplanationSection>
        <p>
          <strong>Perceptron</strong> do Frank Rosenblatt phát minh năm 1958, là đơn vị
          tính toán đơn giản nhất của mạng nơ-ron. Nó mô phỏng cách một nơ-ron sinh học
          nhận tín hiệu, xử lý, và đưa ra quyết định Có/Không.
        </p>
        <Callout variant="info" title="Công thức">
          <p><strong>Tổng có trọng số:</strong> z = w1*x1 + w2*x2 + ... + wn*xn + b</p>
          <p><strong>Hàm kích hoạt bước:</strong> output = 1 nếu z &gt; 0, ngược lại output = 0</p>
        </Callout>
        <Callout variant="tip" title="Luật học (Learning Rule)">
          <p>
            Perceptron tự cập nhật trọng số khi dự đoán sai:{" "}
            <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">
              w_i = w_i + lr * (target - output) * x_i
            </code>
          </p>
        </Callout>
        <CodeBlock language="python" title="perceptron.py">
{`import numpy as np

class Perceptron:
    def __init__(self, n_inputs, lr=0.1):
        self.weights = np.zeros(n_inputs)
        self.bias = 0.0
        self.lr = lr

    def predict(self, x):
        z = np.dot(x, self.weights) + self.bias
        return 1 if z > 0 else 0

    def train(self, X, y, epochs=10):
        for _ in range(epochs):
            for xi, yi in zip(X, y):
                error = yi - self.predict(xi)
                self.weights += self.lr * error * xi
                self.bias += self.lr * error

# Ví dụ: học cổng AND
X = np.array([[0,0],[0,1],[1,0],[1,1]])
y = np.array([0, 0, 0, 1])
p = Perceptron(n_inputs=2)
p.train(X, y, epochs=10)
for xi in X:
    print(f"{xi} -> {p.predict(xi)}")`}
        </CodeBlock>
        <Callout variant="warning" title="Giới hạn quan trọng">
          <p>
            Perceptron chỉ giải được bài toán <strong>phân tách tuyến tính</strong>.
            Năm 1969, Minsky &amp; Papert chứng minh nó không giải được XOR, dẫn tới
            &quot;mùa đông AI&quot; đầu tiên. Giải pháp: xếp nhiều perceptron thành
            lớp → <strong>Multi-Layer Perceptron (MLP)</strong>.
          </p>
        </Callout>
      </ExplanationSection>

      {/* ── Step 7: CONNECT ── */}
      <MiniSummary
        title="Ghi nhớ về Perceptron"
        points={[
          "Perceptron nhận đầu vào, nhân trọng số, cộng bias, áp hàm bước → xuất 0 hoặc 1.",
          "Trọng số (weight) quyết định mức quan trọng của mỗi đầu vào; bias dịch chuyển đường phân chia.",
          "Chỉ tạo được đường thẳng → chỉ giải bài toán phân tách tuyến tính (AND, OR, nhưng không XOR).",
          "Nhiều perceptron xếp thành lớp = MLP, giải được bài toán phi tuyến.",
        ]}
      />

      {/* ── Step 8: QUIZ ── */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
