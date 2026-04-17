"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Direction =
  | "right"
  | "left"
  | "up"
  | "down"
  | "upright"
  | "upleft"
  | "downright"
  | "downleft";

type Phase = 0 | 1 | 2;
type Challenge = 1 | 2 | 3;

interface Pos {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID = 10;
const CELL = 36;
const PAD = 20;
const SVG_SIZE = PAD * 2 + GRID * CELL; // 400

const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  upright: [1, -1],
  upleft: [-1, -1],
  downright: [1, 1],
  downleft: [-1, 1],
};

const DIR_LABELS: Record<Direction, string> = {
  right: "→",
  left: "←",
  up: "↑",
  down: "↓",
  upright: "↗",
  upleft: "↖",
  downright: "↘",
  downleft: "↙",
};

const DIR_COMPONENT: Record<Direction, string> = {
  right: "(1,0)",
  left: "(-1,0)",
  up: "(0,-1)",
  down: "(0,1)",
  upright: "(1,-1)",
  upleft: "(-1,-1)",
  downright: "(1,1)",
  downleft: "(-1,1)",
};

const ALL_DIRS: Direction[] = [
  "up",
  "upright",
  "right",
  "downright",
  "down",
  "downleft",
  "left",
  "upleft",
];

const LANDMARKS: { emoji: string; pos: Pos; label: string }[] = [
  { emoji: "🌴", pos: { x: 7, y: 2 }, label: "Cây dừa" },
  { emoji: "🕳️", pos: { x: 3, y: 6 }, label: "Hang động" },
  { emoji: "🌋", pos: { x: 8, y: 8 }, label: "Núi lửa" },
  { emoji: "💎", pos: { x: 9, y: 3 }, label: "Kho báu" },
];

const OCTOPUS_START: Pos = { x: 1, y: 5 };
const HOME: Pos = { x: 0, y: 0 };

const TEXT = {
  introText:
    "Hòn đảo bí ẩn! Kéo mũi tên để di chuyển Bạch Tuộc khám phá nha!",
  phase0Hint: "Bấm mũi tên để Bạch Tuộc đi nào!",
  phase1Fog: "Sương mù dày quá! Chỉ được dùng 2 mũi tên thôi!",
  phase1Challenge2:
    "Tới hang động! Một mũi tên phải đi xuống — bạn chọn mũi tên còn lại!",
  phase1Challenge3:
    "Mũi tên này có thể mạnh hơn! Kéo thanh trượt nha!",
  phase2Prompt: "Bạn mình bị lạc! Vẽ đường cho bạn ấy về nhà!",
  starLabel: "ngôi sao",
} as const;

const OCTOPUS_COLOR = "#a855f7";
const FRIEND_COLOR = "#f97316";
const TRAIL_COLOR = "#8b5cf6";
const FRIEND_TRAIL_COLOR = "#fb923c";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gridToSvg(gx: number, gy: number): [number, number] {
  return [PAD + gx * CELL + CELL / 2, PAD + gy * CELL + CELL / 2];
}

function clampGrid(v: number): number {
  return Math.max(0, Math.min(GRID - 1, v));
}

function posEq(a: Pos, b: Pos): boolean {
  return a.x === b.x && a.y === b.y;
}

