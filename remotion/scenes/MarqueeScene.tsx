import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 3 — Landing marquee strip
 * (mirror of src/components/landing/LandingMarquee.tsx).
 *
 * Full-bleed ink-black strip with the tagline items scrolling right-
 * to-left. The actual landing uses a CSS `@keyframes` loop on a dup'd
 * array translating from 0 to -50%. Here we do the same arithmetic
 * per-frame via interpolate().
 */
export const MarqueeScene = () => {
  const frame = useCurrentFrame();

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
  const doubled = [...ITEMS, ...ITEMS];

  // Full loop every 180 frames (6s) — track moves from 0 to -50% of its own
  // width, then wraps cleanly because the items are duplicated.
  const shift = interpolate(frame, [0, 180], [0, -50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.ink,
        color: COLORS.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        padding: "48px 0",
      }}
    >
      {/* Eyebrow above the strip */}
      <div
        style={{
          textAlign: "center",
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 13,
          color: COLORS.turquoise300,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: 32,
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        ✳ — nền tảng mở, chạy trên web — ✳
      </div>

      {/* Scrolling strip */}
      <div
        style={{
          display: "inline-flex",
          gap: 48,
          whiteSpace: "nowrap",
          transform: `translateX(${shift}%)`,
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{ display: "inline-flex", gap: 48, alignItems: "center" }}
          >
            <span>{item}</span>
            <span style={{ color: COLORS.turquoise300 }}>— ✳ —</span>
          </span>
        ))}
      </div>

      {/* Footer eyebrow */}
      <div
        style={{
          textAlign: "center",
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 13,
          color: COLORS.turquoise300,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginTop: 32,
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        ✳ — miễn phí · không đăng ký · đọc xong là chạy — ✳
      </div>
    </div>
  );
};
