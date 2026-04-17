"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Species = "fish" | "turtle" | "crab" | "jellyfish" | "starfish" | "seahorse";
type CreatureColor = "blue" | "red" | "green" | "yellow" | "purple" | "orange";
type CreatureSize = "small" | "medium" | "large";

interface Creature {
  id: number;
  species: Species;
  color: CreatureColor;
  size: CreatureSize;
  legs: number;
}

type Phase = 0 | 1 | 2;
type RuleKind = "swap-color" | "legs-x2" | "legs-x2-plus2";
type CreatorOp = "x2" | "plus1" | "swap-color" | "grow";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS: CreatureColor[] = ["blue", "red", "green", "yellow", "purple", "orange"];

const COLOR_HEX: Record<CreatureColor, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  orange: "#f97316",
};

const SIZE_SCALE: Record<CreatureSize, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.3,
};

const SIZES: CreatureSize[] = ["small", "medium", "large"];

const INITIAL_CREATURES: Creature[] = [
  { id: 1, species: "fish", color: "blue", size: "medium", legs: 0 },
  { id: 2, species: "turtle", color: "green", size: "small", legs: 4 },
  { id: 3, species: "crab", color: "red", size: "large", legs: 10 },
  { id: 4, species: "jellyfish", color: "purple", size: "medium", legs: 0 },
  { id: 5, species: "starfish", color: "orange", size: "small", legs: 5 },
  { id: 6, species: "seahorse", color: "yellow", size: "medium", legs: 0 },
];

const TEXT = {
  phase0Hint: "Kéo một con vật vào máy xem điều gì xảy ra!",
  phase1Prompt: "Ôi không, máy bị kẹt rồi! Bạn có nhớ quy tắc không?",
  phase1Correct: "Đúng rồi! Giỏi lắm!",
  phase1Wrong: "Gần đúng rồi! Thử lại nha!",
  phase1HardIntro: "Quy tắc mới khó hơn nè!",
  phase2Prompt: "Bạn giỏi quá! Giờ bạn TẠO quy tắc riêng nhé!",
  phase2Run: "Chạy máy!",
} as const;

// ---------------------------------------------------------------------------
// Rule application helpers
// ---------------------------------------------------------------------------

function swapColor(c: CreatureColor): CreatureColor {
  const i = COLORS.indexOf(c);
  return COLORS[(i + 1) % COLORS.length];
}

function growSize(s: CreatureSize): CreatureSize {
  const i = SIZES.indexOf(s);
  return SIZES[Math.min(i + 1, SIZES.length - 1)];
}

function applyRule(creature: Creature, rule: RuleKind): Creature {
  switch (rule) {
    case "swap-color":
      return { ...creature, color: swapColor(creature.color) };
    case "legs-x2":
      return { ...creature, legs: creature.legs * 2 };
    case "legs-x2-plus2":
      return { ...creature, legs: creature.legs * 2 + 2 };
  }
}

