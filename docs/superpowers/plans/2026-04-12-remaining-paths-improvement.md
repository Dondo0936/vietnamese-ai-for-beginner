# Remaining Paths Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the same UX improvements to Engineer, Researcher, and Office paths: add LearningObjectivesModal, restructure stages per audit findings, add TopicLink cross-references, and add quiz variety to all existing topics.

**Architecture:** Infrastructure is already built (TopicLink, LearningObjectivesModal, extended QuizSection). This plan only covers path-specific data, restructuring, new topic creation, and per-topic edits.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4

**Rules:**
- Vietnamese diacritics (dấu) are mandatory on ALL Vietnamese text — never write ASCII-stripped Vietnamese.

**Spec:** `docs/superpowers/specs/2026-04-12-learning-path-ux-improvement-design.md`

---

## PATH 1: AI ENGINEER (currently 52 topics across 5 stages)

### Structural Changes (from audit)

**Current:**
```
Stage 1: Kiến trúc (7) — transformer, self-attention, multi-head-attention, positional-encoding, cnn, rnn, lstm
Stage 2: LLM & NLP (9) — gpt, bert, tokenization, tokenizer-comparison, kv-cache, temperature, top-k-top-p, beam-search, context-window
Stage 3: Fine-tuning & Tối ưu (8) — fine-tuning, lora, qlora, fine-tuning-vs-prompting, quantization, distillation, pruning, mixed-precision
Stage 4: RAG & Agents (16) — rag, agentic-rag, vector-databases, faiss, semantic-search, hybrid-search, re-ranking, chunking, embedding-model, bm25, function-calling, react-framework, agent-architecture, orchestration, structured-outputs, computer-use
Stage 5: Hạ tầng (12) — model-serving, inference-optimization, mlops, containerization, monitoring, edge-ai, gpu-optimization, cost-optimization, data-pipelines, guardrails, red-teaming, hallucination
```

**Proposed (6 stages):**
```
Stage 1: Kiến trúc (7) — REORDERED: cnn → rnn → lstm → transformer → self-attention → multi-head-attention → positional-encoding
  (Audit fix #1: narrative arc from CNN/RNN limitations → Transformer as solution)

Stage 2: LLM & NLP (10) — ADD prompt-engineering from Office path
  prompt-engineering → gpt → bert → tokenization → tokenizer-comparison → kv-cache → temperature → top-k-top-p → beam-search → context-window
  (Audit fix: prompt engineering missing from Engineer path)

Stage 3: Fine-tuning & Tối ưu (8) — unchanged

Stage 4: RAG & Agents (16) — unchanged

Stage 5: Hạ tầng & Vận hành (9) — SPLIT: remove safety topics
  model-serving → inference-optimization → mlops → containerization → monitoring → edge-ai → gpu-optimization → cost-optimization → data-pipelines

Stage 6: An toàn & Chất lượng (3) — NEW stage from split
  guardrails → red-teaming → hallucination
  (Audit fix #3: separate infrastructure ops from safety/quality)
```

**New topics to create:** None required for restructuring (prompt-engineering already exists). Optional future additions from audit (evaluation/benchmarks, API design, testing AI, observability) are out of scope for this sprint.

### Tasks

- [ ] **Task 1:** Add `pathObjectives` + `LearningObjectivesModal` to `src/app/paths/ai-engineer/page.tsx`
- [ ] **Task 2:** Restructure stages in `src/app/paths/ai-engineer/page.tsx` (reorder Stage 1, add prompt-engineering to Stage 2, split Stage 5)
- [ ] **Task 3:** Add TopicLink + quiz variety to Stage 1 topics (7 files)
- [ ] **Task 4:** Add TopicLink + quiz variety to Stage 2 topics (10 files)
- [ ] **Task 5:** Add TopicLink + quiz variety to Stage 3 topics (8 files)
- [ ] **Task 6:** Add TopicLink + quiz variety to Stage 4 topics (16 files)
- [ ] **Task 7:** Add TopicLink + quiz variety to Stage 5+6 topics (12 files)
- [ ] **Task 8:** Build + verify

