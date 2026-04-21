"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Animated hero viz for the response-streaming article.
 *
 * Loops every ~3s: tokens appear one-by-one (simulating SSE pushes),
 * then pause, then restart. A "Phát lại" button lets the reader kick
 * the loop manually. Because the parent article is a server component,
 * this file is marked "use client" so hooks work — the directive creates
 * a client boundary, everything inside runs in the browser.
 *
 * The SVG structure mirrors the static mixture-of-depths hero so the
 * editorial design language stays consistent.
 */

const TOKENS = [
  "Câu",
  " trả",
  " lời",
  " đang",
  " hiện",
  " ra",
  " từng",
  " token",
  " một",
] as const;

const STEP_MS = 260;
const PAUSE_AFTER_DONE_MS = 1600;

export default function StreamingHeroViz() {
  const [visible, setVisible] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const tick = useCallback((idx: number, runId: number) => {
    if (runId !== runIdRef.current) return;
    if (idx > TOKENS.length) {
      timerRef.current = setTimeout(() => {
        if (runId !== runIdRef.current) return;
        setVisible(0);
        timerRef.current = setTimeout(() => tick(1, runId), STEP_MS);
      }, PAUSE_AFTER_DONE_MS);
      return;
    }
    setVisible(idx);
    timerRef.current = setTimeout(() => tick(idx + 1, runId), STEP_MS);
  }, []);

  const start = useCallback(() => {
    clearTimer();
    runIdRef.current += 1;
    setVisible(0);
    const runId = runIdRef.current;
    timerRef.current = setTimeout(() => tick(1, runId), STEP_MS);
  }, [tick]);

  useEffect(() => {
    start();
    return () => {
      runIdRef.current += 1;
      clearTimer();
    };
  }, [start]);

  const isTyping = visible < TOKENS.length;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox="0 0 900 340"
        className="ar-viz"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Minh hoạ response streaming: tokens xuất hiện từng cái một trong bubble chat"
      >
        <defs>
          <linearGradient id="stream-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--turquoise-50)" />
            <stop offset="100%" stopColor="var(--bg-card)" />
          </linearGradient>
          <marker
            id="stream-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--turquoise-500)" />
          </marker>
        </defs>
        <rect width="900" height="340" fill="url(#stream-bg)" />

        <text
          x="40"
          y="40"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--turquoise-ink)"
          letterSpacing="0.1em"
        >
          / RESPONSE STREAMING · TTFT 280ms · 38 tok/s
        </text>

        {/* Server side */}
        <g transform="translate(60 76)">
          <rect
            width="200"
            height="180"
            rx="14"
            fill="var(--bg-card)"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          <text
            x="100"
            y="32"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--text-tertiary)"
            letterSpacing="0.12em"
          >
            01 · MODEL
          </text>
          <text
            x="100"
            y="68"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="22"
            fontWeight="500"
            fill="var(--text-primary)"
            letterSpacing="-0.01em"
          >
            LLM sinh
          </text>
          <text
            x="100"
            y="92"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="22"
            fontWeight="500"
            fill="var(--text-primary)"
            letterSpacing="-0.01em"
          >
            token
          </text>
          {/* Token chips inside server — flash as each is emitted */}
          {["Câu", "trả", "lời"].map((t, i) => {
            const flashing = isTyping && visible > i;
            return (
              <g key={t} transform={`translate(${22 + i * 54} 120)`}>
                <rect
                  width="48"
                  height="28"
                  rx="6"
                  fill="var(--turquoise-500)"
                  opacity={flashing ? 1 : 0.35}
                  style={{ transition: "opacity 180ms ease-out" }}
                />
                <text
                  x="24"
                  y="18"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fill="var(--paper)"
                  fontWeight="600"
                >
                  {t}
                </text>
              </g>
            );
          })}
        </g>

        {/* Pipe */}
        <g>
          <line
            x1="270"
            y1="166"
            x2="598"
            y2="166"
            stroke="var(--turquoise-500)"
            strokeWidth="2.5"
            markerEnd="url(#stream-arrow)"
          />
          <text
            x="434"
            y="156"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--turquoise-ink)"
            letterSpacing="0.12em"
          >
            SSE · text/event-stream
          </text>
          <text
            x="434"
            y="188"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--text-tertiary)"
            letterSpacing="0.08em"
          >
            data: {"{token: \""}
            {TOKENS[Math.min(visible - 1, TOKENS.length - 1)]?.trim() ||
              "…"}
            {"\"}"}
          </text>
          {/* Moving packet dot — SMIL handles the motion, we just mount/unmount */}
          {isTyping && visible > 0 && (
            <circle
              cx="270"
              cy="166"
              r="4"
              fill="var(--turquoise-600)"
              opacity="0"
            >
              <animate
                attributeName="cx"
                from="270"
                to="598"
                dur="0.55s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="0.55s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>

        {/* Client bubble */}
        <g transform="translate(610 70)">
          <rect
            width="240"
            height="200"
            rx="16"
            fill="var(--bg-card)"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          <text
            x="120"
            y="32"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--text-tertiary)"
            letterSpacing="0.12em"
          >
            02 · BROWSER
          </text>

          {/* Chat bubble */}
          <g transform="translate(16 54)">
            <rect
              width="208"
              height="128"
              rx="10"
              fill="var(--turquoise-50)"
              stroke="var(--turquoise-100)"
            />
            <foreignObject x="14" y="12" width="180" height="104">
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "var(--turquoise-ink)",
                  letterSpacing: "-0.005em",
                }}
              >
                {TOKENS.slice(0, visible).map((tk, i) => (
                  <span key={i} style={{ fontWeight: 500 }}>
                    {tk}
                  </span>
                ))}
                {isTyping && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 14,
                      marginLeft: 2,
                      background: "var(--turquoise-ink)",
                      verticalAlign: "-2px",
                      animation: "ar-blink 1.1s steps(2, start) infinite",
                    }}
                  />
                )}
                {!isTyping && visible >= TOKENS.length && (
                  <span
                    style={{
                      marginLeft: 4,
                      color: "var(--turquoise-600)",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>

      {/* Overlay controls */}
      <button
        type="button"
        onClick={start}
        aria-label="Phát lại animation streaming"
        style={{
          position: "absolute",
          right: 14,
          bottom: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--turquoise-ink)",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid var(--turquoise-100)",
          borderRadius: 999,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "all 140ms ease-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--turquoise-500)";
          e.currentTarget.style.color = "var(--paper)";
          e.currentTarget.style.borderColor = "var(--turquoise-500)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.9)";
          e.currentTarget.style.color = "var(--turquoise-ink)";
          e.currentTarget.style.borderColor = "var(--turquoise-100)";
        }}
      >
        <RotateCcw size={12} strokeWidth={2.4} />
        Phát lại
      </button>
    </div>
  );
}
