import { useMemo } from "react";
import { COLORS } from "../tokens";

/**
 * A minimal, deterministic k-NN visualization that matches the logic in
 * `src/topics/knn.tsx` — three clusters (A/B/C), euclidean distance,
 * majority vote among the k nearest points. The viz resolves its color
 * grid at a fixed resolution and renders a query dot with its neighbor
 * ring for narrative punch.
 *
 * It is intentionally simpler than the live primitive (no drag, no
 * metric toggle) so the video renders cheaply and stays on-message.
 */

type ClassId = "A" | "B" | "C";
type Pt = { x: number; y: number; cls: ClassId };

const DATA: Pt[] = [
  // Cluster A
  { x: 60, y: 50, cls: "A" },
  { x: 80, y: 80, cls: "A" },
  { x: 100, y: 40, cls: "A" },
  { x: 110, y: 90, cls: "A" },
  { x: 130, y: 60, cls: "A" },
  { x: 50, y: 100, cls: "A" },
  { x: 140, y: 110, cls: "A" },
  { x: 90, y: 120, cls: "A" },
  { x: 150, y: 80, cls: "A" },
  { x: 70, y: 140, cls: "A" },
  { x: 160, y: 50, cls: "A" },
  { x: 120, y: 140, cls: "A" },
  { x: 100, y: 160, cls: "A" },
  // Cluster B
  { x: 280, y: 50, cls: "B" },
  { x: 300, y: 80, cls: "B" },
  { x: 320, y: 50, cls: "B" },
  { x: 340, y: 90, cls: "B" },
  { x: 290, y: 120, cls: "B" },
  { x: 350, y: 130, cls: "B" },
  { x: 310, y: 140, cls: "B" },
  { x: 360, y: 70, cls: "B" },
  { x: 295, y: 40, cls: "B" },
  { x: 335, y: 40, cls: "B" },
  { x: 345, y: 180, cls: "B" },
  // Cluster C
  { x: 170, y: 220, cls: "C" },
  { x: 200, y: 240, cls: "C" },
  { x: 230, y: 220, cls: "C" },
  { x: 190, y: 270, cls: "C" },
  { x: 215, y: 280, cls: "C" },
  { x: 240, y: 260, cls: "C" },
  { x: 200, y: 295, cls: "C" },
  { x: 260, y: 230, cls: "C" },
  { x: 150, y: 230, cls: "C" },
];

const COLOR: Record<ClassId, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  C: "#10b981",
};
const SOFT: Record<ClassId, string> = {
  A: "rgba(239,68,68,0.18)",
  B: "rgba(59,130,246,0.18)",
  C: "rgba(16,185,129,0.18)",
};

const W = 400;
const H = 320;

function knnVote(qx: number, qy: number, k: number): { cls: ClassId; neighbors: Pt[] } {
  const scored = DATA.map((p) => ({
    p,
    d: Math.hypot(p.x - qx, p.y - qy),
  }));
  scored.sort((a, b) => a.d - b.d);
  const top = scored.slice(0, k).map((s) => s.p);
  const count: Record<ClassId, number> = { A: 0, B: 0, C: 0 };
  top.forEach((p) => (count[p.cls] += 1));
  let best: ClassId = "A";
  let max = -1;
  (Object.keys(count) as ClassId[]).forEach((c) => {
    if (count[c] > max) {
      best = c;
      max = count[c];
    }
  });
  return { cls: best, neighbors: top };
}

interface KnnCanvasProps {
  /** Current k value. Rounded to nearest odd. */
  k: number;
  /** Query point in [0, W] × [0, H] coords. */
  query?: { x: number; y: number };
  width?: number;
  height?: number;
  /** Grid resolution — how wide each colored cell is, in data coords. */
  cell?: number;
}

export const KnnCanvas = ({
  k,
  query = { x: 210, y: 170 },
  width = 400,
  height = 320,
  cell = 16,
}: KnnCanvasProps) => {
  const kOdd = Math.max(1, Math.round(k) | 1);

  // Build the boundary grid once per (k, cell). At cell=16 this is ~500 cells,
  // trivial to compute per frame.
  const grid = useMemo(() => {
    const rows: { x: number; y: number; cls: ClassId }[] = [];
    for (let y = 0; y < H; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const { cls } = knnVote(x + cell / 2, y + cell / 2, kOdd);
        rows.push({ x, y, cls });
      }
    }
    return rows;
  }, [kOdd, cell]);

  const { neighbors } = knnVote(query.x, query.y, kOdd);
  const maxNeighborD = Math.max(
    ...neighbors.map((p) => Math.hypot(p.x - query.x, p.y - query.y)),
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        display: "block",
        background: "#FBFAF7",
        borderRadius: 10,
        border: `1px solid ${COLORS.line}`,
      }}
    >
      {/* boundary fill */}
      {grid.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width={cell}
          height={cell}
          fill={SOFT[c.cls]}
        />
      ))}

      {/* training points */}
      {DATA.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={COLOR[p.cls]} />
      ))}

      {/* neighbor ring around query */}
      <circle
        cx={query.x}
        cy={query.y}
        r={maxNeighborD + 2}
        fill="none"
        stroke={COLORS.turquoise600}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.75}
      />

      {/* connectors to neighbors */}
      {neighbors.map((p, i) => (
        <line
          key={i}
          x1={query.x}
          y1={query.y}
          x2={p.x}
          y2={p.y}
          stroke={COLOR[p.cls]}
          strokeWidth={1.4}
          opacity={0.55}
        />
      ))}

      {/* query point */}
      <circle
        cx={query.x}
        cy={query.y}
        r={7}
        fill="#FBFAF7"
        stroke={COLORS.ink}
        strokeWidth={2}
      />
      <circle cx={query.x} cy={query.y} r={3} fill={COLORS.ink} />
    </svg>
  );
};