---

## PATH 2: AI RESEARCHER (currently 55 topics across 5 stages)

### Structural Changes (from audit)

**Current:**
```
Stage 1: Lý thuyết sâu (7) — backpropagation, vanishing-exploding-gradients, weight-initialization, regularization, batch-normalization, optimizers, sgd
Stage 2: Kiến trúc tiên tiến (13) — transformer, self-attention, flash-attention, residual-connections, vae, gan, diffusion-models, autoencoder, moe, state-space-models, vision-transformer, u-net, nerf
Stage 3: NLP & Multimodal (13) — word-embeddings, word2vec, glove, seq2seq, attention-mechanism, perplexity-metric, clip, vlm, unified-multimodal, text-to-image, text-to-video, speech-recognition, tts
Stage 4: Huấn luyện & Alignment (11) — rlhf, dpo, grpo, constitutional-ai, alignment, scaling-laws, test-time-compute, adversarial-robustness, ai-watermarking, deepfake-detection, explainability
Stage 5: Xu hướng mới (11) — reasoning-models, world-models, long-context, synthetic-data, small-language-models, ai-for-science, q-learning, deep-q-network, policy-gradient, actor-critic, multi-armed-bandit
```

**Proposed (6 stages):**
```
Stage 1: Lý thuyết sâu (7) — unchanged

Stage 2: Kiến trúc tiên tiến (13) — unchanged

Stage 3: NLP & Multimodal (13) — unchanged

Stage 4: Huấn luyện & Alignment (11) — unchanged

Stage 5: Học tăng cường (5) — NEW stage extracted from "Xu hướng mới"
  q-learning → deep-q-network → policy-gradient → actor-critic → multi-armed-bandit
  (Audit fix #1: RL topics are established theory, not "trends")

Stage 6: Xu hướng mới (6) — SLIMMED: only genuinely frontier topics remain
  reasoning-models → world-models → long-context → synthetic-data → small-language-models → ai-for-science
```

**New topics to create:** None required for restructuring.

### Tasks

- [ ] **Task 9:** Add `pathObjectives` + `LearningObjectivesModal` to `src/app/paths/ai-researcher/page.tsx`
- [ ] **Task 10:** Restructure stages (extract RL into new Stage 5)
- [ ] **Task 11:** Add TopicLink + quiz variety to Stage 1 topics (7 files)
- [ ] **Task 12:** Add TopicLink + quiz variety to Stage 2 topics (13 files)
- [ ] **Task 13:** Add TopicLink + quiz variety to Stage 3 topics (13 files)
- [ ] **Task 14:** Add TopicLink + quiz variety to Stage 4 topics (11 files)
- [ ] **Task 15:** Add TopicLink + quiz variety to Stage 5+6 topics (11 files)
- [ ] **Task 16:** Build + verify

---

## PATH 3: OFFICE WORKER (currently 26 topics across 4 stages)

### Structural Changes (from audit)

**Current:**
```
Stage 1: Hiểu LLM (7) — llm-overview, prompt-engineering, chain-of-thought, in-context-learning, temperature, hallucination, context-window
Stage 2: Ứng dụng thực tế (8) — rag, chunking, semantic-search, function-calling, agent-architecture, agentic-workflows, ai-coding-assistants, model-context-protocol
Stage 3: An toàn & Đạo đức (4) — bias-fairness, ai-governance, guardrails, explainability
Stage 4: Ứng dụng ngành (7) — ai-in-finance, ai-in-healthcare, ai-in-education, ai-in-agriculture, recommendation-systems, sentiment-analysis, text-classification
```