function applyCreatorOps(creature: Creature, ops: CreatorOp[]): Creature {
  let result = { ...creature };
  for (const op of ops) {
    switch (op) {
      case "x2":
        result = { ...result, legs: result.legs * 2 };
        break;
      case "plus1":
        result = { ...result, legs: result.legs + 1 };
        break;
      case "swap-color":
        result = { ...result, color: swapColor(result.color) };
        break;
      case "grow":
        result = { ...result, size: growSize(result.size) };
        break;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// SVG creature renderers
// ---------------------------------------------------------------------------

function CreatureSVG({
  creature,
  x,
  y,
  id: gId,
}: {
  creature: Creature;
  x: number;
  y: number;
  id?: string;
}) {
  const s = SIZE_SCALE[creature.size];
  const fill = COLOR_HEX[creature.color];

  return (
    <g id={gId} transform={`translate(${x},${y}) scale(${s})`}>
      {creature.species === "fish" && (
        <>
          <ellipse cx={0} cy={0} rx={18} ry={11} fill={fill} />
          <polygon points="-18,0 -28,-9 -28,9" fill={fill} opacity={0.8} />
          <circle cx={8} cy={-3} r={2.5} fill="white" />
          <circle cx={9} cy={-3} r={1.2} fill="#1e293b" />
        </>
      )}
      {creature.species === "turtle" && (
        <>
          <ellipse cx={0} cy={0} rx={18} ry={14} fill={fill} />
          <ellipse cx={0} cy={0} rx={14} ry={10} fill={fill} stroke="#166534" strokeWidth={1.5} />
          <circle cx={16} cy={-4} r={5} fill={fill} opacity={0.9} />
          <circle cx={18} cy={-5} r={1.5} fill="white" />
          <circle cx={18.5} cy={-5} r={0.8} fill="#1e293b" />
          <ellipse cx={-12} cy={12} rx={5} ry={3} fill={fill} opacity={0.7} />
          <ellipse cx={12} cy={12} rx={5} ry={3} fill={fill} opacity={0.7} />
          <ellipse cx={-12} cy={-10} rx={5} ry={3} fill={fill} opacity={0.7} />
          <ellipse cx={12} cy={-10} rx={5} ry={3} fill={fill} opacity={0.7} />
        </>
      )}
      {creature.species === "crab" && (
        <>
          <ellipse cx={0} cy={0} rx={16} ry={12} fill={fill} />
          <circle cx={-22} cy={-6} r={5} fill={fill} opacity={0.8} />
          <circle cx={22} cy={-6} r={5} fill={fill} opacity={0.8} />
          <circle cx={-5} cy={-5} r={2} fill="white" />
          <circle cx={5} cy={-5} r={2} fill="white" />
          <circle cx={-4.5} cy={-5} r={1} fill="#1e293b" />
          <circle cx={5.5} cy={-5} r={1} fill="#1e293b" />
          {[...Array(5)].map((_, i) => (
            <line
              key={`leg-l-${i}`}
              x1={-10 - i * 2}
              y1={10}
              x2={-16 - i * 2}
              y2={18}
              stroke={fill}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <line
              key={`leg-r-${i}`}
              x1={10 + i * 2}
              y1={10}
              x2={16 + i * 2}
              y2={18}
              stroke={fill}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </>
      )}
      {creature.species === "jellyfish" && (
        <>
          <ellipse cx={0} cy={-4} rx={16} ry={12} fill={fill} opacity={0.8} />
          <circle cx={-4} cy={-7} r={2} fill="white" />
          <circle cx={4} cy={-7} r={2} fill="white" />
          <circle cx={-3.5} cy={-7} r={1} fill="#1e293b" />
          <circle cx={4.5} cy={-7} r={1} fill="#1e293b" />
          {[-8, -3, 3, 8].map((dx) => (
            <path
              key={`tent-${dx}`}
              d={`M${dx},8 Q${dx + 3},16 ${dx},24`}
              stroke={fill}
              strokeWidth={2}
              fill="none"
              opacity={0.7}
            />
          ))}
        </>
      )}
      {creature.species === "starfish" && (
        <>
          {[...Array(5)].map((_, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const px = Math.cos(angle) * 18;
            const py = Math.sin(angle) * 18;
            return (
              <line
                key={`arm-${i}`}
                x1={0}
                y1={0}
                x2={px}
                y2={py}
                stroke={fill}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={0} cy={0} r={8} fill={fill} />
          <circle cx={-2} cy={-2} r={1.5} fill="white" />
          <circle cx={3} cy={-2} r={1.5} fill="white" />
          <circle cx={-1.5} cy={-2} r={0.8} fill="#1e293b" />
          <circle cx={3.5} cy={-2} r={0.8} fill="#1e293b" />
        </>
      )}
      {creature.species === "seahorse" && (
        <>
          <path
            d={`M0,-16 Q12,-10 8,0 Q4,10 0,16 Q-4,20 -2,24`}
            stroke={fill}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={4} cy={-10} r={6} fill={fill} />
          <circle cx={6} cy={-12} r={1.5} fill="white" />
          <circle cx={6.5} cy={-12} r={0.8} fill="#1e293b" />
          <line x1={4} y1={-16} x2={2} y2={-22} stroke={fill} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {/* Legs label for non-zero */}
      {creature.legs > 0 && (
        <text
          x={0}
          y={creature.species === "crab" ? 28 : 22}
          textAnchor="middle"
          fontSize={9}
          fill="#475569"
          fontWeight="bold"
        >
          {creature.legs} chân
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Machine SVG
// ---------------------------------------------------------------------------

function MachineSVG({
  processing,
  shaking,
  ruleLabel,
  golden,
}: {
  processing: boolean;
  shaking: boolean;
  ruleLabel: string;
  golden: boolean;
}) {
  const shakeClass = shaking ? "animate-machine-shake" : "";
  const gearClass = processing ? "animate-spin-slow" : "";

  return (
    <g className={shakeClass}>
      {/* Machine body */}
      <rect
        x={155}
        y={80}
        width={90}
        height={120}
        rx={8}
        fill={golden ? "#fbbf24" : "#94a3b8"}
        stroke={golden ? "#d97706" : "#64748b"}
        strokeWidth={2}
      />
      {/* Input slot */}
      <rect x={153} y={120} width={10} height={30} rx={3} fill="#475569" />
      {/* Output slot */}
      <rect x={237} y={120} width={10} height={30} rx={3} fill="#475569" />
      {/* Gears */}
      <g className={gearClass} style={{ transformOrigin: "185px 115px" }}>
        <circle cx={185} cy={115} r={10} fill="none" stroke="#334155" strokeWidth={2} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect
            key={a}
            x={183}
            y={103}
            width={4}
            height={6}
            rx={1}
            fill="#334155"
            transform={`rotate(${a} 185 115)`}
          />
        ))}
      </g>
      <g className={gearClass} style={{ transformOrigin: "215px 175px" }}>
        <circle cx={215} cy={175} r={8} fill="none" stroke="#334155" strokeWidth={2} />
        {[0, 72, 144, 216, 288].map((a) => (
          <rect
            key={a}
            x={213}
            y={165}
            width={4}
            height={5}
            rx={1}
            fill="#334155"
            transform={`rotate(${a} 215 175)`}
          />
        ))}
      </g>
      {/* Rule window */}
      <rect x={170} y={140} width={60} height={24} rx={4} fill="white" stroke="#cbd5e1" />
      <text x={200} y={156} textAnchor="middle" fontSize={10} fill="#334155" fontWeight="bold">
        {ruleLabel}
      </text>
      {/* Sparkles when processing */}
      {processing && (
        <>
          <circle cx={168} cy={90} r={3} fill="#fde68a" className="animate-pulse" />
          <circle cx={232} cy={95} r={2.5} fill="#fde68a" className="animate-pulse" style={{ animationDelay: "0.2s" }} />
          <circle cx={180} cy={195} r={2} fill="#fde68a" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
        </>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CoralFactory() {
  // State
  const [phase, setPhase] = useState<Phase>(0);
  const [rule, setRule] = useState<RuleKind>("swap-color");
  const [dragCount, setDragCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [outputs, setOutputs] = useState<Creature[]>([]);
  const [bubbleText, setBubbleText] = useState<string>(TEXT.phase0Hint);
  const [bubbleMood, setBubbleMood] = useState<"happy" | "curious" | "oops" | "celebrate">("curious");

  // Phase 1 state
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [phase1Correct, setPhase1Correct] = useState(0);
  const [challengeInput, setChallengeInput] = useState<Creature | null>(null);
  const [challengeOptions, setChallengeOptions] = useState<Creature[]>([]);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);

  // Phase 2 state
  const [selectedOps, setSelectedOps] = useState<CreatorOp[]>([]);
  const [creatorResults, setCreatorResults] = useState<Array<{ input: Creature; output: Creature }> | null>(null);
  const [showPearl, setShowPearl] = useState(false);

  // Drag state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ---------------------------------------------------------------------------
  // Rule label
  // ---------------------------------------------------------------------------

  const ruleLabel = useMemo(() => {
    switch (rule) {
      case "swap-color":
        return "Đổi màu";
      case "legs-x2":
        return "Chân ×2";
      case "legs-x2-plus2":
        return "Chân ×2 +2";
    }
  }, [rule]);

  // ---------------------------------------------------------------------------
  // Drag helpers
  // ---------------------------------------------------------------------------

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, creature: Creature) => {
      if (phase !== 0 || processing) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraggedId(creature.id);
      const pt = getSVGPoint(e.clientX, e.clientY);
      setDragPos(pt);
    },
    [phase, processing, getSVGPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggedId === null) return;
      e.preventDefault();
      const pt = getSVGPoint(e.clientX, e.clientY);
      setDragPos(pt);
    },
    [draggedId, getSVGPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (draggedId === null || !dragPos) {
      setDraggedId(null);
      setDragPos(null);
      return;
    }

    // Check if dropped on machine area (x: 155-245)
    const onMachine = dragPos.x >= 140 && dragPos.x <= 260;

    if (onMachine && !processing) {
      const creature = INITIAL_CREATURES.find((c) => c.id === draggedId);
      if (!creature) {
        setDraggedId(null);
        setDragPos(null);
        return;
      }

      setProcessing(true);
      const newCount = dragCount + 1;
      setDragCount(newCount);

      setTimeout(() => {
        const output = applyRule(creature, rule);
        setOutputs((prev) => [...prev.slice(-4), output]);
        setProcessing(false);

        // Phase progression
        if (newCount === 3 && rule === "swap-color") {
          setRule("legs-x2");
          setBubbleText("Quy tắc mới khó hơn nè!");
          setBubbleMood("curious");
        } else if (newCount >= 5 && phase === 0) {
          // Transition to Phase 1
          transitionToPhase1();
        }
      }, 600);
    }

    setDraggedId(null);
    setDragPos(null);
  }, [draggedId, dragPos, processing, dragCount, rule, phase]);

  // ---------------------------------------------------------------------------
  // Phase 1 transitions
  // ---------------------------------------------------------------------------

  const generateChallenge = useCallback(
    (currentRule: RuleKind) => {
      const input = INITIAL_CREATURES[Math.floor(Math.random() * INITIAL_CREATURES.length)];
      const correct = applyRule(input, currentRule);

      // Generate 3 wrong answers
      const wrongs: Creature[] = [];
      const otherRules: RuleKind[] = (["swap-color", "legs-x2", "legs-x2-plus2"] as RuleKind[]).filter(
        (r) => r !== currentRule,
      );
      for (const r of otherRules) {
        wrongs.push(applyRule(input, r));
      }
      // Add a random mutation
      wrongs.push({
        ...input,
        color: COLORS[(COLORS.indexOf(input.color) + 3) % COLORS.length],
        legs: input.legs + 3,
      });

      // Pick 3 wrongs and shuffle with correct
      const options = [correct, ...wrongs.slice(0, 3)];
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      setChallengeInput(input);
      setChallengeOptions(options);
      setFeedbackText(null);
    },
    [],
  );

  const transitionToPhase1 = useCallback(() => {
    setPhase(1);
    setRule("legs-x2");
    setBubbleText(TEXT.phase1Prompt);
    setBubbleMood("oops");
    setShaking(true);
    setTimeout(() => setShaking(false), 800);
    setChallengeIndex(0);
    setCorrectStreak(0);
    setPhase1Correct(0);
    // Small delay before generating first challenge
    setTimeout(() => {
      generateChallenge("legs-x2");
    }, 1200);
  }, [generateChallenge]);

  const handlePhase1Pick = useCallback(
    (picked: Creature) => {
      if (!challengeInput || feedbackText) return;

      const correct = applyRule(challengeInput, rule);
      const isCorrect =
        picked.color === correct.color &&
        picked.legs === correct.legs &&
        picked.size === correct.size;

      if (isCorrect) {
        setFeedbackText(TEXT.phase1Correct);
        setFeedbackCorrect(true);
        const newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        const newTotal = phase1Correct + 1;
        setPhase1Correct(newTotal);
        const newIndex = challengeIndex + 1;
        setChallengeIndex(newIndex);

        setTimeout(() => {
          // Check if we should upgrade rule
          if (rule === "legs-x2" && newStreak >= 3) {
            setRule("legs-x2-plus2");
            setBubbleText(TEXT.phase1HardIntro);
            setBubbleMood("curious");
            setCorrectStreak(0);
            setTimeout(() => generateChallenge("legs-x2-plus2"), 800);
          } else if (rule === "legs-x2-plus2" && newStreak >= 3) {
            // Transition to phase 2
            transitionToPhase2();
          } else {
            generateChallenge(rule);
          }
        }, 1000);
      } else {
        setFeedbackText(TEXT.phase1Wrong);
        setFeedbackCorrect(false);
        setCorrectStreak(0);
        setTimeout(() => setFeedbackText(null), 1200);
      }
    },
    [challengeInput, feedbackText, rule, correctStreak, phase1Correct, challengeIndex, generateChallenge],
  );

  // ---------------------------------------------------------------------------
  // Phase 2 transitions
  // ---------------------------------------------------------------------------

  const transitionToPhase2 = useCallback(() => {
    setPhase(2);
    setBubbleText(TEXT.phase2Prompt);
    setBubbleMood("celebrate");
    setSelectedOps([]);
    setCreatorResults(null);
  }, []);

  const toggleOp = useCallback((op: CreatorOp) => {
    setSelectedOps((prev) => {
      if (prev.includes(op)) return prev.filter((o) => o !== op);
      if (prev.length >= 2) return prev;
      return [...prev, op];
    });
  }, []);

  const runCreatorMachine = useCallback(() => {
    if (selectedOps.length === 0) return;
    setProcessing(true);
    setTimeout(() => {
      const results = INITIAL_CREATURES.map((c) => ({
        input: c,
        output: applyCreatorOps(c, selectedOps),
      }));
      setCreatorResults(results);
      setProcessing(false);
      // Show pearl after results display
      setTimeout(() => setShowPearl(true), 1500);
    }, 800);
  }, [selectedOps]);

  // ---------------------------------------------------------------------------
  // Input creature positions (left column)
  // ---------------------------------------------------------------------------

  const inputPositions = useMemo(
    () =>
      INITIAL_CREATURES.map((_, i) => ({
        x: 55,
        y: 95 + i * 68,
      })),
    [],
  );

  // ---------------------------------------------------------------------------
  // Inline styles for CSS animations (injected via style tag)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const styleId = "coral-factory-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes machine-shake {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-3px, 0); }
        40% { transform: translate(3px, 0); }
        60% { transform: translate(-2px, 0); }
        80% { transform: translate(2px, 0); }
      }
      @keyframes slide-out {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes glow-correct {
        0%, 100% { filter: drop-shadow(0 0 0 transparent); }
        50% { filter: drop-shadow(0 0 8px #22c55e); }
      }
      .animate-spin-slow { animation: spin-slow 1.2s linear infinite; }
      .animate-machine-shake { animation: machine-shake 0.5s ease-in-out; }
      .animate-slide-out { animation: slide-out 0.4s ease-out; }
      .animate-glow-correct { animation: glow-correct 0.6s ease-in-out 2; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const draggedCreature = draggedId !== null ? INITIAL_CREATURES.find((c) => c.id === draggedId) : null;

  return (
    <div className="flex flex-col items-center gap-3 pb-8">
      {/* Mascot bubble */}
      <div className="w-full max-w-md px-2">
        <MascotBubble text={bubbleText} mood={bubbleMood} />
      </div>

      {/* Main SVG scene */}
      <svg
        ref={svgRef}
        viewBox="0 0 400 500"
        className="w-full max-w-md touch-none select-none"
        style={{ maxHeight: "70vh" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Background — ocean gradient */}
        <defs>
          <linearGradient id="ocean-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#a5f3fc" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" rx="12" fill="url(#ocean-bg)" />

        {/* Column labels */}
        <text x={55} y={28} textAnchor="middle" fontSize={12} fill="#0369a1" fontWeight="bold">
          Đầu vào
        </text>
        <text x={200} y={28} textAnchor="middle" fontSize={12} fill="#0369a1" fontWeight="bold">
          Máy biến đổi
        </text>
        <text x={340} y={28} textAnchor="middle" fontSize={12} fill="#0369a1" fontWeight="bold">
          Đầu ra
        </text>

        {/* Decorative bubbles */}
        {[
          { cx: 380, cy: 460, r: 6 },
          { cx: 370, cy: 440, r: 4 },
          { cx: 20, cy: 470, r: 5 },
          { cx: 35, cy: 450, r: 3 },
        ].map((b, i) => (
          <circle key={`bubble-${i}`} {...b} fill="white" opacity={0.4} />
        ))}

        {/* ---- Phase 0: Drag creatures ---- */}
        {phase === 0 && (
          <>
            {/* Input creatures */}
            {INITIAL_CREATURES.map((creature, i) => {
              const pos = inputPositions[i];
              const isDragging = draggedId === creature.id;
              return (
                <g
                  key={creature.id}
                  onPointerDown={(e) => handlePointerDown(e, creature)}
                  style={{ cursor: "grab", touchAction: "none" }}
                  opacity={isDragging ? 0.3 : 1}
                >
                  {/* Touch target */}
                  <rect
                    x={pos.x - 28}
                    y={pos.y - 28}
                    width={56}
                    height={56}
                    fill="transparent"
                  />
                  <CreatureSVG creature={creature} x={pos.x} y={pos.y} />
                </g>
              );
            })}

            {/* Machine */}
            <MachineSVG
              processing={processing}
              shaking={shaking}
              ruleLabel={ruleLabel}
              golden={false}
            />

            {/* Output creatures (last 5) */}
            {outputs.map((out, i) => (
              <g key={`out-${i}`} className="animate-slide-out">
                <CreatureSVG
                  creature={out}
                  x={340}
                  y={100 + i * 68}
                />
              </g>
            ))}

            {/* Drag ghost */}
            {draggedCreature && dragPos && (
              <g style={{ pointerEvents: "none" }} opacity={0.85}>
                <CreatureSVG creature={draggedCreature} x={dragPos.x} y={dragPos.y} />
              </g>
            )}

            {/* Drop zone highlight */}
            {draggedId !== null && (
              <rect
                x={148}
                y={75}
                width={104}
                height={130}
                rx={10}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.6}
              />
            )}

            {/* Drag counter */}
            <text x={200} y={225} textAnchor="middle" fontSize={11} fill="#64748b">
              {dragCount} / 5
            </text>
          </>
        )}

        {/* ---- Phase 1: Predictor ---- */}
        {phase === 1 && (
          <>
            {/* Machine (shaking on entry) */}
            <MachineSVG
              processing={false}
              shaking={shaking}
              ruleLabel={ruleLabel}
              golden={false}
            />

            {/* Challenge input creature */}
            {challengeInput && (
              <g>
                <text x={55} y={145} textAnchor="middle" fontSize={11} fill="#475569">
                  Đầu vào:
                </text>
                <CreatureSVG creature={challengeInput} x={55} y={180} />

                {/* Arrow into machine */}
                <line x1={90} y1={180} x2={148} y2={155} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrowhead)" />
              </g>
            )}

            {/* Empty output slot */}
            <rect
              x={300}
              y={120}
              width={70}
              height={50}
              rx={8}
              fill="white"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
            <text x={335} y={149} textAnchor="middle" fontSize={10} fill="#94a3b8">
              ?
            </text>

            {/* Options palette */}
            <text x={200} y={290} textAnchor="middle" fontSize={12} fill="#0369a1" fontWeight="bold">
              Chọn đáp án đúng:
            </text>
            {challengeOptions.map((opt, i) => {
              const ox = 60 + i * 90;
              const oy = 350;
              return (
                <g
                  key={`opt-${i}`}
                  onPointerDown={() => handlePhase1Pick(opt)}
                  style={{ cursor: "pointer", touchAction: "none" }}
                >
                  {/* Touch target (min 44x44) */}
                  <rect
                    x={ox - 32}
                    y={oy - 32}
                    width={64}
                    height={64}
                    rx={8}
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth={1.5}
                  />
                  <CreatureSVG creature={opt} x={ox} y={oy} />
                </g>
              );
            })}

            {/* Feedback text */}
            {feedbackText && (
              <text
                x={200}
                y={440}
                textAnchor="middle"
                fontSize={16}
                fontWeight="bold"
                fill={feedbackCorrect ? "#16a34a" : "#dc2626"}
                className={feedbackCorrect ? "animate-glow-correct" : "animate-machine-shake"}
              >
                {feedbackText}
              </text>
            )}

            {/* Progress indicator */}
            <text x={200} y={470} textAnchor="middle" fontSize={10} fill="#64748b">
              Chuỗi đúng: {correctStreak} / 3
            </text>

            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>
          </>
        )}

        {/* ---- Phase 2: Creator ---- */}
        {phase === 2 && (
          <>
            {/* Golden machine */}
            <MachineSVG
              processing={processing}
              shaking={false}
              ruleLabel={selectedOps.length > 0 ? selectedOps.map((o) => {
                switch (o) {
                  case "x2": return "×2";
                  case "plus1": return "+1";
                  case "swap-color": return "Đổi màu";
                  case "grow": return "Lớn hơn";
                }
              }).join(" → ") : "?"}
              golden={true}
            />

            {/* Operation buttons */}
            {!creatorResults && (
              <>
                <text x={200} y={240} textAnchor="middle" fontSize={12} fill="#0369a1" fontWeight="bold">
                  Chọn 1-2 phép biến đổi:
                </text>
                {([
                  { op: "x2" as CreatorOp, label: "×2", desc: "Chân ×2" },
                  { op: "plus1" as CreatorOp, label: "+1", desc: "Chân +1" },
                  { op: "swap-color" as CreatorOp, label: "Đổi màu", desc: "Đổi màu" },
                  { op: "grow" as CreatorOp, label: "Lớn hơn", desc: "Lớn hơn" },
                ]).map(({ op, label }, i) => {
                  const bx = 50 + i * 85;
                  const by = 275;
                  const isSelected = selectedOps.includes(op);
                  return (
                    <g
                      key={op}
                      onPointerDown={() => toggleOp(op)}
                      style={{ cursor: "pointer", touchAction: "none" }}
                    >
                      <rect
                        x={bx - 30}
                        y={by - 18}
                        width={60}
                        height={36}
                        rx={8}
                        fill={isSelected ? "#3b82f6" : "white"}
                        stroke={isSelected ? "#2563eb" : "#cbd5e1"}
                        strokeWidth={2}
                      />
                      <text
                        x={bx}
                        y={by + 5}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight="bold"
                        fill={isSelected ? "white" : "#334155"}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Run button */}
                {selectedOps.length > 0 && (
                  <g
                    onPointerDown={runCreatorMachine}
                    style={{ cursor: "pointer", touchAction: "none" }}
                  >
                    <rect
                      x={130}
                      y={330}
                      width={140}
                      height={44}
                      rx={22}
                      fill="#22c55e"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                    <text x={200} y={357} textAnchor="middle" fontSize={14} fontWeight="bold" fill="white">
                      {TEXT.phase2Run}
                    </text>
                  </g>
                )}
              </>
            )}

            {/* Creator results: function mapping */}
            {creatorResults && (
              <>
                <text x={200} y={245} textAnchor="middle" fontSize={11} fill="#0369a1" fontWeight="bold">
                  Bảng biến đổi:
                </text>
                {creatorResults.map(({ input, output }, i) => {
                  const ry = 270 + i * 38;
                  return (
                    <g key={`res-${i}`} className="animate-slide-out" style={{ animationDelay: `${i * 0.1}s` }}>
                      <CreatureSVG creature={input} x={80} y={ry} />
                      <text x={155} y={ry + 4} textAnchor="middle" fontSize={16} fill="#64748b">
                        →
                      </text>
                      <CreatureSVG creature={output} x={230} y={ry} />
                      <text x={310} y={ry + 4} fontSize={9} fill="#475569">
                        {output.legs} chân, {output.color === "blue" ? "xanh" : output.color === "red" ? "đỏ" : output.color === "green" ? "lục" : output.color === "yellow" ? "vàng" : output.color === "purple" ? "tím" : "cam"}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </>
        )}
      </svg>

      {/* Pearl reveal overlay */}
      {showPearl && (
        <PearlReveal topicSlug="nhi-coral-factory" onClose={() => setShowPearl(false)} />
      )}
    </div>
  );
}
