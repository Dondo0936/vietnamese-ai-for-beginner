# Spec: new topic page `ai-for-meeting-notes`

## Goal

Create a new interactive lesson page at `src/topics/ai-for-meeting-notes.tsx`
(route `/topics/ai-for-meeting-notes`) teaching office workers (VP persona)
to turn a raw meeting transcript into a clean biên bản (decisions + action
items with owners) with AI, using the site's standard 8-step lesson
pattern. Register it in `src/topics/registry.ts` AND
`src/topics/topic-loader.tsx` (BOTH are required — grep
`topic-loader.tsx` for the comment "IMPORTANT: when adding a new topic
file, add a matching entry here AND an entry in src/topics/registry.ts";
missing either file means the page 404s or ships a client-only skeleton).
This spec covers ONLY the page — no video, no Remotion, no social copy, no
queue.json (a separate spec handles those once the Viettel TTS quota,
currently exhausted, is restored).

## Context / why

This is the Mon 07-14 slot of the "Làm thật một việc với AI" beginner
series (`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`).
Persona **dân văn phòng (VP)**. Hook: "Họp 1 tiếng, biên bản 5 phút" — the
task is turning a meeting transcript into decisions + action items.

Two close structural exemplars, both read in full this session:
`src/topics/ai-for-writing.tsx` and the just-shipped
`src/topics/ai-for-customer-replies.tsx` (same practical/skills page
pattern: Predict → Analogy → 3 interactive demos → Aha → 2 Challenges →
Explain tools/workflow/pitfalls/templates → Summary → Quiz,
`TOTAL_STEPS = 8`). Follow this exact shape and import set. Do NOT use the
`ApplicationX`/`sources`/`Metric` pattern.

**Real grounding — an actual ChatGPT exchange captured this session
(2026-07-09), reuse this exact content in the page's Demo 1 (do not invent
a different transcript; a companion video for this same lesson will reuse
the same content once TTS is restored, so page and video must agree):**

Meeting transcript used throughout (5 speakers, a realistic weekly team
sync — website project status, ad budget, hiring, team building):
```
Minh: Chào mọi người, mình bắt đầu họp tuần nhé. Đầu tiên là tình hình dự án website mới.
Lan: Bên em đã xong phần thiết kế trang chủ, dự kiến gửi bản demo cho anh Minh vào thứ Năm này.
Minh: Ok, còn phần backend thì sao Tuấn?
Tuấn: Backend em đang làm phần đăng nhập, hơi chậm hơn dự kiến vì phát sinh lỗi với API bên thứ ba. Em cần thêm 3 ngày nữa.
Minh: Được, vậy deadline chung dời sang thứ Ba tuần sau nhé. Tuấn nhớ báo sớm nếu vẫn chưa xong.
Lan: Anh Minh ơi, còn vụ ngân sách quảng cáo tháng này thì sao ạ?
Minh: Ngân sách được duyệt 50 triệu, tăng so với tháng trước 10 triệu. Chị Hà bên marketing sẽ gửi kế hoạch chi tiết trước thứ Sáu.
Hà: Dạ vâng, em sẽ tập trung chạy quảng cáo trên Facebook và TikTok, có thể thử thêm Google Ads nếu ngân sách còn dư.
Minh: Tốt. Việc tiếp theo là phỏng vấn ứng viên vị trí designer, ai phụ trách nhỉ?
Lan: Em phụ trách, đã hẹn 2 ứng viên vào thứ Tư tuần sau, buổi sáng và buổi chiều.
Minh: Ok nhớ mời thêm Tuấn ngồi phỏng vấn cùng để đánh giá kỹ năng phối hợp code nhé.
Tuấn: Dạ được ạ.
Minh: Cuối cùng, tuần sau công ty có buổi team building, mọi người sắp xếp công việc để tham gia đầy đủ nhé. Cảm ơn mọi người, họp đến đây thôi.
```

