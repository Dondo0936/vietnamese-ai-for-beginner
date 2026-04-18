# Perplexity Design System Redesign — Spec

> Date: 2026-04-18
> Status: Approved
> Scope: Full visual redesign of ai-edu-v2 using Perplexity × Firecrawl design system tokens. Remove all kids content. Light mode default. Token-first cascade approach.

---

## 1. Goal

Redesign the entire app's visual layer using the Perplexity design system: near-monochrome ink palette, teal accent, Space Grotesk / Inter Tight / JetBrains Mono typography, editorial restraint, soft shadows. Application topics get a secondary heat-orange accent. Remove all kids-related code.

## 2. Approach: Token-First Cascade

Update CSS variables in `globals.css` → tokens cascade through Tailwind utilities → components transform automatically. Then targeted component touch-ups where the cascade isn't enough.

## 3. Design Tokens

### 3.1 Color Palette — Light (default)

```
--bg-primary:    #FBF7F2  (paper-50, warm off-white)
--bg-card:       #FFFFFF
--bg-surface:    #F4EEE3  (paper-100)
--bg-surface-hover: #E8DEC9 (paper-200)
--bg-dark:       #0A0A0B  (ink-950, footer)
--bg-sunken:     #F4EEE3  (paper-100)

--text-primary:  #0A0A0B  (ink-950)
--text-secondary: #2A2A2F (ink-700)
--text-tertiary: #6C6C74  (ink-500)
--text-muted:    #9B9BA3  (ink-400)

--accent:        #0F8A83  (teal-600)
--accent-light:  rgba(15,138,131,0.10)
--accent-dark:   #0E6F69  (teal-700)
--accent-hover:  #0E6F69  (teal-700)
--accent-soft:   rgba(15,138,131,0.10)

--link:          #0F8A83  (teal-600)
--link-hover:    #0E6F69  (teal-700)

--border:        rgba(10,10,11,0.10)
--border-subtle: rgba(10,10,11,0.06)
--border-strong: rgba(10,10,11,0.18)

--ring:          rgba(15,138,131,0.35)
```

### 3.2 Color Palette — Dark

```
--bg-primary:    #0A0A0B  (ink-950)
--bg-card:       #121214  (ink-900)
--bg-surface:    #18181B  (ink-850)
--bg-surface-hover: #1F1F23 (ink-800)
--bg-dark:       #060607
--bg-sunken:     #060607

--text-primary:  #F5F5F7
--text-secondary: #C4C4CC (ink-300)
--text-tertiary: #9B9BA3  (ink-400)
--text-muted:    #6C6C74  (ink-500)

--accent:        #20B8AE  (teal-400)
--accent-light:  rgba(19,168,158,0.12)
--accent-dark:   #13A89E  (teal-500)

--link:          #5FD2CB  (teal-300)
--link-hover:    #9CE5E0  (teal-200)

--border:        rgba(255,255,255,0.10)
--border-subtle: rgba(255,255,255,0.06)
--border-strong: rgba(255,255,255,0.18)
```

### 3.3 Heat-Orange (Application Topic Accent)

```
--heat-400: #FF7A29
--heat-500: #F05A00
--sub-accent-soft: rgba(255,122,41,0.14)
--shadow-glow-heat: 0 0 0 1px rgba(255,122,41,0.35), 0 8px 30px rgba(255,122,41,0.2)
```

### 3.4 Semantic Signal Colors

```
--success: #3DD68C
--warning: #F5B547
--danger:  #F25C54
--info:    teal-300
```

### 3.5 Shadows

```
--shadow-xs: 0 1px 0 rgba(0,0,0,0.04)
--shadow-sm: 0 1px 2px rgba(10,10,11,0.06), 0 0 0 1px rgba(10,10,11,0.04)
--shadow-md: 0 4px 14px rgba(10,10,11,0.08), 0 0 0 1px rgba(10,10,11,0.04)
--shadow-lg: 0 20px 40px rgba(10,10,11,0.12), 0 0 0 1px rgba(10,10,11,0.05)
--shadow-glow-accent: 0 0 0 1px rgba(15,138,131,0.35), 0 8px 30px rgba(15,138,131,0.18)
```

Dark mode shadows use higher opacity (0.35–0.55) and white-based ring borders.

### 3.6 Radii

```
--r-xs:   4px
--r-sm:   6px
--r-md:   10px
--r-lg:   14px
--r-xl:   20px
--r-2xl:  28px
--r-pill: 999px
```

### 3.7 Spacing (4pt base)

Keep existing Tailwind spacing but add explicit tokens:
```
--s-1: 4px  through  --s-24: 96px
```

### 3.8 Motion

```
--ease-standard: cubic-bezier(0.2, 0, 0, 1)
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
--dur-fast: 120ms
--dur-base: 200ms
--dur-slow: 420ms
```

## 4. Typography

