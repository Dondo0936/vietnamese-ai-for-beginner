# AI Cho Mọi Người

[![Build Status](https://img.shields.io/github/actions/workflow/status/Dondo0936/vietnamese-ai-for-beginner/ci.yml?branch=main&style=flat-square)](https://github.com/Dondo0936/vietnamese-ai-for-beginner/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Topics](https://img.shields.io/badge/Ch%E1%BB%A7%20%C4%91%E1%BB%81-158-brightgreen?style=flat-square)](#features)

**Ứng dụng giáo dục AI/ML bằng tiếng Việt** -- Học 158 chủ đề trí tuệ nhân tạo qua hình ảnh tương tác và ví dụ liên hệ thực tế Việt Nam.

**An open-source Vietnamese-language educational app** for learning AI and machine learning through interactive visualizations and real-world analogies.

[Live Demo](https://ai-edu-app.vercel.app) | [Contribute](CONTRIBUTING.md)

![Screenshot](screenshot.png)

---

## Features

- **158 chủ đề AI/ML** across **14 danh mục** -- from neural network fundamentals to emerging trends in 2025--2026
- **Minh họa SVG tương tác** -- 96 interactive and 62 static visualizations that let you experiment with concepts hands-on
- **Ví dụ liên hệ thực tế Việt Nam** for every concept, making abstract ideas concrete and memorable
- **Tìm kiếm mờ (fuzzy search)** supporting both Vietnamese and English queries
- **Lọc theo độ khó** -- Cơ bản / Trung bình / Nâng cao
- **Bookmark & tiến độ đọc** -- track what you have read and save topics for later (powered by Supabase)
- **Thiết kế responsive** -- works on mobile, tablet, and desktop

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Search | [Fuse.js](https://www.fusejs.io/) |
| Backend & Auth | [Supabase](https://supabase.com/) |
| Hosting | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- A free [Supabase](https://supabase.com/) account

### Installation

```bash
# Clone the repository
git clone https://github.com/Dondo0936/vietnamese-ai-for-beginner.git
cd vietnamese-ai-for-beginner

# Install dependencies
pnpm install
```

### Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Enable **Anonymous Auth** under Authentication > Providers
3. Run the following SQL in the Supabase SQL Editor to create the required tables:

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
  using (auth.uid() = user_id);

create policy "Users can upsert own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on user_progress for update
  using (auth.uid() = user_id);
```

### Environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Supabase project URL and anonymous key (found under Settings > API in your Supabase dashboard).

### Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
  app/            # Next.js App Router pages and layouts
    bookmarks/    # Bookmarks page
    topics/       # Topic detail pages
  components/     # Reusable UI components
    home/         # Homepage components (search, category grid)
    layout/       # Layout shell (header, footer)
    topic/        # Topic page components (AnalogyCard, VisualizationSection, ...)
    ui/           # Shared UI primitives
  lib/            # Utilities, types, Supabase client, search config
  topics/         # 158 topic modules (one .tsx per topic) + registry.ts
```

Each topic file in `src/topics/` exports a `metadata` object (`TopicMeta`) and a default React component that uses `AnalogyCard`, `VisualizationSection`, and `ExplanationSection` to present the content.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the development workflow, how to add new topics, and coding conventions.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Credits

Created by **Tien Dat Do** ([@Dondo0936](https://github.com/Dondo0936))

Topic content and visualizations powered by [Claude](https://claude.ai/) (Anthropic).