Real reply A (vague ask "Tóm tắt giúp tôi cuộc họp này", no transcript
pasted) — AI asks for the actual content before it can help:
```
Được. Vui lòng tải lên nội dung cuộc họp, có thể là:
- File âm thanh (MP3, M4A, WAV...)
- File video (MP4, MOV...)
- Bản ghi (transcript) dạng TXT, DOCX, PDF hoặc dán trực tiếp vào khung chat
Sau khi có nội dung, tôi có thể tóm tắt theo nhiều cách, ví dụ:
- Tóm tắt ngắn (5-10 gạch đầu dòng): các ý chính của cuộc họp.
- Tóm tắt chi tiết: theo từng chủ đề được thảo luận.
- Quyết định đã thống nhất: những kết luận cuối cùng.
- Danh sách việc cần làm (Action Items): ai làm gì, thời hạn khi nào (nếu có đề cập).
- Các vấn đề còn tồn đọng: những nội dung cần theo dõi hoặc họp tiếp.
Hãy tải lên file hoặc dán nội dung cuộc họp, tôi sẽ bắt đầu tóm tắt.
```

Real reply B (full 5-part prompt: vai trò trợ lý hành chính, nhiệm vụ viết
biên bản gồm quyết định chính + việc cần làm, bối cảnh họp tuần cần gửi
ngay, định dạng 2 phần, giọng văn ngắn gọn rõ ràng, transcript pasted) —
accurate, well-structured meeting minutes:
```
Biên bản họp tuần

Quyết định chính
- Hoàn tất thiết kế trang chủ website mới và gửi bản demo cho anh Minh vào thứ Năm.
- Điều chỉnh deadline chung của dự án website mới sang thứ Ba tuần sau do phần backend phát sinh lỗi với API bên thứ ba.
- Ngân sách quảng cáo tháng này được duyệt 50 triệu đồng, tăng 10 triệu đồng so với tháng trước.
- Kế hoạch quảng cáo tập trung vào Facebook và TikTok; có thể thử thêm Google Ads nếu còn ngân sách.
- Lan phụ trách phỏng vấn ứng viên vị trí designer; Tuấn tham gia phỏng vấn để đánh giá khả năng phối hợp giữa thiết kế và kỹ thuật.
- Toàn team sắp xếp công việc để tham gia đầy đủ buổi team building tuần sau.

Việc cần làm
| Việc cần làm | Người phụ trách | Hạn chót |
| Gửi bản demo thiết kế trang chủ website mới cho anh Minh | Lan | Thứ Năm |
| Hoàn thành phần backend đăng nhập và cập nhật tiến độ nếu có vấn đề | Tuấn | Thứ Ba tuần sau |
| Gửi kế hoạch chi tiết cho chiến dịch quảng cáo tháng này | Hà | Thứ Sáu |
| Phỏng vấn 2 ứng viên vị trí designer | Lan | Thứ Tư tuần sau (sáng và chiều) |
| Tham gia phỏng vấn designer để đánh giá kỹ năng phối hợp code | Tuấn | Thứ Tư tuần sau |
| Sắp xếp công việc để tham gia team building | Toàn team | Tuần sau |
```

Use these three verbatim (reply B's table may render as an actual HTML
table in the page component — the WORDS must not change) in the page's
demo section.

## Files to touch

Create:
- `AI_EDU/src/topics/ai-for-meeting-notes.tsx` — the full page.

Modify:
- `AI_EDU/src/topics/registry.ts` — append ONE entry (metadata mirror,
  same shape as the `ai-for-writing` / `ai-for-customer-replies` entries),
  as the LAST element of the topics array.
- `AI_EDU/src/topics/topic-loader.tsx` — append ONE entry
  `"ai-for-meeting-notes": dynamic(() => import("@/topics/ai-for-meeting-notes")),`
  keeping the list alphabetized (goes after `ai-for-excel-cleaning`,
  before `ai-for-paperwork`).
- `AI_EDU/src/lib/paths.ts` — add `"ai-for-meeting-notes"` to the "office"
  path's "Ứng dụng thực tế" stage slugs array (optional curation list,
  same pattern as the `ai-for-customer-replies` addition made this
  session — put it near `ai-for-writing`).

Do not touch any other file. No queue.json, no remotion/, no copy/ files.

## Interfaces & contracts

