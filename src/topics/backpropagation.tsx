"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, StepReveal, AhaMoment, InlineChallenge,
  MiniSummary, CodeBlock, Callout,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "backpropagation",
  title: "Backpropagation",
  titleVi: "Lan truyền ngược",
  description:
    "Thuật toán cốt lõi để huấn luyện mạng nơ-ron, tính gradient của hàm mất mát theo từng trọng số.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "optimization", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: ["forward-propagation", "gradient-descent", "loss-functions", "vanishing-exploding-gradients"],
  vizType: "interactive",
};

/* ── Math helpers ── */
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const X = [0.6, 0.4];
const TARGET = 0.8;
const LR = 0.5;
const LOSS_GOAL = 0.05;
const W0 = [0.3, -0.2, 0.5, 0.1, -0.4, 0.6];

function forward(w: number[]) {
  const h1 = sigmoid(X[0] * w[0] + X[1] * w[1]);
  const h2 = sigmoid(X[0] * w[2] + X[1] * w[3]);
  const out = sigmoid(h1 * w[4] + h2 * w[5]);
  return { h1, h2, out, loss: (TARGET - out) ** 2 };
}

function grads(w: number[]) {
  const { h1, h2, out } = forward(w);
  const d3 = -2 * (TARGET - out) * out * (1 - out);
  const dh1 = h1 * (1 - h1), dh2 = h2 * (1 - h2);
  const d1 = d3 * w[4] * dh1, d2 = d3 * w[5] * dh2;
  return [d1 * X[0], d1 * X[1], d2 * X[0], d2 * X[1], d3 * h1, d3 * h2];
}

const fp0 = forward(W0);
const g0 = grads(W0);
const wAfter = W0.map((w, i) => w - LR * g0[i]);
const fpAfter = forward(wAfter);

/* ── SVG positions ── */
const NX = { i: 55, h: 195, o: 335 };
const NY = { i: [70, 165], h: [70, 165], o: [118] };
const R = 22;
const CONNS = [
  { f: [NX.i, NY.i[0]], t: [NX.h, NY.h[0]], w: 0 },
  { f: [NX.i, NY.i[1]], t: [NX.h, NY.h[0]], w: 1 },
  { f: [NX.i, NY.i[0]], t: [NX.h, NY.h[1]], w: 2 },
  { f: [NX.i, NY.i[1]], t: [NX.h, NY.h[1]], w: 3 },
  { f: [NX.h, NY.h[0]], t: [NX.o, NY.o[0]], w: 4 },
  { f: [NX.h, NY.h[1]], t: [NX.o, NY.o[0]], w: 5 },
];

type Phase = "idle" | "forward" | "backward" | "update";

