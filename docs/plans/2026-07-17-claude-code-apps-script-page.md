# Spec: new topic page `claude-code-apps-script`

> **STATUS: FINAL.** All demo material below is from the real run of
> 2026-07-17 on Dat's machine and account (clasp 3.3.0). Every quoted command,
> output, prompt, and app string was captured and verified live; screenshots
> (12 assets, 2560×1440) are in `public/clasp-demo/`. Do not alter quoted
> material.

## Goal

Create a new interactive lesson page at `src/topics/claude-code-apps-script.tsx`
(route `/topics/claude-code-apps-script`) teaching how Claude Code drives
Google Apps Script end to end from the terminal with clasp: tạo project, viết
code, publish web app, sửa và cập nhật mà không mở trình duyệt để code. Use the
site's standard 8-step lesson pattern. Register it in `src/topics/registry.ts`,
`src/topics/topic-loader.tsx`, AND `src/lib/paths.ts` (all three). This spec
covers ONLY the page — no video, no Remotion, no social copy, no queue.json (a
separate drop-prep spec handles those after this page ships).

## Context / why

First episode of the longform-track pivot (Dat, 2026-07-16): niche power-user
use cases of Claude / Claude Code / Codex, starting with "dùng Claude Code
điều khiển Google Apps Script — tạo/sửa/publish script bằng CLI (clasp)". See
`skill-marketplaces/copy/posts/PLAN-2026-07-beginner-series.md`, section
"Longform track pivot". The page is the lesson home the video CTA points to.

Audience: người dùng văn phòng/chủ quán tò mò kỹ thuật, chưa từng mở terminal
nghiêm túc. The page must keep every command literal and every safety gate
visible (permission prompt, login là của bạn).

Two close structural exemplars, follow them: `src/topics/ai-for-writing.tsx`
and `src/topics/ai-for-market-research.tsx` (Predict → Analogy → 3 interactive
demos → Aha → 2 Challenges → Explain tools/workflow/pitfalls/templates →
Summary → Quiz, `TOTAL_STEPS = 8`). Do NOT use the
`ApplicationX`/`sources`/`Metric` pattern.

**Real grounding — an actual run captured 2026-07-17 on Dat's machine: clasp
3.3.0, real Google account, real deployment. Page and video reuse the same
transcripts; do not invent outputs.** Screenshots live in `public/clasp-demo/`
(for the video comp — the page does NOT embed them; do not reference them from
the page).

Scenario (continuity with `ai-for-market-research`): quán cà phê take-away ở
TP.HCM, nay đặt tên **Don Coffee**. Chủ quán cần form đặt món online: khách mở
link, chọn món, đơn rơi thẳng vào Google Sheet.

### The real task given to Claude Code (verbatim, typed into `claude` in
`~/Projects/don-coffee`):
```
Tạo web app đặt món cho quán cà phê bằng Google Apps Script, dùng clasp. Form gồm tên khách, món, số lượng, ghi đơn vào Google Sheet.
```

### The real command sequence and outputs (verbatim from capture):

**C1 — tạo project + Sheet bằng một lệnh (real output, captured):**
```
$ clasp create-script --title "Don Coffee - Đặt món" --type sheets
Created new document: https://drive.google.com/open?id=1h-SXBqvBn5CXdvwZviBEB3kYXUmGnjt_Ctzb5VhCLhE
Created new script: https://script.google.com/d/1HLx-Hu9jqXiCYWfQV5iWFI98wU8cKB7KoxYcbAUsPXks46M7cycmixpM/edit
└─ appsscript.json
Cloned one file..
```
(The page may elide the two long URLs mid-string with `...` for display; keep
the "Created new document/Created new script" line starts intact.)

**C2 — đẩy code lên (3 files: appsscript.json, Code.js, Form.html) (real):**
```
$ ls -1
appsscript.json
Code.js
Form.html
$ clasp push -f
Pushed 3 files at 9:48:18 AM.
└─ appsscript.json
└─ Code.js
└─ Form.html
```

