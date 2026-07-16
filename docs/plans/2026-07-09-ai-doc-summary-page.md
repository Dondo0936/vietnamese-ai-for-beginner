# Spec: new topic page `ai-doc-summary`

## Goal

Create a new interactive lesson page at `src/topics/ai-doc-summary.tsx`
(route `/topics/ai-doc-summary`) teaching office workers / entrepreneurs
(VP/EN persona) to pull the key points and risks out of a long business
report/document quickly with AI, using the site's standard 8-step lesson
pattern. Register it in `src/topics/registry.ts` AND
`src/topics/topic-loader.tsx` (BOTH required) AND `src/lib/paths.ts`
(optional curation). This spec covers ONLY the page — no video, no
Remotion, no social copy, no queue.json (a separate spec handles those
once the Viettel TTS quota, currently exhausted, is restored).

## Context / why — IMPORTANT SCOPE CHANGE from the original plan

This is the Tue 07-15 slot of the "Làm thật một việc với AI" beginner
series. The ORIGINAL plan doc
(`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`) called
this episode "real Claude UI (provider variety)". **That changed on
2026-07-09**: `claude.ai` presents an interactive Cloudflare
human-verification challenge to automated browser sessions (must never be
bypassed), and the Claude desktop app was unreachable via computer-use
(display locked) for an extended window. Rather than block this whole
episode indefinitely, the real screenshots below were captured on
**ChatGPT** instead, same as every other episode in this arc. This is a
content-scope substitution, not a quality reduction — drop "provider
variety" from this episode's framing; do not mention Claude anywhere in
the page.

Hook: "Tài liệu 50 trang, nắm ý chính trong 10 phút" — the task is pulling
key points + risks out of a long report before a meeting, without reading
the whole thing.

Structural exemplars, both read in full this session:
`src/topics/ai-for-writing.tsx` and `src/topics/ai-for-meeting-notes.tsx`
(practical/skills page pattern: Predict → Analogy → 3 interactive demos →
Aha → 2 Challenges → Explain tools/workflow/pitfalls/templates → Summary →
Quiz, `TOTAL_STEPS = 8`). Follow this exact shape and import set. Do NOT
use the `ApplicationX`/`sources`/`Metric` pattern.

**Real grounding — an actual ChatGPT exchange captured this session
(2026-07-09), reuse this exact content in the page's Demo 1 (do not invent
a different example; a companion video for this same lesson will reuse
the same content once TTS is restored, so page and video must agree):**

Source document used throughout (a condensed stand-in for a long
quarterly business report — same "condensed transcript standing in for
the full thing" pattern used for the meeting-notes episode's meeting
recording):
```
BÁO CÁO KẾT QUẢ KINH DOANH QUÝ 2 NĂM 2026 - CÔNG TY TNHH THƯƠNG MẠI ĐIỆN TỬ VIETSHOP

1. TỔNG QUAN KẾT QUẢ KINH DOANH
Trong quý 2 năm 2026, công ty ghi nhận doanh thu đạt 42 tỷ đồng, tăng trưởng so với quý 1. Lợi nhuận sau thuế đạt 3.8 tỷ đồng. Số lượng đơn hàng xử lý trong quý đạt 185.000 đơn, trung bình 2.050 đơn mỗi ngày. Tỷ lệ đơn hàng bị hoàn trả giảm xuống còn 4.2 phần trăm, thấp hơn mức 6.1 phần trăm của quý trước.

2. TÌNH HÌNH KÊNH BÁN HÀNG
Kênh Shopee tiếp tục là kênh đóng góp doanh thu lớn nhất, chiếm 52 phần trăm tổng doanh thu. Kênh TikTok Shop tăng trưởng mạnh nhất trong quý, đóng góp 28 phần trăm doanh thu. Kênh website riêng chỉ đóng góp 12 phần trăm, và Facebook đóng góp 8 phần trăm còn lại.

3. VẤN ĐỀ VẬN HÀNH KHO BÃI
Kho trung tâm tại Bình Dương gặp tình trạng quá tải vào giữa quý do lượng đơn tăng đột biến trong đợt khuyến mãi giữa năm. Thời gian xử lý đơn trung bình tăng từ 1.2 ngày lên 2.5 ngày trong giai đoạn cao điểm.

4. CHI PHÍ MARKETING VÀ HIỆU QUẢ
Chi phí marketing trong quý là 6.5 tỷ đồng, chiếm 15.5 phần trăm doanh thu. Chi phí thu hút một khách hàng mới trung bình là 85.000 đồng, giảm so với mức 110.000 đồng của quý trước.

5. RỦI RO VÀ THÁCH THỨC QUÝ 3
Ban lãnh đạo xác định ba rủi ro chính cho quý 3. Thứ nhất, chi phí vận chuyển có thể tăng do biến động giá nhiên liệu. Thứ hai, cạnh tranh giá trên TikTok Shop ngày càng gay gắt. Thứ ba, kho Bình Dương cần được mở rộng trước mùa cao điểm cuối năm.

6. KẾ HOẠCH HÀNH ĐỘNG QUÝ 3
Công ty đặt mục tiêu doanh thu quý 3 đạt 48 tỷ đồng, mở kho vệ tinh thứ hai tại miền Bắc, tăng ngân sách quảng cáo TikTok Shop thêm 20 phần trăm, và triển khai hệ thống quản lý kho bán tự động.
```

