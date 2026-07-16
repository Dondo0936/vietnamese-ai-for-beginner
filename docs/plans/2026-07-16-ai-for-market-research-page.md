# Spec: new topic page `ai-for-market-research`

## Goal

Create a new interactive lesson page at `src/topics/ai-for-market-research.tsx`
(route `/topics/ai-for-market-research`) teaching small-business
founders (EN persona, người khởi nghiệp / chủ DN nhỏ) to run a competitor
survey in one evening with AI, using the site's standard 8-step lesson
pattern. Register it in `src/topics/registry.ts`, `src/topics/topic-loader.tsx`,
AND `src/lib/paths.ts` (all three, see Files to touch). This spec covers ONLY
the page — no video, no Remotion, no social copy, no queue.json (a separate
spec handles those after this page ships).

## Context / why

This is the Fri 2026-07-17 slot (the series plan file mislabels it "Thu") of the "Làm thật một việc với AI" beginner series
(`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`). Persona
**người khởi nghiệp (EN)**. Hook: "Khảo sát đối thủ trong 1 buổi tối bằng AI".

**This is the series' first episode demoing Claude (Anthropic) instead of
ChatGPT** — per Dat, 2026-07-16. Wherever the page names the tool, name
Claude and gloss it on first mention: "Claude (trợ lý AI của Anthropic, có
bản miễn phí)". Do not name ChatGPT as the demo tool in this page's demos;
it may appear once in the tools list of Step 6.

Two close structural exemplars, follow them: `src/topics/ai-for-writing.tsx`
(practical/skills pattern: Predict → Analogy → 3 interactive demos → Aha →
2 Challenges → Explain tools/workflow/pitfalls/templates → Summary → Quiz,
`TOTAL_STEPS = 8`) and `src/topics/ai-for-customer-replies.tsx` (same
pattern, closest content class — this spec mirrors its spec's shape). Do NOT
use the `ApplicationX`/`sources`/`Metric` pattern.

**Real grounding — actual Claude (Sonnet 5) exchanges captured 2026-07-16 in
the Claude desktop app; reuse this exact content in the page's demos (do not
invent different examples; the companion video reuses the same transcripts,
so page and video must agree).** Screenshots already exist in
`public/market-demo/` (01-home, 02-vague-typed, 03-vague-sent, 04-spec-typed,
05-spec-reply @2560×1440) — the page does NOT embed them (they are for the
video comp), do not reference them from the page.

Scenario used throughout: sắp mở quán cà phê take-away khoảng 30m² gần khu
văn phòng ở TP.HCM, ngân sách 300 triệu.

**Prompt V (vague ask, chat 1):**
```
Tôi sắp mở quán cà phê nhỏ, phân tích đối thủ cạnh tranh giúp tôi
```

**Real reply A (to Prompt V) — Claude asks back instead of analyzing (một
vòng chờ bị mất vì thiếu bối cảnh). Em-dash in the raw transcript reconciled
to a comma per house style, words unchanged. Use verbatim:**
```
Để phân tích đối thủ cạnh tranh chính xác, mình cần biết vài thông tin cụ thể, vì "đối thủ" của một quán cà phê phụ thuộc rất nhiều vào vị trí và phân khúc (một quán take-away giá rẻ và một quán cà phê sân vườn sẽ có tập đối thủ hoàn toàn khác nhau, dù ở cùng khu vực).
```
(In the real capture Claude then asked two follow-up questions — khu vực nào,
concept gì — before it would analyze. The page may describe that fact in one
plain sentence; do not fabricate quoted text for it.)

**Prompt S (bản giao việc 5 phần, chat 2). Use verbatim, including line
breaks:**
```
Bạn là chuyên gia nghiên cứu thị trường F&B tại Việt Nam.
Nhiệm vụ: so sánh 3 chuỗi cà phê Highlands Coffee, Phúc Long và The Coffee House về giá đồ uống phổ biến, mô hình phục vụ và điểm mạnh điểm yếu, rồi chỉ ra khoảng trống mà một quán nhỏ mới mở có thể khai thác.
Bối cảnh: tôi sắp mở quán cà phê take-away khoảng 30m2 gần khu văn phòng ở TP.HCM, ngân sách 300 triệu, chưa có kinh nghiệm F&B.
Định dạng: một bảng so sánh ngắn, sau đó 5 gạch đầu dòng về khoảng trống thị trường, cuối cùng 3 con số tôi cần tự kiểm chứng trước khi tin.
Giọng văn: thẳng thắn, cụ thể, không lý thuyết suông.
```

