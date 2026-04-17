"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreatureColor = "red" | "blue" | "green";
type CreatureSize = "small" | "medium" | "large";
type CreaturePattern = "spots" | "stripes" | "plain";
type Phase = 0 | 1 | 2;
type Spotlight = "color" | "size" | "pattern" | null;

interface GardenCreature {
  id: number;
  color: CreatureColor;
  size: CreatureSize;
  pattern: CreaturePattern;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SVG_W = 400;
const SVG_H = 450;
const FENCE_Y = 225;
const FENCE_X = 200;
const PROXIMITY = 50;
const DRAG_THRESHOLD = 8;

const RADIUS: Record<CreatureSize, number> = { small: 14, medium: 18, large: 22 };

const COLOR_HEX: Record<CreatureColor, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
};

const TEXT = {
  introText: "Vườn sinh vật đầy những bạn nhỏ dễ thương! Kéo chúng quanh vườn xem nào!",
  phase1Prompt: "Bão sắp tới! Giúp mình chia nhóm để trú ẩn nha!",
  phase1Round2: "Nhóm này vẫn quá đông! Chia thêm nha!",
  phase2Prompt: "Bạn mới tới! Nó thuộc nhóm nào?",
  phase2Correct: "Đúng rồi! Bạn ấy vui lắm!",
  phase2Wrong: "Hmm, thử nhìn lại đặc điểm nha!",
  spotlightColor: "Màu sắc",
  spotlightSize: "Kích thước",
  spotlightPattern: "Hoa văn",
} as const;

// ---------------------------------------------------------------------------
// Balanced creature generation
// ---------------------------------------------------------------------------

function generateCreatures(): GardenCreature[] {
  const colors: CreatureColor[] = [
    "red", "red", "red", "red", "red", "red",
    "blue", "blue", "blue", "blue", "blue",
    "green", "green", "green", "green", "green",
  ];
  const sizes: CreatureSize[] = [
    "small", "small", "small", "small", "small",
    "medium", "medium", "medium", "medium", "medium", "medium",
    "large", "large", "large", "large", "large",
  ];
  const patterns: CreaturePattern[] = [
    "spots", "spots", "spots", "spots", "spots", "spots",
    "stripes", "stripes", "stripes", "stripes", "stripes",
    "plain", "plain", "plain", "plain", "plain",
  ];

  // Fisher-Yates shuffle helper
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sc = shuffle(colors);
  const ss = shuffle(sizes);
  const sp = shuffle(patterns);

  const PAD = 40;
  return Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    color: sc[i],
    size: ss[i],
    pattern: sp[i],
    x: PAD + Math.random() * (SVG_W - PAD * 2),
    y: PAD + Math.random() * (SVG_H - PAD * 2),
  }));
}

// ---------------------------------------------------------------------------
// Purity calculation helpers
// ---------------------------------------------------------------------------

/** Returns purity for a 2-zone horizontal split at FENCE_Y. */
function calcPurity2(creatures: GardenCreature[]): number {
  const above = creatures.filter((c) => c.y < FENCE_Y);
  const below = creatures.filter((c) => c.y >= FENCE_Y);
  if (above.length === 0 || below.length === 0) return 0;

  // Try every assignment of 3 colors to 2 zones and pick the best
  const colors: CreatureColor[] = ["red", "blue", "green"];
  let best = 0;
  for (let mask = 0; mask < 8; mask++) {
    // mask bits: 0=above, 1=below for each color
    const aboveColors = colors.filter((_, i) => ((mask >> i) & 1) === 0);
    const belowColors = colors.filter((_, i) => ((mask >> i) & 1) === 1);
    if (aboveColors.length === 0 || belowColors.length === 0) continue;
    const correctAbove = above.filter((c) => aboveColors.includes(c.color)).length;
    const correctBelow = below.filter((c) => belowColors.includes(c.color)).length;
    const purity = (correctAbove + correctBelow) / creatures.length;
    if (purity > best) best = purity;
  }
  return best;
}