function NetSVG({ w, fp, g, phase = "idle", wUp }: {
  w: number[]; fp: ReturnType<typeof forward>; g?: number[];
  phase?: Phase; wUp?: number[];
}) {
  const isFwd = phase === "forward", isBk = phase === "backward", isUp = phase === "update";
  const active = isFwd || isBk || isUp;
  const clr = isFwd ? "#3b82f6" : isBk ? "#ef4444" : isUp ? "#22c55e" : "#475569";
  const nodeClr = (layer: "i" | "h" | "o") =>
    layer === "i" ? (isFwd ? "#3b82f6" : "#1e293b")
    : layer === "h" ? (isFwd ? "#3b82f6" : isBk ? "#ef4444" : "#1e293b")
    : (isFwd ? "#3b82f6" : isBk ? "#ef4444" : isUp ? "#22c55e" : "#1e293b");

  return (
    <svg viewBox="0 0 390 230" className="w-full max-w-lg mx-auto">
      {["Input", "Hidden", "Output"].map((l, i) => (
        <text key={l} x={[NX.i, NX.h, NX.o][i]} y={18} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">{l}</text>
      ))}
      {CONNS.map((c, i) => {
        const mx = (c.f[0] + c.t[0]) / 2, my = (c.f[1] + c.t[1]) / 2;
        const dw = isUp && wUp ? wUp[c.w] : w[c.w];
        return (
          <g key={i}>
            <line x1={c.f[0] + R} y1={c.f[1]} x2={c.t[0] - R} y2={c.t[1]}
              stroke={clr} strokeWidth={active ? 2 : 1.2} opacity={active ? 0.8 : 0.3} />
            <text x={mx} y={my - 5} textAnchor="middle" fill={clr} fontSize="8" fontFamily="monospace">
              w{c.w + 1}={dw.toFixed(2)}
            </text>
            {isBk && g && (
              <text x={mx} y={my + 9} textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">
                g={g[c.w].toFixed(3)}
              </text>
            )}
          </g>
        );
      })}
      {X.map((v, i) => (
        <g key={`i${i}`}>
          <circle cx={NX.i} cy={NY.i[i]} r={R} fill={nodeClr("i")} stroke="#475569" strokeWidth="2" />
          <text x={NX.i} y={NY.i[i] + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{v}</text>
        </g>
      ))}
      {[fp.h1, fp.h2].map((v, i) => (
        <g key={`h${i}`}>
          <circle cx={NX.h} cy={NY.h[i]} r={R} fill={nodeClr("h")} stroke="#475569" strokeWidth="2" />
          <text x={NX.h} y={NY.h[i] + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{v.toFixed(3)}</text>
        </g>
      ))}
      <circle cx={NX.o} cy={NY.o[0]} r={R} fill={nodeClr("o")} stroke="#475569" strokeWidth="2" />
      <text x={NX.o} y={NY.o[0] + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{fp.out.toFixed(3)}</text>
      {isFwd && <text x={195} y={222} textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">{"\u2192 D\u1EEF li\u1EC7u"}</text>}
      {isBk && <text x={195} y={222} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">{"Gradient \u2190"}</text>}
      {isUp && <text x={195} y={222} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">{"Tr\u1ECDng s\u1ED1 c\u1EADp nh\u1EADt!"}</text>}
    </svg>
  );
}

/* ── Quiz ── */
const quiz: QuizQuestion[] = [
  {
    question: "Backpropagation s\u1EED d\u1EE5ng quy t\u1EAFc n\u00E0o \u0111\u1EC3 t\u00EDnh gradient qua nhi\u1EC1u l\u1EDBp?",
    options: ["Quy t\u1EAFc t\u00EDch (product rule)", "Quy t\u1EAFc chu\u1ED7i (chain rule)", "Quy t\u1EAFc th\u01B0\u01A1ng (quotient rule)", "Quy t\u1EAFc L'Hopital"],
    correct: 1,
    explanation: "Chain rule ph\u00E2n t\u00E1ch \u0111\u1EA1o h\u00E0m ph\u1EE9c t\u1EA1p th\u00E0nh t\u00EDch c\u00E1c \u0111\u1EA1o h\u00E0m c\u1EE5c b\u1ED9: dL/dw = dL/da \u00B7 da/dz \u00B7 dz/dw.",
  },
  {
    question: "T\u1EA1i sao backpropagation hi\u1EC7u qu\u1EA3 h\u01A1n th\u1EED ng\u1EABu nhi\u00EAn c\u00E1c tr\u1ECDng s\u1ED1?",
    options: ["N\u00F3 s\u1EED d\u1EE5ng GPU nhanh h\u01A1n", "N\u00F3 t\u00EDnh CH\u00cdNH X\u00c1C h\u01B0\u1EDBng c\u1EA7n thay \u0111\u1ED5i m\u1ED7i tr\u1ECDng s\u1ED1 ch\u1EC9 trong 1 l\u1EA7n duy\u1EC7t ng\u01B0\u1EE3c", "N\u00F3 ch\u1EC9 thay \u0111\u1ED5i tr\u1ECDng s\u1ED1 \u1EDF l\u1EDBp cu\u1ED1i", "N\u00F3 ch\u1ECDn ng\u1EABu nhi\u00EAn nh\u01B0ng th\u00F4ng minh h\u01A1n"],
    correct: 1,
    explanation: "Backprop t\u00EDnh gradient ch\u00EDnh x\u00E1c cho M\u1ECCI tr\u1ECDng s\u1ED1 trong m\u1ED9t l\u1EA7n duy\u1EC7t ng\u01B0\u1EE3c.",
  },
  {
    question: "Vanishing gradient x\u1EA3y ra khi n\u00E0o?",
    options: ["Khi learning rate qu\u00E1 l\u1EDBn", "Khi m\u1EA1ng c\u00F3 qu\u00E1 \u00EDt l\u1EDBp", "Khi gradient nh\u00E2n qua nhi\u1EC1u l\u1EDBp v\u1EDBi gi\u00E1 tr\u1ECB < 1, co d\u1EA7n v\u1EC1 0", "Khi d\u1EEF li\u1EC7u hu\u1EA5n luy\u1EC7n qu\u00E1 \u00EDt"],
    correct: 2,
    explanation: "0.5 nh\u00E2n 100 l\u1EA7n = 0.5^100 \u2248 0. C\u00E1c l\u1EDBp \u0111\u1EA7u kh\u00F4ng \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt. Gi\u1EA3i ph\u00E1p: ReLU, LSTM, ResNet.",
  },
];

/* ── Main Component ── */
export default function BackpropagationTopic() {
  const [weights, setWeights] = useState([...W0]);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const prev = useRef([...W0]);

  const fp = useMemo(() => forward(weights), [weights]);

  const onSlider = useCallback((i: number, v: number) => {
    setWeights(p => { const n = [...p]; n[i] = v; return n; });
  }, []);

  const onCommit = useCallback(() => {
    if (weights.join() !== prev.current.join()) {
      prev.current = [...weights];
      setAttempts(a => { const n = a + 1; if (fp.loss < LOSS_GOAL || n >= 15) setDone(true); return n; });
    }
  }, [weights, fp.loss]);

  /* Step 4: animation */
  const [aPhase, setAPhase] = useState<"idle" | "forward" | "loss" | "backward" | "update">("idle");
  const [running, setRunning] = useState(false);

  const runAnim = useCallback(() => {
    if (running) return;
    setRunning(true);
    setAPhase("forward");
    setTimeout(() => { setAPhase("loss");
      setTimeout(() => { setAPhase("backward");
        setTimeout(() => { setAPhase("update");
          setTimeout(() => { setAPhase("idle"); setRunning(false); }, 2000);
        }, 2000);
      }, 1500);
    }, 1500);
  }, [running]);

  const wLabels = ["w1 (x1\u2192h1)", "w2 (x2\u2192h1)", "w3 (x1\u2192h2)", "w4 (x2\u2192h2)", "w5 (h1\u2192out)", "w6 (h2\u2192out)"];
  const phaseColor = { idle: "#64748b", forward: "#3b82f6", loss: "#f59e0b", backward: "#ef4444", update: "#22c55e" };
  const phaseText = {
    idle: "S\u1EB5n s\u00E0ng", forward: "1. Forward pass", loss: "2. T\u00EDnh loss",
    backward: "3. Backward pass", update: "4. C\u1EADp nh\u1EADt",
  };

  return (
    <>
      {/* Step 1: HOOK */}
      <PredictionGate
        question="M\u1EA1ng n\u01A1-ron d\u1EF1 \u0111o\u00E1n SAI. L\u00E0m sao bi\u1EBFt n\u01A1-ron n\u00E0o g\u00E2y ra l\u1ED7i \u0111\u1EC3 s\u1EEDa?"
        options={[
          "S\u1EEDa t\u1EA5t c\u1EA3 n\u01A1-ron nh\u01B0 nhau",
          "Truy ng\u01B0\u1EE3c t\u1EEB output v\u1EC1 input, n\u01A1-ron n\u00E0o \u1EA3nh h\u01B0\u1EDFng nhi\u1EC1u th\u00EC s\u1EEDa nhi\u1EC1u",
          "Ch\u1EC9 s\u1EEDa n\u01A1-ron cu\u1ED1i c\u00F9ng",
        ]}
        correct={1}
        explanation={"Truy ng\u01B0\u1EE3c l\u1ED7i \u2014 \u0111\u00F3 ch\u00EDnh l\u00E0 Backpropagation! L\u1ED7i 'lan truy\u1EC1n ng\u01B0\u1EE3c' qua t\u1EEBng l\u1EDBp."}
      />

      {/* Step 2: DISCOVER */}
      <VisualizationSection>
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Th\u1EED t\u1ED1i \u01B0u th\u1EE7 c\u00F4ng!</h3>
            <p className="text-sm text-muted leading-relaxed">
              M\u1EA1ng: 2 input \u2192 2 hidden \u2192 1 output (sigmoid).
              M\u1EE5c ti\u00EAu: output = <strong className="text-accent">{TARGET}</strong>.{" "}
              <strong>H\u00E3y \u0111i\u1EC1u ch\u1EC9nh 6 tr\u1ECDng s\u1ED1 \u0111\u1EC3 loss &lt; {LOSS_GOAL}!</strong>
            </p>
          </div>

          <NetSVG w={weights} fp={fp} />

          {/* Loss display */}
          <div className="flex items-center justify-center gap-6">
            {[
              { label: "Output", value: fp.out.toFixed(4), cls: "text-foreground" },
              { label: "M\u1EE5c ti\u00EAu", value: String(TARGET), cls: "text-accent" },
              { label: "Loss (MSE)", value: fp.loss.toFixed(4), cls: fp.loss < LOSS_GOAL ? "text-green-500" : "text-red-500" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted mb-1">{label}</p>
                <p className={`text-2xl font-bold font-mono ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Weight sliders */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weights.map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted">{wLabels[i]}</label>
                  <span className="font-mono text-xs font-medium text-accent">{w.toFixed(2)}</span>
                </div>
                <input type="range" min={-2} max={2} step={0.05} value={w}
                  onChange={e => onSlider(i, parseFloat(e.target.value))}
                  onMouseUp={onCommit} onTouchEnd={onCommit}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                  style={{ background: `linear-gradient(to right, var(--color-accent) ${((w + 2) / 4) * 100}%, var(--bg-surface-hover, #E2E8F0) ${((w + 2) / 4) * 100}%)` }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">L\u1EA7n th\u1EED: <strong className="text-foreground">{attempts}</strong></span>
            <button type="button" onClick={() => { setWeights([...W0]); setAttempts(0); setDone(false); prev.current = [...W0]; }}
              className="text-xs text-accent hover:underline">\u0110\u1EB7t l\u1EA1i</button>
          </div>

          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-xl border p-4 text-sm text-center ${
                  fp.loss < LOSS_GOAL
                    ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                }`}
              >
                {fp.loss < LOSS_GOAL
                  ? `Tuy\u1EC7t v\u1EDDi! B\u1EA1n d\u00F9ng ${attempts} l\u1EA7n th\u1EED. Backprop ch\u1EC9 c\u1EA7n 1 l\u1EA7n t\u00EDnh to\u00E1n!`
                  : `B\u1EA1n \u0111\u00E3 th\u1EED ${attempts} l\u1EA7n. Kh\u00F3 qu\u00E1 ph\u1EA3i kh\u00F4ng? Backprop ch\u1EC9 c\u1EA7n 1 l\u1EA7n t\u00EDnh to\u00E1n!`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </VisualizationSection>

      {/* Step 3: REVEAL */}
      <AhaMoment>
        <p>
          Thay v\u00EC th\u1EED ng\u1EABu nhi\u00EAn, <strong>Backpropagation</strong> t\u00EDnh
          CH\u00cdNH X\u00c1C m\u1ED7i tr\u1ECDng s\u1ED1 c\u1EA7n thay \u0111\u1ED5i bao nhi\u00EAu,
          b\u1EB1ng <strong>\u0111\u1EA1o h\u00E0m chu\u1ED7i (chain rule)</strong>.
        </p>
        <p className="text-sm text-muted mt-1">M\u1ED9t l\u1EA7n t\u00EDnh ng\u01B0\u1EE3c \u2014 t\u1EA5t c\u1EA3 gradient c\u00F3 ngay.</p>
      </AhaMoment>

      {/* Step 4: DEEPEN */}
      <section className="my-8 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Xem Backprop ho\u1EA1t \u0111\u1ED9ng</h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ color: phaseColor[aPhase], backgroundColor: phaseColor[aPhase] + "15" }}>
              {phaseText[aPhase]}
            </div>
            <button type="button" onClick={runAnim} disabled={running}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {running ? "\u0110ang ch\u1EA1y..." : "Ch\u1EA1y Backprop"}
            </button>
          </div>

          <StepReveal labels={[
            "Forward: gi\u00E1 tr\u1ECB ch\u1EA3y tr\u00E1i \u2192 ph\u1EA3i",
            "T\u00EDnh loss t\u1EA1i output",
            "Backward: gradient ch\u1EA3y ph\u1EA3i \u2192 tr\u00E1i",
            "C\u1EADp nh\u1EADt tr\u1ECDng s\u1ED1",
          ]}>
            <div className="rounded-lg bg-surface p-4 space-y-2">
              <p className="text-sm font-medium text-foreground"><span className="text-blue-500">\u2192</span> D\u1EEF li\u1EC7u ch\u1EA3y t\u1EEB input qua hidden \u0111\u1EBFn output:</p>
              <div className="text-xs font-mono text-muted space-y-1 pl-4">
                <p>h1 = sigmoid({X[0]}*{W0[0]} + {X[1]}*{W0[1]}) = <strong className="text-blue-500">{fp0.h1.toFixed(4)}</strong></p>
                <p>h2 = sigmoid({X[0]}*{W0[2]} + {X[1]}*{W0[3]}) = <strong className="text-blue-500">{fp0.h2.toFixed(4)}</strong></p>
                <p>out = sigmoid({fp0.h1.toFixed(3)}*{W0[4]} + {fp0.h2.toFixed(3)}*{W0[5]}) = <strong className="text-blue-500">{fp0.out.toFixed(4)}</strong></p>
              </div>
            </div>
            <div className="rounded-lg bg-surface p-4 space-y-2">
              <p className="text-sm font-medium text-foreground"><span className="text-amber-500">\u26A0</span> So s\u00E1nh v\u1EDBi m\u1EE5c ti\u00EAu:</p>
              <p className="text-xs font-mono text-muted pl-4">
                Loss = ({TARGET} - {fp0.out.toFixed(4)})\u00B2 = <strong className="text-amber-500">{fp0.loss.toFixed(4)}</strong>
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4 space-y-2">
              <p className="text-sm font-medium text-foreground"><span className="text-red-500">\u2190</span> Gradient cho m\u1ED7i tr\u1ECDng s\u1ED1 (chain rule):</p>
              <div className="text-xs font-mono text-muted space-y-1 pl-4">
                {g0.map((g, i) => <p key={i}>\u2202L/\u2202w{i + 1} = <strong className="text-red-500">{g.toFixed(4)}</strong></p>)}
              </div>
            </div>
            <div className="rounded-lg bg-surface p-4 space-y-2">
              <p className="text-sm font-medium text-foreground"><span className="text-green-500">\u2714</span> w_new = w_old - {LR} * gradient</p>
              <div className="text-xs font-mono text-muted space-y-1 pl-4">
                {W0.map((w, i) => (
                  <p key={i}>w{i + 1}: {w.toFixed(2)} \u2192 <strong className="text-green-500">{wAfter[i].toFixed(4)}</strong></p>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-3 text-center">
                <p className="text-xs text-muted">Loss sau c\u1EADp nh\u1EADt:</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{fpAfter.loss.toFixed(4)}</p>
                <p className="text-xs text-muted mt-1">Gi\u1EA3m t\u1EEB {fp0.loss.toFixed(4)} \u2014 ch\u1EC9 1 b\u01B0\u1EDBc!</p>
              </div>
            </div>
          </StepReveal>

          <NetSVG w={W0} fp={fp0}
            g={aPhase === "backward" ? g0 : undefined}
            phase={aPhase === "loss" ? "forward" : aPhase === "idle" ? "idle" : aPhase as Phase}
            wUp={aPhase === "update" ? wAfter : undefined}
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["forward", "loss", "backward", "update"] as const).map(p => (
              <div key={p} className={`rounded-lg border p-2 text-center text-xs transition-all ${
                aPhase === p ? "border-accent bg-accent/10 text-foreground font-semibold" : "border-border text-muted"
              }`}>
                <div className="mx-auto mb-1 h-2 w-2 rounded-full" style={{ backgroundColor: phaseColor[p] }} />
                {{ forward: "Lan truy\u1EC1n ti\u1EBFn", loss: "T\u00EDnh loss", backward: "Lan truy\u1EC1n ng\u01B0\u1EE3c", update: "C\u1EADp nh\u1EADt" }[p]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step 5: CHALLENGE */}
      <InlineChallenge
        question="Trong m\u1EA1ng 100 l\u1EDBp, gradient ph\u1EA3i nh\u00E2n qua 100 \u0111\u1EA1o h\u00E0m. N\u1EBFu m\u1ED7i \u0111\u1EA1o h\u00E0m < 1, gradient s\u1EBD..."
        options={["Gi\u1EEF nguy\u00EAn", "B\u00F9ng n\u1ED5 (r\u1EA5t l\u1EDBn)", "Bi\u1EBFn m\u1EA5t (g\u1EA7n 0)"]}
        correct={2}
        explanation={"0.5^100 \u2248 0. \u0110\u00E2y l\u00E0 vanishing gradient \u2014 l\u00FD do LSTM v\u00E0 ResNet ra \u0111\u1EDDi!"}
      />

      {/* Step 6: EXPLAIN */}
      <ExplanationSection>
        <p>
          <strong>Backpropagation</strong> (lan truy\u1EC1n ng\u01B0\u1EE3c) l\u00E0 thu\u1EADt to\u00E1n n\u1EC1n t\u1EA3ng
          \u0111\u1EC3 hu\u1EA5n luy\u1EC7n m\u1EA1ng n\u01A1-ron, \u0111\u01B0\u1EE3c ph\u1ED5 bi\u1EBFn b\u1EDFi Rumelhart, Hinton v\u00E0 Williams
          n\u0103m 1986. N\u00F3 t\u00EDnh <strong>gradient</strong> c\u1EE7a h\u00E0m loss theo t\u1EEBng tr\u1ECDng s\u1ED1
          b\u1EB1ng <strong>quy t\u1EAFc chu\u1ED7i (chain rule)</strong>.
        </p>
        <Callout variant="info" title="Chain Rule \u2014 C\u00F4ng th\u1EE9c c\u1ED1t l\u00F5i">
          <p className="font-mono text-xs">\u2202L/\u2202w = \u2202L/\u2202a \u00B7 \u2202a/\u2202z \u00B7 \u2202z/\u2202w</p>
          <p className="mt-2">
            M\u1ED7i l\u1EDBp t\u00EDnh <strong>\u0111\u1EA1o h\u00E0m c\u1EE5c b\u1ED9</strong>, nh\u00E2n v\u1EDBi gradient t\u1EEB l\u1EDBp sau.
            To\u00E0n b\u1ED9 ch\u1EC9 c\u1EA7n <strong>1 l\u1EA7n duy\u1EC7t ng\u01B0\u1EE3c</strong>.
          </p>
        </Callout>
        <Callout variant="insight" title="V\u00ED d\u1EE5 t\u00EDnh gradient">
          <div className="font-mono text-xs space-y-1">
            <p>\u2202L/\u2202w5 = \u2202L/\u2202out \u00B7 \u2202out/\u2202z3 \u00B7 \u2202z3/\u2202w5 = -2(target - out) \u00B7 out(1-out) \u00B7 h1</p>
            <p>\u2202L/\u2202w1 = ... \u00B7 \u2202z3/\u2202h1 \u00B7 \u2202h1/\u2202z1 \u00B7 \u2202z1/\u2202w1 (th\u00EAm c\u00E1c b\u01B0\u1EDBc chain rule)</p>
          </div>
        </Callout>
        <CodeBlock language="python" title="autograd_demo.py">
{`import torch

x = torch.tensor([0.6, 0.4])
target = torch.tensor([0.8])

# 6 tr\u1ECDng s\u1ED1, b\u1EADt requires_grad \u0111\u1EC3 PyTorch t\u1EF1 t\u00EDnh gradient
w = torch.tensor([0.3, -0.2, 0.5, 0.1, -0.4, 0.6],
                 requires_grad=True)

# Forward pass
h1 = torch.sigmoid(x[0]*w[0] + x[1]*w[1])
h2 = torch.sigmoid(x[0]*w[2] + x[1]*w[3])
out = torch.sigmoid(h1*w[4] + h2*w[5])

loss = (target - out) ** 2
loss.backward()  # Backprop! M\u1ED9t d\u00F2ng duy nh\u1EA5t.

print(f"Loss: {loss.item():.4f}")
print(f"Gradients: {w.grad}")
# Ch\u00EDnh x\u00E1c 6 gradient cho 6 tr\u1ECDng s\u1ED1!`}
        </CodeBlock>
        <Callout variant="warning" title="Computational Graph">
          <p>
            PyTorch x\u00E2y d\u1EF1ng <strong>computational graph</strong> trong forward pass.
            G\u1ECDi <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">.backward()</code> s\u1EBD
            duy\u1EC7t ng\u01B0\u1EE3c \u0111\u1ED3 th\u1ECB \u0111\u1EC3 t\u00EDnh gradient \u2014 \u0111\u00F3 l\u00E0 <strong>autograd</strong>.
          </p>
        </Callout>
      </ExplanationSection>

      {/* Step 7: SUMMARY */}
      <MiniSummary title="Ghi nh\u1EDB v\u1EC1 Backpropagation" points={[
        "Backprop t\u00EDnh gradient c\u1EE7a loss theo M\u1ECDI tr\u1ECDng s\u1ED1 ch\u1EC9 trong 1 l\u1EA7n duy\u1EC7t ng\u01B0\u1EE3c, d\u00F9ng chain rule.",
        "Forward pass: d\u1EEF li\u1EC7u ch\u1EA3y tr\u00E1i \u2192 ph\u1EA3i. Backward pass: gradient ch\u1EA3y ph\u1EA3i \u2192 tr\u00E1i ph\u00E2n b\u1ED5 l\u1ED7i.",
        "C\u1EADp nh\u1EADt: w_new = w_old - learning_rate * gradient.",
        "Vanishing/exploding gradient \u1EDF m\u1EA1ng s\u00E2u \u2014 gi\u1EA3i ph\u00E1p: ReLU, BatchNorm, ResNet.",
      ]} />

      {/* Step 8: QUIZ */}
      <QuizSection questions={quiz} />
    </>
  );
}