### Metadata (exact values, put in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "ai-for-meeting-notes",
  title: "AI for Meeting Notes",
  titleVi: "AI viết biên bản họp trong 5 phút",
  description:
    "Biến bản ghi cuộc họp thô thành biên bản rõ ràng: quyết định chính và việc cần làm kèm người phụ trách.",
  category: "applied-ai",
  tags: ["meeting-notes", "summarization", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-customer-replies", "getting-started-with-ai"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same imports as `ai-for-customer-replies.tsx`.

### Page structure (8 steps, mirrors `ai-for-customer-replies.tsx`'s shape)

**Step 1, Predict** (`PredictionGate`): "Họp 1 tiếng xong, nếu phải tự
viết biên bản từ ghi chú tay, thường mất bao lâu so với để AI đọc bản ghi
và soạn sẵn?" — 4 options, correct answer about AI cutting the drafting
time from ~20-30 phút xuống còn vài phút đọc lại và sửa. Explanation:
value is not "AI nhanh hơn bạn gõ", it's "AI đọc hết bản ghi dài mà không
bỏ sót, bạn chỉ cần kiểm lại".

**Step 2, Analogy** (rebuilt card): AI viết biên bản giống một thư ký ngồi
nghe cả cuộc họp và ghi chép không sót. Nhưng thư ký ghi lại những gì
được nói, còn bạn là người quyết định phần nào quan trọng để đưa vào bản
gửi cho team. 3 mini-cards: `Cuộc họp diễn ra` / `AI ghi lại có cấu trúc`
/ `Bạn duyệt và gửi`.

**Step 3, Explore** (`VisualizationSection`, 3 demos):
- **Demo 1**: `ToggleCompare`, labelA "AI hỏi lại vì chưa có nội dung" /
  labelB "Biên bản đầy đủ, có người phụ trách", childA = Real reply A
  (verbatim, abridged if needed), childB = Real reply B (verbatim,
  render the "Việc cần làm" list as a simple table or definition list —
  reuse an existing table-rendering pattern from another topic file if
  one exists, otherwise a styled `<dl>`/grid). Description: "Không có bản
  ghi, AI không tự bịa ra được nội dung cuộc họp."
- **Demo 2**: interactive picker (mirrors `ai-for-writing.tsx`'s
  `EmailDrafterDemo` state pattern) — pick "loại cuộc họp" (họp tuần team
  / họp với khách hàng / họp 1-1 với sếp) and "độ dài biên bản" (ngắn gọn
  / đầy đủ), output card re-renders a short sample biên bản snippet for
  that combination. Synthesize plausible short samples for non-real
  combinations (clearly a practice tool).
- **Demo 3**: `TabView` gallery, 4-5 tabs of common meeting-note
  situations (họp dự án, họp bán hàng, họp 1-1 đánh giá, họp khách hàng,
  họp khẩn) each with a short scenario + a synthesized sample output.
- Closing `Callout` (variant "tip"), 3 observations in the established
  rhythm.

**Step 4, Aha** (`AhaMoment`): giá trị chính không phải AI gõ nhanh hơn
bạn, mà AI đọc hết bản ghi dài không bỏ sót chi tiết, và tách đúng phần
nào là quyết định, phần nào là việc cần làm. Bạn vẫn là người xác nhận số
liệu, tên người, hạn chót trước khi gửi cho cả team.

**Step 5, Challenge** (2× `InlineChallenge`):
1. What a vague ask like "Tóm tắt giúp tôi cuộc họp này" (with no
   transcript attached) is missing — correct: bản ghi thật của cuộc họp,
   AI không tự bịa nội dung.
2. A risk case: biên bản AI viết ghi sai hạn chót hoặc gán nhầm người phụ
   trách một việc — correct: luôn đối chiếu bản ghi gốc trước khi gửi biên
   bản cho cả team, đừng gửi thẳng bản AI soạn.

**Step 6, Explain** (`ExplanationSection`):
- 4-5 công cụ tóm tắt họp phổ biến (ChatGPT free để dán transcript tay,
  công cụ ghi âm+tóm tắt tích hợp trong Zoom/Google Meet, Notion AI cho
  ghi chú, ứng dụng ghi âm chuyển văn bản tiếng Việt) — keep general, no
  unverifiable pricing claims.
- Vòng lặp 4 bước: Họp diễn ra → Có bản ghi (ghi âm hoặc gõ tay) → AI soạn
  biên bản → Bạn kiểm và gửi.
- 4 cái bẫy: AI bịa nội dung nếu không có bản ghi thật (bẫy nguy hiểm
  nhất); gán nhầm người phụ trách nếu bản ghi không rõ ai nói; biên bản
  quá dài vì AI giữ hết chi tiết nhỏ (khắc phục: ghi rõ "chỉ giữ quyết
  định và việc cần làm"); quên hạn chót vì cuộc họp không nói rõ (khắc
  phục: ghi "Chưa xác định" thay vì để AI đoán).
- **4 khuôn prompt copy được ngay**: A. Biên bản họp tuần, B. Biên bản họp
  khách hàng, C. Tóm tắt nhanh 5 dòng, D. Việc cần làm kèm người phụ
  trách. Each a fill-in-the-blank template string, same style as sibling
  pages.
- Two `Callout`s: variant "insight" tying to bản giao việc 5 phần (link
  `<TopicLink slug="ai-for-writing">` and
  `<TopicLink slug="ai-for-customer-replies">`); variant "warning" — khi
  KHÔNG nên để AI tự soạn biên bản: họp có nội dung bảo mật cao (lương,
  sa thải, pháp lý), cuộc họp có tranh chấp cần ghi chính xác từng lời,
  khi không có bản ghi đầy đủ và đáng tin cậy.

**Step 7, Summary** (`MiniSummary`, 5-6 points) + "Khám phá thêm" block
with `TopicLink`s to `ai-for-writing` and `ai-for-customer-replies`.

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s covering: what a
vague ask is missing, the "bịa nội dung nếu không có bản ghi" risk, biên
bản structure, when NOT to let AI auto-draft minutes, verifying owner/
deadline before sending).

