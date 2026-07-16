# Spec: new topic page `ai-for-customer-replies`

## Goal

Create a new interactive lesson page at `src/topics/ai-for-customer-replies.tsx`
(route `/topics/ai-for-customer-replies`) teaching small-shop owners (SH
persona) to draft fast, warm, accurate customer-message replies with AI,
using the site's standard 8-step lesson pattern. Register it in
`src/topics/registry.ts`. This spec covers ONLY the page — no video, no
Remotion, no social copy, no queue.json (a separate spec handles those
after this page ships).

## Context / why

This is the Sat 07-12 slot of the "Làm thật một việc với AI" beginner
series (`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`).
Persona **chủ shop (SH)**. Hook: "Khách nhắn lúc 11 giờ đêm, ai trả lời?" —
the anchor longform's "tin nhắn" follow-up (same loop: gõ yêu cầu → đọc →
chỉnh, bản giao việc 5 phần, applied to replying to a customer DM instead
of writing an email).

Two close structural exemplars, both already read in full this session:
`src/topics/ai-for-writing.tsx` (practical/skills page pattern: Predict →
Analogy → 3 interactive demos → Aha → 2 Challenges → Explain
tools/workflow/pitfalls/templates → Summary → Quiz, `TOTAL_STEPS = 8`) and
`src/topics/ai-for-data-analysis.tsx` (same pattern, different domain).
Follow `ai-for-writing.tsx`'s exact shape and imports; do NOT use the
`ApplicationX`/`sources`/`Metric` pattern (that's for `applicationOf`
pages like `sentiment-analysis-in-brand-monitoring`, not applicable here —
this is a practical skills topic, no external company/product citations
needed).

**Real grounding — three actual ChatGPT exchanges captured this session
(2026-07-08/09), reuse this exact content in the page's demos (do not
invent different examples; the companion video for this same lesson will
reuse the same transcripts, so page and video must agree):**

Customer message used throughout: `"Chị ơi áo dài tay màu be còn size M
không ạ? Mai e cần gấp ạ"` (Zalo/Messenger style, sent 23:00).

Real reply A (vague ask "Trả lời giúp tôi khách này", no message pasted) —
AI asks for the actual message before it can help:
```
Chắc chắn rồi. Hãy gửi cho tôi tin nhắn của khách (hoặc chụp màn hình cuộc trò chuyện) và cho biết bạn muốn trả lời theo phong cách nào, ví dụ:
- Lịch sự, chuyên nghiệp
- Thân thiện, gần gũi
- Cứng rắn nhưng khéo léo
- Thuyết phục để chốt đơn
Tôi sẽ soạn giúp bạn câu trả lời phù hợp.
```

Real reply B (message pasted, generic ask, no context about actual stock) —
two generic hedge-templates, neither confirms real stock:
```
Bạn có thể trả lời lịch sự và tạo cảm giác hỗ trợ khách như sau (nếu còn hàng):
"Dạ chị ơi, áo dài tay màu be bên em còn size M ạ. Nếu chị cần gấp để nhận mai thì chị chốt đơn sớm giúp em nhé, em sẽ ưu tiên xử lý và gửi sớm nhất có thể ạ."

Nếu không chắc còn hàng, bạn có thể nhắn:
"Dạ để em kiểm tra ngay giúp chị xem áo dài tay màu be còn size M không ạ. Chị đợi em 1-2 phút nhé. Nếu còn, em sẽ hỗ trợ lên đơn gấp để chị kịp nhận mai ạ."
```

Real reply C (full 5-part giao việc prompt: vai trò chủ shop, nhiệm vụ trả
lời + chốt đơn, bối cảnh còn đúng 2 áo màu be size M giao 2 ngày qua GHTK,
định dạng tin nhắn ngắn thân thiện có emoji, giọng văn không cứng nhắc) —
confident, specific, closes the sale:
```
Chào em, sáng chị mới thấy tin nhắn của em nè 🥰 Áo dài tay màu be size M vẫn còn nhé, hiện còn đúng 2 chiếc thôi. Chị lên đơn ngay hôm nay để GHTK giao sớm cho em nha, em chốt lấy 1 hay 2 áo giúp chị nhé? 😊
```