**Real reply B (to Prompt S) — immediate usable result. Page-ready excerpts
below (em-dashes reconciled, words unchanged). The full raw transcript is in
`skill-marketplaces` scratch notes; the page only needs these blocks:**

Comparison table (render as a real table or table-like card grid, exact
cell text):

| Tiêu chí | Highlands Coffee | Phúc Long | The Coffee House |
|---|---|---|---|
| Giá phổ biến | Phin sữa đá 29-45k, PhinDi 45-55k, trần ~75k | Trà sữa/cà phê phin 30-70k (tùy size S/M/L) | Cà phê Việt 29-39k, cà phê máy/cold brew 40-62k |
| Mô hình phục vụ | Quán ngồi tại vị trí đắc địa (chân cao ốc VP, TTTM), phục vụ nhanh nhưng vẫn có chỗ ngồi | Kiosk trong TTTM/siêu thị WinMart + quán riêng, tối ưu bán mang đi | Quán "không gian thứ ba" để làm việc/học, phục vụ chậm hơn vì trải nghiệm ngồi lâu |
| Điểm yếu | Vừa tăng giá 10-15% gần đây, dễ bị so sánh "đắt hơn không đáng" | Cà phê không phải thế mạnh cốt lõi, không gian ngồi hạn chế hơn Highlands/TCH | Chi phí mặt bằng lớn (không gian rộng), tốc độ ra món chậm hơn nếu khách chỉ cần mua nhanh |

(Điểm mạnh row exists in the raw transcript but the page table may keep just
these 3 rows for scanability — nếu giữ cả 4 hàng cũng được, dùng đúng chữ:
"Độ phủ, vị trí, thương hiệu quen thuộc, giá hợp lý nhất trong 3 chuỗi" /
"Nguyên liệu trà tốt, mạng lưới kiosk dày đặc, tận dụng hạ tầng WinMart" /
"Không gian nhất quán, dịch vụ chuẩn hóa, wifi/ổ điện tốt cho dân làm việc".)

Claude's own honesty caveat, quote verbatim right under the table — this is
load-bearing for the safety beat:
```
Giá lấy từ các trang tổng hợp/blog, không phải menu chính thức niêm yết tại quầy. Xem phần cần kiểm chứng bên dưới.
```

Khoảng trống rõ nhất (bullet 5 of 5, verbatim):
```
Đứng giữa cà phê vỉa hè (15-25k) và chuỗi (29-75k): nhóm khách văn phòng thu nhập trung bình-khá thường thấy chuỗi hơi đắt cho việc uống hàng ngày nhưng muốn chất lượng hơn cà phê vỉa hè. Định vị "chất lượng gần bằng chuỗi, giá gần bằng vỉa hè, tốc độ nhanh hơn cả hai" là khoảng trống rõ nhất.
```

3 con số cần tự kiểm chứng (verbatim, reconciled):
```
1. Giá thuê mặt bằng thực tế/m² tại khu vực cụ thể bạn nhắm: chỉ đi khảo sát trực tiếp hoặc hỏi môi giới địa phương, không tin số liệu chung chung trên mạng vì chênh lệch giữa các tuyến đường có thể gấp 2-3 lần.
2. Lượng khách văn phòng đi ngang/đi bộ qua vị trí vào giờ cao điểm sáng và chiều: tự đứng đếm 3-5 buổi sáng liên tiếp, đây là số quyết định quán có đủ khách để hòa vốn với ngân sách 300 triệu hay không.
3. Giá vốn nguyên liệu thực tế/ly (cà phê, sữa, ly, ống hút) từ nhà cung cấp bạn sẽ dùng: các con số biên lợi nhuận trên blog thường là ước tính chung, không phản ánh giá sỉ thật bạn sẽ trả, cần báo giá trực tiếp từ nhà cung cấp trước khi lên kế hoạch tài chính.
```

**Prompt F (iterate follow-up, same chat as Prompt S). Use verbatim:**
```
Trong 5 khoảng trống đó, khoảng trống nào làm được với ngân sách 300 triệu? Xếp theo chi phí từ thấp đến cao.
```

