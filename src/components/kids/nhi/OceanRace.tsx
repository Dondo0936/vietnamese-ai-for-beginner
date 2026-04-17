"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import MascotBubble from "@/components/kids/nhi/MascotBubble";
import PearlReveal from "@/components/kids/nhi/PearlReveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 0 | 1 | 2;
type BubbleMood = "happy" | "curious" | "oops" | "celebrate";

interface TrackPoint {
  x: number;
  y: number;
}

interface SpeedPoint {
  x: number;
  speed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SVG_W = 400;
const SVG_H = 450;

/** Track area */
const TRACK_TOP = 30;
const TRACK_BOTTOM = 210;
const TRACK_LEFT = 20;
const TRACK_RIGHT = 380;

/** Speedometer area */
const GAUGE_CX = 100;
const GAUGE_CY = 340;
const GAUGE_R = 60;

/** Mini derivative graph area */
const GRAPH_LEFT = 190;
const GRAPH_RIGHT = 385;
const GRAPH_TOP = 270;
const GRAPH_BOTTOM = 420;

const NUM_TRACK_POINTS = 60;

const TEXT = {
  introText:
    "Đường đua đại dương! Xem Bạch Tuộc lướt sóng nhanh cỡ nào!",
  startButton: "Bắt đầu!",
  phase0Hint:
    "Kéo Bạch Tuộc dọc đường đua — nhìn đồng hồ tốc độ nha!",
  phase1FlagPrompt:
    "Chỗ nào mình chạy NHANH NHẤT? Kéo cờ đỏ tới đó!",
  phase1FlagCorrect: "Đúng rồi! Dốc nhất = nhanh nhất!",
  phase1GraphPrompt:
    "Nhìn biểu đồ tốc độ — đường đua nào phù hợp?",
  phase1StopPrompt:
    "Tìm chỗ mình ĐỨNG YÊN! Tốc độ bằng 0 ở đâu?",
  phase2Prompt: "Vẽ đường đua riêng của bạn!",
  phase2Run: "Chạy!",
  phase2AccelerateChallenge:
    "Thử vẽ đường mà Bạch Tuộc tăng tốc suốt!",
  speedLabel: "Tốc độ",
} as const;

/** Tolerance for flag/stop challenges as fraction of track width */
const FLAG_TOLERANCE = 0.15;
const STOP_TOLERANCE = 0.10;

/** Animation duration for the race in ms */
const RACE_DURATION = 4000;

// ---------------------------------------------------------------------------
// Track generation
// ---------------------------------------------------------------------------

function generateTrackPoints(): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i < NUM_TRACK_POINTS; i++) {
    const t = i / (NUM_TRACK_POINTS - 1);
    const x = TRACK_LEFT + t * (TRACK_RIGHT - TRACK_LEFT);
    // y = 120 - 50*sin(t*pi*2.5) - 25*cos(t*pi*1.5)
    // Creates 2-3 hills and valleys
    const yCenter = (TRACK_TOP + TRACK_BOTTOM) / 2;
    const amplitude1 = 55;
    const amplitude2 = 28;
    const y =
      yCenter -
      amplitude1 * Math.sin(t * Math.PI * 2.5) -
      amplitude2 * Math.cos(t * Math.PI * 1.5);
    points.push({ x, y });
  }
  return points;
}

/** Compute speed (negative SVG slope) for each point */
function computeSpeeds(pts: TrackPoint[]): SpeedPoint[] {
  const speeds: SpeedPoint[] = [];
  for (let i = 0; i < pts.length; i++) {
    let slope: number;
    if (i === 0) {
      slope =
        (pts[1].y - pts[0].y) / (pts[1].x - pts[0].x);
    } else if (i === pts.length - 1) {
      slope =
        (pts[i].y - pts[i - 1].y) / (pts[i].x - pts[i - 1].x);
    } else {
      slope =
        (pts[i + 1].y - pts[i - 1].y) / (pts[i + 1].x - pts[i - 1].x);
    }
    // Negative because SVG y-axis is inverted: going "downhill" in SVG = moving down = positive slope
    speeds.push({ x: pts[i].x, speed: -slope });
  }
  return speeds;
}

/** Normalize speeds to 0-100 range */
function normalizeSpeeds(speeds: SpeedPoint[]): SpeedPoint[] {
  const rawSpeeds = speeds.map((s) => s.speed);
  const minS = Math.min(...rawSpeeds);
  const maxS = Math.max(...rawSpeeds);
  const range = maxS - minS || 1;
  return speeds.map((s) => ({
    x: s.x,
    speed: ((s.speed - minS) / range) * 100,
  }));
}