### 4.1 Font Families

| Role | Font | CSS var | Fallback |
|------|------|---------|----------|
| Display | Space Grotesk | --font-display | system-ui, sans-serif |
| Body | Inter Tight | --font-sans | system-ui, sans-serif |
| Mono | JetBrains Mono | --font-mono | ui-monospace, monospace |
| Editorial | Fraunces italic | --font-serif | Georgia, serif |

Loaded via `next/font/google` in `layout.tsx`.

### 4.2 Type Scale

```
--fs-hero:    clamp(48px, 7vw, 96px)
--fs-display: clamp(36px, 4.5vw, 64px)
--fs-h1:      40px
--fs-h2:      28px
--fs-h3:      20px
--fs-h4:      17px
--fs-body:    15px
--fs-small:   13px
--fs-micro:   11px
```

### 4.3 Line Heights & Tracking

```
--lh-tight: 1.05   (hero)
--lh-snug:  1.2    (headings)
--lh-body:  1.5    (body — override Vietnamese 1.7 for tighter feel)
--lh-loose: 1.65   (lead paragraphs)

--tracking-tight:   -0.02em
--tracking-display: -0.035em
--tracking-label:   0.04em
```

Vietnamese body text keeps 1.65 line-height for readability.

## 5. Component Changes

### 5.1 Navbar
- Glassy: `background: rgba(251,247,242,0.7); backdrop-filter: blur(16px) saturate(140%)`
- Dark: `background: rgba(10,10,11,0.7)`
- Brand: Space Grotesk, 17px, weight 500, letter-spacing -0.02em
- Links: `--fg-secondary`, hover `--fg-primary`
- CTA pill button: teal bg, pill radius

### 5.2 Hero
- Heading: Space Grotesk display at `--fs-hero` scale
- Accent word in Fraunces italic
- Subtitle: Inter Tight, 18-19px, `--fg-secondary`
- Search composer: pill-shaped, `--shadow-md` at rest, `--shadow-glow-accent` on focus

### 5.3 Topic Cards
- `--bg-card` fill, 1px `--border-subtle`, `--r-lg` (14px), `--shadow-sm`
- Hover: border → `--border-default`, bg → slightly raised, shadow-md
- Application topic cards: `--shadow-glow-heat` on hover, subtle orange border

### 5.4 Footer
- `--bg-dark` (#0A0A0B) bg, `--border-subtle` top border
- Mono micro labels for column headers
- `--fg-secondary` for links
- Fraunces italic tagline

### 5.5 TopicLayout
- Reading column: 680px max (down from 720)
- Headings: Space Grotesk display
- Keep all existing functionality (TOC, progress bar, nav, bookmarks)

### 5.6 Tags & Pills
- All pill-shaped (999px radius)
- Sentence case only — no uppercase except micro labels (≤11px)
- Difficulty tags keep semantic colors

### 5.7 Buttons
- Primary: teal fill, pill radius, `--fg-on-accent` text
- Ghost: transparent bg, `--border-default` border, pill radius
- Hover: 120ms, no scale (just color shift)
- Press: 2% darker on primary only

### 5.8 Cards (general)
- `--bg-card` fill, 1px `--border-subtle`, `--r-lg`, `--shadow-sm`
- Hover (if clickable): border → `--border-default`, bg → `--bg-raised`
- Internal padding: 20-24px

## 6. Light Mode Default

In `layout.tsx`, the inline theme script defaults to `"light"` when no localStorage preference exists, instead of checking `prefers-color-scheme`.

## 7. Kids Removal — Complete

### 7.1 Directories to delete entirely (32 files)
- `src/components/kids/` (10 files)
- `src/topics/kids/` (8 files)
- `src/app/kids/` (6 files)
- `src/lib/kids/` (2 files)
- `src/components/paths/KidsPathPage.tsx` (1 file)
- 5 test files: `kids-landing`, `kids-mode-context`, `kids-nhi-infrastructure`, `kids-path-page`, `profession-paths-kids`

### 7.2 Files requiring edits
- `src/components/home/ProfessionPaths.tsx` — remove kids-nhi and kids-teen entries from PATHS array
- `src/components/interactive/TopicLink.tsx` — remove kidsTopicMap import and /kids/ routing logic
- `src/lib/paths.ts` — remove kids comment
- `src/app/globals.css` — remove kids CSS animations (confetti, pearl, marble)
- `src/__tests__/paths-lib.test.ts` — remove kids-nhi assertion
- `src/__tests__/topic-link-path-preserved.test.tsx` — remove kids mock and test case
- `src/__tests__/topic-link-dual-registry.test.tsx` — remove kids mock and test cases

## 8. Out of Scope

- Content changes to existing topics
- New topic pages
- Auth/backend changes
- Mobile app-specific redesign beyond responsive CSS
- Fraunces serif for topic body text (display/hero only)
