"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarbleConfig {
  red: number;
  blue: number;
}

type Phase = 0 | 1 | 2;
type MarbleColor = "red" | "blue";

interface DrawResult {
  color: MarbleColor;
  id: number;
}

interface Prediction {
  predicted: MarbleColor;
  actual: MarbleColor;
  correct: boolean;
}

type BubbleMood = "happy" | "curious" | "oops" | "celebrate";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_BAG: MarbleConfig = { red: 3, blue: 7 };
const EVEN_BAG: MarbleConfig = { red: 5, blue: 5 };
const BAG_A: MarbleConfig = { red: 1, blue: 9 };
const BAG_B: MarbleConfig = { red: 5, blue: 5 };

const MAX_BAR_HEIGHT = 120;
const BAR_WIDTH = 60;
const PHASE0_DRAWS = 20;
const PHASE1_PREDICTIONS = 10;
const PHASE1_EVEN_DRAWS = 10;
const CREATOR_MAX_MARBLES = 10;
const FRIEND_DRAW_COUNT = 10;
const FRIEND_DRAW_DELAY = 400;

const SVG_W = 400;
const SVG_H = 450;
const BAG_CX = 200;
const BAG_CY = 140;

const TEXT = {
  introText: "Túi bi thần kỳ! Rút một viên bi xem được màu gì nha!",
  drawButton: "Rút bi!",
  phase1Prompt: "Đặt cược nào! Màu gì sẽ ra tiếp theo?",
  phase1Question: "Màu nào ra NHIỀU hơn? Bao nhiêu lần trong 10?",
  phase1NewBag: "Túi mới nè! Giờ sao?",
  phase1Bayesian: "Viên bi xanh này từ túi nào?",
  phase1BayesianCorrect:
    "Đúng rồi! Túi nào nhiều bi xanh hơn thì khả năng cao hơn!",
  phase2Prompt: "Tạo một túi bi BÍ ẨN cho bạn mình đoán!",
  phase2Done: "Xong!",
  phase2FriendGuessing: "Bạn mình đang đoán...",
} as const;

const RED_FILL = "#ef4444";
const BLUE_FILL = "#3b82f6";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drawMarble(config: MarbleConfig): MarbleColor {
  const total = config.red + config.blue;
  return Math.random() < config.red / total ? "red" : "blue";
}

