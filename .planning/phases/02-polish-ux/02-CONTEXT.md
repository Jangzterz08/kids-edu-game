# Phase 2: Polish & UX - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** User design session — LogicLike.com as aspirational benchmark

<domain>
## Phase Boundary

Phase 2 resolves every pending production rough edge and brings the app to a "finished product" feel. Nine requirements cover: toast notifications, error recovery UI, PWA install prompt, offline indicator, security headers, OG social preview, unified avatar constant, server-side star computation, and a `/api/daily-challenge/today` endpoint.

**Dream app reference:** LogicLike.com — a premium kids learning platform where every micro-interaction feels warm, celebratory, and effortless. Nothing ever looks like an error. Every reward feels like a big deal. This is the quality bar for Phase 2's user-facing polish.

</domain>

<decisions>
## Implementation Decisions

### LogicLike UX Benchmark (applies to all copy + interaction design)

The executor should ask: "Would this feel at home in LogicLike?" for every user-visible string and interaction. Key patterns to match:

- **Celebrate first, inform second.** LogicLike leads with the reward (stars, character unlocks) before showing next-step info. Our toasts should do the same — emotion first, fact second.
- **Emoji-forward copy.** LogicLike uses emoji as punctuation, not decoration. "+🪙 5 coins!" reads faster than "You earned 5 coins." Emoji carry tone for pre-readers.
- **Short sessions respected.** LogicLike designs for 10–15 min windows. Our toasts should be brief (≤5 words + emoji) and auto-dismiss. Never block the game.
- **No technical language ever.** LogicLike never shows "Error", "Failed", "Exception". Neither should we. Words allowed: "oops", "went wrong", "try again", "reconnect", "offline".
- **Character-driven recovery.** LogicLike uses collectible characters to soften failure states. Ollie the octopus (🐙) is our equivalent — use him in error states.
- **Streaks are league-level events.** LogicLike treats streak milestones as major celebrations (leagues, badges). Our streak toast should feel more than a notification — it should feel like a win.

### Toast Notifications (POL-01)

Locked decisions — these are the exact copy strings and behaviors the planner must use:

| Event | Toast Type | Exact Copy | Duration |
|-------|-----------|------------|----------|
| Coin reward (any amount) | `toast.success` | `+🪙 {N} coins!` | 3000ms |
| Streak hit (any day count) | `toast` neutral with 🔥 | `🔥 {N} day streak!` | 3500ms |
| Offline sync failure | `toast.error` | `Progress not saved — reconnect to try again` | 5000ms |
| Generic error | `toast.error` | `Something went wrong. Try again!` | 4000ms |

**Position:** `top-center` (does not overlap game canvas which uses bottom half of screen).
**richColors:** `true` — sonner's accessible built-in palette, no overrides.
**Toaster mount:** `<Toaster />` in `client/src/main.jsx`, inside `<ErrorBoundary>`, outside React Router.
**Library:** `sonner@2.0.7` — install in `client/`.

### Error Boundary (POL-02)

Locked decisions:

- **Full-screen fallback** — ocean gradient background matches app (no jarring white screen).
- **Mascot:** Ollie 🐙 at `font-size: 64px` (emoji rendered as text, centered).
- **Heading:** `"Oops! Something went wrong"` — Fredoka 600, 28px, white.
- **Subtext:** `"Don't worry — Ollie will help you get back."` — Fredoka 400, 18px, white.
- **CTA:** `"Try again"` button using existing `.btn-primary` style. On click: `window.location.assign('/')`.
- **Library:** `react-error-boundary@6.1.1` — install in `client/`. Wrap `<App>` in `client/src/main.jsx`.

### PWA Install Prompt (POL-03)

Locked decisions — framed as "unlock offline play" (LogicLike frames mobile install as a feature unlock, not a browser action):