**C3 — publish thành web app, lấy link công khai (real):**
```
$ clasp create-deployment -d "ban dau"
Deployed AKfycbziPuB409wDy3HQ0o4f2vCTBb3rbl774FgfsYUF0bzjMwAYgz9_GDmJdz_jQOo3AuRZWA @1
```
Real web app URL, elided display form for the page:
`script.google.com/macros/s/AKfycbzi...RZWA/exec`

**C4 — the edit round (thêm tổng tiền), link giữ nguyên (real):**
```
$ clasp push
Pushed 3 files at 10:16:14 AM.
└─ appsscript.json
└─ Code.js
└─ Form.html
$ clasp update-deployment AKfycbziPuB409wDy3HQ0o4f2vCTBb3rbl774FgfsYUF0bzjMwAYgz9_GDmJdz_jQOo3AuRZWA -d "them tong tien"
Redeployed AKfycbziPuB409wDy3HQ0o4f2vCTBb3rbl774FgfsYUF0bzjMwAYgz9_GDmJdz_jQOo3AuRZWA @2
```
Teaching anchor: "Redeployed ... @2" = cùng deployment ID, phiên bản 2, link
không đổi. The v1→v2 code diff (real): guiDon computes
`const tongTien = monChon.gia * don.soLuong`, appendRow gains `tongTien`,
return becomes `"Đã nhận đơn: " + don.soLuong + " " + don.mon + ", tổng " +
dinhDangTien(tongTien)` with new `dinhDangTien(so)` =
`so.toLocaleString("vi-VN") + "đ"`, and laySheetDonHang gains the "Tổng tiền"
header column + an E1 header backfill for sheets created by v1.

### The real Claude Code permission beat (verbatim, captured — asset 02):
```
Bash command

  clasp create --type sheets --title "Đơn Coffee" 2>&1
  Create Sheet-bound Apps Script project via clasp

This command requires approval

Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again for: clasp create *
  3. No

Esc to cancel · Tab to amend · ctrl+e to explain
```
Note: the live Claude Code session proposed the SHORT ALIAS `clasp create`
(and its own title spelling "Đơn Coffee"); the canonical command the lesson
teaches is `create-script`. The page glosses this exactly once in Demo 2: một
số lệnh có tên gọi tắt, `create` là tên tắt của `create-script`. Do not
"correct" the prompt text; quote it as captured.

### Real app strings (from the demo source, capture-verified in browser):
- v1 confirmation, VERIFIED in real browser (3 real orders): `Đã nhận đơn của Chị Lan!`
  (also captured: "Đã nhận đơn của Anh Minh!", "Đã nhận đơn của Cô Hà!")
- v2 confirmation, VERIFIED in real browser after the redeploy (same URL):
  `Đã nhận đơn: 2 Bạc xỉu, tổng 58.000đ`
- Menu options: `Phin sữa đá (25k)`, `Bạc xỉu (29k)`, `Cold brew cam (35k)`,
  `Trà đào cam sả (32k)`
- Sheet tab `Đơn hàng`, header v2: Thời gian, Tên khách, Món, Số lượng, Tổng tiền

### The real v1→v2 diff (page renders as before/after, exact code):
v1 `guiDon` appends 4 columns and returns `"Đã nhận đơn của " + don.tenKhach + "!"`.
v2 computes `tongTien = monChon.gia * don.soLuong`, appends 5 columns, returns
the total via `dinhDangTien(so)` = `so.toLocaleString("vi-VN") + "đ"`. Full
staged sources: session scratchpad `don-coffee/v1/`, `don-coffee/v2/`; after
the run they also live in `~/Projects/don-coffee/`.

## Files to touch

Create:
- `src/topics/claude-code-apps-script.tsx` — the full page.

