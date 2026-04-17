"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress-context";

const ISLANDS = [
  { slug: "nhi-coral-factory", nameVi: "Nhà máy san hô", icon: "🏭", cx: 80, cy: 65 },
  { slug: "nhi-creature-garden", nameVi: "Vườn sinh vật", icon: "🌿", cx: 220, cy: 40 },
  { slug: "nhi-treasure-map", nameVi: "Bản đồ kho báu", icon: "🗺️", cx: 340, cy: 80 },
  { slug: "nhi-magic-marble-bag", nameVi: "Túi bi thần kỳ", icon: "🎱", cx: 140, cy: 160 },
  { slug: "nhi-shadow-theater", nameVi: "Rạp chiếu bóng", icon: "🎭", cx: 280, cy: 170 },
  { slug: "nhi-ocean-race", nameVi: "Đường đua", icon: "🏁", cx: 200, cy: 260 },
] as const;

const PATH_POINTS = ISLANDS.map((i) => `${i.cx},${i.cy}`).join(" ");

export default function OceanMap() {
  const { readTopics } = useProgress();

  return (
    <svg
      viewBox="0 0 420 320"
      className="w-full max-w-lg mx-auto"
      role="img"
      aria-label="Bản đồ đại dương — 6 hòn đảo"
    >
      <defs>
        <linearGradient id="ocean-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <filter id="pearl-glow-filter">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ocean background */}
      <rect width="420" height="320" rx="16" fill="url(#ocean-bg)" />

      {/* Decorative wave lines */}
      <path
        d="M0 290 Q70 275, 140 290 T280 290 T420 290"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M0 300 Q70 285, 140 300 T280 300 T420 300"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M0 15 Q105 30, 210 15 T420 15"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* Dotted path connecting islands */}
      <polyline
        points={PATH_POINTS}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.6"
      />

      {/* Islands */}
      {ISLANDS.map((island) => {
        const done = readTopics.includes(island.slug);
        return (
          <Link key={island.slug} href={`/kids/topics/${island.slug}`}>
            <g className="cursor-pointer" role="link" aria-label={island.nameVi}>
              {/* Island circle */}
              <circle
                cx={island.cx}
                cy={island.cy}
                r={32}
                fill="#fefce8"
                stroke={done ? "#f59e0b" : "#cbd5e1"}
                strokeWidth={done ? 3 : 2}
              />

              {/* Pearl glow for completed islands */}
              {done && (
                <circle
                  cx={island.cx + 20}
                  cy={island.cy - 20}
                  r={8}
                  fill="#fbbf24"
                  filter="url(#pearl-glow-filter)"
                  className="animate-pearl-glow"
                />
              )}

              {/* Emoji icon */}
              <text
                x={island.cx}
                y={island.cy + 6}
                textAnchor="middle"
                fontSize="22"
                aria-hidden="true"
              >
                {island.icon}
              </text>

              {/* Label */}
              <text
                x={island.cx}
                y={island.cy + 48}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#334155"
              >
                {island.nameVi}
              </text>
            </g>
          </Link>
        );
      })}

      {/* Octopus mascot at center bottom */}
      <text x="210" y="310" textAnchor="middle" fontSize="28" aria-hidden="true">
        🐙
      </text>
    </svg>
  );
}