**Real reply C (to Prompt F) — cost-ranked. Page needs only the head and
tail, verbatim (reconciled):**
```
Xếp theo chi phí thực hiện, từ thấp đến cao (trong ngân sách 300 triệu):
1. Định vị giá giữa vỉa hè và chuỗi, chi phí: gần bằng 0
```
```
Gợi ý thực tế: với 300 triệu, ưu tiên làm tốt mục 1-3 trước (gần như không tốn thêm vốn, chỉ tốn kỷ luật vận hành), dùng mục 4 để tạo dòng tiền ổn định sau 1-2 tháng đầu khi đã hiểu rõ lưu lượng khách thật, và chỉ cân nhắc mục 5 khi đã có số liệu thật về nhu cầu giao hàng. Đừng đầu tư nhân lực giao hàng dựa trên phỏng đoán.
```

## Files to touch

Create:
- `src/topics/ai-for-market-research.tsx` — the full page.

Modify (ALL THREE registrations — missing topic-loader.tsx makes the route
404 even with green typecheck/tests, this happened before):
- `src/topics/registry.ts` — append ONE entry as the LAST element, metadata
  byte-identical to the .tsx `metadata` export (enforced by
  `src/__tests__/contracts.test.ts` parity test; read `docs/CONTRACTS.md`).
- `src/topics/topic-loader.tsx` — add
  `"ai-for-market-research": dynamic(() => import("@/topics/ai-for-market-research")),`
  in the loader map (alphabetical placement consistent with neighbors).
- `src/lib/paths.ts` — add `"ai-for-market-research"` to the
  "Ứng dụng thực tế" section's `slugs` array.

Do not touch any other file. No queue.json, no remotion/, no copy/ files.

## Interfaces & contracts

### Metadata (exact values, in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "ai-for-market-research",
  title: "AI for Market Research",
  titleVi: "Khảo sát đối thủ trong 1 buổi tối bằng AI",
  description:
    "Dùng AI so sánh giá, mô hình và điểm yếu của đối thủ rồi chỉ ra khoảng trống thị trường, kèm danh sách con số bạn phải tự kiểm chứng trước khi tin.",
  category: "applied-ai",
  tags: ["market-research", "small-business", "practical", "startup"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis-in-brand-monitoring", "ai-for-writing", "getting-started-with-ai"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same `LessonSection`/`PredictionGate`/`InlineChallenge`/
`AhaMoment`/`MiniSummary`/`QuizSection`/`TopicLink` imports as
`ai-for-writing.tsx`. No `@/components/application/*` imports. The file must
start with `"use client"` (both exemplars do; the state-driven demos need
hooks).

### Page structure (8 steps, mirrors `ai-for-writing.tsx` / `ai-for-customer-replies.tsx`)

**Step 1, Predict** (`PredictionGate`): question: bạn sắp mở quán/bán hàng và
gõ cho AI đúng một câu "phân tích đối thủ cạnh tranh giúp tôi" — điều gì
nhiều khả năng xảy ra nhất? 4 options; correct = AI hỏi ngược lại vì chưa đủ
bối cảnh (đúng như Real reply A); distractors: AI đưa ngay bảng phân tích
chính xác cho khu vực của bạn / AI từ chối vì không có dữ liệu / AI chỉ trả
lời lý thuyết marketing. Explanation ties to: AI chỉ có những gì bạn gõ ra —
"đối thủ" phụ thuộc vị trí và phân khúc mà bạn chưa nói.

**Step 2, Analogy** (rebuilt card, same shape as exemplars): AI khảo sát
thị trường giống một nhân viên nghiên cứu cực nhanh nhưng ngồi ở văn phòng:
tổng hợp từ nguồn công khai trong vài phút, còn việc "đi chân đất" (đứng đếm
khách, hỏi giá thuê thật) vẫn là của bạn. 3 mini-cards: `Bạn giao việc` /
`AI tổng hợp khung` / `Bạn kiểm chứng số`.

**Step 3, Explore** (`VisualizationSection`, 3 demos):
- **Demo 1**: `ToggleCompare`, labelA "Hỏi mơ hồ" / labelB "Bản giao việc 5
  phần", childA = Prompt V + Real reply A (verbatim, plus one plain sentence
  that in the real exchange Claude then asked khu vực + concept before
  analyzing), childB = Prompt S (compact rendering) + the comparison table +
  the caveat line (verbatim). Description: "Cùng một nhu cầu, một bên mất
  vòng hỏi lại, một bên ra bảng dùng được ngay."