- **Trigger:** Second visit + not already installed + not previously dismissed.
- **Visit tracking:** `localStorage.kl_visit_count` counter; increment on app mount; show prompt when value ≥ 2.
- **Dismissed flag:** `localStorage.kl_pwa_dismissed = "1"` — set on ✕ dismiss; never show again.
- **Android copy:** `"Add KidsLearn to your home screen!"` + `"Install App"` button.
- **iOS copy:** `"Tap Share then 'Add to Home Screen'"` (no programmatic install API on iOS).
- **Design:** Fixed pill at bottom, 24px from viewport edge, `#6C5CE7` background (matches PWA `theme_color`), white text, ✕ dismiss icon.
- **Component path:** `client/src/components/pwa/InstallPrompt.jsx`.
- **Mount point:** `client/src/App.jsx` (or `main.jsx`) — always rendered, shows conditionally.

### Offline Indicator (POL-04)

Locked decisions — gentle, not alarming (LogicLike uses screen-time warnings rather than hard blocks):

- **Copy:** `"You're offline — progress may not save 🌊"` (the 🌊 softens it for kids).
- **Design:** Fixed top-0, full-width, `--accent-red` (`#EF4444`) background, white Fredoka 18px text, 8px vertical padding.
- **Behavior:** Appears immediately on `offline` event; disappears immediately on `online` event. No manual dismiss.
- **`role="alert"`** for screen reader announcement.
- **Component path:** `client/src/components/ui/OfflineBanner.jsx`.
- **Mount:** `client/src/App.jsx` above all route content.

### Security Headers (POL-05)

Locked — exact values from RESEARCH.md and UI-SPEC.md:

```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://kids-edu-game-production.up.railway.app; media-src 'self' blob:; worker-src 'self' blob:;"
}
```

Target file: `client/vercel.json` — add `headers` array alongside existing `rewrites`.

### OG Social Preview (POL-06)

Locked — exact meta tag values:

| Property | Value |
|----------|-------|
| `og:title` | `KidsLearn — Fun games for kids` |
| `og:description` | `Letters, numbers, shapes and more — learn through play!` |
| `og:image` | `https://kids-edu-game.vercel.app/og-image.png` |
| `og:url` | `https://kids-edu-game.vercel.app/` |
| `og:type` | `website` |
| `twitter:card` | `summary_large_image` |

**Image:** 1200×630px, ocean gradient (`#3BBFE8` → `#0EA5E9`), "KidsLearn" in white Fredoka 600 centered, "Fun games for kids" in white Fredoka 400 below, 🐙 mascot. Create as static PNG at `client/public/og-image.png`. Use Sharp or generate manually — either is acceptable.

**Target file:** `client/index.html` — add `<meta>` tags in `<head>`.

### Avatar Constant (POL-07)

Locked:

- **New file:** `client/src/lib/avatars.js` — exports `AVATAR_EMOJIS` as a default-exported object. Format: `{ bear: "🐻", cat: "🐱", ... }` — 16 entries matching the current canonical list from any one of the 6 source files.
- **Files to update (all 6 must import from avatars.js):**
  1. `client/src/components/AvatarSelector.jsx`
  2. `client/src/components/KidHome.jsx`
  3. `client/src/components/ParentDashboard.jsx`
  4. `client/src/components/StudentCard.jsx` (if exists)
  5. `client/src/pages/Profile.jsx` (if exists)
  6. Any other file containing an inline `AVATAR_EMOJIS` or equivalent object — executor must grep for `bear.*cat\|cat.*bear\|🐻.*🐱\|🐱.*🐻` to find all copies.
- **Inline definitions removed** from all 6 files after import added.

### Server-Side Stars (POL-08)

Locked:

- **Goal:** `computeStars()` function deleted from `client/src/components/MiniGame.jsx`. Client reads `starsEarned` from the server's `progressSync` response and displays it directly.
- **Server:** `server/src/routes/progressSync.js` already includes `starsEarned` in response — no server change needed unless the field is missing from the response body. Executor must verify the response shape before deleting the client function.
- **Client change:** Remove `import/call to computeStars`, read `response.data.starsEarned` (or equivalent) instead.

### Daily Challenge Endpoint (POL-09)

Locked:

