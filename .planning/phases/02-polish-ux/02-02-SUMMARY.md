---
phase: 02-polish-ux
plan: "02"
subsystem: ui
tags: [react, pwa, vite, vercel, og-image, csp, offline, sharp]

# Dependency graph
requires: []
provides:
  - OfflineBanner component: fixed red top-bar with role="alert", auto-shows on offline event
  - InstallPrompt component: fixed purple bottom pill with iOS/Android PWA install variants, 2nd-visit trigger
  - Security headers via vercel.json: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP
  - OG social preview: og:title, og:description, og:image, twitter:card tags + 1200x630 og-image.png
affects:
  - 02-03-PLAN (toast notifications plan references same App.jsx mount point area)
  - Any plan deploying to Vercel (CSP headers now active, connect-src scoped to Supabase + Railway)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - OfflineBanner uses window online/offline events with useState/useEffect, returns null when online
    - InstallPrompt uses localStorage counters (kl_visit_count, kl_pwa_dismissed) for visit-gating + dismiss persistence
    - Both components mounted in App.jsx outside Router/AuthProvider (no context dependency), always-rendered conditionally-visible
    - Security headers centralized in vercel.json headers array alongside existing rewrites
    - og-image.png generated from SVG via Sharp (Node CJS at project root)

key-files:
  created:
    - client/src/components/ui/OfflineBanner.jsx
    - client/src/components/pwa/InstallPrompt.jsx
    - client/public/og-image.png
  modified:
    - client/src/App.jsx
    - client/vercel.json
    - client/index.html

key-decisions:
  - "OfflineBanner and InstallPrompt mounted in App.jsx using React Fragment wrapper — avoids Router/Provider dependency while keeping them always-rendered"
  - "InstallPrompt at bottom (outside providers), OfflineBanner at top (before providers) — fragment pattern <><OfflineBanner /><AuthProvider>...</AuthProvider><InstallPrompt /></>"
  - "og-image.png generated via Sharp from SVG (ocean gradient + white text + octopus emoji) — 28KB, 1200x630"
  - "CSP connect-src includes both https://*.supabase.co and https://kids-edu-game-production.up.railway.app"

patterns-established:
  - "Always-rendered conditionally-visible pattern: component handles its own show/hide logic, parent just mounts unconditionally"
  - "PWA prompt gating via localStorage: kl_visit_count >= 2 AND kl_pwa_dismissed != '1'"
  - "Vercel headers array pattern: source '/(.*)', headers array alongside rewrites array"

requirements-completed: [POL-03, POL-04, POL-05, POL-06]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 02 Plan 02: Offline + PWA Install + Security Headers + OG Preview Summary

**OfflineBanner (red top-bar), InstallPrompt (purple bottom pill), Vercel CSP headers, and 1200x630 OG image added to KidsLearn client**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T18:40:43Z
- **Completed:** 2026-03-20T18:43:50Z
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- OfflineBanner: fixed red banner at top on offline event, disappears on reconnect, role="alert" for screen readers, uses --accent-red CSS variable with Fredoka font
- InstallPrompt: fixed purple pill at bottom, shows on 2nd visit, supports iOS (Share + Add to Home Screen copy) and Android (beforeinstallprompt API), dismissible with localStorage persistence
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, full CSP with Supabase + Railway connect-src — all delivered by Vercel on every response
- OG social preview: og:title/description/image + twitter:card tags in index.html, 1200x630 ocean gradient PNG with KidsLearn text and octopus mascot

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OfflineBanner and InstallPrompt, mount in App.jsx** - `304bb6b` (feat)
2. **Task 2: Security headers in vercel.json, OG meta tags in index.html, create og-image.png** - `ae734af` (feat)

**Plan metadata:** (docs: complete plan — committed after summary)

## Files Created/Modified
- `client/src/components/ui/OfflineBanner.jsx` - Offline connectivity indicator with fixed top-0 red bar
- `client/src/components/pwa/InstallPrompt.jsx` - PWA install prompt with iOS/Android variants and visit-gated display
- `client/src/App.jsx` - Added imports and render for OfflineBanner (top) and InstallPrompt (bottom) via React fragment
- `client/vercel.json` - Added headers array with 4 security headers alongside existing rewrites
- `client/index.html` - Added 9 OG/Twitter Card meta tags after description tag
- `client/public/og-image.png` - 1200x630 PNG generated via Sharp, ocean gradient background, 28KB

## Decisions Made
- Mounted both components in App.jsx (not main.jsx) using `<>...</>` fragment — OfflineBanner before AuthProvider, InstallPrompt after providers. This gives access to no context (not needed) while keeping them always-rendered.
- Used `window.MSStream` check for iOS detection to exclude Windows Phone from the iOS prompt path.
- Generated og-image.png from SVG via Sharp at project root (root package.json already had `sharp: ^0.34.5`).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — root node_modules were not installed but `npm install` at project root was sufficient to access the pre-declared Sharp dependency. Build succeeded on first attempt.

## User Setup Required

None — no external service configuration required. Security headers activate automatically on next Vercel deployment.

## Next Phase Readiness
- OfflineBanner and InstallPrompt are mounted and ready for end-to-end verification on next deployment
- CSP is in strict mode — if any new third-party connect-src is added in future plans, vercel.json CSP must be updated accordingly
- og-image.png is static and committed to git, will be served by Vercel's CDN automatically

---
*Phase: 02-polish-ux*
*Completed: 2026-03-20*