**Proposed (4 stages, restructured):**
```
Stage 1: Bắt đầu với AI (8) — RENAMED + add getting-started topic
  getting-started-with-ai (NEW) → llm-overview → prompt-engineering → chain-of-thought → in-context-learning → temperature → hallucination → context-window
  (Audit fix #4: add "day 1" topic for first-time AI users)

Stage 2: Ứng dụng thực tế (8) — SIMPLIFIED: remove overly technical topics, add practical ones
  rag → semantic-search → ai-coding-assistants → agentic-workflows → ai-for-writing (NEW) → ai-for-data-analysis (NEW) → ai-privacy-security (NEW) → ai-tool-evaluation (NEW)
  (Audit fix #1+#2: replace chunking/function-calling/MCP with practical office topics)

Stage 3: An toàn & Đạo đức (4) — unchanged

Stage 4: Ứng dụng ngành (7) — unchanged
```

**New topics to create (5):**
- `getting-started-with-ai` — How to sign up, first conversation, get useful results in 5 minutes
- `ai-for-writing` — AI for email, reports, presentations, meeting summaries
- `ai-for-data-analysis` — Using AI to analyze spreadsheets, create charts, write SQL
- `ai-privacy-security` — What NOT to put into AI tools, corporate data policies
- `ai-tool-evaluation` — Comparing ChatGPT vs Claude vs Gemini vs Copilot

**Topics removed from Stage 2:** `chunking`, `function-calling`, `agent-architecture`, `model-context-protocol` (still accessible via other paths, just not in the Office path)

### Tasks

- [ ] **Task 17:** Create 5 new Office path topics + register in registry.ts
- [ ] **Task 18:** Add `pathObjectives` + `LearningObjectivesModal` to `src/app/paths/office/page.tsx`
- [ ] **Task 19:** Restructure stages (add getting-started, swap technical topics for practical ones)
- [ ] **Task 20:** Add TopicLink + quiz variety to Stage 1 topics (8 files)
- [ ] **Task 21:** Add TopicLink + quiz variety to Stage 2 topics (8 files, mix of new and existing)
- [ ] **Task 22:** Add TopicLink + quiz variety to Stage 3+4 topics (11 files)
- [ ] **Task 23:** Build + verify all 3 paths

---

## Execution Order

```
--- AI Engineer ---
Task 1-2: Path page (objectives + restructure)
Task 3-7: Topic edits by stage (parallel subagents)
Task 8: Build verify

--- AI Researcher ---
Task 9-10: Path page (objectives + restructure)
Task 11-15: Topic edits by stage (parallel subagents)
Task 16: Build verify

--- Office Worker ---
Task 17: Create 5 new topics + register
Task 18-19: Path page (objectives + restructure)
Task 20-22: Topic edits by stage (parallel subagents)
Task 23: Final build verify
```

## Topic Edit Checklist (per topic, all paths)

| # | Step |
|---|------|
| 1 | Add `TopicLink` import |
| 2 | Add `TopicLink` on first mention of cross-referenced terms |
| 3 | Add 1 fill-blank, code, or scenario-based quiz question |
| 4 | Fix bugs if found (TOTAL_STEPS mismatch, unused imports) |

## Shared Topics (appear in multiple paths)

These topics appear in more than one path. Edit them ONCE (during the first path that touches them), then skip in subsequent paths:

- `transformer` — Engineer Stage 1 + Researcher Stage 2
- `self-attention` — Engineer Stage 1 + Researcher Stage 2
- `backpropagation` — Already edited (Student path) + Researcher Stage 1
- `rag` — Engineer Stage 4 + Office Stage 2
- `hallucination` — Engineer Stage 5 + Office Stage 1
- `guardrails` — Engineer Stage 6 + Office Stage 3
- `explainability` — Researcher Stage 4 + Office Stage 3
- `temperature` — Engineer Stage 2 + Office Stage 1
- `context-window` — Engineer Stage 2 + Office Stage 1
- `prompt-engineering` — Engineer Stage 2 + Office Stage 1

For shared topics already edited in the Student path (backpropagation, bias-variance, etc.), skip them entirely.
