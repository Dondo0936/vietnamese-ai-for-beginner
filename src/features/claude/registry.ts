import type { ShelfKey, ShelfMeta, TileMeta } from "./types";

export const SHELF_ORDER = ["starter", "power", "developer"] as const;

/**
 * Canonical tile slugs — single source of truth.
 * `TileSlug` narrows string keys in `tileBodies` so typos in downstream
 * tile registrations fail at compile time. Keep in sync with the `tiles`
 * array below (enforced by `slug: "…" satisfies TileSlug`).
 */
const TILE_SLUGS = [
  "chat", "projects", "artifacts", "files-vision", "voice", "web-search",
  "claude-design", "chrome", "thinking", "skills", "workspace", "mcp",
  "cowork", "memory", "routines", "dispatch", "claude-code", "tool-use",
  "prompt-caching", "batch", "context", "subagents", "structured", "cicd",
] as const;
export type TileSlug = (typeof TILE_SLUGS)[number];

export const SHELF_META: Record<ShelfKey, ShelfMeta> = {
  starter: {
    key: "starter",
    viTitle: "Khởi đầu",
    viSubtitle: "Những gì bạn thấy trong giờ đầu dùng Claude Desktop.",
    enTitle: "Starter",
  },
  power: {
    key: "power",
    viTitle: "Nâng cao",
    viSubtitle: "Các tính năng mở rộng cho công việc nhiều bước, nhiều nguồn.",
    enTitle: "Power user",
  },
  developer: {
    key: "developer",
    viTitle: "Dành cho nhà phát triển",
    viSubtitle: "Claude Code, API, agent SDK và hạ tầng tự động.",
    enTitle: "Developer",
  },
};

export const tiles: TileMeta[] = [
  // Shelf 1 — Khởi đầu (8)
  { slug: "chat" satisfies TileSlug,          shelf: "starter",   viTitle: "Chat + phản hồi trực tiếp", viTagline: "Token chảy từng chữ một.",                status: "ready" },
  { slug: "projects" satisfies TileSlug,      shelf: "starter",   viTitle: "Workspace (Projects)",      viTagline: "Không gian làm việc dài hạn.",              status: "ready" },
  { slug: "artifacts" satisfies TileSlug,     shelf: "starter",   viTitle: "Artifacts",                 viTagline: "Panel bên phải cho mã, tài liệu, app.",      status: "ready" },
  { slug: "files-vision" satisfies TileSlug,  shelf: "starter",   viTitle: "Files & Vision",            viTagline: "Đọc PDF, ảnh, Excel.",                       status: "ready" },
  { slug: "voice" satisfies TileSlug,         shelf: "starter",   viTitle: "Voice Mode",                viTagline: "Nói chuyện với Claude.",                     status: "ready" },
  { slug: "web-search" satisfies TileSlug,    shelf: "starter",   viTitle: "Web Search",                viTagline: "Thông tin mới nhất, có trích dẫn.",          status: "ready" },
  { slug: "claude-design" satisfies TileSlug, shelf: "starter",   viTitle: "Claude Design",             viTagline: "Slide, prototype, one-pager.",               status: "ready",   badge: "new" },
  { slug: "chrome" satisfies TileSlug,        shelf: "starter",   viTitle: "Claude for Chrome",         viTagline: "Claude đọc trang web bạn đang xem.",         status: "planned" },

  // Shelf 2 — Nâng cao (8)
  { slug: "thinking" satisfies TileSlug,      shelf: "power",     viTitle: "Extended thinking",         viTagline: "Xem Claude suy luận, điều chỉnh độ sâu.",    status: "planned" },
  { slug: "skills" satisfies TileSlug,        shelf: "power",     viTitle: "Skills",                    viTagline: "Lệnh /skill và skill do bạn viết.",          status: "planned" },
  { slug: "workspace" satisfies TileSlug,     shelf: "power",     viTitle: "Workspace",                 viTagline: "Gmail, Drive, Slack, Office trực tiếp.",     status: "planned" },
  { slug: "mcp" satisfies TileSlug,           shelf: "power",     viTitle: "MCP connectors",            viTagline: "Cắm thêm nguồn dữ liệu riêng.",              status: "planned" },
  { slug: "cowork" satisfies TileSlug,        shelf: "power",     viTitle: "Cowork",                    viTagline: "Claude tạm dừng chờ bạn duyệt.",             status: "planned" },
  { slug: "memory" satisfies TileSlug,        shelf: "power",     viTitle: "Memory",                    viTagline: "Ghi nhớ xuyên phiên, xây tri thức.",         status: "planned" },
  { slug: "routines" satisfies TileSlug,      shelf: "power",     viTitle: "Routines",                  viTagline: "Tác vụ chạy định kỳ trên hạ tầng Anthropic.", status: "planned" },
  { slug: "dispatch" satisfies TileSlug,      shelf: "power",     viTitle: "Dispatch + Remote",         viTagline: "Bắt đầu trên điện thoại, tiếp ở desktop.",   status: "planned" },

  // Shelf 3 — Dành cho nhà phát triển (8)
  { slug: "claude-code" satisfies TileSlug,   shelf: "developer", viTitle: "Claude Code",               viTagline: "Terminal, IDE, Desktop, Web.",               status: "planned" },
  { slug: "tool-use" satisfies TileSlug,      shelf: "developer", viTitle: "Tool use",                  viTagline: "Function call, Bash, Computer use.",         status: "planned" },
  { slug: "prompt-caching" satisfies TileSlug,shelf: "developer", viTitle: "Prompt caching",            viTagline: "Cache hệ thống + ngữ cảnh lớn.",             status: "planned" },
  { slug: "batch" satisfies TileSlug,         shelf: "developer", viTitle: "Batch API",                 viTagline: "50% chi phí cho yêu cầu hàng loạt.",         status: "planned" },
  { slug: "context" satisfies TileSlug,       shelf: "developer", viTitle: "Context management",        viTagline: "1M token, compaction, trim.",                status: "planned" },
  { slug: "subagents" satisfies TileSlug,     shelf: "developer", viTitle: "Sub-agents + Agent SDK",    viTagline: "Sinh agent song song.",                      status: "planned" },
  { slug: "structured" satisfies TileSlug,    shelf: "developer", viTitle: "Structured outputs",        viTagline: "JSON schema đảm bảo, citation.",             status: "planned" },
  { slug: "cicd" satisfies TileSlug,          shelf: "developer", viTitle: "Claude in CI/CD",           viTagline: "GitHub Actions, review PR, triage issue.",    status: "planned" },
];

export const shelves: Record<ShelfKey, { meta: ShelfMeta; tiles: TileMeta[] }> =
  Object.fromEntries(
    SHELF_ORDER.map((key) => [
      key,
      { meta: SHELF_META[key], tiles: tiles.filter((t) => t.shelf === key) },
    ])
  ) as Record<ShelfKey, { meta: ShelfMeta; tiles: TileMeta[] }>;

export function findTile(slug: string): TileMeta | undefined {
  return tiles.find((t) => t.slug === slug);
}
