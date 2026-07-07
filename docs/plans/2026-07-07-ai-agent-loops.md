# Lesson: ai-agent-loops (Vòng lặp agent)

## Goal

Add one new topic page to udemi.tech: `ai-agent-loops`, a Vietnamese lesson teaching the four loop types for AI coding agents from Anthropic's "Getting started with loops" guide (claude.com blog, published June 30, 2026, by Delba de Oliveira and Michael Segner). Live URL after deploy: `https://udemi.tech/topics/ai-agent-loops`.

## Context / why

The article defines loops as "agents repeating cycles of work until a stop condition is met" and categorizes four types by trigger, stop criterion, primitive, and best-fit task. This lesson translates and adapts it for udemi.tech's Vietnamese audience. All factual claims below come from the article and the official Claude Code docs; do not invent commands or behavior beyond what this spec states.

## Files to touch

- `src/topics/ai-agent-loops.tsx` — NEW. The lesson. Copy the structure of `src/topics/_template.tsx`; model prose density and section rhythm on `src/topics/ai-for-social-media.tsx` (the most recent shipped lesson, same author-era conventions) and `src/topics/agentic-workflows.tsx` (same category).
- `src/topics/registry.ts` — add one `TopicMeta` entry immediately after the `agentic-workflows` entry (around line 1396, category block `ai-agents`). The block's count comment currently says 9 topics; update it to 10.
- Deliberate non-change: do NOT add the slug to any `STAGES` array in `src/lib/paths.ts`. This is a standalone topic (reachable by URL and browse), same as `ai-for-social-media`; inserting a beginner topic into an existing path risks the stage difficulty-monotonicity contract.
- `src/topics/topic-loader.tsx` — add one alphabetized line: `"ai-agent-loops": dynamic(() => import("@/topics/ai-agent-loops")),` — alphabetically this lands right BEFORE `"ai-coding-assistants"` (and after `"ai-agents-...`-anything; check the map and keep strict alphabetical order).

## Interfaces & contracts

`TopicMeta` — use these exact values in BOTH the topic file's `export const metadata` and the registry entry (contracts test enforces parity):

```ts
{
  slug: "ai-agent-loops",
  title: "AI Agent Loops",
  titleVi: "Vòng lặp agent: giao việc cho AI tự chạy đến khi xong",
  description:
    "Bốn kiểu vòng lặp giúp AI agent tự lặp lại công việc đến khi đạt điều kiện dừng: theo lượt, theo mục tiêu, theo lịch và chủ động. Kèm cách giữ chất lượng và quản lý token.",
  category: "ai-agents",
  tags: ["agents", "loops", "automation", "claude-code", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["agentic-workflows", "ai-coding-assistants", "getting-started-with-ai"],
  vizType: "interactive",
}
```

- `"use client"` default-export component like every topic.
- Import palette: same families as `ai-for-social-media.tsx` (interactive primitives, topic sections, lucide-react, framer-motion). `CodeBlock` from the shared components IS allowed here (this is a technical `ai-agents` topic, not an office-path lesson) — use it for the command examples.
- Section headings unique within the page. Contrast rules per AGENTS.md: body text inside tinted panels is `text-foreground`; no `text-{hue}-{50..600}` on same-family tinted backgrounds; no `text-muted` on tinted panels.

## Source facts the lesson must teach (do not alter these)

Definition: a loop = an agent repeating cycles of work until a stop condition is met. The base cycle ("agentic loop"): gather context → take action → check the work → repeat if needed → respond.

The four loop types, each with trigger / stop / primitive / best-for / usage-management:

1. **Turn-based** — trigger: a user prompt. Stop: Claude judges the task complete or needs more context. Primitive: none (every normal prompt). Best for: shorter, one-off tasks. Manage usage: specific prompts; encode manual verification steps as a SKILL.md so the agent checks its own work (example in the article: a `verify-frontend-change` skill that starts the dev server, interacts with the change, checks the console, runs a performance trace — and reruns from step 1 on any failure).
2. **Goal-based (`/goal`)** — trigger: a manual prompt. Stop: goal achieved OR a maximum number of turns. Primitive: `/goal`. Best for: tasks with verifiable exit criteria. Each time the agent tries to stop, an evaluator model checks the condition and sends it back to work until met. Deterministic criteria (tests passed, score threshold) work best. Article example: `/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries.`
3. **Time-based (`/loop`, `/schedule`)** — trigger: a time interval. Stop: you cancel it, or the work completes (PR merges, queue empty). Best for: recurring work or interfacing with external systems by polling. Article example: `/loop 5m check my PR, address review comments, and fix failing CI`. `/loop` runs on your machine (turn it off and it stops); `/schedule` moves the loop to the cloud as a routine. Manage usage: longer intervals, or react to events instead of time.
4. **Proactive** — trigger: an event or schedule, no human in real time. Stop: each task exits when its goal is met; the routine runs until you turn it off. Best for: recurring streams of well-defined work (bug reports, issue triage, migrations, dependency upgrades). Built by composing `/schedule` + `/goal` + skills + dynamic workflows + auto mode. Article composite example, verbatim: `/schedule every hour: check the #project-feedback channel for bug reports. /goal: don't stop until every report found this run is triaged, actioned, and responded to. When fixing a bug, use a workflow to explore three solutions in parallel worktrees and have a judge adversarially review them.` Manage usage: route routines to smaller, faster models; use the most capable model only for judgment calls.

