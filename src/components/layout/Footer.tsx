import Link from "next/link";
import FeedbackLink from "@/components/feedback/FeedbackLink";

/**
 * Site footer — paper-first, multi-column brand layout used on all
 * AppShell pages (topics, paths, browse, progress, etc.).
 *
 * Matches LandingFooter visually but stays separate so landing can
 * keep its bespoke `ld-foot` classes; this component stays Tailwind
 * inline so the topic/path bundles don't pull in landing.css.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-16 pb-9">
        {/* Top row: brand + 4 column link grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2.2fr] gap-10 pb-10 border-b border-border">
          <div className="flex items-start gap-3">
            <span
              className="relative inline-block h-4 w-4 mt-1"
              aria-hidden="true"
            >
              <span className="absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rounded-[1px] bg-accent" />
              <span className="absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rotate-45 rounded-[1px] bg-accent" />
              <span className="absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rotate-90 rounded-[1px] bg-accent" />
              <span className="absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rotate-[135deg] rounded-[1px] bg-accent" />
            </span>
            <div className="flex flex-col gap-1">
              <b className="font-display text-[19px] font-medium tracking-[-0.01em] text-foreground">
                udemi.tech
              </b>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tertiary">
                AI cho mọi người · tiếng Việt
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <FooterCol
              title="Lộ trình"
              links={[
                { href: "/paths/student", label: "Học sinh · SV" },
                { href: "/paths/office", label: "Văn phòng" },
                { href: "/paths/ai-engineer", label: "AI Engineer" },
                { href: "/paths/ai-researcher", label: "AI Researcher" },
              ]}
            />
            <FooterCol
              title="Nội dung"
              links={[
                { href: "/browse", label: "Tất cả chủ đề" },
                { href: "/claude", label: "Cẩm nang Claude" },
                { href: "/bookmarks", label: "Đã lưu" },
                { href: "/progress", label: "Tiến độ" },
              ]}
            />
            <FooterCol
              title="Cộng đồng"
              links={[
                {
                  href: "https://github.com/Dondo0936/vietnamese-ai-for-beginner",
                  label: "GitHub ↗",
                  external: true,
                },
                {
                  href: "https://github.com/Dondo0936/vietnamese-ai-for-beginner/blob/main/CONTRIBUTING.md",
                  label: "Đóng góp bài",
                  external: true,
                },
              ]}
              extraSlot={
                <FeedbackLink className="block mb-2 text-[14px] text-foreground no-underline hover:text-accent text-left" />
              }
            />
            <FooterCol
              title="Giới thiệu"
              links={[
                { href: "/#process", label: "Triết lý" },
                { href: "/claude", label: "Hệ thiết kế" },
              ]}
            />
          </div>
        </div>

        {/* Bottom row: copyright + stack */}
        <div className="pt-7 flex flex-col sm:flex-row gap-3 justify-between font-mono text-[11px] text-tertiary">
          <span>© 2026 @Dondo0936 · MIT License</span>
          <span>
            Stack mở · Next.js 16 · React 19 · Supabase · Tailwind v4 · không
            tracking
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  extraSlot,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
  extraSlot?: React.ReactNode;
}) {
  return (
    <div>
      <h5 className="mb-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-tertiary font-medium">
        {title}
      </h5>
      {links.map((link) =>
        link.external ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="block mb-2 text-[14px] text-foreground no-underline hover:text-accent"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className="block mb-2 text-[14px] text-foreground no-underline hover:text-accent"
          >
            {link.label}
          </Link>
        )
      )}
      {extraSlot}
    </div>
  );
}