Use these three verbatim (reply C may be lightly reformatted for the
`ToggleCompare`/gallery components but the WORDS must not change) in the
page's demo section — this keeps the page and the upcoming video honest
about being the same real interaction, not two different invented examples.

## Files to touch

Create:
- `AI_EDU/src/topics/ai-for-customer-replies.tsx` — the full page.

Modify:
- `AI_EDU/src/topics/registry.ts` — append ONE entry (metadata mirror,
  same shape as the `ai-for-writing` / `ai-for-data-analysis` entries
  already there — read them for the exact field set) as the LAST element
  of the topics array. Field values must be byte-identical to the
  `metadata` export in the new .tsx file (this is an enforced contract,
  see `docs/CONTRACTS.md` "registry/topic metadata parity" and its test in
  `src/__tests__/contracts.test.ts`).

Do not touch any other file. No queue.json, no remotion/, no copy/ files
in this spec — those come in a follow-up spec after this page is live.

## Interfaces & contracts

### Metadata (exact values, put in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "ai-for-customer-replies",
  title: "AI for Customer Replies",
  titleVi: "AI trả lời tin nhắn khách hàng nhanh và đúng",
  description:
    "Soạn tin nhắn trả lời khách đến bất kể giờ nào, giữ đúng giọng shop và chốt đơn tự nhiên, không cứng nhắc như trả lời tự động.",
  category: "applied-ai",
  tags: ["customer-service", "messaging", "practical", "shop"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "prompt-engineering", "getting-started-with-ai"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same `LessonSection`/`PredictionGate`/`InlineChallenge`/
`AhaMoment`/`MiniSummary`/`QuizSection`/`TopicLink` imports as
`ai-for-writing.tsx`. Do NOT import anything from
`@/components/application/*` (that family is for `ApplicationX` pages
only).

### Page structure (8 steps, mirrors `ai-for-writing.tsx`'s shape exactly)

**Step 1, Predict** (`PredictionGate`): question along the lines of "Khách
nhắn hỏi mua hàng lúc 11 giờ đêm. Nếu shop trả lời trong vài phút thay vì
để sang hôm sau, điều gì thường xảy ra?" — 4 options, correct answer about
khách vẫn còn hứng thú mua / tỉ lệ chốt đơn cao hơn nhiều so với để nguội
qua đêm (phrase this as a plausible, non-fabricated-statistic framing —
"nhiều khả năng chốt đơn hơn hẳn", not an invented precise percentage with
a fake source, since this page has no `sources` array to back a number).
Explanation ties to: khách nhắn giờ nào cũng cần một câu trả lời nhanh,
đúng và thân thiện, không phải một khung giờ hành chính.

**Step 2, Analogy** (rebuilt card, same shape as `ai-for-writing.tsx`'s
"AI viết giống một thư ký soạn thảo" block): AI trả lời tin nhắn giống một
nhân viên trực đêm biết đọc kỹ tin nhắn khách và soạn sẵn câu trả lời, nhưng
chủ shop vẫn là người xem lại số lượng hàng thật và bấm gửi. 3 mini-cards:
`Khách nhắn` / `AI soạn sẵn` / `Bạn duyệt và gửi`.

**Step 3, Explore** (`VisualizationSection`, 3 demos, same shape as
`ai-for-writing.tsx`):
- **Demo 1**: `ToggleCompare` (or an equivalent side-by-side using the
  house `ToggleCompare` primitive), labelA "Trả lời chung chung" / labelB
  "Trả lời có bối cảnh thật", childA = Real reply B's FIRST hedge template
  (verbatim), childB = Real reply C (verbatim). Description line: "Cùng
  một tin nhắn khách, một bản đoán mò còn hàng hay không, một bản biết
  chắc còn đúng 2 áo."
- **Demo 2**: an interactive picker (mirrors `EmailDrafterDemo`'s
  state-driven card pattern, adapted: pick "tình huống khách" from 3-4
  options — hỏi còn hàng / hỏi ship bao lâu / hỏi giảm giá / phàn nàn giao
  chậm — and "giọng trả lời" from 2-3 options — thân thiện / lịch sự
  chuyên nghiệp — output card re-renders a short reply for that
  combination). Synthesize plausible short replies for the non-real
  combinations (clearly a demo/practice tool, not claimed as a captured
  transcript) — keep them short, natural, no invented statistics.
- **Demo 3**: `TabView` gallery, same shape as `UseCaseGalleryDemo`, 4-5
  tabs of common shop-message situations (hỏi còn hàng, hỏi ship, xin giảm
  giá, phàn nàn giao chậm, hỏi cách phối đồ) each with a short scenario +
  a synthesized sample reply (again, clearly a practice gallery, not
  claimed as real transcripts — only the three quoted transcripts above
  are real).
- Closing `Callout` (variant "tip"), 3 observations, same rhythm as
  `ai-for-writing.tsx`'s: giọng đổi theo lựa chọn; khi có đủ bối cảnh AI
  không cần "thông minh" chỉ cần trình bày đúng; mỗi loại tin nhắn có một
  khuôn riêng.

**Step 4, Aha** (`AhaMoment`): AI trả lời nhanh, nhưng "nhanh" không phải
giá trị chính, giá trị chính là trả lời ĐÚNG bối cảnh thật (còn hàng hay
không, giao được lúc nào) NGAY CẢ lúc bạn đang ngủ hoặc bận tay. AI không
thay bạn kiểm kho, chỉ giúp bạn không bỏ lỡ khách vì chưa kịp gõ chữ.

**Step 5, Challenge** (2× `InlineChallenge`):
1. Question about what a vague ask like "Trả lời giúp tôi khách này" is
   missing (correct: bối cảnh thật, còn hàng hay không, số lượng, thời
   gian giao) — mirrors the real reply A behavior above.
2. Question about a risk case: AI trả lời "chắc chắn còn hàng" nhưng thực
   tế đã hết, khách đặt xong mới báo hết hàng — correct answer: luôn xác
   nhận số lượng thật trước khi để AI khẳng định còn hàng; đừng để AI đoán
   tồn kho.

**Step 6, Explain** (`ExplanationSection`, same rhythm as
`ai-for-writing.tsx`'s tools/workflow/pitfalls/templates blocks):
- 4-5 công cụ nhắn tin AI dùng được cho chủ shop VN (ChatGPT free, Zalo
  OA có trợ lý AI, các nền tảng chatbot bán hàng phổ biến — keep vague/
  general, no specific pricing claims that could go stale or need a
  citation this page doesn't have).
- Vòng lặp 4 bước tương tự: Khách nhắn → AI soạn → Bạn kiểm hàng thật →
  Gửi.
- 4 cái bẫy: AI đoán tồn kho (bẫy nguy hiểm nhất, nhấn mạnh); giọng quá
  trang trọng cho khách quen; trả lời chậm vì phải mở app AI riêng (giải
  pháp: soạn khuôn có sẵn để dán nhanh); quên chốt đơn rõ ràng (thiếu câu
  hỏi cuối để khách trả lời có/không).
- **4 khuôn prompt copy được ngay** (same card grid as `ai-for-writing`'s
  4-template block), themed for shop replies: A. Hỏi còn hàng, B. Hỏi ship
  bao lâu, C. Xin giảm giá, D. Phàn nàn giao chậm. Each a fill-in-the-blank
  prompt template string, same style as ai-for-writing's.
- Two `Callout`s: variant "insight" tying back to bản giao việc 5 phần
  (link `<TopicLink slug="ai-for-writing">` for "khung tương tự" and
  `<TopicLink slug="prompt-engineering">` for kỹ thuật viết prompt sâu
  hơn); variant "warning" — khi KHÔNG nên để AI tự trả lời: khách hỏi giá
  đặc biệt/thương lượng lớn, khiếu nại nghiêm trọng cần chủ shop trực tiếp
  xử lý, tin nhắn liên quan đến đơn hàng đã có vấn đề pháp lý/tranh chấp.

**Step 7, Summary** (`MiniSummary`, 5-6 points mirroring the beat list):
bối cảnh thật quan trọng hơn tốc độ; AI không thay việc kiểm kho; khuôn
prompt theo loại tin nhắn; luôn có câu chốt rõ cuối tin; bẫy lớn nhất là để
AI đoán số lượng hàng. Plus a "Khám phá thêm" block with `TopicLink`s to
`ai-for-writing` and `getting-started-with-ai` (same shape as
`ai-for-writing.tsx`'s closing block).

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s in the same mix of
plain/fill-blank as `ai-for-writing.tsx`'s `quizQuestions` — cover: what a
vague ask is missing, the "AI đoán tồn kho" risk, giao việc components,
when NOT to let AI auto-reply, picking the right tone for a repeat
customer vs a new one).

## Constraints / do-not-touch

- Follow `AI_EDU/AGENTS.md`'s color-contrast rules exactly: no
  `text-{hue}-{50..600}` on same-family tinted backgrounds; tinted-card
  body text defaults to `text-foreground`; audit every visible state
  (idle/hover/selected/correct/wrong) in both light and dark mode.
- Follow `docs/CONTRACTS.md` for every primitive used (`InlineChallenge`
  retry, `PredictionGate` discipline, jargon gloss policy, hex→token
  policy, etc.) — read it before writing.
- Do not modify `ai-for-writing.tsx`, `ai-for-data-analysis.tsx`, or any
  other existing topic file.
- Do not touch `remotion/`, `queue.json`, or any `copy/` file — out of
  scope for this spec.
- No git commit/push.
- No new npm dependencies.
- No em/en dashes in Vietnamese body copy (house voice rule, applies to
  all shipped Vietnamese text).

## Acceptance criteria

1. `src/topics/ai-for-customer-replies.tsx` exports `metadata` (exact
   values above) and a default component with all 8 `LessonSection`s.
2. `src/topics/registry.ts` has exactly one new entry, metadata-identical
   to the .tsx export.
3. The three real transcripts (A, B, C) appear verbatim somewhere in the
   page (Demo 1 at minimum).
4. `npx tsc --noEmit` clean.
5. `npm test` green (contracts.test.ts passes, including metadata parity).
6. Color-contrast audit: every tinted card/button state uses
   `text-foreground` or the correct `-800/-900` scale per AGENTS.md table
   — call this out explicitly in the final report, don't just assert it.
7. `pnpm run build` succeeds locally (this is a documentation-only guard
   per AGENTS.md — actual deploy is a separate, human-approved step, do
   NOT run `git push` or `vercel deploy` from this spec).

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests (contracts + registry parity)
npm test

# 3. Build
pnpm run build

# 4. Metadata present + parity (asserts)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-customer-replies.tsx','utf8');
if(!tsx.includes('slug: \"ai-for-customer-replies\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"ai-for-customer-replies\"'))throw new Error('missing registry entry');
console.log('metadata present in both files');
"

# 5. Real transcripts present verbatim (asserts)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-customer-replies.tsx','utf8');
const musts=[
  'Chị ơi áo dài tay màu be còn size M không ạ? Mai e cần gấp ạ',
  'Áo dài tay màu be size M vẫn còn nhé, hiện còn đúng 2 chiếc thôi',
];
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real transcript text: '+m);
console.log('real transcripts present verbatim');
"

# 6. Dash ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-for-customer-replies.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table (state × light
mode class × dark mode class, for every tinted/interactive element
introduced), confirmation all 6 verification commands passed, and the
exact diff summary (files touched, line counts).