## Constraints / do-not-touch

- Follow `AI_EDU/AGENTS.md` color-contrast rules exactly (read it first).
- Follow `docs/CONTRACTS.md` for every primitive used.
- Do not modify any existing topic file other than the three files listed
  above.
- Do not touch `remotion/`, `queue.json`, or any `copy/` file.
- No git commit/push. No new npm dependencies.
- No em/en dashes in Vietnamese body copy.

## Acceptance criteria

1. `src/topics/ai-for-meeting-notes.tsx` exports `metadata` (exact values
   above) and a default component with all 8 `LessonSection`s.
2. `src/topics/registry.ts` has exactly one new entry, metadata-identical.
3. `src/topics/topic-loader.tsx` has exactly one new entry, alphabetized.
4. `src/lib/paths.ts` "office" path includes the new slug.
5. The transcript, Real reply A, and Real reply B appear verbatim in Demo 1.
6. `npx tsc --noEmit` clean.
7. `npm test` green (contracts.test.ts passes, including metadata parity).
8. Color-contrast audit called out explicitly in the final report.
9. `npm run build` succeeds (note: `pnpm` is not installed in this
   environment per this session's earlier finding — use `npm run build`
   instead and note the substitution, do not treat pnpm-not-found as a
   real failure).
10. Visually verify the live page: start `npm run dev`, navigate to
    `/topics/ai-for-meeting-notes` via chrome-devtools, screenshot it in
    both light and dark mode, confirm no console errors beyond the
    pre-existing generic dev-mode CSP/analytics noise (Vercel Analytics
    CSP block, Supabase-offline warning — those are expected on every
    page in this dev environment, not a bug). Report what you saw.

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests
npm test

# 3. Build
npm run build

# 4. Metadata present + parity
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-meeting-notes.tsx','utf8');
if(!tsx.includes('slug: \"ai-for-meeting-notes\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"ai-for-meeting-notes\"'))throw new Error('missing registry entry');
const loader=fs.readFileSync('src/topics/topic-loader.tsx','utf8');
if(!loader.includes('\"ai-for-meeting-notes\"'))throw new Error('missing topic-loader entry');
const paths=fs.readFileSync('src/lib/paths.ts','utf8');
if(!paths.includes('\"ai-for-meeting-notes\"'))throw new Error('missing paths.ts entry');
console.log('metadata present in all 4 files');
"

# 5. Real content present verbatim
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/ai-for-meeting-notes.tsx','utf8');
const musts=[
  'Backend em đang làm phần đăng nhập',
  'Hoàn tất thiết kế trang chủ website mới và gửi bản demo cho anh Minh vào thứ Năm',
];
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real content: '+m);
console.log('real transcripts present verbatim');
"

# 6. Dash ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/ai-for-meeting-notes.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table, confirmation
all verification commands passed, the live-page visual check
(light+dark screenshots described, console check), and the exact diff
summary.