/** Returns purity for a 4-quadrant split at (FENCE_X, FENCE_Y). */
function calcPurity4(creatures: GardenCreature[]): number {
  const quads = [
    creatures.filter((c) => c.x < FENCE_X && c.y < FENCE_Y),
    creatures.filter((c) => c.x >= FENCE_X && c.y < FENCE_Y),
    creatures.filter((c) => c.x < FENCE_X && c.y >= FENCE_Y),
    creatures.filter((c) => c.x >= FENCE_X && c.y >= FENCE_Y),
  ];

  // For each quadrant, count the most common color
  let correct = 0;
  for (const q of quads) {
    if (q.length === 0) continue;
    const counts: Record<string, number> = {};
    for (const c of q) counts[c.color] = (counts[c.color] ?? 0) + 1;
    correct += Math.max(...Object.values(counts));
  }
  return correct / creatures.length;
}

/** Determine the dominant color per quadrant for mystery placement. */
function getQuadDominant(creatures: GardenCreature[]): Record<number, CreatureColor> {
  const quads: GardenCreature[][] = [
    creatures.filter((c) => c.x < FENCE_X && c.y < FENCE_Y),
    creatures.filter((c) => c.x >= FENCE_X && c.y < FENCE_Y),
    creatures.filter((c) => c.x < FENCE_X && c.y >= FENCE_Y),
    creatures.filter((c) => c.x >= FENCE_X && c.y >= FENCE_Y),
  ];
  const result: Record<number, CreatureColor> = {};
  quads.forEach((q, i) => {
    if (q.length === 0) return;
    const counts: Partial<Record<CreatureColor, number>> = {};
    for (const c of q) counts[c.color] = (counts[c.color] ?? 0) + 1;
    let best: CreatureColor = "red";
    let bestN = 0;
    for (const [col, n] of Object.entries(counts)) {
      if ((n ?? 0) > bestN) {
        best = col as CreatureColor;
        bestN = n ?? 0;
      }
    }
    result[i] = best;
  });
  return result;
}

