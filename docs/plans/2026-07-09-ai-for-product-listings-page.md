# Spec: new topic page `ai-for-product-listings`

## Goal

Create a new interactive lesson page at `src/topics/ai-for-product-listings.tsx`
(route `/topics/ai-for-product-listings`) teaching small-shop owners (SH
persona) to write product descriptions quickly with AI, using the site's
standard 8-step lesson pattern. Register it in `src/topics/registry.ts`
AND `src/topics/topic-loader.tsx` (BOTH required — see the comment at the
top of `topic-loader.tsx`). This spec covers ONLY the page — no video, no
Remotion, no social copy, no queue.json (a separate spec handles those
once the Viettel TTS quota, currently exhausted, is restored).

## Context / why

Wed 07-16 slot of the "Làm thật một việc với AI" beginner series
(`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`). Persona
**chủ shop (SH)**. Hook: "Mô tả sản phẩm cho 30 món trong 1 giờ" — seeded
from `/topics/ai-for-writing`'s "khuôn D" (product description template),
now given its own full lesson.

Structural exemplars, both read in full this session:
`src/topics/ai-for-writing.tsx` and `src/topics/ai-for-customer-replies.tsx`
(practical/skills page pattern: Predict → Analogy → 3 interactive demos →
Aha → 2 Challenges → Explain tools/workflow/pitfalls/templates → Summary →
Quiz, `TOTAL_STEPS = 8`). Follow this exact shape and import set. Do NOT
use the `ApplicationX`/`sources`/`Metric` pattern.

**Real grounding — an actual ChatGPT exchange captured this session
(2026-07-09), reuse this exact content in the page's Demo 1 (do not invent
a different example; a companion video for this same lesson will reuse
the same content once TTS is restored, so page and video must agree):**

Real reply A (vague ask "Viết mô tả sản phẩm giúp tôi", no product info
given) — AI asks for the actual product details before it can help:
```
Được. Bạn gửi cho tôi các thông tin về sản phẩm, tôi sẽ viết mô tả phù hợp.
Bạn có thể cung cấp:
- Tên sản phẩm:
- Loại sản phẩm/ngành hàng:
- Điểm nổi bật:
- Chất liệu/thành phần:
- Kích thước, màu sắc, thông số (nếu có):
- Đối tượng khách hàng:
- Phong cách mong muốn (sang trọng, ngắn gọn, bán hàng, chuyên nghiệp, dễ thương...):
- Kênh đăng (Shopee, website, Facebook, TikTok Shop, catalogue...):
Nếu bạn chỉ có vài dòng thông tin thô, cứ gửi, tôi sẽ giúp viết lại thành mô tả hoàn chỉnh.
```

