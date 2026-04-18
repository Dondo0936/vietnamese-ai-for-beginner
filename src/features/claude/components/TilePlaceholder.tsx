import Link from "next/link";
import { DeepLinkCTA } from "./DeepLinkCTA";
import type { TileMeta } from "@/features/claude/types";

/**
 * Phase 1 body for every tile page. Later phases swap this out with a
 * real DemoCanvas per tile.
 */
export function TilePlaceholder({ tile }: { tile: TileMeta }) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <p className="ds-eyebrow mb-3">
        Cẩm nang Claude · {shelfVi(tile.shelf)}
      </p>
      <h1
        className="font-display text-foreground"
        style={{
          fontWeight: 500,
          fontSize: "clamp(32px, 5vw, 48px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        {tile.viTitle}
      </h1>
      <p className="mt-4 text-[17px] leading-[1.55] text-muted">
        {tile.viTagline}
      </p>

      <section
        className="mt-10 rounded-[14px] border border-border bg-card p-6"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <p className="ds-eyebrow mb-2">Đang xây dựng</p>
        <p className="text-[15px] leading-[1.6] text-foreground">
          Bài hướng dẫn tương tác cho tính năng này đang được soạn. Tạm thời
          bạn có thể mở Claude và thử ngay — tài liệu chính thức của Anthropic
          sẽ hiện ở nút bên dưới.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <DeepLinkCTA prompt={defaultPromptFor(tile.slug)} />
          <Link
            href="/claude"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface"
          >
            ← Xem toàn bộ cẩm nang
          </Link>
        </div>
      </section>
    </div>
  );
}

function shelfVi(shelf: TileMeta["shelf"]) {
  return shelf === "starter"
    ? "Khởi đầu"
    : shelf === "power"
    ? "Nâng cao"
    : "Dành cho nhà phát triển";
}

function defaultPromptFor(slug: string): string {
  return `Tôi muốn học cách dùng tính năng "${slug}" trong Claude. Bạn có thể giới thiệu ngắn và hướng dẫn tôi thử một ví dụ?`;
}
