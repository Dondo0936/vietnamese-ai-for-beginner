# Contributing to AI Cho Mọi Người

Cảm ơn bạn đã quan tâm đến dự án! Mọi đóng góp đều được hoan nghênh -- dù là sửa lỗi chính tả, cải thiện minh họa, hay thêm chủ đề mới.

Thank you for your interest in contributing! Whether it is fixing a typo, improving a visualization, or adding an entirely new topic, every contribution is valued.

---

## How to Contribute

1. **Fork** the repository on GitHub.
2. **Create a branch** for your change:
   ```bash
   git checkout -b feat/my-new-topic
   ```
3. Make your changes and **commit** with a clear message.
4. **Push** your branch and open a **Pull Request** against `main`.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/vietnamese-ai-for-beginner.git
cd vietnamese-ai-for-beginner

# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase credentials (see README.md for details)

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to preview your changes.

## Adding a New Topic

Each topic lives in a single `.tsx` file inside `src/topics/`. Follow these steps:

### 1. Create the topic file

Create `src/topics/your-topic-slug.tsx`. Every topic file follows this structure:

```tsx
"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

// ---- Metadata (must be a named export) ----
export const metadata: TopicMeta = {
  slug: "your-topic-slug",
  title: "Topic Name",
  titleVi: "Tên chủ đề bằng tiếng Việt",
  description: "Mô tả ngắn gọn bằng tiếng Việt",
  category: "neural-fundamentals", // one of the 14 category slugs
  tags: ["tag1", "tag2"],
  difficulty: "beginner", // "beginner" | "intermediate" | "advanced"
  relatedSlugs: ["related-topic-a", "related-topic-b"],
  vizType: "interactive", // "interactive" | "static"
};

// ---- Component (default export) ----
export default function YourTopicTopic() {
  return (
    <>
      {/* Vietnamese real-world analogy */}
      <AnalogyCard>
        <p>Ví dụ liên hệ thực tế bằng tiếng Việt ...</p>
      </AnalogyCard>

      {/* Interactive or static SVG visualization */}
      <VisualizationSection>
        {/* Your SVG / interactive content here */}
      </VisualizationSection>

      {/* Detailed explanation */}
      <ExplanationSection>
        <h3>Cách hoạt động</h3>
        <p>Giải thích chi tiết ...</p>
      </ExplanationSection>
    </>
  );
}
```

### 2. Register the topic

Add your topic's metadata to the `topicList` array in `src/topics/registry.ts`, placing it under the appropriate category section:

```ts
{
  slug: "your-topic-slug",
  title: "Topic Name",
  titleVi: "Tên chủ đề bằng tiếng Việt",
  description: "Mô tả ngắn gọn bằng tiếng Việt",
  category: "neural-fundamentals",
  tags: ["tag1", "tag2"],
  difficulty: "beginner",
  relatedSlugs: ["related-topic-a", "related-topic-b"],
  vizType: "interactive",
},
```

### 3. Verify

- Run `pnpm dev` and navigate to your topic page.
- Confirm the analogy, visualization, and explanation all render correctly.
- Run `pnpm build` to make sure the production build passes.

## Coding Conventions

- **TypeScript** -- all code must be fully typed. Avoid `any`.
- **Tailwind CSS** -- use utility classes; avoid inline styles or custom CSS files.
- **Vietnamese diacritics** -- always use proper dấu in all Vietnamese text (e.g., write "Nền tảng" not "Nen tang"). This is a hard requirement.
- **Component patterns** -- use the `AnalogyCard`, `VisualizationSection`, and `ExplanationSection` wrappers for every topic.
- **File naming** -- topic files use kebab-case matching the slug: `your-topic-slug.tsx`.
- **Imports** -- use `@/` path aliases (e.g., `@/components/topic/AnalogyCard`).

## Pull Request Expectations

When opening a PR, please:

1. **Describe your changes** clearly in the PR description.
2. **Test locally** -- run `pnpm dev` and verify your changes work on both desktop and mobile viewports.
3. **Ensure the build passes** -- run `pnpm build` before submitting.
4. **Keep PRs focused** -- one topic or one feature per PR when possible.

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful, constructive, and kind in all interactions. Harassment, discrimination, or disrespectful behavior will not be tolerated.

Hãy tôn trọng, xây dựng, và thân thiện trong mọi trao đổi. Cảm ơn bạn!