- **Demo 2**: interactive picker (state-driven card, mirrors
  `EmailDrafterDemo` adaptation in the exemplars): pick "bạn muốn biết gì"
  from 4 options (giá của đối thủ / điểm yếu của đối thủ / khoảng trống thị
  trường / con số phải tự kiểm chứng) — output card shows the matching
  REAL block from reply B (table row giá / điểm yếu row / bullet-5 gap /
  3-số list). All output text from the verbatim blocks above; the picker
  only selects which real block renders.
- **Demo 3**: `TabView` gallery, 4-5 tabs of business types (quán cà phê /
  shop quần áo online / tiệm bánh ngọt / dịch vụ dọn nhà theo giờ / quán ăn
  trưa văn phòng), each with a short scenario + a synthesized 5-part giao
  việc khuôn for competitor research in that business (clearly practice
  templates, not claimed as captured transcripts — only the quoted blocks
  above are real). No invented statistics inside the templates.
- Closing `Callout` (variant "tip"), 3 observations: bản giao việc đổi kết
  quả nhiều hơn "AI thông minh"; định dạng yêu cầu (bảng + gạch đầu dòng +
  danh sách kiểm chứng) quyết định độ dùng được; AI tự thú nhận nguồn số
  liệu khi bạn yêu cầu chỗ cần kiểm chứng.

**Step 4, Aha** (`AhaMoment`): AI không biết thị trường của bạn, nó chỉ sắc
bén đúng bằng bối cảnh bạn đưa. Kết quả tốt nhất của một buổi tối khảo sát
bằng AI không phải "câu trả lời cuối cùng" mà là bộ khung: bảng so sánh,
khoảng trống, và danh sách con số bạn phải tự đi kiểm chứng. AI làm phần
khung trong vài phút, bạn làm phần chân đất.

**Step 5, Challenge** (2× `InlineChallenge`):
1. "Phân tích đối thủ cạnh tranh giúp tôi" thiếu gì khiến AI phải hỏi lại?
   (correct: vị trí/khu vực, phân khúc/concept, ngân sách — bối cảnh cụ
   thể; mirrors Real reply A.)
2. AI đưa bảng giá đối thủ 29-75k, bạn dùng ngay để định giá 18-25k mà không
   kiểm chứng — rủi ro là gì? (correct: số lấy từ trang tổng hợp/blog có thể
   cũ hoặc sai, phải kiểm giá thật tại quầy và giá vốn thật trước khi chốt
   giá bán; chính Claude cũng ghi chú điều này trong reply B.)

**Step 6, Explain** (`ExplanationSection`, same rhythm as exemplars):
- Công cụ: Claude (bản miễn phí, demo của bài này), ChatGPT, Gemini — nói
  chung chung, không claim giá gói.
- Vòng lặp 4 bước: Giao việc 5 phần → Đọc bảng và khoảng trống → Hỏi tiếp
  trong cùng hội thoại (như Prompt F, xếp theo chi phí) → Tự kiểm chứng 3
  con số trước khi quyết định.
- 4 cái bẫy: tin ngay số liệu AI đưa mà không kiểm chứng (bẫy nguy hiểm
  nhất — giá thuê, giá menu, biên lợi nhuận trên mạng có thể sai hoặc cũ);
  hỏi mơ hồ nên mất vòng hỏi lại; quên khai báo ngân sách nên gợi ý vượt
  khả năng; nghĩ AI thay được khảo sát thực địa (đứng đếm khách không thay
  được).
- **4 khuôn prompt copy được ngay** (card grid như exemplar): A. So sánh
  đối thủ trực tiếp (khuôn của Prompt S, fill-in-the-blank hóa); B. Tìm
  khoảng trống thị trường cho mô hình nhỏ; C. Xếp hạng cơ hội theo ngân sách
  (khuôn của Prompt F); D. Lập danh sách con số cần tự kiểm chứng trước khi
  tin kết quả.