function posDist(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function applyDir(pos: Pos, dir: Direction, scale = 1): Pos {
  const [dx, dy] = DIRECTION_VECTORS[dir];
  return {
    x: clampGrid(pos.x + dx * scale),
    y: clampGrid(pos.y + dy * scale),
  };
}

/** Pick a random grid position not on home or landmarks. */
function randomFriendPos(): Pos {
  const blocked = new Set(
    [...LANDMARKS.map((l) => `${l.pos.x},${l.pos.y}`), `${HOME.x},${HOME.y}`],
  );
  let pos: Pos;
  do {
    pos = {
      x: 3 + Math.floor(Math.random() * 6),
      y: 3 + Math.floor(Math.random() * 6),
    };
  } while (blocked.has(`${pos.x},${pos.y}`));
  return pos;
}

// ---------------------------------------------------------------------------
// Arrow button sub-component
// ---------------------------------------------------------------------------

function ArrowButton({
  dir,
  onPress,
  disabled,
  highlight,
}: {
  dir: Direction;
  onPress: (d: Direction) => void;
  disabled: boolean;
  highlight: boolean;
}) {
  const handleClick = useCallback(() => {
    if (!disabled) onPress(dir);
  }, [dir, disabled, onPress]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Di chuyển ${dir}`}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all
        ${
          disabled
            ? "border-gray-300 dark:border-gray-600 opacity-40 cursor-not-allowed"
            : highlight
              ? "border-amber-400 bg-amber-100 dark:bg-amber-500/20 shadow-md scale-105"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 hover:shadow active:scale-95"
        }`}
      style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
    >
      <span className="text-lg leading-none">{DIR_LABELS[dir]}</span>
      <span className="text-[8px] text-muted-foreground/50 leading-none mt-0.5">
        {DIR_COMPONENT[dir]}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SVG grid sub-component
// ---------------------------------------------------------------------------

function GridLines() {
  const lines = useMemo(() => {
    const result: React.JSX.Element[] = [];
    for (let i = 0; i <= GRID; i++) {
      const p = PAD + i * CELL;
      result.push(
        <line
          key={`h${i}`}
          x1={PAD}
          y1={p}
          x2={PAD + GRID * CELL}
          y2={p}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={1}
        />,
        <line
          key={`v${i}`}
          x1={p}
          y1={PAD}
          x2={p}
          y2={PAD + GRID * CELL}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={1}
        />,
      );
    }
    return result;
  }, []);
  return <>{lines}</>;
}

// ---------------------------------------------------------------------------
// Octopus token
// ---------------------------------------------------------------------------

function OctopusToken({
  pos,
  color,
  label,
}: {
  pos: Pos;
  color: string;
  label: string;
}) {
  const [cx, cy] = gridToSvg(pos.x, pos.y);
  return (
    <g
      style={{
        transition: "transform 0.3s ease-out",
        transform: `translate(${cx}px, ${cy}px)`,
      }}
    >
      <circle r={14} fill={color} fillOpacity={0.25} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        aria-label={label}
      >
        🐙
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Trail polyline
// ---------------------------------------------------------------------------

function Trail({ path, color }: { path: Pos[]; color: string }) {
  if (path.length < 2) return null;
  const points = path
    .map((p) => gridToSvg(p.x, p.y).join(","))
    .join(" ");
  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={0.6}
    />
  );
}

// ---------------------------------------------------------------------------
// Landmark emoji
// ---------------------------------------------------------------------------

function LandmarkIcon({
  emoji,
  pos,
  label,
  pulse,
}: {
  emoji: string;
  pos: Pos;
  label: string;
  pulse: boolean;
}) {
  const [cx, cy] = gridToSvg(pos.x, pos.y);
  return (
    <g>
      {pulse && (
        <circle
          cx={cx}
          cy={cy}
          r={16}
          fill="none"
          stroke="#eab308"
          strokeWidth={2}
          opacity={0.7}
        >
          <animate
            attributeName="r"
            values="14;22;14"
            dur="1.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.7;0.2;0.7"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        aria-label={label}
      >
        {emoji}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Arrow merge animation overlay
// ---------------------------------------------------------------------------

function ArrowMergeOverlay({
  arrows,
  onDone,
}: {
  arrows: [Direction, Direction];
  onDone: () => void;
}) {
  const [merged, setMerged] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setMerged(true);
      timerRef.current = setTimeout(onDone, 800);
    }, 600);
    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDone]);

  const [v1, v2] = [
    DIRECTION_VECTORS[arrows[0]],
    DIRECTION_VECTORS[arrows[1]],
  ];
  const combined: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-lg font-mono">
      <span
        className="transition-all duration-500"
        style={{
          opacity: merged ? 0 : 1,
          transform: merged ? "translateX(20px)" : "translateX(0)",
        }}
      >
        {DIR_LABELS[arrows[0]]}
      </span>
      <span className="text-muted-foreground">+</span>
      <span
        className="transition-all duration-500"
        style={{
          opacity: merged ? 0 : 1,
          transform: merged ? "translateX(-20px)" : "translateX(0)",
        }}
      >
        {DIR_LABELS[arrows[1]]}
      </span>
      <span className="text-muted-foreground">=</span>
      <span
        className="transition-all duration-500 font-bold text-purple-600 dark:text-purple-400"
        style={{
          opacity: merged ? 1 : 0,
          transform: merged ? "scale(1)" : "scale(0.5)",
        }}
      >
        ({combined[0]},{combined[1]})
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fog overlay
// ---------------------------------------------------------------------------

function FogOverlay({ visible }: { visible: boolean }) {
  return (
    <rect
      x={PAD}
      y={PAD}
      width={GRID * CELL}
      height={GRID * CELL}
      fill="white"
      style={{
        transition: "opacity 0.8s ease-in-out",
        opacity: visible ? 0.55 : 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} ${TEXT.starLabel}`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-2xl transition-all duration-300 ${
            n <= count ? "opacity-100 scale-100" : "opacity-20 scale-75"
          }`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TreasureMap() {
  // -- Phase management --
  const [phase, setPhase] = useState<Phase>(0);
  const [challenge, setChallenge] = useState<Challenge>(1);

  // -- Phase 0: free explore --
  const [octPos, setOctPos] = useState<Pos>(OCTOPUS_START);
  const [trail, setTrail] = useState<Pos[]>([OCTOPUS_START]);
  const [moveCount, setMoveCount] = useState(0);

  // -- Phase 1: challenges --
  const [selectedArrows, setSelectedArrows] = useState<Direction[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [challengeResult, setChallengeResult] = useState<
    "pending" | "success" | "fail"
  >("pending");
  const [fogVisible, setFogVisible] = useState(false);
  const [sliderValue, setSliderValue] = useState(1);

  // -- Phase 2: friend rescue --
  const [friendPos] = useState<Pos>(() => randomFriendPos());
  const [friendCurrent, setFriendCurrent] = useState<Pos | null>(null);
  const [friendTrail, setFriendTrail] = useState<Pos[]>([]);
  const [friendArrows, setFriendArrows] = useState<Direction[]>([]);
  const [friendDone, setFriendDone] = useState(false);
  const [starCount, setStarCount] = useState(0);

  // -- Completion --
  const [showPearl, setShowPearl] = useState(false);

  // -- Bubble text --
  const [bubble, setBubble] = useState<string>(TEXT.phase0Hint);
  const [bubbleMood, setBubbleMood] = useState<
    "happy" | "curious" | "oops" | "celebrate"
  >("curious");

  // Phase 1 target positions
  const phase1Targets = useMemo(
    () => ({
      1: { x: 7, y: 2 } as Pos, // palm tree
      2: { x: 3, y: 6 } as Pos, // cave
      3: { x: 7, y: 4 } as Pos, // scalar target: 3 right from (4,4)
    }),
    [],
  );

  // Pulse target landmark
  const pulseTarget = useMemo<Pos | null>(() => {
    if (phase === 1 && challenge <= 2) return phase1Targets[challenge];
    return null;
  }, [phase, challenge, phase1Targets]);

  // -----------------------------------------------------------------------
  // Phase 0 handlers
  // -----------------------------------------------------------------------

  const handlePhase0Move = useCallback(
    (dir: Direction) => {
      const next = applyDir(octPos, dir);
      if (posEq(next, octPos)) return; // hit boundary, no move
      setOctPos(next);
      setTrail((t) => [...t, next]);
      const newCount = moveCount + 1;
      setMoveCount(newCount);
      if (newCount >= 6) {
        // Transition to phase 1
        setTimeout(() => {
          setPhase(1);
          setFogVisible(true);
          setBubble(TEXT.phase1Fog);
          setBubbleMood("curious");
          setOctPos({ x: 4, y: 4 });
          setTrail([{ x: 4, y: 4 }]);
        }, 400);
      }
    },
    [octPos, moveCount],
  );

  // -----------------------------------------------------------------------
  // Phase 1 handlers
  // -----------------------------------------------------------------------

  const handlePhase1Arrow = useCallback(
    (dir: Direction) => {
      if (challenge === 3) return; // slider challenge, not arrow picking
      if (selectedArrows.length >= 2) return;

      const next = [...selectedArrows, dir];
      setSelectedArrows(next);

      if (next.length === 2) {
        // Show merge animation, then move
        setShowMerge(true);
      }
    },
    [challenge, selectedArrows],
  );

  const handleMergeDone = useCallback(() => {
    setShowMerge(false);
    // Apply combined vector
    const [d1, d2] = selectedArrows;
    const v1 = DIRECTION_VECTORS[d1];
    const v2 = DIRECTION_VECTORS[d2];
    const combined: Pos = {
      x: clampGrid(octPos.x + v1[0] + v2[0]),
      y: clampGrid(octPos.y + v1[1] + v2[1]),
    };
    setOctPos(combined);
    setTrail((t) => [...t, combined]);

    const target = phase1Targets[challenge as 1 | 2];
    const dist = posDist(combined, target);
    if (dist <= 1) {
      setChallengeResult("success");
      setBubble("Tuyệt vời! Đúng rồi!");
      setBubbleMood("celebrate");
      // Advance to next challenge
      setTimeout(() => {
        if (challenge === 1) {
          setChallenge(2);
          setChallengeResult("pending");
          setSelectedArrows([]);
          setOctPos({ x: 4, y: 4 });
          setTrail([{ x: 4, y: 4 }]);
          setBubble(TEXT.phase1Challenge2);
          setBubbleMood("curious");
        } else {
          setChallenge(3);
          setChallengeResult("pending");
          setSelectedArrows([]);
          setOctPos({ x: 4, y: 4 });
          setTrail([{ x: 4, y: 4 }]);
          setBubble(TEXT.phase1Challenge3);
          setBubbleMood("curious");
          setSliderValue(1);
        }
      }, 1200);
    } else {
      setChallengeResult("fail");
      setBubble("Gần lắm rồi! Thử lại nha!");
      setBubbleMood("oops");
      setTimeout(() => {
        setChallengeResult("pending");
        setSelectedArrows([]);
        setOctPos({ x: 4, y: 4 });
        setTrail([{ x: 4, y: 4 }]);
        setBubble(
          challenge === 1 ? TEXT.phase1Fog : TEXT.phase1Challenge2,
        );
        setBubbleMood("curious");
      }, 1200);
    }
  }, [selectedArrows, octPos, phase1Targets, challenge]);

  // Challenge 2: pre-filled down arrow
  const challenge2Arrows = useMemo<Direction[]>(() => {
    if (challenge === 2) return ["down"];
    return [];
  }, [challenge]);

  const handleChallenge2Arrow = useCallback(
    (dir: Direction) => {
      if (challenge !== 2) return;
      // Already have down pre-filled, kid picks the second
      setSelectedArrows(["down", dir]);
      setShowMerge(true);
    },
    [challenge],
  );

  // Challenge 3: scalar multiplication
  const handleSliderApply = useCallback(() => {
    const target = phase1Targets[3];
    const combined: Pos = {
      x: clampGrid(octPos.x + sliderValue),
      y: octPos.y,
    };
    setOctPos(combined);
    setTrail((t) => [...t, combined]);

    const dist = posDist(combined, target);
    if (dist <= 1) {
      setChallengeResult("success");
      setBubble("Siêu giỏi! Mũi tên mạnh hơn rồi!");
      setBubbleMood("celebrate");
      setTimeout(() => {
        // Move to phase 2
        setPhase(2);
        setFogVisible(false);
        setFriendCurrent(friendPos);
        setFriendTrail([friendPos]);
        setFriendArrows([]);
        setBubble(TEXT.phase2Prompt);
        setBubbleMood("curious");
      }, 1200);
    } else {
      setChallengeResult("fail");
      setBubble("Chưa tới! Thử điều chỉnh thanh trượt!");
      setBubbleMood("oops");
      setTimeout(() => {
        setChallengeResult("pending");
        setOctPos({ x: 4, y: 4 });
        setTrail([{ x: 4, y: 4 }]);
        setSliderValue(1);
        setBubble(TEXT.phase1Challenge3);
        setBubbleMood("curious");
      }, 1200);
    }
  }, [sliderValue, octPos, phase1Targets, friendPos]);

  // -----------------------------------------------------------------------
  // Phase 2 handlers
  // -----------------------------------------------------------------------

  const handleFriendMove = useCallback(
    (dir: Direction) => {
      if (friendDone || !friendCurrent) return;
      const next = applyDir(friendCurrent, dir);
      setFriendCurrent(next);
      setFriendTrail((t) => [...t, next]);
      setFriendArrows((a) => [...a, dir]);

      if (posEq(next, HOME)) {
        setFriendDone(true);
        const arrows = friendArrows.length + 1;
        const stars = arrows <= 1 ? 3 : arrows <= 2 ? 2 : 1;
        setStarCount(stars);
        setBubble("Bạn ấy về nhà rồi! Cảm ơn bạn!");
        setBubbleMood("celebrate");
        setTimeout(() => setShowPearl(true), 1500);
      }
    },
    [friendDone, friendCurrent, friendArrows],
  );

  // -----------------------------------------------------------------------
  // Unified arrow handler
  // -----------------------------------------------------------------------

  const handleArrowPress = useCallback(
    (dir: Direction) => {
      if (phase === 0) {
        handlePhase0Move(dir);
      } else if (phase === 1) {
        if (challenge === 2 && selectedArrows.length === 0) {
          handleChallenge2Arrow(dir);
        } else if (challenge !== 3) {
          handlePhase1Arrow(dir);
        }
      } else {
        handleFriendMove(dir);
      }
    },
    [
      phase,
      challenge,
      selectedArrows,
      handlePhase0Move,
      handlePhase1Arrow,
      handleChallenge2Arrow,
      handleFriendMove,
    ],
  );

  // Arrow palette disabled state
  const arrowsDisabled = useMemo(() => {
    if (phase === 1 && challenge === 3) return true;
    if (phase === 1 && selectedArrows.length >= 2) return true;
    if (phase === 2 && friendDone) return true;
    if (showMerge) return true;
    if (challengeResult === "success" || challengeResult === "fail")
      return true;
    return false;
  }, [phase, challenge, selectedArrows, friendDone, showMerge, challengeResult]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-3 pb-8">
      {/* Mascot bubble */}
      <div className="w-full max-w-md px-2">
        <MascotBubble text={bubble} mood={bubbleMood} />
      </div>

      {/* SVG scene */}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width={SVG_SIZE}
        height={SVG_SIZE}
        className="max-w-full rounded-2xl border border-border bg-cyan-50/50 dark:bg-cyan-950/20"
        role="img"
        aria-label="Bản đồ kho báu 10×10"
      >
        {/* Grid lines */}
        <GridLines />

        {/* Home marker (phase 2) */}
        {phase === 2 && (
          <text
            x={gridToSvg(HOME.x, HOME.y)[0]}
            y={gridToSvg(HOME.x, HOME.y)[1]}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            aria-label="Nhà"
          >
            🏠
          </text>
        )}

        {/* Landmarks */}
        {LANDMARKS.map((lm) => (
          <LandmarkIcon
            key={lm.label}
            emoji={lm.emoji}
            pos={lm.pos}
            label={lm.label}
            pulse={pulseTarget !== null && posEq(lm.pos, pulseTarget)}
          />
        ))}

        {/* Phase 1 challenge 3 target marker */}
        {phase === 1 && challenge === 3 && (
          <LandmarkIcon
            emoji="🎯"
            pos={phase1Targets[3]}
            label="Mục tiêu"
            pulse
          />
        )}

        {/* Trail */}
        <Trail path={trail} color={TRAIL_COLOR} />

        {/* Friend trail (phase 2) */}
        {phase === 2 && <Trail path={friendTrail} color={FRIEND_TRAIL_COLOR} />}

        {/* Fog overlay */}
        <FogOverlay visible={fogVisible} />

        {/* Octopus */}
        {phase !== 2 && (
          <OctopusToken pos={octPos} color={OCTOPUS_COLOR} label="Bạch Tuộc" />
        )}

        {/* Friend octopus (phase 2) */}
        {phase === 2 && friendCurrent && (
          <OctopusToken
            pos={friendCurrent}
            color={FRIEND_COLOR}
            label="Bạn Bạch Tuộc"
          />
        )}
      </svg>

      {/* Arrow merge animation (phase 1) */}
      {showMerge && selectedArrows.length === 2 && (
        <ArrowMergeOverlay
          arrows={selectedArrows as [Direction, Direction]}
          onDone={handleMergeDone}
        />
      )}

      {/* Phase 1 challenge info */}
      {phase === 1 && !showMerge && (
        <div className="text-center text-sm text-muted-foreground">
          {challenge === 1 && (
            <p>
              Chọn 2 mũi tên để tới 🌴 ({phase1Targets[1].x},{phase1Targets[1].y})
            </p>
          )}
          {challenge === 2 && (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs font-mono">
                ↓ <span className="text-muted-foreground/60">(0,1)</span>
              </span>
              <span>+</span>
              <span className="text-muted-foreground">?</span>
              <span className="text-xs">→ tới 🕳️</span>
            </div>
          )}
          {challenge === 3 && (
            <p>
              Dùng mũi tên → với sức mạnh ×{sliderValue} để tới 🎯
            </p>
          )}
        </div>
      )}

      {/* Phase 1 Challenge 3: Strength slider */}
      {phase === 1 && challenge === 3 && !showMerge && (
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <div className="flex items-center gap-3 w-full">
            <span className="text-lg">→</span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none bg-purple-200 dark:bg-purple-800 accent-purple-500 cursor-pointer"
              aria-label="Sức mạnh mũi tên"
            />
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 w-8 text-center">
              ×{sliderValue}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>→ × {sliderValue} = ({sliderValue},0)</span>
          </div>
          <button
            type="button"
            onClick={handleSliderApply}
            disabled={challengeResult !== "pending"}
            className="rounded-full bg-purple-500 px-5 py-1.5 text-sm font-bold text-white hover:bg-purple-400 active:scale-95 transition-all disabled:opacity-40"
          >
            Bắn mũi tên!
          </button>
        </div>
      )}

      {/* Selected arrows display (phase 1 challenges 1&2) */}
      {phase === 1 && challenge <= 2 && selectedArrows.length > 0 && !showMerge && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Đã chọn:</span>
          {selectedArrows.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 text-xs font-mono"
            >
              {DIR_LABELS[a]}
            </span>
          ))}
        </div>
      )}

      {/* Arrow palette */}
      {(phase === 0 || (phase === 1 && challenge <= 2) || phase === 2) && (
        <div className="grid grid-cols-8 gap-1.5 max-w-[380px]">
          {ALL_DIRS.map((dir) => (
            <ArrowButton
              key={dir}
              dir={dir}
              onPress={handleArrowPress}
              disabled={arrowsDisabled}
              highlight={
                phase === 1 &&
                challenge === 2 &&
                selectedArrows.length === 0 &&
                dir !== "down"
                  ? false
                  : false
              }
            />
          ))}
        </div>
      )}

      {/* Phase 2 star rating */}
      {phase === 2 && friendDone && (
        <div className="flex flex-col items-center gap-2">
          <StarRating count={starCount} />
          <p className="text-sm text-muted-foreground">
            {friendArrows.length} mũi tên dùng
          </p>
        </div>
      )}

      {/* Pearl reveal */}
      {showPearl && (
        <PearlReveal
          topicSlug="nhi-treasure-map"
          onClose={() => setShowPearl(false)}
        />
      )}
    </div>
  );
}