function getQuadIndex(x: number, y: number): number {
  if (x < FENCE_X && y < FENCE_Y) return 0;
  if (x >= FENCE_X && y < FENCE_Y) return 1;
  if (x < FENCE_X && y >= FENCE_Y) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Creature SVG renderer
// ---------------------------------------------------------------------------

function CreatureSVG({
  creature,
  spotlight,
  dimmed,
}: {
  creature: GardenCreature;
  spotlight: Spotlight;
  dimmed?: boolean;
}) {
  const r = RADIUS[creature.size];
  const fill = COLOR_HEX[creature.color];
  const opacity = dimmed ? 0.25 : 1;

  // Spotlight fading: when a spotlight is active, dim non-relevant features
  const colorOpacity = spotlight !== null && spotlight !== "color" ? 0.4 : 1;
  const patternOpacity = spotlight !== null && spotlight !== "pattern" ? 0.3 : 1;

  return (
    <g opacity={opacity}>
      {/* Body circle */}
      <circle
        r={r}
        fill={fill}
        opacity={colorOpacity}
        stroke={fill}
        strokeWidth={1.5}
      />
      {/* Eyes */}
      <circle cx={-r * 0.28} cy={-r * 0.2} r={r * 0.18} fill="white" />
      <circle cx={r * 0.28} cy={-r * 0.2} r={r * 0.18} fill="white" />
      <circle cx={-r * 0.22} cy={-r * 0.2} r={r * 0.09} fill="#1e293b" />
      <circle cx={r * 0.34} cy={-r * 0.2} r={r * 0.09} fill="#1e293b" />
      {/* Smile */}
      <path
        d={`M ${-r * 0.2} ${r * 0.15} Q 0 ${r * 0.35} ${r * 0.2} ${r * 0.15}`}
        fill="none"
        stroke="#1e293b"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Pattern decorations */}
      {creature.pattern === "spots" && (
        <g opacity={patternOpacity}>
          <circle cx={-r * 0.45} cy={r * 0.35} r={r * 0.12} fill="white" opacity={0.6} />
          <circle cx={r * 0.5} cy={-r * 0.45} r={r * 0.1} fill="white" opacity={0.6} />
          <circle cx={r * 0.15} cy={r * 0.5} r={r * 0.1} fill="white" opacity={0.6} />
          <circle cx={-r * 0.35} cy={-r * 0.5} r={r * 0.08} fill="white" opacity={0.5} />
        </g>
      )}
      {creature.pattern === "stripes" && (
        <g opacity={patternOpacity}>
          <line
            x1={-r * 0.6} y1={0}
            x2={r * 0.6} y2={0}
            stroke="white" strokeWidth={1.5} opacity={0.5} strokeLinecap="round"
          />
          <line
            x1={-r * 0.45} y1={r * 0.35}
            x2={r * 0.45} y2={r * 0.35}
            stroke="white" strokeWidth={1.2} opacity={0.4} strokeLinecap="round"
          />
          <line
            x1={-r * 0.45} y1={-r * 0.4}
            x2={r * 0.45} y2={-r * 0.4}
            stroke="white" strokeWidth={1.2} opacity={0.4} strokeLinecap="round"
          />
        </g>
      )}
      {/* Plain has no extra decoration */}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Match meter bar
// ---------------------------------------------------------------------------

function MatchMeter({ purity }: { purity: number }) {
  const pct = Math.round(purity * 100);
  const barColor = pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2 mt-2 px-2" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Mức phân nhóm: ${pct}%`}>
      <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
        Nhóm: {pct}%
      </span>
      <svg width="100%" height="16" className="flex-1">
        <rect x={0} y={2} width="100%" height={12} rx={6} fill="#e5e7eb" />
        <rect
          x={0}
          y={2}
          width={`${pct}%`}
          height={12}
          rx={6}
          fill={barColor}
          style={{ transition: "width 0.4s ease" }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CreatureGarden() {
  // Core state
  const [creatures, setCreatures] = useState<GardenCreature[]>(() => generateCreatures());
  const [phase, setPhase] = useState<Phase>(0);
  const [round, setRound] = useState(1); // 1 or 2 within phase 1
  const [spotlight, setSpotlight] = useState<Spotlight>(null);
  const [dragCount, setDragCount] = useState(0);

  // Phase 1+2 state
  const [showClouds, setShowClouds] = useState(false);
  const [showHFence, setShowHFence] = useState(false);
  const [showVFence, setShowVFence] = useState(false);

  // Phase 2 — mystery creature
  const [mysteryCreature, setMysteryCreature] = useState<GardenCreature | null>(null);
  const [mysteryPlaced, setMysteryPlaced] = useState(false);
  const [mysteryFeedback, setMysteryFeedback] = useState<"correct" | "wrong" | null>(null);

  // Bubble text
  const [bubbleText, setBubbleText] = useState<string>(TEXT.introText);
  const [bubbleMood, setBubbleMood] = useState<"happy" | "curious" | "oops" | "celebrate">("curious");
  const [showPearl, setShowPearl] = useState(false);

  // Drag state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ---------------------------------------------------------------------------
  // SVG coordinate helper
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

  // ---------------------------------------------------------------------------
  // Glow lines between same-color nearby creatures (Phase 0)
  // ---------------------------------------------------------------------------

  const glowLines = useMemo(() => {
    if (phase !== 0) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
    for (let i = 0; i < creatures.length; i++) {
      for (let j = i + 1; j < creatures.length; j++) {
        const a = creatures[i];
        const b = creatures[j];
        if (a.color !== b.color) continue;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < PROXIMITY) {
          lines.push({
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            color: COLOR_HEX[a.color],
          });
        }
      }
    }
    return lines;
  }, [creatures, phase]);

  // ---------------------------------------------------------------------------
  // Purity calculations
  // ---------------------------------------------------------------------------

  const purity = useMemo(() => {
    if (phase !== 1) return 0;
    if (round === 1) return calcPurity2(creatures);
    return calcPurity4(creatures);
  }, [creatures, phase, round]);

  // ---------------------------------------------------------------------------
  // Phase transitions
  // ---------------------------------------------------------------------------

  const advanceToPhase1 = useCallback(() => {
    setPhase(1);
    setShowClouds(true);
    setShowHFence(true);
    setBubbleText(TEXT.phase1Prompt);
    setBubbleMood("curious");
  }, []);

  const advanceToRound2 = useCallback(() => {
    setRound(2);
    setShowVFence(true);
    setBubbleText(TEXT.phase1Round2);
    setBubbleMood("curious");
  }, []);

  const advanceToPhase2 = useCallback(() => {
    setPhase(2);
    // Create mystery creature: blue + medium + stripes
    setMysteryCreature({
      id: 99,
      color: "blue",
      size: "medium",
      pattern: "stripes",
      x: SVG_W + 30,
      y: SVG_H / 2,
    });
    setBubbleText(TEXT.phase2Prompt);
    setBubbleMood("curious");
    // Slide in after a short delay
    setTimeout(() => {
      setMysteryCreature((prev) =>
        prev ? { ...prev, x: SVG_W - 40 } : prev,
      );
    }, 100);
  }, []);

  // Check auto-advance conditions after drag
  const checkAdvance = useCallback(
    (newDragCount: number) => {
      if (phase === 0 && newDragCount >= DRAG_THRESHOLD) {
        advanceToPhase1();
      }
    },
    [phase, advanceToPhase1],
  );

  // Check purity for auto-advance within phase 1
  const checkPurityAdvance = useCallback(
    (newCreatures: GardenCreature[]) => {
      if (phase !== 1) return;
      if (round === 1) {
        const p = calcPurity2(newCreatures);
        if (p > 0.7) {
          advanceToRound2();
        }
      } else if (round === 2) {
        const p = calcPurity4(newCreatures);
        if (p > 0.6) {
          advanceToPhase2();
        }
      }
    },
    [phase, round, advanceToRound2, advanceToPhase2],
  );

  // ---------------------------------------------------------------------------
  // Mystery creature placement check
  // ---------------------------------------------------------------------------

  const checkMysteryPlacement = useCallback(
    (mx: number, my: number) => {
      if (!mysteryCreature) return;
      const quadDom = getQuadDominant(creatures);
      const placedQuad = getQuadIndex(mx, my);
      const dominantColor = quadDom[placedQuad];

      if (dominantColor === mysteryCreature.color) {
        setMysteryFeedback("correct");
        setMysteryPlaced(true);
        setBubbleText(TEXT.phase2Correct);
        setBubbleMood("celebrate");
        setTimeout(() => setShowPearl(true), 1200);
      } else {
        setMysteryFeedback("wrong");
        setBubbleText(TEXT.phase2Wrong);
        setBubbleMood("oops");
        // Allow retry after shake
        setTimeout(() => setMysteryFeedback(null), 800);
      }
    },
    [mysteryCreature, creatures],
  );

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: number) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraggedId(id);
      const pt = getSVGPoint(e.clientX, e.clientY);
      setDragStartPos(pt);
    },
    [getSVGPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggedId === null) return;
      e.preventDefault();
      const pt = getSVGPoint(e.clientX, e.clientY);
      const clampedX = Math.max(20, Math.min(SVG_W - 20, pt.x));
      const clampedY = Math.max(20, Math.min(SVG_H - 20, pt.y));

      if (draggedId === 99 && mysteryCreature) {
        setMysteryCreature((prev) =>
          prev ? { ...prev, x: clampedX, y: clampedY } : prev,
        );
      } else {
        setCreatures((prev) =>
          prev.map((c) =>
            c.id === draggedId ? { ...c, x: clampedX, y: clampedY } : c,
          ),
        );
      }
    },
    [draggedId, mysteryCreature, getSVGPoint],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggedId === null) return;
      e.preventDefault();

      const endPt = getSVGPoint(e.clientX, e.clientY);
      const didDrag =
        dragStartPos !== null &&
        Math.hypot(endPt.x - dragStartPos.x, endPt.y - dragStartPos.y) > 5;

      if (didDrag) {
        if (draggedId === 99 && mysteryCreature && !mysteryPlaced) {
          checkMysteryPlacement(mysteryCreature.x, mysteryCreature.y);
        } else {
          const newCount = dragCount + 1;
          setDragCount(newCount);
          checkAdvance(newCount);
          // Check purity advance with current creatures state
          setCreatures((current) => {
            checkPurityAdvance(current);
            return current;
          });
        }
      }

      setDraggedId(null);
      setDragStartPos(null);
    },
    [
      draggedId,
      dragStartPos,
      dragCount,
      mysteryCreature,
      mysteryPlaced,
      checkAdvance,
      checkPurityAdvance,
      checkMysteryPlacement,
      getSVGPoint,
    ],
  );

  // ---------------------------------------------------------------------------
  // Spotlight toggle
  // ---------------------------------------------------------------------------

  const toggleSpotlight = useCallback(
    (s: Spotlight) => {
      setSpotlight((prev) => (prev === s ? null : s));
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-2 pb-6">
      {/* Feature spotlight buttons (Phase 0 only) */}
      {phase === 0 && (
        <div className="flex gap-2 mb-1">
          {(["color", "size", "pattern"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpotlight(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors min-h-[44px] min-w-[44px] ${
                spotlight === s
                  ? "bg-amber-400 text-amber-900"
                  : "bg-white/80 dark:bg-slate-800 text-foreground border border-border hover:bg-amber-100 dark:hover:bg-amber-900/20"
              }`}
              aria-pressed={spotlight === s}
            >
              {s === "color"
                ? TEXT.spotlightColor
                : s === "size"
                  ? TEXT.spotlightSize
                  : TEXT.spotlightPattern}
            </button>
          ))}
        </div>
      )}

      {/* Mascot bubble */}
      <div className="w-full max-w-md px-2">
        <MascotBubble text={bubbleText} mood={bubbleMood} autoSpeak={false} />
      </div>

      {/* SVG garden scene */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-md touch-none select-none"
        style={{ aspectRatio: `${SVG_W}/${SVG_H}` }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label="Vườn sinh vật — kéo thả để phân nhóm"
      >
        {/* Garden background */}
        <rect width={SVG_W} height={SVG_H} rx={16} fill="#dcfce7" />
        {/* Grass tufts */}
        <circle cx={30} cy={430} r={8} fill="#86efac" opacity={0.5} />
        <circle cx={370} cy={420} r={10} fill="#86efac" opacity={0.4} />
        <circle cx={200} cy={440} r={7} fill="#86efac" opacity={0.5} />
        <circle cx={80} cy={25} r={6} fill="#86efac" opacity={0.4} />
        <circle cx={320} cy={30} r={9} fill="#86efac" opacity={0.5} />

        {/* Storm clouds (Phase 1+) */}
        {showClouds && (
          <g opacity={0.6}>
            <ellipse cx={80} cy={25} rx={50} ry={18} fill="#94a3b8" />
            <ellipse cx={160} cy={18} rx={60} ry={22} fill="#64748b" />
            <ellipse cx={260} cy={22} rx={55} ry={20} fill="#94a3b8" />
            <ellipse cx={340} cy={28} rx={45} ry={16} fill="#64748b" />
          </g>
        )}

        {/* Horizontal fence (Phase 1+) */}
        {showHFence && (
          <g>
            <line
              x1={10}
              y1={FENCE_Y}
              x2={SVG_W - 10}
              y2={FENCE_Y}
              stroke="#92400e"
              strokeWidth={3}
              strokeDasharray="10 5"
            />
            {/* Fence posts */}
            {[40, 120, 200, 280, 360].map((fx) => (
              <rect
                key={fx}
                x={fx - 3}
                y={FENCE_Y - 8}
                width={6}
                height={16}
                rx={2}
                fill="#a16207"
              />
            ))}
          </g>
        )}

        {/* Vertical fence (Round 2+) */}
        {showVFence && (
          <g>
            <line
              x1={FENCE_X}
              y1={10}
              x2={FENCE_X}
              y2={SVG_H - 10}
              stroke="#92400e"
              strokeWidth={3}
              strokeDasharray="10 5"
            />
            {[60, 140, 225, 310, 390].map((fy) => (
              <rect
                key={fy}
                x={FENCE_X - 8}
                y={fy - 3}
                width={16}
                height={6}
                rx={2}
                fill="#a16207"
              />
            ))}
          </g>
        )}

        {/* Glow lines between same-color nearby creatures */}
        {glowLines.map((line, i) => (
          <line
            key={`glow-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth={2}
            opacity={0.4}
            strokeLinecap="round"
          />
        ))}

        {/* Creatures */}
        {creatures.map((c) => {
          const isDragging = draggedId === c.id;
          return (
            <g
              key={c.id}
              transform={`translate(${c.x},${c.y})`}
              style={{
                cursor: "grab",
                transition: isDragging ? "none" : "transform 0.15s ease",
              }}
              onPointerDown={(e) => handlePointerDown(e, c.id)}
            >
              {/* Invisible touch target (44px min) */}
              <rect
                x={-22}
                y={-22}
                width={44}
                height={44}
                fill="transparent"
              />
              {/* Floating animation wrapper */}
              <g
                style={
                  !isDragging && phase === 0
                    ? {
                        animation: `creature-float ${2 + (c.id % 3) * 0.5}s ease-in-out infinite`,
                        animationDelay: `${(c.id * 0.3) % 2}s`,
                      }
                    : undefined
                }
              >
                <CreatureSVG
                  creature={c}
                  spotlight={phase === 0 ? spotlight : null}
                />
              </g>
              {isDragging && (
                <circle
                  r={RADIUS[c.size] + 4}
                  fill="none"
                  stroke={COLOR_HEX[c.color]}
                  strokeWidth={2}
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}

        {/* Mystery creature (Phase 2) */}
        {mysteryCreature && (
          <g
            transform={`translate(${mysteryCreature.x},${mysteryCreature.y})`}
            style={{
              cursor: mysteryPlaced ? "default" : "grab",
              transition:
                draggedId === 99 ? "none" : "transform 0.5s ease",
            }}
            onPointerDown={
              !mysteryPlaced
                ? (e) => handlePointerDown(e, 99)
                : undefined
            }
          >
            <rect x={-22} y={-22} width={44} height={44} fill="transparent" />
            <g
              className={
                mysteryFeedback === "wrong" ? "animate-shake" : undefined
              }
            >
              <CreatureSVG creature={mysteryCreature} spotlight={null} />
              {/* Question mark label */}
              {!mysteryPlaced && (
                <text
                  y={-RADIUS[mysteryCreature.size] - 6}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill="#1e293b"
                >
                  ?
                </text>
              )}
              {/* Green glow when correctly placed */}
              {mysteryFeedback === "correct" && (
                <circle
                  r={RADIUS[mysteryCreature.size] + 6}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={3}
                  opacity={0.7}
                >
                  <animate
                    attributeName="r"
                    from={String(RADIUS[mysteryCreature.size] + 4)}
                    to={String(RADIUS[mysteryCreature.size] + 12)}
                    dur="1s"
                    repeatCount="3"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.7"
                    to="0"
                    dur="1s"
                    repeatCount="3"
                  />
                </circle>
              )}
            </g>
            {/* Dotted lines to nearest neighbors when correct */}
            {mysteryFeedback === "correct" &&
              creatures
                .filter((c) => c.color === mysteryCreature.color)
                .slice(0, 3)
                .map((c) => (
                  <line
                    key={`nn-${c.id}`}
                    x1={0}
                    y1={0}
                    x2={c.x - mysteryCreature.x}
                    y2={c.y - mysteryCreature.y}
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    opacity={0.6}
                  />
                ))}
          </g>
        )}
      </svg>

      {/* Match meter (Phase 1) */}
      {phase === 1 && <MatchMeter purity={purity} />}

      {/* CSS animations */}
      <style>{`
        @keyframes creature-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>

      {/* Pearl reveal */}
      {showPearl && (
        <PearlReveal
          topicSlug="nhi-creature-garden"
          onClose={() => setShowPearl(false)}
        />
      )}
    </div>
  );
}