Modify (ALL THREE registrations. Failure modes differ: missing registry.ts
entry → route 404s; missing topic-loader.tsx entry → page renders with an
EMPTY body while typecheck/tests stay green — so verify the rendered page has
content, not just that the route resolves):
- `src/topics/registry.ts` — append ONE entry as the LAST element, metadata
  byte-identical to the .tsx `metadata` export (parity test in
  `src/__tests__/contracts.test.ts`; read `docs/CONTRACTS.md`).
- `src/topics/topic-loader.tsx` — add
  `"claude-code-apps-script": dynamic(() => import("@/topics/claude-code-apps-script")),`
  (alphabetical placement consistent with neighbors).
- `src/lib/paths.ts` — add `"claude-code-apps-script"` to the
  "Ứng dụng thực tế" section's `slugs` array (after `ai-for-market-research`).

Do not touch any other file. No queue.json, no remotion/, no copy/ files.

## Interfaces & contracts

### Metadata (exact values, in BOTH the .tsx file and registry.ts)
```ts
export const metadata: TopicMeta = {
  slug: "claude-code-apps-script",
  title: "Claude Code + Google Apps Script",
  titleVi: "Dựng web app đặt món bằng Claude Code và 3 lệnh clasp",
  description:
    "Claude Code viết code Google Apps Script rồi tạo, đẩy và publish web app đặt món bằng clasp ngay trong terminal. Đơn hàng rơi thẳng vào Google Sheet, sửa code xong link vẫn giữ nguyên.",
  category: "applied-ai",
  tags: ["claude-code", "apps-script", "clasp", "automation", "cli"],
  difficulty: "intermediate",
  relatedSlugs: ["ai-coding-assistants", "agentic-workflows", "ai-for-market-research"],
  vizType: "interactive",
};
```
`TOTAL_STEPS = 8`, same `LessonSection`/`PredictionGate`/`InlineChallenge`/
`AhaMoment`/`MiniSummary`/`QuizSection`/`TopicLink` imports as the exemplars.
No `@/components/application/*` imports. File starts with `"use client"`.

### Page structure (8 steps)

**Step 1, Predict** (`PredictionGate`): Muốn tạo và publish một web app Google
Apps Script (form đặt món ghi vào Google Sheet), bạn bắt buộc phải làm gì?
4 options; correct = "Không bắt buộc mở trình duyệt để code: từ tạo project
đến publish đều làm được bằng lệnh trong terminal"; distractors: phải vào
script.google.com và code trong editor web / phải thành thạo JavaScript trước /
phải trả phí Google Workspace. Explanation: clasp là CLI chính thức của Google
cho Apps Script; Claude Code gõ lệnh và viết code thay bạn, bạn duyệt từng
bước.

**Step 2, Analogy** (rebuilt card, literal per house style — NO metaphors):
Phân vai ba bên: bạn ra đề bài và giữ quyền duyệt; Claude Code viết code và đề
xuất từng lệnh; clasp là đường chính thức đưa code lên Google và lấy link về.
3 mini-cards: `Bạn ra đề và duyệt` / `Claude Code viết và gõ lệnh` /
`clasp đưa code lên Google`.

**Step 3, Explore** (`VisualizationSection`, 3 demos):
- **Demo 1** — "3 lệnh từ 0 đến link công khai": state-driven stepper
  (terminal-style monospace cards). Step qua C1 → C2 → C3, each showing the
  REAL command + REAL output (verbatim blocks above) + one plain sentence
  explaining what just happened (một lệnh tạo cả Sheet lẫn project / push đưa
  3 file lên / deployment trả về link ai cũng mở được).
- **Demo 2** — `ToggleCompare`, labelA "Tự làm trên trình duyệt" (5-6 manual
  steps listed: mở script.google.com, tạo project, gõ code trong editor, gắn
  Sheet, deploy qua menu, copy link) / labelB "Ra lệnh cho Claude Code":
  the real task sentence (verbatim) + the REAL permission prompt beat
  (verbatim) + one sentence: Claude Code luôn dừng lại xin phép trước khi chạy
  lệnh, bạn đọc lệnh rồi mới bấm đồng ý. This is the safety-model beat, keep
  it load-bearing.
