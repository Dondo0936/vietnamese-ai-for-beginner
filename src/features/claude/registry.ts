import type { ShelfKey, ShelfMeta, TileMeta } from "./types";

export const SHELF_ORDER = ["starter", "power", "developer"] as const;

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
  { slug: "chat",          shelf: "starter",   viTitle: "Chat + phản hồi trực tiếp", viTagline: "Token chảy từng chữ một.",                status: "planned" },
  { slug: "projects",      shelf: "starter",   viTitle: "Projects",                  viTagline: "Không gian làm việc dài hạn.",              status: "planned" },
  { slug: "artifacts",     shelf: "starter",   viTitle: "Artifacts",                 viTagline: "Panel bên phải cho mã, tài liệu, app.",      status: "planned" },
  { slug: "files-vision",  shelf: "starter",   viTitle: "Files & Vision",            viTagline: "Đọc PDF, ảnh, Excel.",                       status: "planned" },
  { slug: "voice",         shelf: "starter",   viTitle: "Voice Mode",                viTagline: "Nói chuyện với Claude.",                     status: "planned" },
  { slug: "web-search",    shelf: "starter",   viTitle: "Web Search",                viTagline: "Thông tin mới nhất, có trích dẫn.",          status: "planned" },
  { slug: "claude-design", shelf: "starter",   viTitle: "Claude Design",             viTagline: "Slide, prototype, one-pager.",               status: "planned", badge: "new" },
  { slug: "chrome",        shelf: "starter",   viTitle: "Claude for Chrome",         viTagline: "Claude đọc trang web bạn đang xem.",         status: "planned" },

  // Shelf 2 — Nâng cao (8)
  { slug: "thinking",      shelf: "power",     viTitle: "Extended thinking",         viTagline: "Xem Claude suy luận, điều chỉnh độ sâu.",    status: "planned" },
  { slug: "skills",        shelf: "power",     viTitle: "Skills",                    viTagline: "Lệnh /skill và skill do bạn viết.",          status: "planned" },
  { slug: "workspace",     shelf: "power",     viTitle: "Workspace",                 viTagline: "Gmail, Drive, Slack, Office trực tiếp.",     status: "planned" },
  { slug: "mcp",           shelf: "power",     viTitle: "MCP connectors",            viTagline: "Cắm thêm nguồn dữ liệu riêng.",              status: "planned" },
  { slug: "cowork",        shelf: "power",     viTitle: "Cowork",                    viTagline: "Claude tạm dừng chờ bạn duyệt.",             status: "planned" },
  { slug: "memory",        shelf: "power",     viTitle: "Memory",                    viTagline: "Ghi nhớ xuyên phiên, xây tri thức.",         status: "planned" },
  { slug: "routines",      shelf: "power",     viTitle: "Routines",                  viTagline: "Tác vụ chạy định kỳ trên hạ tầng Anthropic.", status: "planned" },
  { slug: "dispatch",      shelf: "power",     viTitle: "Dispatch + Remote",         viTagline: "Bắt đầu trên điện thoại, tiếp ở desktop.",   status: "planned" },

  // Shelf 3 — Dành cho nhà phát triển (8)
  { slug: "claude-code",   shelf: "developer", viTitle: "Claude Code",               viTagline: "Terminal, IDE, Desktop, Web.",               status: "planned" },
  { slug: "tool-use",      shelf: "developer", viTitle: "Tool use",                  viTagline: "Function call, Bash, Computer use.",         status: "planned" },
  { slug: "prompt-caching",shelf: "developer", viTitle: "Prompt caching",            viTagline: "Cache hệ thống + ngữ cảnh lớn.",             status: "planned" },
  { slug: "batch",         shelf: "developer", viTitle: "Batch API",                 viTagline: "50% chi phí cho yêu cầu hàng loạt.",         status: "planned" },
  { slug: "context",       shelf: "developer", viTitle: "Context management",        viTagline: "1M token, compaction, trim.",                status: "planned" },
  { slug: "subagents",     shelf: "developer", viTitle: "Sub-agents + Agent SDK",    viTagline: "Sinh agent song song.",                      status: "planned" },
  { slug: "structured",    shelf: "developer", viTitle: "Structured outputs",        viTagline: "JSON schema đảm bảo, citation.",             status: "planned" },
  { slug: "cicd",          shelf: "developer", viTitle: "Claude in CI/CD",           viTagline: "GitHub Actions, review PR, triage issue.",    status: "planned" },
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