Product caveats (teach honestly, one compact `Callout` variant="info" in beat 3 or 6): `/goal` cần Claude Code bản mới (v2.1.139 trở lên); model đánh giá của `/goal` chỉ đọc hội thoại, không tự chạy lệnh, nên điều kiện phải chứng minh được trong nội dung agent trả ra; `/schedule` và routines đang ở giai đoạn research preview (bản dùng thử), khả dụng tùy gói tài khoản.

Summary table (render as the CONNECT beat's core):

| Vòng lặp | Bạn giao phần gì | Dùng khi | Công cụ |
| Theo lượt | Phần kiểm tra | Bạn đang khám phá hoặc cân nhắc | Skill kiểm tra tự viết |
| Theo mục tiêu | Điều kiện dừng | Bạn biết rõ "xong" nghĩa là gì | /goal |
| Theo lịch | Thời điểm chạy | Việc diễn ra theo lịch hoặc ở hệ thống ngoài | /loop, /schedule |
| Chủ động | Toàn bộ đề bài | Việc lặp lại và được định nghĩa rõ | Tất cả các công cụ trên + dynamic workflows |

Quality rules (article section "Maintaining code quality"): keep the codebase clean (the agent follows existing patterns); give the agent a way to verify its own work via skills; make docs easy to reach; use a second agent with fresh context for code review; when a result misses the bar, encode the fix into the system, not just the instance.

Token rules (article section "Managing token usage"): right primitive and model for the job; clear success and stop criteria; pilot on a small slice before a large run; use scripts for deterministic work instead of re-reasoning; don't run routines more often than the watched thing changes; review usage with `/usage` (and `/goal` with no arguments shows turns and token usage so far).

Getting-started advice: pick one task where you are the bottleneck and ask which piece you can hand off — can you write the check? is the goal clear? does the work arrive on a schedule? Run it, watch where it stalls or over-reaches, iterate.

## Ordered changes

1. Create `src/topics/ai-agent-loops.tsx` with the metadata above and the 8-beat arc below.
2. Register in `registry.ts`; add loader line.
3. Run verification commands.

### Lesson arc (all learner-visible text Vietnamese, full diacritics, "bạn"; gloss each English term at first use and stay consistent: loop → "vòng lặp", agent → "agent, tức tác nhân AI", token → "token, tức đơn vị chữ mà AI xử lý", PR → "PR, tức yêu cầu gộp code", CI → "CI, tức bộ kiểm tra tự động của dự án")

1. **HOOK** — `PredictionGate`, question near-verbatim: "Cùng dùng một AI agent, vì sao có người chỉ giao việc một câu rồi agent tự chạy đến khi xong, còn bạn phải nhắc từng bước một?" Options (two plausible misconceptions + one correct, per the PredictionGate contract): (a) "Vì họ mua gói AI đắt hơn, model mạnh hơn nên tự biết phải làm gì" (b) "Vì họ định nghĩa điều kiện dừng, thay vì ra lệnh từng bước" (correct) (c) "Vì họ viết prompt dài và chi tiết hơn nhiều lần". Explanation introduces the loop definition.
2. **DISCOVER** — `MatchPairs`: nối "bạn giao phần gì" với kiểu vòng lặp (4 pairs from the summary table). Frame with a VN example: một bạn làm marketing muốn AI tóm tắt tin nhắn Slack mỗi sáng.
3. **REVEAL** — four loop-type cards (grid like PlatformRuleGrid in ai-for-social-media.tsx): mỗi card có Kích hoạt / Dừng khi / Công cụ / Hợp với. Include one `CodeBlock` per command-bearing type with the article's exact commands (English, unaltered): the `/goal` Lighthouse example, the `/loop 5m` PR example, the composite `/schedule` + `/goal` prompt.
4. **DEEPEN** — `StepReveal` of the agentic loop's 5 steps (thu thập ngữ cảnh → hành động → tự kiểm tra → lặp nếu cần → trả lời). Then a `Callout` (insight) on the evaluator: với `/goal`, mỗi lần agent định dừng, một model đánh giá sẽ kiểm tra điều kiện; nếu chưa đạt, agent bị gửi quay lại làm tiếp — vì vậy tiêu chí đo đếm được (số test đạt, điểm số) hiệu quả hơn tiêu chí cảm tính. `AhaMoment`: "Thứ bạn giao cho agent không phải là từng bước làm. Thứ bạn giao là điều kiện dừng."
5. **CHALLENGE** — `InlineChallenge`: "Bạn muốn AI tóm tắt kênh Slack của nhóm vào 8 giờ mỗi sáng, kể cả khi bạn chưa mở máy. Chọn kiểu vòng lặp nào?" Options: theo lượt / theo mục tiêu / theo lịch bằng `/loop` trên máy bạn / theo lịch bằng `/schedule` trên cloud (correct — vì `/loop` dừng khi tắt máy, còn routine trên cloud chạy độc lập). Explanation reinforces the local-vs-cloud distinction.
6. **EXPLAIN** — two rule groups as compact lists (`ExplanationSection`): "Giữ chất lượng" (5 quality rules) and "Quản lý token" (6 token rules), each rule one short sentence. `Callout` (tip): không phải việc nào cũng cần vòng lặp phức tạp; bắt đầu bằng cách đơn giản nhất, dùng có chọn lọc (article's own advice).
7. **CONNECT** — `MiniSummary` with the 4-row summary table content as points; getting-started advice (một việc bạn đang là nút thắt; bạn viết được phần kiểm tra chưa; mục tiêu đã rõ chưa; việc có đến theo lịch không). `TopicLink` to `agentic-workflows`, `ai-coding-assistants`, `getting-started-with-ai`.
8. **QUIZ** — `QuizSection`, 4 questions:
   1. `/goal` dừng khi nào? → Khi điều kiện đạt hoặc chạm số lượt tối đa bạn đặt.
   2. Vì sao `/loop` dừng khi bạn tắt máy còn routine của `/schedule` thì không? → `/loop` chạy trên máy bạn; `/schedule` chuyển vòng lặp lên cloud.
   3. Vì sao tiêu chí đo đếm được hiệu quả hơn với `/goal`? → Model đánh giá kiểm tra được rõ ràng, agent không tự kết luận "tạm ổn" rồi dừng sớm.
   4. Vòng lặp chủ động hợp với loại việc nào? → Dòng việc lặp lại, định nghĩa rõ: triage bug, nâng cấp thư viện, xử lý phản hồi.

## Constraints / do-not-touch

- Only the three listed files. No `paths.ts`, no other topics, no package.json, no new dependencies.
- Command examples stay in English exactly as the article wrote them; surrounding prose Vietnamese.
- No em dashes in Vietnamese prose, no US cultural references, no hype words; "bạn" only; full diacritics.
- Do NOT git commit, push, or deploy. Supervisor ships.

## Acceptance criteria

- [ ] `src/topics/ai-agent-loops.tsx` compiles and renders all 8 beats with at least 3 interactive primitives, 3 CodeBlock command examples, and a 4-question quiz.
- [ ] Registry/topic metadata field-identical across ALL TopicMeta fields (title, titleVi, description, category, tags, difficulty, relatedSlugs, vizType) — the contracts test only compares a subset, so check the rest by hand.
- [ ] Loader line is the exact dynamic-import wiring (`"ai-agent-loops": dynamic(() => import("@/topics/ai-agent-loops")),`), alphabetized after `agentic-workflows`, before `ai-coding-assistants` — a missing loader entry renders silently as an empty page, so also `curl` or run the dev server if in doubt.
- [ ] All learner-visible prose Vietnamese with full diacritics; commands verbatim English.
- [ ] `npm test` green, `npx tsc --noEmit` clean, `pnpm run build` (or `npm run build`) succeeds.

## Verification commands

```sh
cd /Users/datdo/Projects/ai-edu-v2
npm test
npx tsc --noEmit
npm run build 2>&1 | tail -5
grep -c "ai-agent-loops" src/topics/registry.ts src/topics/topic-loader.tsx
```

Sandbox note: if the build fails for sandbox/network reasons unrelated to this change, report verbatim and stop; tests and typecheck must pass. The supervisor reruns the build outside the sandbox.
