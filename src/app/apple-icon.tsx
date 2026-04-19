import { ImageResponse } from "next/og";

// Apple touch icon — 180×180 PNG for iOS home-screen installs. Next.js
// auto-registers this file as <link rel="apple-touch-icon" …> and runs
// the JSX through ImageResponse at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Match src/app/icon.svg — same turquoise tile, same paper-white A with a
// breve above. Dimensions scaled up 5.625× from the 32-unit viewport.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0E5F5B",
          borderRadius: 39,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FBFAF7",
          fontSize: 128,
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.04em",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            width: 64,
            height: 10,
            transform: "translateX(-50%)",
            borderBottom: "10px solid #6FD6D0",
            borderRadius: "0 0 64px 64px / 0 0 20px 20px",
          }}
        />
        <span style={{ marginTop: 14, lineHeight: 1 }}>A</span>
      </div>
    ),
    size
  );
}