- **New route:** `GET /api/daily-challenge/today` — no auth required, no kidId, returns `{ slug: string }`.
- **Logic:** Same formula already in `server/src/routes/dailyChallenge.js`: `SLUGS[dayOfYear % SLUGS.length]`. Extract to a shared helper or inline directly.
- **Client:** Remove `getDailyChallengeSlug()` from `client/src/data/index.js`. Replace all callers with a fetch to `/api/daily-challenge/today`.
- **Executor must grep** for `getDailyChallengeSlug` in client to find all call sites before deleting.

### Claude's Discretion

- How to generate the OG image (Sharp programmatically vs. manual creation in a design tool — either acceptable)
- Whether to put `<OfflineBanner />` and `<InstallPrompt />` in `App.jsx` or `main.jsx` — use whichever avoids prop-drilling into Router context
- Error boundary `onError` callback implementation details (logging to console vs. future Sentry — console.error is fine for now)
- Whether `AVATAR_EMOJIS` in `avatars.js` is a plain object or a `Map` — plain object is simpler and matches existing usage

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Artifacts
- `.planning/phases/02-polish-ux/02-RESEARCH.md` — technical approach, library versions, architecture patterns, file paths
- `.planning/phases/02-polish-ux/02-UI-SPEC.md` — complete visual contract: colors, typography, spacing, component specs, accessibility requirements

### Project Config
- `client/src/index.css` — CSS custom property tokens (colors, spacing, typography) — executor must not introduce hardcoded values that duplicate these
- `client/vite.config.js` — vite-plugin-pwa config (manifest already embedded, `theme_color: #6C5CE7`)
- `client/vercel.json` — existing rewrites config that POL-05 must extend, not overwrite
- `client/index.html` — POL-06 meta tag target

### Aspirational Design Reference
- **LogicLike.com** — dream app benchmark. Every user-facing string and interaction in Phase 2 should aspire to LogicLike's warmth and celebratory feel. Key patterns: emoji-forward copy, no technical language, character-driven error states, streaks treated as major wins.

</canonical_refs>

<specifics>
## Specific Ideas

### From LogicLike — apply directly to Phase 2

**Streak toast should feel like a league event:**
LogicLike treats streak milestones as league-level celebrations with prominent visuals. Our streak toast copy `"🔥 {N} day streak!"` should use a slightly longer duration (3500ms vs 3000ms for coins) to let it land. On milestone days (7, 30), the planner may optionally escalate to `toast.success` with gold styling — but this is Claude's discretion, not a locked decision.

**Coin reward as instant dopamine:**
LogicLike shows star animations immediately after correct answers. Our coin reward toast fires from `MiniGame.jsx` immediately on correct answer confirmation. The copy `"+🪙 {N} coins!"` is short enough that kids see it and move on — this is intentional.

**Offline as a soft landing, not a wall:**
LogicLike uses screen-time warnings rather than hard blocks. Our offline banner uses `"You're offline — progress may not save 🌊"` with the wave emoji to signal "ocean theme, all is calm" rather than a hard error. This is deliberate — do not change to a more alarming variant.

**Error fallback as a character moment:**
LogicLike uses character personalities to soften failure. Ollie 🐙 as the error mascot is the same principle — the crash screen is Ollie's moment, not a system failure.

</specifics>

<deferred>
## Deferred Ideas

- **Streak milestone escalation** (7-day, 30-day special toast) — good LogicLike-inspired idea, deferred to Phase 7 (Dashboards) when analytics can track milestones
- **Audio reinforcement** (LogicLike voices all instructions) — audio system deferred to a future phase; Phase 2 is silent
- **League/leaderboard integration** — deferred to Phase 5+ (School Licensing)
- **Character collection** (LogicLike's hero collection mechanic) — deferred; current avatar system (emoji selection) is the Phase 2 scope
- **Age-adaptive onboarding** (LogicLike's age-gate curriculum path) — deferred to Phase 6 (Adaptive Learning)
- **Family plan / parent-child shared metrics** — deferred to Phase 4 (Parent Subscriptions)

</deferred>

---

*Phase: 02-polish-ux*
*Context gathered: 2026-03-19 via user design session*
*Design benchmark: LogicLike.com — aspirational kids learning UX*