Real reply A (vague ask "Tóm tắt giúp tôi tài liệu này", no document
pasted) — AI asks for the actual document before it can help:
```
Được. Bạn hãy tải lên tài liệu (PDF, Word, ảnh chụp, hoặc dán nội dung vào đây), tôi sẽ giúp bạn tóm tắt.
Bạn có thể cho biết thêm nếu muốn:
- Tóm tắt ngắn (5-10 ý chính)
- Tóm tắt chi tiết theo từng mục
- Rút ra kết luận, điểm quan trọng, số liệu
- Làm bản tóm tắt để học tập/thuyết trình/báo cáo
Gửi tài liệu là tôi xử lý ngay.
```

Real reply B (full 5-part prompt: vai trò trợ lý điều hành, nhiệm vụ nêu 3
điểm quan trọng + 2 rủi ro, bối cảnh cần nắm ý trong 10 phút trước họp,
định dạng 2 phần, giọng văn ngắn gọn đi thẳng trọng tâm, document pasted)
— NOTE: the model's real reply included one inferred figure ("tăng 18% so
với quý trước") that was NOT stated in the source document (the source
only said "tăng trưởng so với quý 1" without a number) — this is the
model filling a gap with an unverified figure. Per the site's real-UI
production rule (verbatim quotes, no fabricated claims presented as
sourced fact), DROP that bullet from the staged card and use only the two
clean bullets below plus both risk bullets, which are fully traceable to
the source document:
```
Điểm quan trọng
- Shopee vẫn là kênh doanh thu lớn nhất với 52%, trong khi TikTok Shop tăng trưởng mạnh lên 28% tổng doanh thu.
- Hiệu quả marketing được cải thiện khi chi phí thu hút khách hàng mới giảm từ 110.000 xuống 85.000 đồng và công ty đặt mục tiêu doanh thu quý 3 là 48 tỷ đồng.

Rủi ro cần chú ý
- Kho Bình Dương có nguy cơ quá tải khi sản lượng tăng, từng khiến thời gian xử lý đơn kéo dài từ 1,2 lên 2,5 ngày trong cao điểm.
- Chi phí vận chuyển có thể tăng do biến động giá nhiên liệu và cạnh tranh giá trên TikTok Shop ngày càng gay gắt.
```
This dropped-bullet situation is ALSO useful real content for the page's
"4 cái bẫy" section — one of the pitfalls should be specifically "AI tự
suy ra số liệu không có trong tài liệu gốc" grounded in this exact real
example (một câu tóm tắt ghi "tăng 18%" dù tài liệu gốc không có con số
này) — this is a genuine, freshly-observed instance of the site's
standing hallucination-adjacent lesson, worth naming explicitly since it
happened during this exact capture.

## Files to touch

Create:
- `AI_EDU/src/topics/ai-doc-summary.tsx` — the full page.

Modify:
- `AI_EDU/src/topics/registry.ts` — append ONE entry, last element.
- `AI_EDU/src/topics/topic-loader.tsx` — append ONE entry
  `"ai-doc-summary": dynamic(() => import("@/topics/ai-doc-summary")),`
  keeping the list alphabetized (goes right after `ai-coding-assistants`,
  before `ai-for-customer-replies` — check current neighbors since
  earlier pages this session may have shifted things).
- `AI_EDU/src/lib/paths.ts` — add `"ai-doc-summary"` to the "office"
  path's "Ứng dụng thực tế" stage slugs array, near `ai-for-writing`.

Do not touch any other file.

## Interfaces & contracts