- Two `Callout`s: variant "insight" tying về bản giao việc 5 phần với
  `<TopicLink slug="ai-for-writing">` (khung tương tự) và
  `<TopicLink slug="sentiment-analysis-in-brand-monitoring">` (đọc review
  khách hàng, một dạng khảo sát khác); variant "warning" — khi KHÔNG nên
  dừng ở AI: quyết định xuống tiền thuê mặt bằng, ký hợp đồng nhà cung cấp,
  vay vốn — mọi quyết định không đảo ngược được cần số liệu tự kiểm chứng,
  không phải số từ chatbot.

**Step 7, Summary** (`MiniSummary`, 5-6 points): bối cảnh cụ thể mới có phân
tích cụ thể; yêu cầu định dạng bảng + khoảng trống + danh sách kiểm chứng;
hỏi tiếp trong cùng hội thoại để xếp theo ngân sách; AI làm khung, bạn kiểm
số; bẫy lớn nhất là tin số chưa kiểm chứng. Plus "Khám phá thêm" block with
`TopicLink`s to `sentiment-analysis-in-brand-monitoring` and
`getting-started-with-ai`.

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s, same mix as exemplars):
cover: vì sao AI hỏi lại khi thiếu bối cảnh; 5 phần của bản giao việc; vì
sao yêu cầu "3 con số cần tự kiểm chứng" trong định dạng; rủi ro dùng giá
từ blog; bước nào KHÔNG thể giao cho AI (đứng đếm khách); hỏi tiếp trong
cùng hội thoại để làm gì.

## Constraints / do-not-touch

- Follow `AI_EDU/AGENTS.md` color-contrast rules exactly (no
  `text-{hue}-{50..600}` on same-family tinted bg; tinted-card body text
  defaults `text-foreground`; audit every visible state in light AND dark).
- Follow `docs/CONTRACTS.md` for every primitive used — read it first.
- Do not modify any existing topic file.
- Do not touch `remotion/`, `queue.json`, `copy/`, `public/market-demo/`.
- No git commit/push. No new npm dependencies.
- No em/en dashes anywhere in the page file (transcripts above are already
  reconciled — use them exactly as given here, not from any other source).
- No decimal numbers in Vietnamese prose you author (ranges like 29-45k and
  units like 30m² in the verbatim transcript blocks are fine).

## Acceptance criteria

1. `src/topics/ai-for-market-research.tsx` exports `metadata` (exact values
   above) and a default component with all 8 `LessonSection`s.
2. All THREE registrations present (registry.ts entry metadata-identical,
   topic-loader.tsx map entry, paths.ts slug in "Ứng dụng thực tế").
3. The verbatim blocks (reply A, table cells, caveat line, bullet-5 gap,
   3-số list, reply C head+tail) appear exactly as given in this spec.
4. `npx tsc --noEmit` clean. 5. `npm test` green. 6. `pnpm run build` succeeds.
7. Color-contrast audit reported explicitly (state × light × dark table).

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests (contracts + registry parity)
npm test

# 3. Build
pnpm run build

# 4. Triple registration (asserts)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-market-research.tsx','utf8');
if(!tsx.includes('slug: \"ai-for-market-research\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"ai-for-market-research\"'))throw new Error('missing registry entry');
const loader=fs.readFileSync('src/topics/topic-loader.tsx','utf8');
if(!loader.includes('\"ai-for-market-research\"'))throw new Error('missing topic-loader entry');
const paths=fs.readFileSync('src/lib/paths.ts','utf8');
if(!paths.includes('\"ai-for-market-research\"'))throw new Error('missing paths.ts entry');
console.log('all three registrations present');
"

# 5. Real transcripts present verbatim (asserts)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-market-research.tsx','utf8');
const musts=[
  'mình cần biết vài thông tin cụ thể',
  'chất lượng gần bằng chuỗi, giá gần bằng vỉa hè, tốc độ nhanh hơn cả hai',
  'Giá lấy từ các trang tổng hợp/blog',
  'tự đứng đếm 3-5 buổi sáng liên tiếp',
];
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real transcript text: '+m);
console.log('real transcripts present verbatim');
"

# 6. Dash ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-for-market-research.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table (state × light
mode class × dark mode class for every tinted/interactive element), all 6
verification command results, and the exact diff summary (files touched,
line counts).
