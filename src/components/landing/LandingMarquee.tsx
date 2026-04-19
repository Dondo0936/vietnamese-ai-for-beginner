"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Marquee strip below the hero — infinite horizontal scroll, paused
 * entirely for `prefers-reduced-motion`. We duplicate the items array
 * so the CSS `translateX(-50%)` loop seams cleanly.
 */

const ITEMS = [
  "260+ chủ đề",
  "47 primitive tương tác",
  "4 lộ trình",
  "viết lại cho người Việt",
  "minh hoạ trước · chữ sau",
  "mã nguồn mở · MIT license",
  "chạy trên Vercel + Supabase",
  "không quảng cáo · không tracking",
];

export function LandingMarquee() {
  const reduceMotion = useReducedMotion();
  const items = [...ITEMS, ...ITEMS];
  return (
    <section className="ld-marquee" aria-hidden="true">
      <div className={`ld-marquee__track ${reduceMotion ? "" : "ld-marquee__track--anim"}`}>
        {items.map((w, i) => (
          <span key={i} style={{ display: "inline-flex", gap: 32 }}>
            <span>{w}</span>
            <span className="ld-marquee__sep">— ✳ —</span>
          </span>
        ))}
      </div>
    </section>
  );
}