### Metadata (exact values, put in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "ai-doc-summary",
  title: "AI for Document Summaries",
  titleVi: "AI tóm tắt tài liệu dài, nắm ý chính trong 10 phút",
  description:
    "Rút điểm quan trọng và rủi ro từ báo cáo dài bằng AI, đủ nhanh để đọc trước một cuộc họp mà không cần đọc hết tài liệu.",
  category: "applied-ai",
  tags: ["summarization", "reports", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-meeting-notes", "ai-for-writing", "hallucination"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same imports as `ai-for-meeting-notes.tsx`.

### Page structure (8 steps, mirrors sibling pages' shape)

**Step 1, Predict** (`PredictionGate`): "Một báo cáo kinh doanh dài 6 mục,
nhiều số liệu. Đọc hết và tự rút điểm quan trọng mất khoảng 20-30 phút.
AI có thể rút thời gian này xuống còn khoảng bao nhiêu nếu bạn hỏi đúng?"
— 4 options, correct answer about a few minutes given a clear enough
prompt, NOT because AI reads faster but because it can filter for exactly
what you asked for.

**Step 2, Analogy** (rebuilt card): AI tóm tắt tài liệu giống một trợ lý
đọc trước tài liệu dài rồi báo lại đúng phần bạn cần, nhưng không phải lúc
nào cũng biết phần nào là quan trọng nhất nếu bạn không nói rõ. 3
mini-cards: `Bạn đưa tài liệu` / `AI lọc và tóm tắt` / `Bạn kiểm số liệu
trước khi dùng`.

**Step 3, Explore** (`VisualizationSection`, 3 demos):
- **Demo 1**: `ToggleCompare`, labelA "AI hỏi lại vì chưa có tài liệu" /
  labelB "Tóm tắt đúng 2 phần cần, có số liệu thật", childA = Real reply A
  (verbatim), childB = Real reply B (verbatim, ONLY the two clean bullets
  per group as instructed above). Description: "Không có tài liệu thật,
  AI không tự biết nội dung báo cáo."
- **Demo 2**: interactive picker (mirrors sibling pages' state pattern) —
  pick "loại tài liệu" (báo cáo kinh doanh / hợp đồng / tài liệu nghiên
  cứu / biên bản pháp lý) and "độ dài tóm tắt" (5 dòng / theo mục), output
  card re-renders a short sample summary snippet for that combination.
  Synthesize plausible short samples for non-real combinations (clearly a
  practice tool).
- **Demo 3**: `TabView` gallery, 4-5 tabs of common summary situations
  (báo cáo tài chính, hợp đồng đối tác, tài liệu nghiên cứu thị trường,
  biên bản họp cổ đông, đề xuất dự án) each with a short scenario + a
  synthesized sample output.
- Closing `Callout` (variant "tip"), 3 observations in the established
  rhythm.

**Step 4, Aha** (`AhaMoment`): giá trị chính không phải AI đọc nhanh hơn
bạn, mà AI lọc đúng phần bạn cần (điểm quan trọng, rủi ro) thay vì đọc
tuần tự từ đầu. Nhưng AI có thể tự suy ra số liệu không có trong tài liệu
gốc nếu bạn không yêu cầu rõ "chỉ dùng thông tin có trong tài liệu" — đây
là điều cần kiểm lại luôn.

**Step 5, Challenge** (2× `InlineChallenge`):
1. What a vague ask like "Tóm tắt giúp tôi tài liệu này" (no document
   pasted) is missing — correct: tài liệu thật, AI không tự bịa nội dung.
2. A risk case grounded in the real capture: bản tóm tắt AI viết có một
   con số phần trăm không xuất hiện trong tài liệu gốc — correct: luôn
   đối chiếu số liệu trong bản tóm tắt với tài liệu gốc trước khi dùng,
   yêu cầu AI "chỉ dùng thông tin có trong tài liệu" ngay từ đầu.

**Step 6, Explain** (`ExplanationSection`):
- 4-5 công cụ tóm tắt tài liệu phổ biến cho dân văn phòng VN (ChatGPT free
  cho dán nội dung tay, Google NotebookLM cho tài liệu dài nhiều nguồn,
  Microsoft Copilot tích hợp Word/Outlook, công cụ OCR + AI cho tài liệu
  scan) — keep general, no unverifiable pricing claims.
- Vòng lặp 4 bước: Có tài liệu thật → AI tóm tắt theo yêu cầu → Bạn đối
  chiếu số liệu → Dùng trong họp/báo cáo.
- 4 cái bẫy: **AI tự suy ra số liệu không có trong tài liệu gốc** (bẫy
  nguy hiểm nhất, grounded in the real "18%" example above — narrate it
  as "một lần thử thật, bản tóm tắt ghi thêm một con số phần trăm tăng
  trưởng không có trong báo cáo gốc"); tóm tắt bỏ sót rủi ro quan trọng
  nếu không yêu cầu rõ; tóm tắt quá chung chung nếu tài liệu dài và không
  giới hạn số ý; nhầm lẫn số liệu giữa các mục nếu tài liệu có nhiều bảng
  số liệu tương tự nhau.
- **4 khuôn prompt copy được ngay**: A. Tóm tắt báo cáo kinh doanh, B. Tóm
  tắt hợp đồng (điểm cần chú ý), C. Tóm tắt 5 dòng cho người bận, D. Trích
  rủi ro và hành động cần làm. Each a fill-in-the-blank template string,
  same style as sibling pages, and EACH should include an explicit
  instruction like "chỉ dùng thông tin có trong tài liệu, không suy đoán
  thêm" given the real pitfall found this session.
- Two `Callout`s: variant "insight" tying to bản giao việc 5 phần (link
  `<TopicLink slug="ai-for-meeting-notes">` and
  `<TopicLink slug="ai-for-writing">`); variant "warning" — khi KHÔNG nên
  để AI tự tóm tắt: hợp đồng pháp lý cần đọc từng điều khoản, tài liệu có
  số liệu tài chính dùng để ra quyết định lớn (cần đối chiếu bản gốc kỹ),
  tài liệu có thông tin bảo mật không nên dán vào công cụ AI công cộng.

**Step 7, Summary** (`MiniSummary`, 5-6 points) + "Khám phá thêm" block
with `TopicLink`s to `ai-for-meeting-notes` and `ai-for-writing`.

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s covering: what a
vague ask is missing, the "AI tự suy ra số liệu" risk (grounded in the
real example), tóm tắt structure, when NOT to trust an AI summary blindly,
verifying figures against the source).

## Constraints / do-not-touch

- Follow `AI_EDU/AGENTS.md` color-contrast rules exactly (read it first).
- Follow `docs/CONTRACTS.md` for every primitive used.
- Do not modify any existing topic file other than the three files listed.
- Do not touch `remotion/`, `queue.json`, or any `copy/` file.
- No git commit/push. No new npm dependencies.
- No em/en dashes anywhere in the shipped page.
- Do NOT mention Claude, Anthropic, or "provider variety" anywhere in the
  page — this episode uses ChatGPT like every other episode in the arc,
  per the scope change explained above.

## Acceptance criteria

Same shape as `ai-for-meeting-notes`/`ai-for-product-listings` page specs
from earlier this session: metadata in all 4 files, transcripts verbatim
(dropping the one bullet with the unverified figure, per instructions),
typecheck/test/build clean, color audit reported. Do NOT attempt a
Chrome/Playwright visual check yourself (sandbox browser access is
unreliable) — the supervisor (Claude, outside this sandbox) does that
directly afterward.

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests
npm test

# 3. Build (pnpm not installed — use npm run build)
npm run build

# 4. Metadata present + parity
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-doc-summary.tsx','utf8');
if(!tsx.includes('slug: \"ai-doc-summary\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"ai-doc-summary\"'))throw new Error('missing registry entry');
const loader=fs.readFileSync('src/topics/topic-loader.tsx','utf8');
if(!loader.includes('\"ai-doc-summary\"'))throw new Error('missing topic-loader entry');
const paths=fs.readFileSync('src/lib/paths.ts','utf8');
if(!paths.includes('\"ai-doc-summary\"'))throw new Error('missing paths.ts entry');
console.log('metadata present in all 4 files');
"

# 5. Real content present verbatim (the two clean bullets only, not the dropped one)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-doc-summary.tsx','utf8');
const musts=[
  'Shopee vẫn là kênh doanh thu lớn nhất với 52%',
  'Kho Bình Dương có nguy cơ quá tải',
];
const mustNot = 'tăng 18% so với quý trước';
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real content: '+m);
if(tsx.includes(mustNot)) throw new Error('page includes the unverified 18% figure that should have been dropped');
console.log('real transcripts present verbatim, unverified figure correctly dropped');
"

# 6. No Claude/Anthropic mentions
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-doc-summary.tsx','utf8');
if(/claude|anthropic/i.test(t))throw new Error('page mentions Claude/Anthropic — this episode uses ChatGPT only');
console.log('no Claude/Anthropic mentions');
"

# 7. Dash ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-doc-summary.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table, confirmation
all verification commands passed, and the exact diff summary.
