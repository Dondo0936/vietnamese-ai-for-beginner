# AI cho mọi người

[![Website](https://img.shields.io/badge/Website-udemi.tech-20B8B0?style=flat-square)](https://udemi.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Topics](https://img.shields.io/badge/Ch%E1%BB%A7%20%C4%91%E1%BB%81-260%2B-20B8B0?style=flat-square)](#nội-dung)
[![Paths](https://img.shields.io/badge/L%E1%BB%99%20tr%C3%ACnh-4-178F89?style=flat-square)](#bốn-lộ-trình-học)

> **Học AI và học máy bằng tiếng Việt — qua hình ảnh tương tác và ví dụ thực tế.**
>
> Nền tảng giáo dục AI/ML mã nguồn mở, tập trung vào minh hoạ tương tác thay vì những bức tường chữ.

**[→ Mở app ngay tại udemi.tech](https://udemi.tech)**

---

## Demo

<p align="center">
  <a href="https://udemi.tech/demo.mp4">
    <img src="./public/demo.gif" alt="Demo — AI cho mọi người" width="820" />
  </a>
</p>

<p align="center">
  <em>
    30 giây · 8 cảnh · render bằng <a href="https://www.remotion.dev/">Remotion 4</a> với cùng bảng màu, typography và diacritics tiếng Việt như app.
    <br />
    Bấm vào GIF để xem bản <strong>MP4 độ nét cao</strong> tại
    <a href="https://udemi.tech/demo.mp4">udemi.tech/demo.mp4</a> (tiện đăng LinkedIn / X / Facebook).
  </em>
</p>

---

## Tóm tắt nhanh

- **260+ chủ đề AI/ML** trải khắp **bốn lộ trình**: Học sinh · Sinh viên, Nhân viên văn phòng, AI Engineer, AI Researcher.
- Nội dung **viết lại cho người Việt** — ẩn dụ đời thường (chợ, phở, Grab, Shopee…), ví dụ từ doanh nghiệp Việt (Techcombank, VinBrain, MoMo, Tiki…), diacritics chuẩn.
- Mọi bài học đều **tương tác** — slider, drag-drop, toggle-compare, match-pairs, SVG thủ công, animated counter. Chữ chỉ là phần phụ.
- Stack hiện đại: **Next.js 16 + Turbopack**, React 19, Supabase (xác thực + tiến độ), Tailwind v4, Framer Motion.
- Triển khai trên **Vercel** với **Speed Insights + Analytics**.
- Video demo trong repo được dựng bằng **Remotion 4** — tôn trọng đúng design system của app.

---

## Tính năng

- **260+ chủ đề** trải từ nền tảng ML đến xu hướng 2026 (reasoning models, RAG, agentic, MoE, diffusion, alignment, long-context…).
- **Bốn lộ trình có hướng dẫn** (`/paths/*`) — tự ghép thứ tự bài trước/sau, có mục tiêu + thời lượng rõ ràng.
- **Ưu tiên trực quan** — slider, drag-drop, toggle-compare, match-pairs, sort-challenge, fill-blank, custom SVG, Framer Motion.
- **Tìm kiếm mờ (fuzzy search)** song ngữ Việt–Anh qua Fuse.js — gõ tắt, bỏ dấu, sai chính tả vẫn ra đúng chủ đề.
- **Bookmark + tiến độ đọc** lưu qua Supabase (xác thực ẩn danh).
- **Cẩm nang Claude** tại `/claude` — hướng dẫn chuyên sâu cho Claude Code và Claude.ai.
- **Ứng dụng thực tế** cho mọi khái niệm (ChatGPT, Claude, Gemini, Copilot, Jasper, Notion AI, o1…).
- **Responsive** trên mobile/tablet/desktop, tôn trọng `prefers-reduced-motion`.
- **Accessibility**: skip-link, reading progress bar, command palette hỗ trợ bàn phím, scroll-reveal tự tắt khi reduced motion.

### Nội dung

- 260+ topic trong `src/topics/*.tsx` — mỗi file là một component `"use client"` kèm `metadata` riêng.
- 47 primitive tương tác trong `src/components/interactive/` — `SliderGroup`, `ToggleCompare`, `DragDrop`, `MatchPairs`, `PredictionGate`, `AhaMoment`, `InlineChallenge`, `QuizSection`…
- 7 component `Application*` trong `src/components/application/` — dùng cho các bài học "case study thực tế".

### Bốn lộ trình học

Tất cả định nghĩa ở `src/lib/paths.ts`, trang đầu vào ở `src/app/paths/*/page.tsx`.

| Lộ trình | Trọng tâm | Thời lượng ước tính |
| --- | --- | --- |
| **Học sinh · Sinh viên** | Toán nền tảng, ML cơ bản, mạng nơ-ron, kỹ năng thực hành | ~52 giờ |
| **Nhân viên văn phòng** | Prompt, ứng dụng thực tế, an toàn & đạo đức, ứng dụng ngành | ~24 giờ |
| **AI Engineer** | Kiến trúc, LLM & NLP, fine-tuning, RAG & agents, MLOps, đánh giá, an toàn | ~110 giờ |
| **AI Researcher** | Lý thuyết sâu, kiến trúc tiên tiến, NLP & multimodal, alignment, RL, xu hướng mới | ~92 giờ |

Lộ trình **Văn phòng** được viết riêng cho người không lập trình: không code, không công thức toán, 50–70% JSX là hình ảnh tương tác.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Runtime | React 19 + TypeScript 5 |
| Giao diện | [Tailwind v4](https://tailwindcss.com/) + CSS variables (design tokens kiểu Perplexity × MoMo) |
| Animation | [Framer Motion 12](https://www.framer.com/motion/) |
| Tìm kiếm | [Fuse.js 7](https://www.fusejs.io/) |
| Công thức toán | [KaTeX](https://katex.org/) (chỉ dùng trong lộ trình Học sinh / Researcher) |
| Backend & Auth | [Supabase](https://supabase.com/) (xác thực ẩn danh + bảng `user_progress` + RLS) |
| Hosting | [Vercel](https://vercel.com/) — Fluid Compute + Speed Insights + Analytics |
| Video demo | [Remotion 4](https://www.remotion.dev/) (thư mục `remotion/`) |
| Kiểm thử | [Vitest](https://vitest.dev/) + Testing Library |

---

## Bắt đầu

### Yêu cầu

- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/)
- Một dự án [Supabase](https://supabase.com/) miễn phí

### Cài đặt

```bash
git clone https://github.com/Dondo0936/vietnamese-ai-for-beginner.git
cd vietnamese-ai-for-beginner
pnpm install
```

### Cấu hình Supabase

1. Tạo dự án mới tại [supabase.com](https://supabase.com/).
2. Bật **Anonymous Auth** tại *Authentication → Providers*.
3. Chạy đoạn SQL này trong **SQL Editor** (một lần duy nhất):

   ```sql
   create table if not exists user_progress (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users(id) on delete cascade,
     read_topics text[] default '{}',
     bookmarks text[] default '{}',
     last_visited text,
     updated_at timestamptz default now()
   );

   alter table user_progress enable row level security;

   create policy "Users can read own progress"
     on user_progress for select
     using ((select auth.uid()) = user_id);

   create policy "Users can insert own progress"
     on user_progress for insert
     with check ((select auth.uid()) = user_id);

   create policy "Users can update own progress"
     on user_progress for update
     using ((select auth.uid()) = user_id);
   ```

   > Viết `(select auth.uid())` thay vì `auth.uid()` để tránh bị `initplan` cảnh báo trên Supabase Advisor (hàm không bị re-eval theo từng dòng).

4. Copy file biến môi trường và điền vào:

   ```bash
   cp .env.local.example .env.local
   ```

   Vào Supabase **Settings → API** để lấy project URL + anon key.

### Chạy

```bash
pnpm dev          # http://localhost:3000
pnpm build        # build production
pnpm test         # chạy vitest
pnpm lint         # eslint
```

### Video demo (Remotion)

```bash
pnpm demo:studio   # mở Remotion Studio để xem trực tiếp và chỉnh cảnh
pnpm demo:render   # render public/demo.mp4
pnpm demo:poster   # render public/demo-poster.png (ảnh đại diện)
```

Muốn tự tạo GIF cho README từ MP4 vừa render:

```bash
ffmpeg -y -i public/demo.mp4 -vf "fps=10,scale=560:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=48:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" public/demo.gif
```

---

## Cấu trúc dự án

```
remotion/
  index.ts                  # entry cho Remotion CLI
  Root.tsx                  # đăng ký DemoComposition
  DemoComposition.tsx       # xâu 8 cảnh lại bằng TransitionSeries
  scenes/                   # Hero · Paths · Search · Lesson · DragDrop ·
                            # Quiz · Community · Outro
  components/               # LiquidBackground · GlassPanel · AnimatedIn
  tokens.ts                 # palette + FPS + resolution
                            #   (đồng bộ với src/app/globals.css)
  fonts.ts                  # @remotion/google-fonts tải đúng 4 font app đang
                            # dùng (Space Grotesk, Inter Tight, Fraunces,
                            # JetBrains Mono — có subset "vietnamese")

src/
  app/                      # Next.js App Router
    paths/                  # /paths/{student,office,ai-engineer,ai-researcher}
    topics/[slug]/          # trang chi tiết chủ đề (dynamic)
    claude/                 # Cẩm nang Claude Code & Claude.ai
    bookmarks/, progress/   # trang cá nhân
    layout.tsx              # font + Analytics + SpeedInsights
  components/
    application/            # ApplicationLayout, Hero, Metric, Beat…
    interactive/            # PredictionGate, ToggleCompare, DragDrop,
                            # SliderGroup…
    topic/                  # TopicLayout, VisualizationSection,
                            # ExplanationSection, QuizSection
    paths/                  # LearningPathPage, LearningObjectivesModal
    ui/                     # Tag, ReadingProgressBar, Skeleton…
  features/claude/          # Tile + gating cho Cẩm nang Claude
  lib/
    paths.ts                # 4 registry lộ trình + điều hướng bài trước/sau
    types.ts                # TopicMeta + kiểu dữ liệu chung
    database.ts             # Supabase client + helper
                            # markTopicRead/bookmark
    theme.tsx               # ThemeProvider sáng/tối
  topics/
    *.tsx                   # 260+ module chủ đề
    registry.ts             # chỉ mục slug → metadata
    topic-loader.tsx        # dynamic import giữ SSR
```

Mọi file chủ đề đều export hai thứ:

```tsx
export const metadata: TopicMeta = {
  slug, title, titleVi, description, category, tags, difficulty,
  relatedSlugs, vizType,
  // optional: applicationOf, featuredApp, sources, tocSections
};

export default function TopicComponent() {
  /* Bố cục 8 bước của một bài học */
}
```

Bố cục 8 bước chuẩn của project:

```
PredictionGate  →  prose + ẩn dụ  →  VisualizationSection
              →  AhaMoment  →  InlineChallenge
              →  ExplanationSection  →  MiniSummary  →  QuizSection
```

---

## Quy ước

- **Lộ trình Văn phòng** KHÔNG được import `CodeBlock` hoặc `LaTeX` — người đọc không lập trình và không đọc công thức.
- **Không viết "Tổng quan LLM"** — người Việt nói đơn giản là "LLM" hoặc "mô hình AI".
- **Link từ concept sang application** hiển thị ở **CUỐI** trang bài học (xem `src/components/topic/TopicLayout.tsx`), không phải đầu trang.
- **Mọi subagent** dispatch trên repo này đều dùng Opus-class model (xem `AGENTS.md`).
- **Mỗi lần ship** phải push lên GitHub *và* chạy `vercel deploy --prod --yes`, rồi curl URL production để đảm bảo status 200. Auto-sync của Vercel không ổn định với repo này.

Đầy đủ quy ước ở `AGENTS.md` + [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Trước khi viết nội dung mới:

1. Đọc `src/topics/_template.tsx` để nắm bố cục 8 bước.
2. Chọn primitive có sẵn trong `src/components/interactive/index.ts`; tránh thêm primitive mới trừ khi thực sự cần.
3. Chạy `pnpm lint && pnpm test && pnpm build` trên máy trước khi push.

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy trình đầy đủ, quy ước code, và hướng dẫn viết chủ đề mới.

---

## Giấy phép

MIT — xem [LICENSE](LICENSE).

---

## Ghi công

Phát triển bởi [**@Dondo0936**](https://github.com/Dondo0936).

Nội dung chủ đề, trực quan hoá, bản viết lại lộ trình Văn phòng, và composition Remotion được xây cùng [Claude Opus 4.7](https://claude.ai/) (Anthropic).

Hệ token thiết kế lấy cảm hứng từ bảng giấy của Perplexity và hệ accent của MoMo.
