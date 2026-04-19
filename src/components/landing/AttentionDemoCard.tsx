"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animated attention-bars demo shown in the hero's right column.
 *
 * The query token cycles through the 5 Vietnamese tokens every ~2.4s;
 * each row's bars pulse to the heights the design hardcoded for that
 * query. `useReducedMotion` short-circuits the cycle for users with
 * `prefers-reduced-motion`, pinning the bars to the "ngủ" state (the
 * frame the design ships as its poster).
 */

type Row = { label: string; heights: [number, number, number, number, number] };

// For each query token (by index), the attention distribution across
// the 5 tokens. Heights are percentages; design-authored values.
const ROWS_BY_QUERY: Row[][] = [
  // query = "con mèo" (0)
  [
    { label: "con mèo", heights: [30, 80, 50, 20, 15] },
    { label: "đang", heights: [60, 35, 90, 25, 20] },
    { label: "ngủ", heights: [20, 45, 30, 95, 40] },
    { label: "trên", heights: [40, 55, 65, 40, 50] },
    { label: "ghế", heights: [25, 60, 40, 75, 90] },
  ],
  // query = "đang" (1)
  [
    { label: "con mèo", heights: [85, 30, 40, 20, 10] },
    { label: "đang", heights: [30, 70, 60, 25, 20] },
    { label: "ngủ", heights: [90, 40, 50, 35, 20] },
    { label: "trên", heights: [20, 40, 35, 60, 55] },
    { label: "ghế", heights: [15, 30, 25, 60, 75] },
  ],
  // query = "ngủ" (2) — design's canonical frame
  [
    { label: "con mèo", heights: [90, 75, 50, 20, 15] },
    { label: "đang", heights: [60, 80, 90, 25, 20] },
    { label: "ngủ", heights: [30, 55, 40, 85, 40] },
    { label: "trên", heights: [20, 40, 55, 70, 60] },
    { label: "ghế", heights: [25, 40, 35, 85, 90] },
  ],
  // query = "trên" (3)
  [
    { label: "con mèo", heights: [40, 35, 30, 20, 15] },
    { label: "đang", heights: [30, 45, 40, 25, 20] },
    { label: "ngủ", heights: [50, 45, 35, 60, 45] },
    { label: "trên", heights: [30, 50, 70, 50, 60] },
    { label: "ghế", heights: [70, 65, 55, 90, 95] },
  ],
  // query = "ghế" (4)
  [
    { label: "con mèo", heights: [20, 30, 25, 15, 10] },
    { label: "đang", heights: [30, 40, 50, 25, 20] },
    { label: "ngủ", heights: [40, 55, 40, 60, 65] },
    { label: "trên", heights: [40, 50, 55, 70, 85] },
    { label: "ghế", heights: [35, 50, 60, 80, 95] },
  ],
];

const QUERY_LABELS = ["con mèo", "đang", "ngủ", "trên", "ghế"];
const CYCLE_MS = 2400;
const CANONICAL = 2; // "ngủ"

export function AttentionDemoCard() {
  const reduceMotion = useReducedMotion();
  const [queryIndex, setQueryIndex] = useState(CANONICAL);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setQueryIndex((q) => (q + 1) % QUERY_LABELS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const rows = ROWS_BY_QUERY[queryIndex];
  const pct = ((queryIndex + 0.5) / QUERY_LABELS.length) * 100;

  return (
    <div className="ld-hero__right">
      <div className="ld-demo" aria-label="Mẫu trực quan attention">
        <div className="ld-demo__chrome">
          <span className="ld-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="ld-demo__url">
            udemi.tech/topics/attention-mechanism
          </span>
          <span className="ld-demo__live">LIVE</span>
        </div>
        <div className="ld-demo__body">
          <div className="ld-demo__step">Bước 3 / 8 · Trực quan tương tác</div>
          <h3 className="ld-demo__title">Mô hình &quot;nhìn&quot; vào đâu khi đọc câu?</h3>
          <p className="ld-demo__caption">
            Cột cao = mô hình chú ý nhiều hơn vào token đó cho query hiện tại.
          </p>

          {rows.map((row, i) => (
            <div key={i} className="ld-demo__row">
              <span className="ld-demo__label">{row.label}</span>
              <div className="ld-demo__bars">
                {row.heights.map((h, j) => (
                  <span
                    key={j}
                    className="ld-demo__bar"
                    style={{
                      height: `${h}%`,
                      background: `color-mix(in oklch, var(--accent) ${h}%, var(--bg-surface))`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="ld-demo__slider">
            <div className="ld-demo__slider-label">
              <span>← con mèo</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                query: &quot;{QUERY_LABELS[queryIndex]}&quot;
              </span>
              <span>ghế →</span>
            </div>
            <div className="ld-demo__track">
              <div className="ld-demo__fill" style={{ width: `${pct}%` }} />
              <div className="ld-demo__thumb" style={{ left: `${pct}%` }} />
            </div>
          </div>

          <div className="ld-demo__aha">
            <span aria-hidden="true">✳</span>{" "}
            <b>Khoảnh khắc à-ha:</b>{" "}
            {queryIndex === CANONICAL
              ? "mô hình 'nhìn' trở lại 'con mèo' để biết ai đang ngủ."
              : "attention dịch chuyển khi query đổi — không cố định một ô."}
          </div>
        </div>
      </div>
      <div className="ld-tag ld-tag--ink">tương tác thật · không phải ảnh</div>
      <div className="ld-tag ld-tag--accent">→ kéo để thử</div>
    </div>
  );
}