Real reply B (full 5-part prompt: vai trò chủ shop thời trang online,
nhiệm vụ viết mô tả cho áo thun cotton form rộng unisex, bối cảnh chất
liệu cotton 100%/5 màu/giá 149 nghìn đồng/khách 18-25 tuổi, định dạng
80-100 từ có gạch đầu dòng + câu kêu gọi mua, giọng văn trẻ trung gần gũi)
— NOTE: the model's real reply opened with an em-dash character
("unisex – item basic..."); per this site's standing house rule (no em/en
dashes in any shipped Vietnamese text), when you stage this in the page,
use the bullet list + closing CTA verbatim (dash-free) as the primary
quoted content, and render the opening line with the em-dash replaced by
a period ("unisex. Item basic...") — that is a punctuation reconciliation,
not a content change, the words themselves must stay exactly as the model
wrote them:
```
Áo thun cotton form rộng unisex. Item basic dễ mặc cho mọi outfit ngày.
- Chất liệu cotton 100% mềm mại, thoáng khí, thấm hút tốt, mặc cả ngày vẫn dễ chịu.
- Form rộng unisex, phù hợp cả nam và nữ từ 18-25 tuổi, phối quần jeans, short hay layer đều đẹp.
- Có 5 màu trẻ trung để lựa chọn, giá chỉ 149K, dễ sắm nhiều màu thay đổi phong cách.
Thiết kế đơn giản nhưng chất lượng, chiếc áo này sẽ là món đồ không thể thiếu trong tủ đồ. Chốt đơn ngay hôm nay để chọn màu yêu thích nhé!
```
(the "18–25" in the real reply also had an en-dash — write it as "18 đến
25" in the staged version, same reconciliation rule.)

## Files to touch

Create:
- `AI_EDU/src/topics/ai-for-product-listings.tsx` — the full page.

Modify:
- `AI_EDU/src/topics/registry.ts` — append ONE entry (metadata mirror),
  as the LAST element of the topics array.
- `AI_EDU/src/topics/topic-loader.tsx` — append ONE entry
  `"ai-for-product-listings": dynamic(() => import("@/topics/ai-for-product-listings")),`
  keeping the list alphabetized (goes after `ai-for-paperwork`, before
  `ai-for-science` — check current alphabetical neighbors since
  `ai-for-customer-replies` and `ai-for-meeting-notes` were added earlier
  this session and may have shifted things).
- `AI_EDU/src/lib/paths.ts` — add `"ai-for-product-listings"` to the
  "office" path's "Ứng dụng thực tế" stage slugs array, near
  `ai-for-writing`.

Do not touch any other file.

## Interfaces & contracts

### Metadata (exact values, put in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "ai-for-product-listings",
  title: "AI for Product Listings",
  titleVi: "AI viết mô tả sản phẩm cho 30 món trong 1 giờ",
  description:
    "Biến vài dòng thông tin thô thành mô tả sản phẩm bán hàng, đủ điểm nổi bật và lời kêu gọi mua, cho từng món trong shop.",
  category: "applied-ai",
  tags: ["product-listing", "copywriting", "practical", "shop"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-customer-replies", "getting-started-with-ai"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same imports as `ai-for-customer-replies.tsx`.

### Page structure (8 steps, mirrors sibling pages' shape)

**Step 1, Predict** (`PredictionGate`): "Shop có 30 sản phẩm chưa có mô tả.
Viết tay từng cái mất khoảng 10 phút một món. AI có thể rút thời gian này
xuống còn khoảng bao nhiêu?" — 4 options, correct answer about the time
dropping to a few minutes per item once you have a reusable prompt
template, NOT because AI types faster but because you stop starting from
a blank page each time.

**Step 2, Analogy** (rebuilt card): AI viết mô tả sản phẩm giống một nhân
viên content ngồi cả ngày viết bài đăng, nhưng chỉ giỏi khi bạn đưa đủ
thông tin thật về sản phẩm. 3 mini-cards: `Bạn đưa thông tin sản phẩm` /
`AI viết mô tả có cấu trúc` / `Bạn kiểm giá và thông số rồi đăng`.

**Step 3, Explore** (`VisualizationSection`, 3 demos):
- **Demo 1**: `ToggleCompare`, labelA "AI hỏi lại vì chưa có thông tin" /
  labelB "Mô tả đầy đủ, có gạch đầu dòng và lời kêu gọi mua", childA =
  Real reply A (verbatim), childB = Real reply B (verbatim, with the
  punctuation reconciliation noted above). Description: "Không có thông
  tin thật về sản phẩm, AI không tự bịa ra chất liệu hay giá được."
- **Demo 2**: interactive picker (mirrors `EmailDrafterDemo`'s state
  pattern) — pick "loại sản phẩm" (áo thun / son môi / đồ gia dụng nhỏ /
  đồ ăn vặt) and "giọng văn" (trẻ trung / sang trọng / hài hước), output
  card re-renders a short sample description for that combination.
  Synthesize plausible short samples for non-real combinations (clearly a
  practice tool).
- **Demo 3**: `TabView` gallery, 4-5 tabs of common listing situations
  (sản phẩm mới ra mắt, sản phẩm giảm giá, sản phẩm quà tặng, sản phẩm
  best-seller, sản phẩm nhập khẩu) each with a short scenario + a
  synthesized sample output.
- Closing `Callout` (variant "tip"), 3 observations in the established
  rhythm.

**Step 4, Aha** (`AhaMoment`): giá trị chính không phải AI viết nhanh hơn
bạn gõ, mà một khuôn prompt tốt dùng lại được cho cả 30 sản phẩm, chỉ cần
đổi vài dòng thông tin mỗi lần. AI không biết giá thật hay chất liệu thật
nếu bạn không ghi ra, nên mô tả chỉ đúng khi thông tin đưa vào đúng.

**Step 5, Challenge** (2× `InlineChallenge`):
1. What a vague ask like "Viết mô tả sản phẩm giúp tôi" (no product info)
   is missing — correct: thông tin thật về sản phẩm (chất liệu, giá, đối
   tượng khách), AI không tự bịa ra được.
2. A risk case: mô tả AI viết ghi sai chất liệu hoặc phóng đại công dụng
   sản phẩm — correct: luôn đối chiếu mô tả với thông tin sản phẩm thật
   trước khi đăng, không để AI tự thêm chi tiết chưa xác nhận.

**Step 6, Explain** (`ExplanationSection`):
- 4-5 công cụ viết mô tả sản phẩm phổ biến cho chủ shop VN (ChatGPT free
  cho viết tay từng sản phẩm, công cụ AI tích hợp trong Shopee/TikTok Shop
  Seller Center, Canva Magic Write cho caption ngắn, Capcut AI cho mô tả
  kèm video) — keep general, no unverifiable pricing claims.
- Vòng lặp 4 bước: Có thông tin sản phẩm thật → AI viết mô tả theo khuôn →
  Bạn kiểm giá/chất liệu/thông số → Đăng lên kênh bán.
- 4 cái bẫy: AI phóng đại công dụng nếu không giới hạn (bẫy nguy hiểm
  nhất với hàng tiêu dùng, mỹ phẩm, thực phẩm); mô tả sai chất liệu nếu
  thông tin đưa vào mơ hồ; giọng văn không khớp đối tượng khách (khắc
  phục: ghi rõ độ tuổi/phong cách trong prompt); mô tả quá dài cho kênh
  cần ngắn như TikTok Shop (khắc phục: ghi rõ giới hạn số từ).
- **4 khuôn prompt copy được ngay**: A. Mô tả sản phẩm thời trang, B. Mô
  tả đồ gia dụng/tiêu dùng, C. Mô tả sản phẩm giảm giá gấp, D. Mô tả ngắn
  cho TikTok Shop (dưới 50 từ). Each a fill-in-the-blank template string,
  same style as sibling pages.
- Two `Callout`s: variant "insight" tying to bản giao việc 5 phần (link
  `<TopicLink slug="ai-for-writing">` and
  `<TopicLink slug="ai-for-customer-replies">`); variant "warning" — khi
  KHÔNG nên để AI tự thêm chi tiết: công dụng y tế/sức khỏe cần chính xác
  tuyệt đối, cam kết bảo hành hoặc chính sách đổi trả, số liệu kỹ thuật
  (dung tích, công suất) chưa xác nhận với nhà cung cấp.

**Step 7, Summary** (`MiniSummary`, 5-6 points) + "Khám phá thêm" block
with `TopicLink`s to `ai-for-writing` and `ai-for-customer-replies`.

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s covering: what a
vague ask is missing, the "AI phóng đại công dụng" risk, mô tả structure,
when NOT to let AI add unconfirmed details, matching tone to channel).

## Constraints / do-not-touch

- Follow `AI_EDU/AGENTS.md` color-contrast rules exactly (read it first).
- Follow `docs/CONTRACTS.md` for every primitive used.
- Do not modify any existing topic file other than the three files listed.
- Do not touch `remotion/`, `queue.json`, or any `copy/` file.
- No git commit/push. No new npm dependencies.
- No em/en dashes anywhere in the shipped page (including the two
  reconciled quotes above — write "." or "đến" instead, per the
  instructions given for Real reply B).

## Acceptance criteria

Same shape as the `ai-for-meeting-notes` page spec from earlier this
session: metadata in all 4 files, transcripts verbatim (with the two
noted punctuation reconciliations), typecheck/test/build clean, color
audit reported, live page visually verified in light+dark mode via
chrome-devtools with no unexpected console errors.

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests
npm test

# 3. Build (pnpm not installed in this environment — use npm run build)
npm run build

# 4. Metadata present + parity
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-product-listings.tsx','utf8');
if(!tsx.includes('slug: \"ai-for-product-listings\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"ai-for-product-listings\"'))throw new Error('missing registry entry');
const loader=fs.readFileSync('src/topics/topic-loader.tsx','utf8');
if(!loader.includes('\"ai-for-product-listings\"'))throw new Error('missing topic-loader entry');
const paths=fs.readFileSync('src/lib/paths.ts','utf8');
if(!paths.includes('\"ai-for-product-listings\"'))throw new Error('missing paths.ts entry');
console.log('metadata present in all 4 files');
"

# 5. Real content present verbatim (post-reconciliation forms)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-product-listings.tsx','utf8');
const musts=[
  'Chất liệu cotton 100% mềm mại, thoáng khí, thấm hút tốt',
  'Có 5 màu trẻ trung để lựa chọn, giá chỉ 149K',
];
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real content: '+m);
console.log('real transcripts present verbatim');
"

# 6. Dash ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-for-product-listings.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page (check the two reconciled quotes)');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table, confirmation
all verification commands passed, the live-page visual check
(light+dark), and the exact diff summary.