/** Positions for marbles inside the bag — semi-circle arrangement */
function bagMarblePositions(
  config: MarbleConfig,
): { cx: number; cy: number; color: MarbleColor }[] {
  const marbles: { cx: number; cy: number; color: MarbleColor }[] = [];
  const total = config.red + config.blue;
  const cols = Math.min(total, 5);
  const rows = Math.ceil(total / cols);
  let idx = 0;
  const colors: MarbleColor[] = [
    ...Array.from<MarbleColor>({ length: config.red }).fill("red"),
    ...Array.from<MarbleColor>({ length: config.blue }).fill("blue"),
  ];
  // Shuffle for visual variety
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  for (let r = 0; r < rows; r++) {
    const colsInRow = Math.min(cols, total - r * cols);
    const rowWidth = colsInRow * 28;
    const startX = BAG_CX - rowWidth / 2 + 14;
    for (let c = 0; c < colsInRow; c++) {
      marbles.push({
        cx: startX + c * 28,
        cy: BAG_CY - 20 + r * 28,
        color: colors[idx],
      });
      idx++;
    }
  }
  return marbles;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** The bag SVG shape — rounded trapezoid */
function BagShape({ opaque, label }: { opaque: boolean; label?: string }) {
  return (
    <g>
      {/* Bag body — rounded trapezoid path */}
      <path
        d="M120,60 Q110,60 108,75 L95,230 Q92,250 110,255 L290,255 Q308,250 305,230 L292,75 Q290,60 280,60 Z"
        fill={opaque ? "#f5f5f5" : "#f5f5f5"}
        fillOpacity={opaque ? 1 : 0.45}
        stroke="#a3a3a3"
        strokeWidth={2.5}
        className="transition-all duration-500"
      />
      {/* Bag opening */}
      <ellipse
        cx={BAG_CX}
        cy={62}
        rx={87}
        ry={12}
        fill="#d4d4d4"
        stroke="#a3a3a3"
        strokeWidth={2}
      />
      {opaque && (
        <text
          x={BAG_CX}
          y={BAG_CY + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={48}
          fill="#737373"
          aria-hidden="true"
        >
          ?
        </text>
      )}
      {label && (
        <text
          x={BAG_CX}
          y={270}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill="#525252"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Marbles visible inside a transparent bag */
function BagMarbles({
  config,
  jiggle,
}: {
  config: MarbleConfig;
  jiggle: boolean;
}) {
  const positions = useMemo(() => bagMarblePositions(config), [config]);
  return (
    <g>
      {positions.map((m, i) => (
        <circle
          key={i}
          cx={m.cx}
          cy={m.cy}
          r={11}
          fill={m.color === "red" ? RED_FILL : BLUE_FILL}
          stroke="white"
          strokeWidth={1.5}
          className={jiggle ? "animate-marble-jiggle" : ""}
          style={
            jiggle ? { animationDelay: `${(i * 0.12).toFixed(2)}s` } : undefined
          }
        />
      ))}
    </g>
  );
}

/** Tally bar chart for draw results */
function TallyBars({
  redCount,
  blueCount,
}: {
  redCount: number;
  blueCount: number;
}) {
  const maxCount = Math.max(redCount, blueCount, 1);
  const redH = (redCount / maxCount) * MAX_BAR_HEIGHT;
  const blueH = (blueCount / maxCount) * MAX_BAR_HEIGHT;
  const barY = 290;
  const barBase = barY + MAX_BAR_HEIGHT;

  return (
    <g>
      {/* Labels */}
      <text
        x={BAG_CX - 55}
        y={barBase + 20}
        textAnchor="middle"
        fontSize={12}
        fill="#525252"
      >
        🔴 {redCount}
      </text>
      <text
        x={BAG_CX + 55}
        y={barBase + 20}
        textAnchor="middle"
        fontSize={12}
        fill="#525252"
      >
        🔵 {blueCount}
      </text>
      {/* Red bar */}
      <rect
        x={BAG_CX - 55 - BAR_WIDTH / 2}
        y={barBase - redH}
        width={BAR_WIDTH}
        height={redH}
        rx={6}
        fill={RED_FILL}
        fillOpacity={0.8}
        className="transition-all duration-300"
      />
      {/* Blue bar */}
      <rect
        x={BAG_CX + 55 - BAR_WIDTH / 2}
        y={barBase - blueH}
        width={BAR_WIDTH}
        height={blueH}
        rx={6}
        fill={BLUE_FILL}
        fillOpacity={0.8}
        className="transition-all duration-300"
      />
    </g>
  );
}

/** Animated marble floating up from bag */
function FloatingMarble({
  color,
  onDone,
}: {
  color: MarbleColor;
  onDone: () => void;
}) {
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const timer = setTimeout(onDone, 600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <circle
      ref={ref}
      cx={BAG_CX}
      cy={BAG_CY - 40}
      r={13}
      fill={color === "red" ? RED_FILL : BLUE_FILL}
      stroke="white"
      strokeWidth={2}
      className="animate-marble-float"
    />
  );
}

/** Prediction history row */
function PredictionHistory({ predictions }: { predictions: Prediction[] }) {
  if (predictions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 justify-center">
      {predictions.map((p, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
            p.correct
              ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
          }`}
          aria-label={p.correct ? "Đúng" : "Sai"}
        >
          {p.correct ? "✓" : "✗"}
        </span>
      ))}
    </div>
  );
}

/** Bayesian two-bag scene (mini SVG) */
function BayesianScene({
  onPick,
}: {
  onPick: (bag: "A" | "B") => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-6">
        {/* Bag A */}
        <button
          type="button"
          onClick={() => onPick("A")}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 px-4 py-3 hover:border-blue-400 hover:shadow-md active:scale-95 transition-all"
          style={{ minWidth: 100, minHeight: 100 }}
          aria-label="Chọn Túi A"
        >
          <svg viewBox="0 0 80 90" width={80} height={90}>
            <path
              d="M10,15 Q8,15 7,20 L3,75 Q2,85 12,87 L68,87 Q78,85 77,75 L73,20 Q72,15 70,15 Z"
              fill="#f5f5f5"
              stroke="#a3a3a3"
              strokeWidth={1.5}
            />
            <ellipse cx={40} cy={16} rx={32} ry={6} fill="#d4d4d4" stroke="#a3a3a3" strokeWidth={1} />
            <text x={40} y={55} textAnchor="middle" fontSize={24} fill="#737373">?</text>
          </svg>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Túi A</span>
        </button>

        {/* Mystery marble between bags */}
        <div className="flex flex-col items-center gap-1 pb-8">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: BLUE_FILL }}
          >
            <span className="text-white text-lg" aria-hidden="true">●</span>
          </div>
          <span className="text-xs text-muted-foreground">?</span>
        </div>

        {/* Bag B */}
        <button
          type="button"
          onClick={() => onPick("B")}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 px-4 py-3 hover:border-blue-400 hover:shadow-md active:scale-95 transition-all"
          style={{ minWidth: 100, minHeight: 100 }}
          aria-label="Chọn Túi B"
        >
          <svg viewBox="0 0 80 90" width={80} height={90}>
            <path
              d="M10,15 Q8,15 7,20 L3,75 Q2,85 12,87 L68,87 Q78,85 77,75 L73,20 Q72,15 70,15 Z"
              fill="#f5f5f5"
              stroke="#a3a3a3"
              strokeWidth={1.5}
            />
            <ellipse cx={40} cy={16} rx={32} ry={6} fill="#d4d4d4" stroke="#a3a3a3" strokeWidth={1} />
            <text x={40} y={55} textAnchor="middle" fontSize={24} fill="#737373">?</text>
          </svg>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Túi B</span>
        </button>
      </div>
    </div>
  );
}

/** Creator marble palette */
function MarblePalette({
  config,
  onChange,
  maxTotal,
}: {
  config: MarbleConfig;
  onChange: (next: MarbleConfig) => void;
  maxTotal: number;
}) {
  const total = config.red + config.blue;
  const canAdd = total < maxTotal;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => canAdd && onChange({ ...config, red: config.red + 1 })}
          disabled={!canAdd}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Thêm bi đỏ"
        >
          <span className="text-xl">🔴</span>
        </button>
        <button
          type="button"
          onClick={() =>
            canAdd && onChange({ ...config, blue: config.blue + 1 })
          }
          disabled={!canAdd}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Thêm bi xanh"
        >
          <span className="text-xl">🔵</span>
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1">
          🔴 <strong>{config.red}</strong>
        </span>
        <span className="flex items-center gap-1">
          🔵 <strong>{config.blue}</strong>
        </span>
        <span className="text-muted-foreground">
          ({total}/{maxTotal})
        </span>
      </div>
      {config.red > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...config, red: config.red - 1 })}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Bớt bi đỏ"
        >
          Bớt 🔴
        </button>
      )}
      {config.blue > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...config, blue: config.blue - 1 })}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Bớt bi xanh"
        >
          Bớt 🔵
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 1 sub-stages
// ---------------------------------------------------------------------------

type Phase1Stage =
  | "predict" // predicting with opaque bag
  | "question" // "which color appeared more?"
  | "even-draw" // 50/50 bag free draws
  | "bayesian" // two-bag question
  | "bayesian-result"; // feedback after bayesian

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MagicMarbleBag() {
  // -- Phase management --
  const [phase, setPhase] = useState<Phase>(0);
  const [phase1Stage, setPhase1Stage] = useState<Phase1Stage>("predict");

  // -- Bag config --
  const [bag, setBag] = useState<MarbleConfig>(INITIAL_BAG);

  // -- Draw state --
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [drawId, setDrawId] = useState(0);
  const [floating, setFloating] = useState<MarbleColor | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // -- Phase 0 counts --
  const redCount = useMemo(
    () => draws.filter((d) => d.color === "red").length,
    [draws],
  );
  const blueCount = useMemo(
    () => draws.filter((d) => d.color === "blue").length,
    [draws],
  );

  // -- Phase 1 state --
  const [pendingPrediction, setPendingPrediction] =
    useState<MarbleColor | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);

  // -- Phase 1 even draws --
  const [evenDraws, setEvenDraws] = useState<DrawResult[]>([]);
  const evenRedCount = useMemo(
    () => evenDraws.filter((d) => d.color === "red").length,
    [evenDraws],
  );
  const evenBlueCount = useMemo(
    () => evenDraws.filter((d) => d.color === "blue").length,
    [evenDraws],
  );

  // -- Phase 1 Bayesian --
  const [bayesianPick, setBayesianPick] = useState<"A" | "B" | null>(null);

  // -- Phase 2 state --
  const [creatorBag, setCreatorBag] = useState<MarbleConfig>({
    red: 0,
    blue: 0,
  });
  const [creatorDone, setCreatorDone] = useState(false);
  const [friendDraws, setFriendDraws] = useState<DrawResult[]>([]);
  const [friendGuessing, setFriendGuessing] = useState(false);
  const [friendGuess, setFriendGuess] = useState<MarbleConfig | null>(null);

  // -- Completion --
  const [showPearl, setShowPearl] = useState(false);

  // -- Bubble --
  const [bubble, setBubble] = useState<string>(TEXT.introText);
  const [bubbleMood, setBubbleMood] = useState<BubbleMood>("curious");

  // -- Timers --
  const friendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- Cleanup on unmount --
  useEffect(() => {
    return () => {
      if (friendTimerRef.current) clearTimeout(friendTimerRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Phase 0: Observer — draw marbles
  // -----------------------------------------------------------------------

  const handleDraw = useCallback(() => {
    if (isDrawing) return;

    const color = drawMarble(bag);
    setFloating(color);
    setIsDrawing(true);
  }, [isDrawing, bag]);

  const handleFloatDone = useCallback(() => {
    if (floating === null) return;
    const newId = drawId + 1;
    setDrawId(newId);
    const newDraw: DrawResult = { color: floating, id: newId };
    setFloating(null);
    setIsDrawing(false);

    if (phase === 0) {
      const nextDraws = [...draws, newDraw];
      setDraws(nextDraws);

      // After 20 draws → transition to phase 1
      if (nextDraws.length >= PHASE0_DRAWS) {
        setTimeout(() => {
          setPhase(1);
          setPhase1Stage("predict");
          setBubble(TEXT.phase1Prompt);
          setBubbleMood("curious");
          setDraws([]);
        }, 500);
      }
    } else if (phase === 1 && phase1Stage === "predict" && pendingPrediction) {
      const correct = pendingPrediction === floating;
      const newPrediction: Prediction = {
        predicted: pendingPrediction,
        actual: floating,
        correct,
      };
      const nextPredictions = [...predictions, newPrediction];
      setPredictions(nextPredictions);
      setPendingPrediction(null);

      if (nextPredictions.length >= PHASE1_PREDICTIONS) {
        setTimeout(() => {
          setPhase1Stage("question");
          setBubble(TEXT.phase1Question);
          setBubbleMood("curious");
        }, 500);
      }
    } else if (phase === 1 && phase1Stage === "even-draw") {
      const nextEvenDraws = [...evenDraws, newDraw];
      setEvenDraws(nextEvenDraws);

      if (nextEvenDraws.length >= PHASE1_EVEN_DRAWS) {
        setTimeout(() => {
          setPhase1Stage("bayesian");
          setBubble(TEXT.phase1Bayesian);
          setBubbleMood("curious");
        }, 500);
      }
    }
  }, [
    floating,
    drawId,
    phase,
    phase1Stage,
    draws,
    pendingPrediction,
    predictions,
    evenDraws,
  ]);

  // -----------------------------------------------------------------------
  // Phase 1: Predictor
  // -----------------------------------------------------------------------

  const handlePredict = useCallback(
    (color: MarbleColor) => {
      if (pendingPrediction !== null || isDrawing) return;
      setPendingPrediction(color);
      // Auto-draw after prediction
      const drawnColor = drawMarble(bag);
      setFloating(drawnColor);
      setIsDrawing(true);
    },
    [pendingPrediction, isDrawing, bag],
  );

  const handleQuestionAnswer = useCallback(
    (answer: string) => {
      setQuestionAnswer(answer);
      if (answer === "7/10") {
        setBubble("Giỏi lắm! Bi xanh ra nhiều hơn vì có 7 viên!");
        setBubbleMood("celebrate");
      } else {
        setBubble("Gần rồi! Bi xanh ra khoảng 7 lần trong 10 vì có 7 viên xanh!");
        setBubbleMood("oops");
      }
      setTimeout(() => {
        setBag(EVEN_BAG);
        setPhase1Stage("even-draw");
        setBubble(TEXT.phase1NewBag);
        setBubbleMood("curious");
        setQuestionAnswer(null);
        setDraws([]);
        setEvenDraws([]);
      }, 2000);
    },
    [],
  );

  const handleEvenDraw = useCallback(() => {
    if (isDrawing) return;
    const color = drawMarble(EVEN_BAG);
    setFloating(color);
    setIsDrawing(true);
  }, [isDrawing]);

  const handleBayesianPick = useCallback((pick: "A" | "B") => {
    setBayesianPick(pick);
    if (pick === "A") {
      setBubble(TEXT.phase1BayesianCorrect);
      setBubbleMood("celebrate");
    } else {
      setBubble(
        "Thử nghĩ lại! Túi nào có nhiều bi xanh hơn thì khả năng ra bi xanh cao hơn!",
      );
      setBubbleMood("oops");
    }
    setTimeout(() => {
      setPhase(2);
      setBubble(TEXT.phase2Prompt);
      setBubbleMood("curious");
      setBag({ red: 0, blue: 0 });
      setDraws([]);
    }, 2500);
  }, []);

  // -----------------------------------------------------------------------
  // Phase 2: Creator
  // -----------------------------------------------------------------------

  const handleCreatorDone = useCallback(() => {
    if (creatorBag.red + creatorBag.blue === 0) return;
    setCreatorDone(true);
    setFriendGuessing(true);
    setBubble(TEXT.phase2FriendGuessing);
    setBubbleMood("curious");

    // Auto-draw friend marbles
    const bagCopy = { ...creatorBag };
    const results: DrawResult[] = [];
    let step = 0;

    function drawNext() {
      if (step >= FRIEND_DRAW_COUNT) {
        // Friend guesses based on draws
        const fRed = results.filter((r) => r.color === "red").length;
        const fBlue = results.filter((r) => r.color === "blue").length;
        const total = bagCopy.red + bagCopy.blue;
        // Friend's guess is close but not exact — proportional estimate with noise
        const guessRed = Math.max(
          0,
          Math.min(
            total,
            Math.round((fRed / FRIEND_DRAW_COUNT) * total) +
              (Math.random() > 0.5 ? 1 : -1),
          ),
        );
        const guessBlue = total - guessRed;
        setFriendGuess({ red: Math.max(0, guessRed), blue: Math.max(0, guessBlue) });
        setFriendGuessing(false);
        setBubble(
          `Bạn ấy đoán: ${Math.max(0, guessRed)} đỏ, ${Math.max(0, guessBlue)} xanh!`,
        );
        setBubbleMood("happy");
        setTimeout(() => setShowPearl(true), 1500);
        return;
      }

      const color = drawMarble(bagCopy);
      step++;
      const result: DrawResult = { color, id: step };
      results.push(result);
      setFriendDraws([...results]);

      friendTimerRef.current = setTimeout(drawNext, FRIEND_DRAW_DELAY);
    }

    friendTimerRef.current = setTimeout(drawNext, FRIEND_DRAW_DELAY);
  }, [creatorBag]);

  // -- Derived state for friend draw counts --
  const friendRedCount = useMemo(
    () => friendDraws.filter((d) => d.color === "red").length,
    [friendDraws],
  );
  const friendBlueCount = useMemo(
    () => friendDraws.filter((d) => d.color === "blue").length,
    [friendDraws],
  );

  // -- Bag opaque? --
  const bagOpaque = phase === 1 || (phase === 2 && creatorDone);

  // -- Current bag for display --
  const displayBag = useMemo(() => {
    if (phase === 2) return creatorBag;
    if (phase === 1 && phase1Stage === "even-draw") return EVEN_BAG;
    return bag;
  }, [phase, phase1Stage, bag, creatorBag]);

  // -- Current draw counts for tally --
  const tallyRed = useMemo(() => {
    if (phase === 1 && phase1Stage === "even-draw") return evenRedCount;
    if (phase === 2 && creatorDone) return friendRedCount;
    return redCount;
  }, [phase, phase1Stage, redCount, evenRedCount, friendRedCount, creatorDone]);

  const tallyBlue = useMemo(() => {
    if (phase === 1 && phase1Stage === "even-draw") return evenBlueCount;
    if (phase === 2 && creatorDone) return friendBlueCount;
    return blueCount;
  }, [phase, phase1Stage, blueCount, evenBlueCount, friendBlueCount, creatorDone]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-3 pb-8">
      {/* Mascot bubble */}
      <div className="w-full max-w-md px-2">
        <MascotBubble text={bubble} mood={bubbleMood} />
      </div>

      {/* Prediction history (Phase 1 predict stage) */}
      {phase === 1 && phase1Stage === "predict" && (
        <PredictionHistory predictions={predictions} />
      )}

      {/* Bayesian scene */}
      {phase === 1 && phase1Stage === "bayesian" && bayesianPick === null && (
        <BayesianScene onPick={handleBayesianPick} />
      )}

      {/* Main SVG scene — hide during bayesian */}
      {!(phase === 1 && phase1Stage === "bayesian" && bayesianPick === null) && (
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          className="max-w-full rounded-2xl border border-border bg-cyan-50/50 dark:bg-cyan-950/20"
          role="img"
          aria-label="Túi bi thần kỳ"
        >
          {/* Bag shape */}
          <BagShape opaque={bagOpaque} />

          {/* Marbles inside bag (visible when transparent) */}
          {!bagOpaque && displayBag.red + displayBag.blue > 0 && (
            <BagMarbles config={displayBag} jiggle={phase === 0} />
          )}

          {/* Floating marble animation */}
          {floating !== null && (
            <FloatingMarble color={floating} onDone={handleFloatDone} />
          )}

          {/* Tally bars */}
          {(tallyRed > 0 || tallyBlue > 0) && (
            <TallyBars redCount={tallyRed} blueCount={tallyBlue} />
          )}

          {/* Friend draws indicator (phase 2) */}
          {phase === 2 && creatorDone && friendDraws.length > 0 && (
            <g>
              {friendDraws.map((d, i) => (
                <circle
                  key={d.id}
                  cx={BAG_CX - 80 + (i % 5) * 40}
                  cy={280 + Math.floor(i / 5) * 25}
                  r={8}
                  fill={d.color === "red" ? RED_FILL : BLUE_FILL}
                  fillOpacity={0.7}
                  stroke="white"
                  strokeWidth={1}
                  className="animate-marble-appear"
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </g>
          )}
        </svg>
      )}

      {/* Phase 0: Draw button */}
      {phase === 0 && (
        <button
          type="button"
          onClick={handleDraw}
          disabled={isDrawing}
          className="rounded-full bg-amber-400 px-8 py-3 text-base font-bold text-amber-900 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minWidth: 120, minHeight: 44 }}
        >
          {TEXT.drawButton}
        </button>
      )}

      {/* Phase 0: Draw counter */}
      {phase === 0 && draws.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Lần rút: {draws.length}/{PHASE0_DRAWS}
        </p>
      )}

      {/* Phase 1 predict: Prediction buttons */}
      {phase === 1 && phase1Stage === "predict" && !isDrawing && pendingPrediction === null && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handlePredict("red")}
            className="flex items-center justify-center rounded-full border-2 border-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 active:scale-95 transition-all"
            style={{ width: 56, height: 56, minWidth: 44, minHeight: 44 }}
            aria-label="Đoán bi đỏ"
          >
            <span className="text-2xl">🔴</span>
          </button>
          <button
            type="button"
            onClick={() => handlePredict("blue")}
            className="flex items-center justify-center rounded-full border-2 border-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 active:scale-95 transition-all"
            style={{ width: 56, height: 56, minWidth: 44, minHeight: 44 }}
            aria-label="Đoán bi xanh"
          >
            <span className="text-2xl">🔵</span>
          </button>
        </div>
      )}

      {/* Phase 1 predict: Prediction counter */}
      {phase === 1 && phase1Stage === "predict" && (
        <p className="text-sm text-muted-foreground">
          Dự đoán: {predictions.length}/{PHASE1_PREDICTIONS}
        </p>
      )}

      {/* Phase 1 question: Multiple choice */}
      {phase === 1 && phase1Stage === "question" && questionAnswer === null && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {["7/10", "5/10", "3/10"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleQuestionAnswer(opt)}
                className="rounded-xl border-2 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 px-5 py-3 text-base font-bold hover:border-amber-400 hover:shadow-md active:scale-95 transition-all"
                style={{ minWidth: 70, minHeight: 44 }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 1 even-draw: Draw button */}
      {phase === 1 && phase1Stage === "even-draw" && (
        <>
          <button
            type="button"
            onClick={handleEvenDraw}
            disabled={isDrawing || evenDraws.length >= PHASE1_EVEN_DRAWS}
            className="rounded-full bg-amber-400 px-8 py-3 text-base font-bold text-amber-900 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: 120, minHeight: 44 }}
          >
            {TEXT.drawButton}
          </button>
          <p className="text-sm text-muted-foreground">
            Lần rút: {evenDraws.length}/{PHASE1_EVEN_DRAWS}
          </p>
        </>
      )}

      {/* Phase 2: Creator palette (before done) */}
      {phase === 2 && !creatorDone && (
        <>
          <MarblePalette
            config={creatorBag}
            onChange={setCreatorBag}
            maxTotal={CREATOR_MAX_MARBLES}
          />
          <button
            type="button"
            onClick={handleCreatorDone}
            disabled={creatorBag.red + creatorBag.blue === 0}
            className="rounded-full bg-amber-400 px-8 py-3 text-base font-bold text-amber-900 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: 120, minHeight: 44 }}
          >
            {TEXT.phase2Done}
          </button>
        </>
      )}

      {/* Phase 2: Friend guessing indicator */}
      {phase === 2 && friendGuessing && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {TEXT.phase2FriendGuessing} ({friendDraws.length}/{FRIEND_DRAW_COUNT})
        </p>
      )}

      {/* Phase 2: Friend guess result */}
      {phase === 2 && friendGuess && (
        <div className="flex flex-col items-center gap-2 text-sm">
          <p className="font-bold">
            Thật ra: 🔴 {creatorBag.red} — 🔵 {creatorBag.blue}
          </p>
          <p className="text-muted-foreground">
            Bạn ấy đoán: 🔴 {friendGuess.red} — 🔵 {friendGuess.blue}
          </p>
        </div>
      )}

      {/* Pearl reveal */}
      {showPearl && (
        <PearlReveal
          topicSlug="nhi-magic-marble-bag"
          onClose={() => setShowPearl(false)}
        />
      )}

    </div>
  );
}
