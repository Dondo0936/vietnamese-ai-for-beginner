import { CSSProperties, ReactNode } from "react";
import { COLORS } from "../tokens";
import { FONT_DISPLAY, FONT_SANS, FONT_VN_DISPLAY } from "../fonts";
import {
  Brain,
  Search as SearchIcon,
  BookOpen,
  BarChart3,
  Bookmark,
  Sun,
  MessageSquare,
} from "lucide-react";

/**
 * A pixel-close mock of the real AppShell chrome: a 56px sticky navbar
 * with the turquoise `<Brain>` + "AI Cho Mọi Người" wordmark on the left
 * and the icon-only toolbar on the right. Below the navbar is a paper
 * (`--paper`) canvas into which each scene paints its page body.
 *
 * The scenes should fill the `children` slot with page-body markup
 * (hero, path grid, topic layout, etc.). The navbar is identical across
 * scenes so the viewer reads a consistent "this is one app" narrative.
 */
export const AppFrame = ({
  children,
  canvasStyle,
  showKbd = true,
}: {
  children: ReactNode;
  canvasStyle?: CSSProperties;
  showKbd?: boolean;
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.paper,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Navbar showKbd={showKbd} />
      <div
        style={{
          position: "absolute",
          inset: "56px 0 0 0",
          overflow: "hidden",
          ...canvasStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Navbar = ({ showKbd }: { showKbd: boolean }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      background: "rgba(251, 247, 242, 0.86)",
      borderBottom: `1px solid ${COLORS.line}`,
      backdropFilter: "blur(16px)",
      zIndex: 10,
    }}
  >
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        height: "100%",
        paddingLeft: 56,
        paddingRight: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Brain size={20} color={COLORS.turquoise500} strokeWidth={2} />
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: COLORS.ink,
          }}
        >
          AI Cho Mọi Người
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <NavIcon>
          <SearchIcon size={17} color={COLORS.ash} strokeWidth={1.8} />
          {showKbd && <Kbd>⌘K</Kbd>}
        </NavIcon>
        <NavIcon>
          <BookOpen size={17} color={COLORS.ash} strokeWidth={1.8} />
        </NavIcon>
        <NavIcon>
          <MessageSquare size={17} color={COLORS.ash} strokeWidth={1.8} />
        </NavIcon>
        <NavIcon>
          <BarChart3 size={17} color={COLORS.ash} strokeWidth={1.8} />
        </NavIcon>
        <NavIcon>
          <Bookmark size={17} color={COLORS.ash} strokeWidth={1.8} />
        </NavIcon>
        <div style={{ width: 1, height: 20, background: COLORS.line }} />
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
            color: COLORS.graphite,
          }}
        >
          Đăng nhập
        </div>
        <NavIcon>
          <Sun size={17} color={COLORS.ash} strokeWidth={1.8} />
        </NavIcon>
      </div>
    </div>
  </div>
);

const NavIcon = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
);

const Kbd = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
      fontSize: 10,
      color: COLORS.ash,
      padding: "2px 5px",
      border: `1px solid ${COLORS.line}`,
      borderRadius: 4,
      background: "rgba(255,255,255,0.7)",
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);

// Re-export tokens for convenience inside scenes
export { FONT_DISPLAY, FONT_SANS, FONT_VN_DISPLAY, COLORS };