- **Demo 3** — "Sửa xong, link giữ nguyên": before/after toggle of the real
  v1/v2 `guiDon` code (compact) + the two real confirmation strings, then the
  two real commands (`clasp push`, `clasp update-deployment ...`) with real
  output. Teaching line: push chỉ đưa code lên editor; bản publish đứng yên ở
  phiên bản cũ cho đến khi update-deployment.
- Closing `Callout` (variant "tip"), 3 observations: publish một lần lấy link,
  sửa bao nhiêu lần link vẫn giữ nguyên; Claude Code xin phép trước mọi lệnh;
  Google Sheet làm kho đơn hàng miễn phí cho form nhỏ.

**Step 4, Aha** (`AhaMoment`): AI viết code và gõ lệnh nhanh hơn bạn, nhưng ba
thứ vẫn nằm nguyên trong tay bạn: tài khoản Google (clasp login là bạn đăng
nhập), nút đồng ý trước mỗi lệnh, và quyết định publish. Điều khiển bằng AI
không có nghĩa là buông tay khỏi tài khoản của mình.

**Step 5, Challenge** (2× `InlineChallenge`):
1. Claude Code đề xuất chạy `clasp create-script` nhưng bạn chưa từng
   `clasp login` — điều gì xảy ra? (correct: lệnh báo lỗi vì chưa có quyền;
   AI không tự đăng nhập vào Google của bạn được, đăng nhập luôn là bước của
   bạn.)
2. Bạn sửa Code.js, chạy `clasp push` thành công, nhưng khách mở link vẫn thấy
   bản cũ — thiếu bước nào? (correct: `clasp update-deployment`; push đưa code
   lên editor còn bản publish giữ nguyên phiên bản cũ cho đến khi update.)

**Step 6, Explain** (`ExplanationSection`, same rhythm as exemplars):
- Công cụ: Claude Code (agent chạy trong terminal của Anthropic), clasp (CLI
  chính thức của Google cho Apps Script, cài qua npm), Google Sheet (kho dữ
  liệu). One line going-further: clasp 3 còn có lệnh `start-mcp-server` để
  các AI agent nói chuyện trực tiếp với Apps Script.
- Vòng lặp 4 bước: Ra đề bài rõ (form gồm gì, ghi vào đâu) → Claude Code viết
  code và đề xuất lệnh, bạn duyệt từng lệnh → create-script, push,
  create-deployment để lấy link → Sửa tiếp: push rồi update-deployment, link
  giữ nguyên.
- 4 cái bẫy: **link 403 dù deploy thành công** (THIS HAPPENED IN THE REAL RUN,
  tell it as the lived story: publish hoàn toàn bằng lệnh nghĩa là tài khoản
  của bạn chưa từng cấp quyền cho script chạy, mở editor bấm Run một lần, Google
  hỏi quyền, cho phép xong link chạy ngay; cùng nhóm rào cản một lần này là
  công tắc Apps Script API trong settings nếu push bị chặn); sửa xong chỉ push
  mà quên update-deployment nên link vẫn chạy bản cũ; để quyền truy cập "ai
  cũng gửi được" thì form công khai có thể nhận đơn rác, cân nhắc khi form chỉ
  dùng nội bộ; bấm đồng ý cho lệnh mà chưa đọc lệnh, nhất là các lệnh xóa như
  delete-script.
- **4 khuôn prompt copy được ngay** (card grid): A. đề bài dựng web app form
  (khuôn hóa từ task thật); B. đề bài thêm tính năng vào script đang có (khuôn
  hóa từ edit round); C. yêu cầu Claude Code giải thích một lệnh trước khi
  chạy; D. đề bài tự động hóa một Sheet khác (điểm danh lớp học, chấm công).
  Fill-in-the-blank hóa, không claim là transcript.
