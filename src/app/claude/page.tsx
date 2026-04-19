import { SHELF_ORDER, shelves } from "@/features/claude/registry";
import { ShelfGrid } from "@/features/claude/components/ShelfGrid";

export default function ClaudeHub() {
  return (
    <main>
      <header className="mx-auto max-w-[720px] px-4 pt-16 pb-10 text-center">
        <p className="ds-eyebrow mb-3">Cẩm nang Claude · Tiếng Việt</p>
        <h1
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: "clamp(40px, 6.4vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Mọi tính năng Claude, dạy bằng ví dụ.
        </h1>
        <p className="mt-5 text-[17px] leading-[1.55] text-muted">
          24 bài hướng dẫn trực quan. Mỗi bài là một mô phỏng giao diện Claude
          Desktop, có chú thích tiếng Việt, đọc xong là dùng được ngay.
        </p>

        {/* Honest disclosure — surfaced as its own line so it isn't buried.
            Sighted users see a "Mô phỏng" badge on every shell (via
            ClaudeDesktopShell); this line tells them why it's there. */}
        <p
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-3 py-1 text-[12px] text-tertiary"
          style={{ lineHeight: 1.45 }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--turquoise-ink, #13343B)" }}
          />
          Các giao diện dưới đây là bản mô phỏng để minh họa — ứng dụng Claude
          thật có thể khác đôi chút. Mỗi bài có liên kết tới trang gốc của
          Anthropic.
        </p>
      </header>

      {SHELF_ORDER.map((key, i) => (
        <ShelfGrid
          key={key}
          shelf={shelves[key].meta}
          tiles={shelves[key].tiles}
          index={i + 1}
        />
      ))}
    </main>
  );
}
