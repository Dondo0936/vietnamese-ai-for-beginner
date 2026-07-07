# Lesson: ai-for-social-media (AI đăng bài nhiều kênh)

## Goal

Add one new beginner topic page to udemi.tech: `ai-for-social-media`, a Vietnamese lesson teaching the multi-channel social publishing process (one piece of content to five platforms, with verification that catches posts the API claims succeeded). Live URL after deploy: `https://udemi.tech/topics/ai-for-social-media`.

## Context / why

We run this exact process daily (Buffer for Facebook/Threads/X, a video scheduler for YouTube/LinkedIn) and packaged it as a sellable agent skill (`~/Projects/skill-marketplaces/forge/skills/multi-channel-social-ops/` — read its `SKILL.md` and `reference/*.md` for the source material). The lesson translates that process for udemi.tech's beginner audience. A social post promoting this lesson is scheduled separately; the lesson must therefore be complete and self-contained.

## Files to touch

- `src/topics/ai-for-social-media.tsx` — NEW. The lesson. Copy the structure of `src/topics/_template.tsx`; model prose density, section rhythm, and component usage on `src/topics/ai-for-paperwork.tsx` (718 lines; same category, same difficulty, same applied/no-video type).
- `src/topics/registry.ts` — add one `TopicMeta` entry to `topicList` immediately after the `ai-for-paperwork` entry (inside the block that starts at the `// Category 16: applied-ai` comment; note the block actually holds more slugs than the comment's count and the comment is already stale — do NOT edit the comment, just insert the entry).
- `src/topics/topic-loader.tsx` — add one alphabetized line to `topicComponents`: `"ai-for-social-media": dynamic(() => import("@/topics/ai-for-social-media")),` — alphabetically this lands between `"ai-for-science"` and `"ai-for-writing"`.

## Interfaces & contracts

`TopicMeta` (from `src/lib/types.ts`). Use these exact values in BOTH the topic file's `export const metadata` and the registry entry — `src/__tests__/contracts.test.ts` enforces field parity:

```ts
{
  slug: "ai-for-social-media",
  title: "AI for Social Media",
  titleVi: "AI đăng bài nhiều kênh: một nội dung, năm nền tảng",
  description:
    "Dùng AI biến một nội dung thành năm bản đăng riêng cho Facebook, Threads, X, YouTube và LinkedIn. Kèm quy trình kiểm tra giúp bắt bài đăng lỗi ngay cả khi hệ thống báo thành công.",
  category: "applied-ai",
  tags: ["social-media", "automation", "practical", "office", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-paperwork", "getting-started-with-ai"],
  vizType: "interactive",
}
```

- Component: `"use client"` default-export React component, like every topic.
- Use the same import palette as `ai-for-paperwork.tsx`: primitives from `@/components/interactive` (`PredictionGate`, `DragDrop`/`MatchPairs`, `InlineChallenge`, `StepReveal`/`ProgressSteps`, `AhaMoment`, `Callout`, `MiniSummary`, `ToggleCompare`, `MetricReadout`, …), sections from `@/components/topic` (`VisualizationSection`, `ExplanationSection`, `QuizSection`, and `LessonSection`/`TopicLink`/`TabView` if useful), plus `lucide-react` icons and `framer-motion` — all already used by the exemplar. No NEW components and no new package.json dependencies.
- Section ids/headings must be unique within the page (`topic-section-uniqueness.test.ts`).

## Ordered changes

1. Create `src/topics/ai-for-social-media.tsx` with the metadata above and the 8-beat arc below.
2. Register it in `registry.ts` (same field values verbatim).
3. Add the loader line in `topic-loader.tsx`.
4. Run the verification commands.

### Lesson arc (all learner-visible text in Vietnamese, full diacritics, second person "bạn")

1. **HOOK** — open with this question (verbatim or near-verbatim): "Bạn viết một caption thật ưng ý rồi đăng nguyên văn lên năm mạng xã hội. Vì sao trên Facebook bài lại ít người thấy, còn trên X chữ bị cắt mất một nửa?" Use `PredictionGate` to make the learner guess before revealing.
2. **DISCOVER** — interactive beat: learner matches caption traits to platforms (`DragDrop` or `MatchPairs`): link trong caption → Facebook giảm tiếp cận; bài dài → X cắt chữ; chuỗi nhiều đoạn (thread) → Threads/X; khai báo nội dung AI → YouTube.
3. **REVEAL** — the per-platform rule table (an `ExplanationSection` or visual grid):
   - Facebook: caption KHÔNG chứa link. Link để ở bình luận đầu tiên. Caption kết bằng một dòng kiểu "link ở bình luận đầu tiên".
   - Threads và X: viết dạng chuỗi (thread); link chỉ nằm ở đoạn cuối cùng.
   - LinkedIn: link để thẳng trong caption, nền tảng này không phạt.
   - YouTube: tiêu đề và mô tả là hai trường riêng; nếu video có nội dung do AI tạo thì phải bật khai báo (synthetic media disclosure, tức là khai nội dung tổng hợp bằng AI).
   Core message: một nội dung, năm bản đăng riêng. Không bao giờ dùng chung một caption.
4. **DEEPEN** — the pipeline as steps (`StepReveal` or `ProgressSteps`): Soạn bản riêng cho từng kênh → Cổng kiểm tra (QA gate, bộ kiểm tra tự động) → Chạy thử (dry run, chạy giả lập không đăng thật) → Người duyệt → Đăng thật → Đọc lại bản đã lưu. Then tell the true story in a `Callout` (warning) without naming any person: chúng tôi lên lịch một chuỗi bài qua công cụ lên lịch (scheduler); API (cổng giao tiếp giữa các phần mềm) báo thành công; nhưng công cụ đã lặng lẽ bỏ đoạn mở đầu (định đăng 4 đoạn, chỉ lưu 3) và không đính kèm video (video chỉ nằm ở mục "gợi ý"); phát hiện được là nhờ một người mở giao diện soạn thảo lên xem. Follow with `AhaMoment`: "Máy báo 'đã đăng thành công' không có nghĩa bài đăng đúng như bạn muốn. Muốn chắc, phải đọc lại bản mà nền tảng đã lưu và so với bản bạn định đăng."
5. **CHALLENGE** — `InlineChallenge`: show one caption cho Facebook có link ngay trong caption; learner spots the violation.
6. **EXPLAIN** — wiring an AI agent (ví dụ Claude Code) to run the process: agent soạn bài, chạy kiểm tra, chạy thử, rồi DỪNG chờ người duyệt; chế độ chạy tự động không giám sát chỉ được chuẩn bị và dừng ở "chờ duyệt", không bao giờ tự đăng. Lý do: một ngày không đăng thì bù được, một bài đăng hỏng thì không rút lại được.
7. **CONNECT** — liên hệ `ai-for-writing` (dùng AI viết chính nội dung trước khi phân phối) và `ai-for-paperwork`. One sentence noting the process exists as a packaged agent skill for those who want it ready-made (link in sources, not inline).
8. **QUIZ** — `QuizSection`, 4 questions (correct answers marked):
   1. Vì sao không để link trong caption Facebook? → Bài có link trong caption bị giảm tiếp cận; link để ở bình luận đầu tiên.
   2. API báo "đăng thành công" nghĩa là gì? → Chỉ là lệnh đã được nhận; muốn chắc phải đọc lại bản nền tảng đã lưu.
   3. Chế độ tự động không giám sát được phép làm gì? → Soạn bài, kiểm tra, chạy thử, rồi dừng chờ người duyệt. Không tự đăng.
   4. Dùng một caption cho cả năm nền tảng thì sai ở đâu? → Mỗi nền tảng có luật riêng; phải soạn bản riêng cho từng kênh.

Use VN-local examples throughout (fanpage quán cà phê, shop Shopee bán phụ kiện). Gloss each English term once at first use, Vietnamese-primary or English-primary but consistent within the page. In `metadata.sources` (if the field is used by ai-for-paperwork's pattern, mirror it) include: `https://thejackedvibecoder.gumroad.com/l/dbsqr` (the packaged skill) plus any public docs referenced.

## Constraints / do-not-touch

- Do NOT touch `src/lib/paths.ts` (this lesson joins no learning path), any other topic file, `package.json`, or anything outside the three files listed.
- No new npm dependencies. No `CodeBlock` with real credentials or tokens; command examples must be generic.
- Vietnamese prose: no em dashes, no US cultural references, no hype words; "bạn" only.
- Do NOT git commit, push, or deploy. The supervisor ships.

## Acceptance criteria

- [ ] `src/topics/ai-for-social-media.tsx` exists, compiles, renders all 8 beats with at least 3 interactive primitives and a 4-question quiz.
- [ ] Registry entry and topic metadata are field-identical; loader line present and alphabetized.
- [ ] All learner-visible text is Vietnamese with full diacritics.
- [ ] `npm test` green, `npx tsc --noEmit` clean.
- [ ] `pnpm run build` succeeds (static page generated for the new slug).

## Verification commands

```sh
cd /Users/datdo/Projects/ai-edu-v2
npm test
npx tsc --noEmit
pnpm run build 2>&1 | tail -20
grep -c "ai-for-social-media" src/topics/registry.ts src/topics/topic-loader.tsx
```

Sandbox note: if `pnpm run build` fails for sandbox/network reasons unrelated to this change, report the failure verbatim and stop; tests and typecheck must still pass. The supervisor reruns the build outside the sandbox.