- Two `Callout`s: variant "insight" với `<TopicLink slug="ai-coding-assistants">`
  (Claude Code là gì, cho người không code) và
  `<TopicLink slug="agentic-workflows">` (giao việc nhiều bước cho AI);
  variant "warning" — khi KHÔNG nên làm theo bài này: dữ liệu nhạy cảm (lương,
  số điện thoại khách) đổ vào Sheet qua form công khai; form nội bộ thì đừng
  deploy quyền cho tất cả mọi người; và đừng để AI chạy lệnh xóa khi bạn chưa
  đọc kỹ.

**Step 7, Summary** (`MiniSummary`, 5-6 points): 3 lệnh create-script, push,
create-deployment là xương sống; sửa code cần push VÀ update-deployment; đăng
nhập và nút đồng ý luôn là của bạn; Google Sheet đủ làm kho đơn cho form nhỏ;
bẫy lớn nhất là quên update-deployment rồi tưởng code hỏng. Plus "Khám phá
thêm" block with `TopicLink`s to `ai-coding-assistants` and
`ai-for-market-research`.

**Step 8, Quiz** (`QuizSection`, 6-8 `QuizQuestion`s): clasp là gì và của ai;
thứ tự 3 lệnh từ 0 đến link; push khác gì update-deployment (tình huống link
bản cũ); ai giữ quyền đăng nhập Google; permission prompt của Claude Code để
làm gì; vì sao một lệnh create-script --type sheets tạo được cả Sheet; link
deploy xong báo 403 nghĩa là gì (script chưa được cấp quyền chạy lần đầu, không
phải code hỏng); rủi ro của form công khai ghi vào Sheet.

## Constraints / do-not-touch

- **Verbatim-text encoding rule (prevents TSX breakage):** every quoted
  transcript, command, output, and code block in this spec goes into the page
  as template-literal string constants (backtick strings or `String.raw`, or
  string arrays joined at render) rendered via `{...}` inside `<pre>`/`<code>`
  elements — NEVER pasted as raw JSX text. The material contains double
  quotes, apostrophes (`don't`), `2>&1`, `<`/`>` and raw braces in `guiDon`,
  all of which break naive JSX. None of the quoted material contains a
  backtick, so template literals are safe; if one is ever introduced, escape
  it. The spec's quoted v1/v2 code snippets are the source of truth for the
  page (do not re-read `~/Projects/don-coffee`).
- **ID/URL elision policy (one rule everywhere):** long opaque Google IDs and
  URLs display elided as first-8-chars + `...` + last-4-chars (e.g.
  `AKfycbzi...RZWA`, and the C1 document/script URLs elided mid-path). ALL
  other quoted text is byte-exact. Apply the same elision to the same ID
  everywhere it appears (C3 output, C4 command, C4 output) so the "same ID,
  new version" comparison stays visibly true.
- Follow the repo-root `AGENTS.md` color-contrast rules exactly (no
  `text-{hue}-{50..600}` on same-family tinted bg; tinted-card body text
  defaults `text-foreground`; audit every visible state in light AND dark;
  NO `[&_...]` descendant-override wrappers — they broke dark mode last time).
- Follow `docs/CONTRACTS.md` for every primitive used — read it first.
- Do not modify any existing topic file. Do not touch `remotion/`,
  `queue.json`, `copy/`, `public/clasp-demo/`.
- No git commit/push. No new npm dependencies.
- No em/en dashes anywhere in the page file. No metaphors — mọi so sánh phải
  literal (house rule after the "chân đất" correction).
- No decimal numbers in Vietnamese prose you author (real outputs quoted
  verbatim are fine). Command names, flags, and outputs must match the
  captured transcripts byte-for-byte — never "improve" a real output.
