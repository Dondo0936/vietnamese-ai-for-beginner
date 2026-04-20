import { LandingChrome } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "../tokens";import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 5 — Landing featured topics
 * (mirror of src/components/landing/LandingFeatured.tsx).
 *
 * The 6 hardcoded featured topic tiles the design ships:
 *   Reasoning models · Agentic RAG · Constitutional AI
 *   Mixture of Experts · KV cache · LoRA & QLoRA
 *
 * Each tile has a bespoke inline SVG that previews the concept. Cards
 * stagger in left→right, top→bottom.
 */
export const FeaturedScene = () => {
  return (
    <LandingChrome>
      <div
        style={{
          padding: "56px 56px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div>
          <AnimatedIn delay={2} offsetY={6} duration={14}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: COLORS.ash,
              }}
            >
              (02) · 6 chủ đề nổi bật
            </span>
          </AnimatedIn>
          <AnimatedIn delay={6} offsetY={10} duration={16}>
            <h2
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,                fontSize: 52,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                margin: "10px 0 0",
                color: COLORS.ink,
              }}
            >
              Những gì{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: COLORS.turquoiseInk,
                }}
              >
                đang thịnh
              </span>{" "}
              trong AI năm nay.
            </h2>
          </AnimatedIn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
            flex: 1,
          }}
        >
          {TILES.map((t, i) => (
            <AnimatedIn key={t.title} delay={16 + i * 4} offsetY={12} duration={16}>
              <Tile tile={t} />
            </AnimatedIn>
          ))}
        </div>
      </div>
    </LandingChrome>
  );
};

type Tile = {
  title: string;
  blurb: string;
  svg: React.ReactNode;
};

const TILES: Tile[] = [
  {
    title: "Reasoning models",
    blurb: "Vì sao chain-of-thought làm mô hình thông minh hơn?",
    svg: <ReasoningSVG />,
  },
  {
    title: "Agentic RAG",
    blurb: "Không chỉ retrieve — agent quyết định query, fetch, compose.",
    svg: <AgenticRAGSVG />,
  },
  {
    title: "Constitutional AI",
    blurb: "Mô hình tự critique theo một hiến pháp do người viết.",
    svg: <ConstitutionalSVG />,
  },
  {
    title: "Mixture of Experts",
    blurb: "Chỉ bật một phần mạng cho mỗi token — rẻ hơn, đúng hơn.",
    svg: <MoESVG />,
  },
  {
    title: "KV cache",
    blurb: "Vì sao token 1001 tạo nhanh hơn token 1?",
    svg: <KVCacheSVG />,
  },
  {
    title: "LoRA & QLoRA",
    blurb: "Fine-tune mô hình 70B trên một GPU consumer.",
    svg: <LoRASVG />,
  },
];

const Tile = ({ tile }: { tile: Tile }) => (
  <div
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 14,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        height: 110,
        background: COLORS.paper2,
        borderRadius: 10,
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {tile.svg}
    </div>
    <h4
      style={{
        fontFamily: FONT_VN_DISPLAY,
        ...VN_TEXT_RENDER,        fontSize: 19,
        fontWeight: 500,
        letterSpacing: "-0.015em",
        color: COLORS.ink,
        margin: "0 0 6px",
      }}
    >
      {tile.title}
    </h4>
    <p
      style={{
        fontFamily: FONT_VN_DISPLAY,
        ...VN_TEXT_RENDER,        fontSize: 13,
        color: COLORS.graphite,
        lineHeight: 1.5,
        margin: 0,
      }}
    >
      {tile.blurb}
    </p>
  </div>
);

/* ─── 6 bespoke SVGs mirroring src/components/landing/LandingFeatured.tsx ─ */

function ReasoningSVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      {[
        { cx: 20, y: 40 },
        { cx: 54, y: 24 },
        { cx: 88, y: 56 },
        { cx: 122, y: 32 },
      ].map((n, i, arr) =>
        i < arr.length - 1 ? (
          <line
            key={i}
            x1={n.cx + 8}
            y1={n.y}
            x2={arr[i + 1].cx - 8}
            y2={arr[i + 1].y}
            stroke={COLORS.turquoise500}
            strokeWidth={1.5}
            strokeDasharray="2 3"
          />
        ) : null
      )}
      {[
        { cx: 20, y: 40 },
        { cx: 54, y: 24 },
        { cx: 88, y: 56 },
        { cx: 122, y: 32 },
        { cx: 152, y: 44 },
      ].map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.y}
          r={i === 4 ? 10 : 8}
          fill={i === 4 ? COLORS.turquoise500 : COLORS.white}
          stroke={COLORS.graphite}
          strokeWidth={1.3}
        />
      ))}
    </svg>
  );
}

function AgenticRAGSVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      <circle
        cx={80}
        cy={40}
        r={14}
        fill={COLORS.turquoise500}
      />
      <text
        x={80}
        y={44}
        textAnchor="middle"
        fill={COLORS.white}
        fontSize={11}
        fontFamily="monospace"
      >
        agent
      </text>
      {[
        { x: 24, y: 16, label: "search" },
        { x: 24, y: 64, label: "sql" },
        { x: 136, y: 16, label: "docs" },
        { x: 136, y: 64, label: "api" },
      ].map((t, i) => (
        <g key={i}>
          <line
            x1={80}
            y1={40}
            x2={t.x}
            y2={t.y}
            stroke={COLORS.ash}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <rect
            x={t.x - 18}
            y={t.y - 8}
            width={36}
            height={16}
            rx={3}
            fill={COLORS.white}
            stroke={COLORS.line}
          />
          <text
            x={t.x}
            y={t.y + 4}
            textAnchor="middle"
            fill={COLORS.graphite}
            fontSize={9}
            fontFamily="monospace"
          >
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ConstitutionalSVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      <rect
        x={8}
        y={20}
        width={60}
        height={42}
        rx={4}
        fill={COLORS.white}
        stroke={COLORS.line}
      />
      <text
        x={38}
        y={44}
        textAnchor="middle"
        fill={COLORS.ink}
        fontSize={10}
        fontFamily="monospace"
      >
        draft
      </text>
      <path
        d="M 70 40 L 90 40"
        stroke={COLORS.turquoise500}
        strokeWidth={1.4}
        strokeDasharray="3 2"
      />
      <rect
        x={92}
        y={20}
        width={60}
        height={42}
        rx={4}
        fill={COLORS.turquoise50}
        stroke={COLORS.turquoise500}
      />
      <text
        x={122}
        y={40}
        textAnchor="middle"
        fill={COLORS.turquoiseInk}
        fontSize={9}
        fontFamily="monospace"
      >
        critique
      </text>
      <text
        x={122}
        y={54}
        textAnchor="middle"
        fill={COLORS.turquoiseInk}
        fontSize={9}
        fontFamily="monospace"
      >
        + revise
      </text>
    </svg>
  );
}

function MoESVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      <circle cx={20} cy={40} r={6} fill={COLORS.turquoise500} />
      {[
        { cy: 16, on: true },
        { cy: 36, on: false },
        { cy: 56, on: true },
      ].map((e, i) => (
        <g key={i}>
          <line
            x1={26}
            y1={40}
            x2={60}
            y2={e.cy}
            stroke={e.on ? COLORS.turquoise500 : COLORS.line}
            strokeWidth={e.on ? 1.6 : 1}
            strokeDasharray={e.on ? "" : "2 3"}
            opacity={e.on ? 1 : 0.5}
          />
          <rect
            x={60}
            y={e.cy - 8}
            width={48}
            height={16}
            rx={3}
            fill={e.on ? COLORS.turquoise50 : COLORS.white}
            stroke={e.on ? COLORS.turquoise500 : COLORS.line}
          />
          <text
            x={84}
            y={e.cy + 4}
            textAnchor="middle"
            fill={e.on ? COLORS.turquoiseInk : COLORS.ash}
            fontSize={9}
            fontFamily="monospace"
          >
            expert {i + 1}
          </text>
          {e.on && (
            <line
              x1={108}
              y1={e.cy}
              x2={138}
              y2={40}
              stroke={COLORS.turquoise500}
              strokeWidth={1.4}
            />
          )}
        </g>
      ))}
      <circle cx={140} cy={40} r={6} fill={COLORS.turquoiseInk} />
    </svg>
  );
}

function KVCacheSVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={8 + i * 18}
          y={24}
          width={14}
          height={14}
          rx={2}
          fill={i < 6 ? COLORS.turquoise100 : COLORS.white}
          stroke={i < 6 ? COLORS.turquoise500 : COLORS.line}
        />
      ))}
      <text
        x={8 + 3 * 18 + 7}
        y={56}
        textAnchor="middle"
        fill={COLORS.turquoiseInk}
        fontSize={9}
        fontFamily="monospace"
      >
        cached
      </text>
      <text
        x={8 + 7 * 18 + 7}
        y={56}
        textAnchor="middle"
        fill={COLORS.graphite}
        fontSize={9}
        fontFamily="monospace"
      >
        new
      </text>
    </svg>
  );
}

function LoRASVG() {
  return (
    <svg width={160} height={80} viewBox="0 0 160 80">
      <rect
        x={16}
        y={16}
        width={48}
        height={48}
        rx={2}
        fill={COLORS.paper3}
        stroke={COLORS.line}
      />
      <text
        x={40}
        y={44}
        textAnchor="middle"
        fill={COLORS.ash}
        fontSize={11}
        fontFamily="monospace"
      >
        W (frozen)
      </text>
      <text
        x={72}
        y={44}
        textAnchor="middle"
        fill={COLORS.ink}
        fontSize={14}
        fontFamily="monospace"
      >
        +
      </text>
      <rect
        x={82}
        y={26}
        width={20}
        height={28}
        rx={2}
        fill={COLORS.turquoise50}
        stroke={COLORS.turquoise500}
      />
      <text
        x={92}
        y={44}
        textAnchor="middle"
        fill={COLORS.turquoiseInk}
        fontSize={10}
        fontFamily="monospace"
      >
        A
      </text>
      <text
        x={108}
        y={44}
        textAnchor="middle"
        fill={COLORS.ink}
        fontSize={13}
        fontFamily="monospace"
      >
        ×
      </text>
      <rect
        x={116}
        y={26}
        width={28}
        height={28}
        rx={2}
        fill={COLORS.turquoise50}
        stroke={COLORS.turquoise500}
      />
      <text
        x={130}
        y={44}
        textAnchor="middle"
        fill={COLORS.turquoiseInk}
        fontSize={10}
        fontFamily="monospace"
      >
        B
      </text>
      <text
        x={80}
        y={72}
        textAnchor="middle"
        fill={COLORS.ash}
        fontSize={9}
        fontFamily="monospace"
      >
        rank 8 · chỉnh 0.1% tham số
      </text>
    </svg>
  );
}