/** Build SVG path from points using smooth quadratic curves */
function pointsToSvgPath(pts: TrackPoint[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Get the index corresponding to a normalized t (0-1) value */
function tToIndex(t: number, count: number): number {
  return Math.round(Math.max(0, Math.min(1, t)) * (count - 1));
}

/** Find the closest track index for an x coordinate */
function xToTrackIndex(x: number, pts: TrackPoint[]): number {
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const dist = Math.abs(pts[i].x - x);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

// ---------------------------------------------------------------------------
// Alternative tracks for Phase 1 Challenge 2
// ---------------------------------------------------------------------------

function generateAltTrack(variant: number): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i < NUM_TRACK_POINTS; i++) {
    const t = i / (NUM_TRACK_POINTS - 1);
    const x = TRACK_LEFT + t * (TRACK_RIGHT - TRACK_LEFT);
    const yCenter = (TRACK_TOP + TRACK_BOTTOM) / 2;
    let y: number;
    if (variant === 0) {
      // Gentle wave — mostly flat
      y = yCenter - 20 * Math.sin(t * Math.PI * 2);
    } else {
      // Sharp zigzag — very steep
      y =
        yCenter -
        70 * Math.sin(t * Math.PI * 4) * (1 - t * 0.5);
    }
    points.push({ x, y });
  }
  return points;
}

/** Generate a mini thumbnail path for a track in a small bounding box */
function trackToMiniPath(
  pts: TrackPoint[],
  bx: number,
  by: number,
  bw: number,
  bh: number,
): string {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaled = pts.map((p) => ({
    x: bx + ((p.x - minX) / rangeX) * bw,
    y: by + ((p.y - minY) / rangeY) * bh,
  }));
  return pointsToSvgPath(scaled);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OceanRace() {
  // Phase state
  const [phase, setPhase] = useState<Phase>(0);
  const [bubbleText, setBubbleText] = useState<string>(TEXT.phase0Hint);
  const [bubbleMood, setBubbleMood] = useState<BubbleMood>("curious");
  const [showPearl, setShowPearl] = useState(false);

  // Track data (memoized)
  const trackPoints = useMemo(generateTrackPoints, []);
  const rawSpeeds = useMemo(() => computeSpeeds(trackPoints), [trackPoints]);
  const speeds = useMemo(() => normalizeSpeeds(rawSpeeds), [rawSpeeds]);
  const trackPath = useMemo(
    () => pointsToSvgPath(trackPoints),
    [trackPoints],
  );

  // Phase 0 state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [hasRaced, setHasRaced] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [dragCount, setDragCount] = useState(0);
  const [drawnGraphIndex, setDrawnGraphIndex] = useState(0);
  const animRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingOctopus = useRef(false);

  // Phase 1 state
  const [challenge, setChallenge] = useState(0); // 0, 1, 2
  const [flagIndex, setFlagIndex] = useState(Math.floor(NUM_TRACK_POINTS / 2));
  const isDraggingFlag = useRef(false);
  const [flagPlaced, setFlagPlaced] = useState(false);
  const [challenge2Answer, setChallenge2Answer] = useState<number | null>(null);
  const [challenge2Correct, setChallenge2Correct] = useState(false);
  const [stopPoints, setStopPoints] = useState<number[]>([]);
  const [challenge3Done, setChallenge3Done] = useState(false);

  // Phase 2 state
  const [customPoints, setCustomPoints] = useState<TrackPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customRaced, setCustomRaced] = useState(false);
  const [customIndex, setCustomIndex] = useState(0);
  const [isCustomRacing, setIsCustomRacing] = useState(false);
  const [customDrawnIndex, setCustomDrawnIndex] = useState(0);

  // Alt tracks for challenge 2 (randomize order once)
  const [altTracksOrder] = useState<number[]>(() => {
    // 0 = original (correct), 1 = gentle, 2 = sharp
    const arr = [0, 1, 2];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const altTracks = useMemo(() => {
    return [trackPoints, generateAltTrack(0), generateAltTrack(1)];
  }, [trackPoints]);

  // Compute max-speed and zero-speed indices for challenges
  const maxSpeedIndex = useMemo(() => {
    let maxI = 0;
    let maxV = -Infinity;
    for (let i = 0; i < speeds.length; i++) {
      if (speeds[i].speed > maxV) {
        maxV = speeds[i].speed;
        maxI = i;
      }
    }
    return maxI;
  }, [speeds]);

  const zeroSpeedIndices = useMemo(() => {
    // Find local min/max of the track (where slope crosses zero)
    const indices: number[] = [];
    for (let i = 2; i < rawSpeeds.length - 2; i++) {
      const prev = rawSpeeds[i - 1].speed;
      const curr = rawSpeeds[i].speed;
      const next = rawSpeeds[i + 1].speed;
      if ((prev > 0 && next < 0) || (prev < 0 && next > 0) || Math.abs(curr) < 0.02) {
        // Only add if not too close to an existing one
        if (indices.length === 0 || i - indices[indices.length - 1] > 5) {
          indices.push(i);
        }
      }
    }
    return indices;
  }, [rawSpeeds]);

  // Custom track speeds
  const customSpeeds = useMemo(() => {
    if (customPoints.length < 3) return [];
    return normalizeSpeeds(computeSpeeds(customPoints));
  }, [customPoints]);

  const customTrackPath = useMemo(() => {
    if (customPoints.length < 2) return "";
    return pointsToSvgPath(customPoints);
  }, [customPoints]);

  // ---------------------------------------------------------------------------
  // Phase transitions
  // ---------------------------------------------------------------------------

  const advanceToPhase1 = useCallback(() => {
    setPhase(1);
    setChallenge(0);
    setBubbleText(TEXT.phase1FlagPrompt);
    setBubbleMood("curious");
  }, []);

  const advanceToPhase2 = useCallback(() => {
    setPhase(2);
    setBubbleText(TEXT.phase2Prompt);
    setBubbleMood("happy");
  }, []);

  // Check phase 0 → phase 1 transition
  useEffect(() => {
    if (phase !== 0) return;
    if (runCount >= 3 || dragCount >= 15) {
      advanceToPhase1();
    }
  }, [phase, runCount, dragCount, advanceToPhase1]);

  // ---------------------------------------------------------------------------
  // Phase 0: Race animation
  // ---------------------------------------------------------------------------

  const startRace = useCallback(() => {
    if (isRacing) return;
    setIsRacing(true);
    setDrawnGraphIndex(0);
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / RACE_DURATION, 1);
      const idx = tToIndex(t, trackPoints.length);
      setCurrentIndex(idx);
      setDrawnGraphIndex(idx);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsRacing(false);
        setHasRaced(true);
        setRunCount((c) => c + 1);
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, [isRacing, trackPoints.length]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Phase 0: Octopus dragging
  // ---------------------------------------------------------------------------

  const getSvgX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return 0;
      const rect = svg.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * SVG_W;
    },
    [],
  );

  const handleOctopusPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isRacing) return;
      if (phase === 0 && !hasRaced) return; // Must race first
      isDraggingOctopus.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [isRacing, hasRaced, phase],
  );

  const handleOctopusPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingOctopus.current) return;
      const svgX = getSvgX(e.clientX);
      const pts = phase === 2 && customPoints.length > 2 ? customPoints : trackPoints;
      const idx = xToTrackIndex(svgX, pts);
      setCurrentIndex(idx);
      setDrawnGraphIndex((prev) => Math.max(prev, idx));
      setDragCount((c) => c + 1);
    },
    [getSvgX, trackPoints, customPoints, phase],
  );

  const handleOctopusPointerUp = useCallback(() => {
    isDraggingOctopus.current = false;
  }, []);

  // ---------------------------------------------------------------------------
  // Phase 1, Challenge 1: Flag dragging
  // ---------------------------------------------------------------------------

  const handleFlagPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingFlag.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handleFlagPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingFlag.current) return;
      const svgX = getSvgX(e.clientX);
      const idx = xToTrackIndex(svgX, trackPoints);
      setFlagIndex(idx);
    },
    [getSvgX, trackPoints],
  );

  const handleFlagPointerUp = useCallback(() => {
    isDraggingFlag.current = false;
    // Check if placed within tolerance of max speed point
    const tolerance = Math.floor(NUM_TRACK_POINTS * FLAG_TOLERANCE);
    if (Math.abs(flagIndex - maxSpeedIndex) <= tolerance) {
      setFlagPlaced(true);
      setBubbleText(TEXT.phase1FlagCorrect);
      setBubbleMood("celebrate");
      // Move to challenge 2 after delay
      setTimeout(() => {
        setChallenge(1);
        setBubbleText(TEXT.phase1GraphPrompt);
        setBubbleMood("curious");
      }, 1800);
    }
  }, [flagIndex, maxSpeedIndex]);

  // ---------------------------------------------------------------------------
  // Phase 1, Challenge 2: Match track to speed graph
  // ---------------------------------------------------------------------------

  const handleTrackChoice = useCallback(
    (choiceIdx: number) => {
      if (challenge2Correct) return;
      const trackId = altTracksOrder[choiceIdx];
      setChallenge2Answer(choiceIdx);
      if (trackId === 0) {
        // Correct!
        setChallenge2Correct(true);
        setBubbleText(TEXT.phase1FlagCorrect);
        setBubbleMood("celebrate");
        setTimeout(() => {
          setChallenge(2);
          setBubbleText(TEXT.phase1StopPrompt);
          setBubbleMood("curious");
        }, 1800);
      } else {
        setBubbleText("Chưa đúng! Thử lại nha!");
        setBubbleMood("oops");
        // Reset after a moment
        setTimeout(() => {
          setChallenge2Answer(null);
          setBubbleText(TEXT.phase1GraphPrompt);
          setBubbleMood("curious");
        }, 1200);
      }
    },
    [altTracksOrder, challenge2Correct],
  );

  // ---------------------------------------------------------------------------
  // Phase 1, Challenge 3: Find zero-speed points
  // ---------------------------------------------------------------------------

  const handleTrackTapForStop = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== 1 || challenge !== 2 || challenge3Done) return;
      const svgX = getSvgX(e.clientX);
      const idx = xToTrackIndex(svgX, trackPoints);
      const tolerance = Math.floor(NUM_TRACK_POINTS * STOP_TOLERANCE);

      const matchedZero = zeroSpeedIndices.find(
        (zi) => Math.abs(idx - zi) <= tolerance,
      );
      if (matchedZero !== undefined && !stopPoints.includes(matchedZero)) {
        const newStopPoints = [...stopPoints, matchedZero];
        setStopPoints(newStopPoints);

        if (newStopPoints.length >= 2) {
          setChallenge3Done(true);
          setBubbleText("Tuyệt vời! Đỉnh đồi và đáy thung lũng — tốc độ bằng 0!");
          setBubbleMood("celebrate");
          setTimeout(() => {
            advanceToPhase2();
          }, 2000);
        } else {
          setBubbleText("Tìm được một chỗ! Còn chỗ nào nữa không?");
          setBubbleMood("happy");
        }
      }
    },
    [
      phase,
      challenge,
      challenge3Done,
      getSvgX,
      trackPoints,
      zeroSpeedIndices,
      stopPoints,
      advanceToPhase2,
    ],
  );

  // ---------------------------------------------------------------------------
  // Phase 2: Freehand drawing
  // ---------------------------------------------------------------------------

  const handleDrawStart = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== 2 || isCustomRacing || customRaced) return;
      setIsDrawing(true);
      setCustomPoints([]);
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const y = ((e.clientY - rect.top) / rect.height) * SVG_H;
      // Clamp to track area
      const cx = Math.max(TRACK_LEFT, Math.min(TRACK_RIGHT, x));
      const cy = Math.max(TRACK_TOP, Math.min(TRACK_BOTTOM, y));
      setCustomPoints([{ x: cx, y: cy }]);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [phase, isCustomRacing, customRaced],
  );

  const handleDrawMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const y = ((e.clientY - rect.top) / rect.height) * SVG_H;
      const cx = Math.max(TRACK_LEFT, Math.min(TRACK_RIGHT, x));
      const cy = Math.max(TRACK_TOP, Math.min(TRACK_BOTTOM, y));
      setCustomPoints((prev) => {
        // Only add if moved enough from last point (smoothing)
        const last = prev[prev.length - 1];
        if (last && Math.hypot(cx - last.x, cy - last.y) < 4) return prev;
        return [...prev, { x: cx, y: cy }];
      });
    },
    [isDrawing],
  );

  const handleDrawEnd = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Phase 2: Race custom track
  const startCustomRace = useCallback(() => {
    if (isCustomRacing || customPoints.length < 5) return;
    setIsCustomRacing(true);
    setCustomDrawnIndex(0);
    setCustomIndex(0);
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / RACE_DURATION, 1);
      const idx = tToIndex(t, customPoints.length);
      setCustomIndex(idx);
      setCustomDrawnIndex(idx);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsCustomRacing(false);
        setCustomRaced(true);
        // Show PearlReveal
        setTimeout(() => setShowPearl(true), 600);
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, [isCustomRacing, customPoints]);

  // ---------------------------------------------------------------------------
  // Derived values for rendering
  // ---------------------------------------------------------------------------

  const activePoints =
    phase === 2 && customPoints.length > 2 ? customPoints : trackPoints;
  const activeSpeeds =
    phase === 2 && customSpeeds.length > 2 ? customSpeeds : speeds;
  const activeIndex = phase === 2 ? customIndex : currentIndex;
  const activeDrawnIndex =
    phase === 2 ? customDrawnIndex : drawnGraphIndex;

  const currentPoint = activePoints[activeIndex] ?? activePoints[0];
  const currentSpeed = activeSpeeds[activeIndex]?.speed ?? 50;

  // Tangent line at current position
  const tangentLen = 30;
  const tangent = useMemo(() => {
    const pts = activePoints;
    const idx = activeIndex;
    if (!pts[idx]) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    let dx: number, dy: number;
    if (idx === 0 && pts.length > 1) {
      dx = pts[1].x - pts[0].x;
      dy = pts[1].y - pts[0].y;
    } else if (idx === pts.length - 1 && pts.length > 1) {
      dx = pts[idx].x - pts[idx - 1].x;
      dy = pts[idx].y - pts[idx - 1].y;
    } else if (pts.length > 2) {
      dx = pts[idx + 1].x - pts[idx - 1].x;
      dy = pts[idx + 1].y - pts[idx - 1].y;
    } else {
      dx = 1;
      dy = 0;
    }
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: currentPoint.x - ux * tangentLen,
      y1: currentPoint.y - uy * tangentLen,
      x2: currentPoint.x + ux * tangentLen,
      y2: currentPoint.y + uy * tangentLen,
    };
  }, [activePoints, activeIndex, currentPoint]);

  // Speedometer needle angle: -90 (left/slow) to +90 (right/fast)
  const needleAngle = -90 + (currentSpeed / 100) * 180;

  // Speed graph polyline (drawn progressively)
  const speedGraphPolyline = useMemo(() => {
    if (activeSpeeds.length < 2) return "";
    const gw = GRAPH_RIGHT - GRAPH_LEFT;
    const gh = GRAPH_BOTTOM - GRAPH_TOP - 20;
    const pts: string[] = [];
    const limit = Math.min(activeDrawnIndex + 1, activeSpeeds.length);
    for (let i = 0; i < limit; i++) {
      const sx =
        GRAPH_LEFT + (i / (activeSpeeds.length - 1)) * gw;
      const sy = GRAPH_BOTTOM - 10 - (activeSpeeds[i].speed / 100) * gh;
      pts.push(`${sx},${sy}`);
    }
    return pts.join(" ");
  }, [activeSpeeds, activeDrawnIndex]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /** Ocean background decorations */
  function renderOceanDecor() {
    return (
      <g opacity={0.4}>
        {/* Seaweed */}
        <path
          d="M35 210 Q30 190, 38 170 Q32 155, 40 140"
          fill="none"
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <path
          d="M40 210 Q48 185, 42 165 Q50 150, 44 135"
          fill="none"
          stroke="#16a34a"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M360 210 Q365 190, 358 170 Q362 155, 355 140"
          fill="none"
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Bubbles */}
        <circle cx={55} cy={60} r={3} fill="#7dd3fc" />
        <circle cx={62} cy={50} r={2} fill="#7dd3fc" />
        <circle cx={350} cy={55} r={2.5} fill="#7dd3fc" />
        <circle cx={340} cy={45} r={1.8} fill="#7dd3fc" />
        <circle cx={200} cy={40} r={2} fill="#7dd3fc" />
        {/* Wave lines */}
        <path
          d="M0 215 Q50 208, 100 215 T200 215 T300 215 T400 215"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={1.5}
        />
        <path
          d="M0 222 Q60 215, 120 222 T240 222 T360 222 T400 222"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={1}
        />
      </g>
    );
  }

  /** Speedometer gauge */
  function renderSpeedometer() {
    // Arc from -90deg to +90deg (semi-circle at top)
    const startAngle = -Math.PI;
    const endAngle = 0;
    const arcPoints: string[] = [];
    const steps = 30;

    // Gradient arc segments
    const arcs: React.ReactElement[] = [];
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * (endAngle - startAngle);
      const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);
      const x1 = GAUGE_CX + Math.cos(a1) * GAUGE_R;
      const y1 = GAUGE_CY + Math.sin(a1) * GAUGE_R;
      const x2 = GAUGE_CX + Math.cos(a2) * GAUGE_R;
      const y2 = GAUGE_CY + Math.sin(a2) * GAUGE_R;
      const t = i / steps;
      // blue → yellow → red
      let color: string;
      if (t < 0.4) {
        color = "#3b82f6";
      } else if (t < 0.7) {
        color = "#eab308";
      } else {
        color = "#ef4444";
      }
      arcs.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
        />,
      );
      arcPoints.push(`${x1},${y1}`);
    }

    // Needle
    const needleRad =
      (-Math.PI / 2) + (needleAngle * Math.PI) / 180 - Math.PI / 2;
    const nx = GAUGE_CX + Math.cos(needleRad) * (GAUGE_R - 10);
    const ny = GAUGE_CY + Math.sin(needleRad) * (GAUGE_R - 10);

    return (
      <g>
        {/* Gauge background */}
        <circle
          cx={GAUGE_CX}
          cy={GAUGE_CY}
          r={GAUGE_R + 5}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        {arcs}
        {/* Needle */}
        <line
          x1={GAUGE_CX}
          y1={GAUGE_CY}
          x2={nx}
          y2={ny}
          stroke="#1e293b"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={GAUGE_CX} cy={GAUGE_CY} r={4} fill="#1e293b" />
        {/* Label */}
        <text
          x={GAUGE_CX}
          y={GAUGE_CY + 20}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#334155"
        >
          {TEXT.speedLabel}
        </text>
        {/* Speed value */}
        <text
          x={GAUGE_CX}
          y={GAUGE_CY - 15}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="#0f172a"
        >
          {Math.round(currentSpeed)}
        </text>
      </g>
    );
  }

  /** Mini derivative graph */
  function renderSpeedGraph() {
    const gw = GRAPH_RIGHT - GRAPH_LEFT;
    const gh = GRAPH_BOTTOM - GRAPH_TOP - 20;

    return (
      <g>
        {/* Graph background */}
        <rect
          x={GRAPH_LEFT - 5}
          y={GRAPH_TOP - 5}
          width={gw + 10}
          height={gh + 30}
          rx={6}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        {/* Axes */}
        <line
          x1={GRAPH_LEFT}
          y1={GRAPH_BOTTOM - 10}
          x2={GRAPH_RIGHT}
          y2={GRAPH_BOTTOM - 10}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <line
          x1={GRAPH_LEFT}
          y1={GRAPH_TOP + 5}
          x2={GRAPH_LEFT}
          y2={GRAPH_BOTTOM - 10}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        {/* Zero line */}
        <line
          x1={GRAPH_LEFT}
          y1={GRAPH_BOTTOM - 10}
          x2={GRAPH_RIGHT}
          y2={GRAPH_BOTTOM - 10}
          stroke="#e2e8f0"
          strokeWidth={0.5}
          strokeDasharray="3 3"
        />
        {/* Speed polyline */}
        {speedGraphPolyline && (
          <polyline
            points={speedGraphPolyline}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {/* Current position marker */}
        {activeSpeeds.length > 0 && activeDrawnIndex > 0 && (
          <circle
            cx={
              GRAPH_LEFT +
              (activeDrawnIndex / (activeSpeeds.length - 1)) * gw
            }
            cy={
              GRAPH_BOTTOM -
              10 -
              ((activeSpeeds[activeDrawnIndex]?.speed ?? 0) / 100) * gh
            }
            r={4}
            fill="#8b5cf6"
          />
        )}
        {/* Label */}
        <text
          x={GRAPH_LEFT + gw / 2}
          y={GRAPH_TOP}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="#64748b"
        >
          {TEXT.speedLabel}
        </text>
      </g>
    );
  }

  /** Octopus token on track */
  function renderOctopus(pt: TrackPoint, draggable: boolean) {
    return (
      <g
        style={{ cursor: draggable ? "grab" : "default", touchAction: "none" }}
        onPointerDown={draggable ? handleOctopusPointerDown : undefined}
        onPointerMove={draggable ? handleOctopusPointerMove : undefined}
        onPointerUp={draggable ? handleOctopusPointerUp : undefined}
      >
        <text
          x={pt.x}
          y={pt.y - 8}
          textAnchor="middle"
          fontSize={24}
          aria-label="Bạch Tuộc"
          role="img"
        >
          🐙
        </text>
        {/* Invisible larger touch target */}
        {draggable && (
          <rect
            x={pt.x - 22}
            y={pt.y - 30}
            width={44}
            height={44}
            fill="transparent"
          />
        )}
      </g>
    );
  }

  /** Tangent line at current position */
  function renderTangent() {
    if (!hasRaced && phase === 0) return null;
    if (phase === 1 && challenge === 1) return null; // hide during graph matching
    return (
      <line
        x1={tangent.x1}
        y1={tangent.y1}
        x2={tangent.x2}
        y2={tangent.y2}
        stroke="#f97316"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.8}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Phase-specific renders
  // ---------------------------------------------------------------------------

  function renderPhase0() {
    const canDrag = hasRaced && !isRacing;
    return (
      <>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {renderTangent()}
        {renderOctopus(currentPoint, canDrag)}

        {/* Start button */}
        {!isRacing && (
          <g
            onClick={startRace}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={TEXT.startButton}
          >
            <rect
              x={SVG_W / 2 - 50}
              y={TRACK_BOTTOM + 12}
              width={100}
              height={36}
              rx={18}
              fill="#0ea5e9"
            />
            <text
              x={SVG_W / 2}
              y={TRACK_BOTTOM + 35}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="#fff"
            >
              {TEXT.startButton}
            </text>
          </g>
        )}
      </>
    );
  }

  function renderPhase1() {
    return (
      <>
        {/* Track — possibly hidden in challenge 2 */}
        {challenge !== 1 && (
          <path
            d={trackPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Challenge 1: Flag placement */}
        {challenge === 0 && (
          <>
            <path
              d={trackPath}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0}
            />
            {renderTangent()}
            {renderOctopus(
              trackPoints[flagIndex] ?? trackPoints[0],
              false,
            )}

            {/* Draggable red flag */}
            <g
              style={{ cursor: "grab", touchAction: "none" }}
              onPointerDown={handleFlagPointerDown}
              onPointerMove={handleFlagPointerMove}
              onPointerUp={handleFlagPointerUp}
            >
              <text
                x={trackPoints[flagIndex]?.x ?? 200}
                y={(trackPoints[flagIndex]?.y ?? 120) - 22}
                textAnchor="middle"
                fontSize={22}
                aria-label="Cờ đỏ"
              >
                🚩
              </text>
              {/* Touch target */}
              <rect
                x={(trackPoints[flagIndex]?.x ?? 200) - 22}
                y={(trackPoints[flagIndex]?.y ?? 120) - 44}
                width={44}
                height={44}
                fill="transparent"
              />
            </g>

            {/* Show tangent at flag position if placed correctly */}
            {flagPlaced && (() => {
              const pt = trackPoints[maxSpeedIndex];
              if (!pt) return null;
              const idx = maxSpeedIndex;
              let dx = 1, dy = 0;
              if (idx > 0 && idx < trackPoints.length - 1) {
                dx = trackPoints[idx + 1].x - trackPoints[idx - 1].x;
                dy = trackPoints[idx + 1].y - trackPoints[idx - 1].y;
              }
              const len = Math.hypot(dx, dy) || 1;
              return (
                <line
                  x1={pt.x - (dx / len) * 30}
                  y1={pt.y - (dy / len) * 30}
                  x2={pt.x + (dx / len) * 30}
                  y2={pt.y + (dy / len) * 30}
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })()}
          </>
        )}

        {/* Challenge 2: Match track to speed graph */}
        {challenge === 1 && (
          <>
            {/* Curtain over track area */}
            <rect
              x={TRACK_LEFT - 5}
              y={TRACK_TOP - 10}
              width={TRACK_RIGHT - TRACK_LEFT + 10}
              height={TRACK_BOTTOM - TRACK_TOP + 20}
              rx={8}
              fill="#475569"
              opacity={challenge2Correct ? 0.1 : 0.85}
            />
            {challenge2Correct && (
              <path
                d={trackPath}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}
            {/* Question mark if hidden */}
            {!challenge2Correct && (
              <text
                x={SVG_W / 2}
                y={(TRACK_TOP + TRACK_BOTTOM) / 2 + 8}
                textAnchor="middle"
                fontSize={40}
                fill="#fff"
                opacity={0.7}
              >
                ?
              </text>
            )}

            {/* Three thumbnail choices */}
            {altTracksOrder.map((trackId, choiceIdx) => {
              const thumbW = 55;
              const thumbH = 30;
              const gap = 10;
              const totalW = 3 * thumbW + 2 * gap;
              const startX = SVG_W / 2 - totalW / 2;
              const bx = startX + choiceIdx * (thumbW + gap);
              const by = TRACK_BOTTOM + 10;
              const pts = altTracks[trackId];
              const miniPath = trackToMiniPath(pts, bx + 3, by + 3, thumbW - 6, thumbH - 6);
              const isSelected = challenge2Answer === choiceIdx;
              return (
                <g
                  key={choiceIdx}
                  onClick={() => handleTrackChoice(choiceIdx)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  aria-label={`Đường đua ${choiceIdx + 1}`}
                >
                  <rect
                    x={bx}
                    y={by}
                    width={thumbW}
                    height={thumbH}
                    rx={4}
                    fill={isSelected ? "#dbeafe" : "#f1f5f9"}
                    stroke={isSelected ? "#3b82f6" : "#cbd5e1"}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <path
                    d={miniPath}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </>
        )}

        {/* Challenge 3: Find zero-speed points */}
        {challenge === 2 && (
          <>
            {renderTangent()}
            <g
              onPointerDown={handleTrackTapForStop}
              style={{ cursor: "crosshair" }}
            >
              {/* Invisible wider hit area along the track */}
              <path
                d={trackPath}
                fill="none"
                stroke="transparent"
                strokeWidth={30}
              />
            </g>
            {renderOctopus(currentPoint, false)}

            {/* Show found zero-speed points */}
            {stopPoints.map((zi, i) => {
              const pt = trackPoints[zi];
              if (!pt) return null;
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={8}
                    fill="#22c55e"
                    opacity={0.5}
                  />
                  <text
                    x={pt.x}
                    y={pt.y + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#fff"
                  >
                    0
                  </text>
                  {/* Flat tangent line */}
                  <line
                    x1={pt.x - 25}
                    y1={pt.y}
                    x2={pt.x + 25}
                    y2={pt.y}
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                </g>
              );
            })}

            {/* Show all zero-speed target hints after done */}
            {challenge3Done &&
              zeroSpeedIndices.map((zi, i) => {
                const pt = trackPoints[zi];
                if (!pt) return null;
                if (stopPoints.includes(zi)) return null;
                return (
                  <circle
                    key={`hint-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={6}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                  />
                );
              })}
          </>
        )}
      </>
    );
  }

  function renderPhase2() {
    const hasCustomTrack = customPoints.length > 4;
    const showCustom = hasCustomTrack;
    const activePt =
      showCustom && customPoints[customIndex]
        ? customPoints[customIndex]
        : trackPoints[0];

    return (
      <>
        {/* Drawing area */}
        <rect
          x={TRACK_LEFT - 5}
          y={TRACK_TOP - 5}
          width={TRACK_RIGHT - TRACK_LEFT + 10}
          height={TRACK_BOTTOM - TRACK_TOP + 10}
          rx={8}
          fill="#f0f9ff"
          stroke="#bae6fd"
          strokeWidth={1}
          strokeDasharray={hasCustomTrack ? "0" : "6 3"}
          onPointerDown={handleDrawStart}
          onPointerMove={handleDrawMove}
          onPointerUp={handleDrawEnd}
          style={{ cursor: isDrawing ? "crosshair" : "pointer", touchAction: "none" }}
        />

        {/* Draw instruction */}
        {!hasCustomTrack && !isDrawing && (
          <text
            x={SVG_W / 2}
            y={(TRACK_TOP + TRACK_BOTTOM) / 2}
            textAnchor="middle"
            fontSize={12}
            fill="#64748b"
          >
            Kéo ngón tay để vẽ!
          </text>
        )}

        {/* Custom track path */}
        {customTrackPath && (
          <path
            d={customTrackPath}
            fill="none"
            stroke="#f97316"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Octopus on custom track */}
        {showCustom && !isDrawing && (
          <>
            {renderTangent()}
            {renderOctopus(activePt, false)}
          </>
        )}

        {/* Run button */}
        {hasCustomTrack && !isCustomRacing && !customRaced && (
          <g
            onClick={startCustomRace}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={TEXT.phase2Run}
          >
            <rect
              x={SVG_W / 2 - 40}
              y={TRACK_BOTTOM + 12}
              width={80}
              height={32}
              rx={16}
              fill="#f97316"
            />
            <text
              x={SVG_W / 2}
              y={TRACK_BOTTOM + 33}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill="#fff"
            >
              {TEXT.phase2Run}
            </text>
          </g>
        )}

        {/* Accelerate challenge hint */}
        {customRaced && (
          <text
            x={SVG_W / 2}
            y={TRACK_BOTTOM + 30}
            textAnchor="middle"
            fontSize={10}
            fill="#64748b"
          >
            {TEXT.phase2AccelerateChallenge}
          </text>
        )}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-3 pb-6">
      {/* Mascot bubble */}
      <MascotBubble text={bubbleText} mood={bubbleMood} autoSpeak={false} />

      {/* Main SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="Đường đua đại dương — tốc độ thay đổi"
        style={{ touchAction: "none" }}
      >
        <defs>
          <linearGradient id="ocean-race-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect
          width={SVG_W}
          height={SVG_H}
          rx={12}
          fill="url(#ocean-race-bg)"
        />

        {/* Ocean decorations */}
        {renderOceanDecor()}

        {/* Phase content */}
        {phase === 0 && renderPhase0()}
        {phase === 1 && renderPhase1()}
        {phase === 2 && renderPhase2()}

        {/* Speedometer gauge (always visible) */}
        {renderSpeedometer()}

        {/* Mini derivative graph (always visible) */}
        {renderSpeedGraph()}

        {/* Divider line between track and dashboard */}
        <line
          x1={10}
          y1={255}
          x2={SVG_W - 10}
          y2={255}
          stroke="#94a3b8"
          strokeWidth={0.5}
          opacity={0.4}
        />
      </svg>

      {/* Pearl reveal */}
      {showPearl && (
        <PearlReveal
          topicSlug="nhi-ocean-race"
          onClose={() => setShowPearl(false)}
        />
      )}
    </div>
  );
}