- Terminal-styled cards must be readable in BOTH site themes (dark terminal
  card on light page is fine, but audit the pairing both ways).

## Acceptance criteria

1. `src/topics/claude-code-apps-script.tsx` exports `metadata` (exact values
   above) and a default component with all 8 `LessonSection`s.
2. All THREE registrations present (registry.ts metadata-identical,
   topic-loader.tsx map entry, paths.ts slug in "Ứng dụng thực tế").
3. The real task sentence, real command lines, real outputs, real permission
   prompt, and real confirmation strings appear exactly as given in this spec.
4. `npx tsc --noEmit` clean. 5. `npm test` green. 6. `npm run build` succeeds.
7. Color-contrast audit reported explicitly (state × light × dark table).

## Verification commands

```bash
cd /Users/datdo/Projects/ai-edu-v2

# 1. Typecheck
npx tsc --noEmit

# 2. Tests (contracts + registry parity)
npm test

# 3. Build (npm — pnpm is not installed in this shell)
npm run build

# 4. Triple registration (asserts)
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/claude-code-apps-script.tsx','utf8');
if(!tsx.includes('slug: \"claude-code-apps-script\"'))throw new Error('metadata slug missing in tsx');
const reg=fs.readFileSync('src/topics/registry.ts','utf8');
if(!reg.includes('slug: \"claude-code-apps-script\"'))throw new Error('missing registry entry');
const loader=fs.readFileSync('src/topics/topic-loader.tsx','utf8');
if(!loader.includes('import(\"@/topics/claude-code-apps-script\")'))throw new Error('missing topic-loader dynamic import');
const paths=fs.readFileSync('src/lib/paths.ts','utf8');
const secStart=paths.indexOf('Ứng dụng thực tế');
if(secStart<0)throw new Error('paths.ts section not found');
const nextTitle=paths.indexOf('title:',secStart+20);
const section=paths.slice(secStart, nextTitle<0?paths.length:nextTitle);
if(!section.includes('\"claude-code-apps-script\"'))throw new Error('slug not inside Ứng dụng thực tế section');
console.log('all three registrations present and placed');
"

# 4b. Rendered page has real content (guards the empty-body failure mode:
# a missing loader entry renders an empty TopicLayout while builds stay green).
# Start the dev server (npm run dev), request the route, and assert Step 1
# text is present in the response:
# curl -s http://localhost:3000/topics/claude-code-apps-script | grep -c "Đặt món"
# Expect a nonzero count. State the observed count in the report.

# 5. Real material present verbatim
node -e "
const fs=require('fs');
const tsx=fs.readFileSync('src/topics/claude-code-apps-script.tsx','utf8');
const musts=[
  'Tạo web app đặt món cho quán cà phê bằng Google Apps Script, dùng clasp',
  'create-script --title',
  'Pushed 3 files at 9:48:18 AM.',
  'Deployed AKfycbzi',
  'This command requires approval',
  'update-deployment',
  'Redeployed AKfycbzi',
  'Đã nhận đơn của Chị Lan!',
  'Đã nhận đơn: 2 Bạc xỉu, tổng 58.000đ',
  'Esc to cancel',
  'Tab to amend',
];
for(const m of musts) if(!tsx.includes(m)) throw new Error('missing real material: '+m);
console.log('real material present verbatim');
"

# 6. Dash + metaphor-token ban
node -e "
const fs=require('fs');
const t=fs.readFileSync('src/topics/claude-code-apps-script.tsx','utf8');
if(/[—–]/.test(t))throw new Error('em/en dash found in page');
console.log('no em/en dashes');
"
```

## Report

Final report must include: the color-contrast audit table (state × light mode
class × dark mode class), explicitly covering AT MINIMUM every `Callout`
variant used, every `PredictionGate` and `InlineChallenge` state, and the
terminal-styled/code cards in both site themes; all verification command
results including the 4b rendered-content count; and the exact diff summary
(files touched, line counts).
