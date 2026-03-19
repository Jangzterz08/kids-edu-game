# Phase 2: Polish & UX - Research

**Researched:** 2026-03-19
**Domain:** React UX polish, PWA, CSP headers, OG meta, shared constants
**Confidence:** HIGH

## Summary

Phase 2 is entirely about finishing the production surface of an already-deployed React + Vite app. Nine requirements cluster into five distinct technical areas: (1) toast notifications for user feedback events, (2) an Error Boundary for crash recovery, (3) a PWA install prompt for repeat mobile visitors, (4) an offline indicator banner, (5) Vercel security headers, (6) OG/social meta tags with a preview image, (7) a unified avatar constant to eliminate duplicate definitions across six files, (8) moving `computeStars` logic to the server so the client only displays the value returned by the API, and (9) a `/api/daily-challenge/today` endpoint so the client does not duplicate the day-of-year formula that already lives in `server/src/routes/dailyChallenge.js`.

The codebase is a React 19 + Vite 7 SPA (`type: module`) deployed on Vercel. The server is Express 5 / CJS deployed on Railway. `vite-plugin-pwa` (v1.2.0) is already installed and configured in `vite.config.js`; the PWA manifest is embedded in the plugin, not a separate `public/manifest.json`. No toast library is installed yet. `react-error-boundary` v6.1.1 is the current stable package. The server already has `computeStars` in `progressSync.js` — POL-08 is mostly a client-side deletion with a minor server route change to expose the computed value explicitly in the response.

**Primary recommendation:** Use `sonner` 2.0.7 for toasts (tiny, framework-native for Vite/React 19, requires only a `<Toaster />` in App.jsx), `react-error-boundary` 6.1.1 for the Error Boundary wrapper, and a custom `beforeinstallprompt` hook for the PWA install prompt (vite-plugin-pwa exposes a `useRegisterSW` helper but does not handle the install prompt — that is a native browser API).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POL-01 | Toast notification system for coin rewards, streak alerts, errors, and offline sync failures | sonner 2.0.7 — single `<Toaster />` mount + `toast()` calls at event sites |
| POL-02 | React Error Boundary catches render crashes and shows friendly recovery screen | react-error-boundary 6.1.1 — `<ErrorBoundary FallbackComponent={...}>` wrapping `<App>` in main.jsx |
| POL-03 | PWA install prompt nudges users after 2nd visit (shown once) | Native `beforeinstallprompt` event + localStorage visit counter; vite-plugin-pwa already registers the SW |
| POL-04 | Offline indicator banner appears on connectivity loss; dismisses on reconnect | Native `window.addEventListener('online'/'offline')` or `navigator.onLine`; no library needed |
| POL-05 | Security headers in vercel.json (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | vercel.json `headers` array — currently only has `rewrites` |
| POL-06 | OG meta tags + 1200×630 social preview image configured for link sharing | Static meta tags in `client/index.html`; preview image generated with Sharp or created manually |
| POL-07 | Avatar emoji map unified into shared constant used by all consumers | Extract to `client/src/lib/avatars.js` and import across 6 files that currently each define their own copy |
| POL-08 | `computeStars` removed from client; client displays `starsEarned` returned by server API | `computeStars` already in `progressSync.js`; server response already includes `starsEarned`; delete function from `MiniGame.jsx` and pass server value |
| POL-09 | `/api/daily-challenge/today` endpoint serves daily slug so client does not compute it locally | Add `GET /api/daily-challenge/today` route (no kidId, no auth needed for slug only); client removes `getDailyChallengeSlug()` from `data/index.js` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | 2.0.7 | Toast notifications | Minimal bundle (~3 KB), React 19 compatible, works with Vite, opinionated defaults suited to app feedback |
| react-error-boundary | 6.1.1 | Error Boundary wrapper | Maintained React team adjacent; removes boilerplate class component; supports `resetKeys` and `onReset` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-pwa | 1.2.0 | SW registration + manifest | Already installed — no new install needed for PWA prompt |

**No additional libraries** are needed for POL-03 (offline indicator), POL-04 (PWA prompt), POL-05 (Vercel headers), POL-06 (OG tags), POL-07 (constant extraction), POL-08 (client function removal), or POL-09 (new server endpoint). These are all configuration or small code changes.

**Installation (client):**
```bash
cd /Users/Ja_Jang/Application/kids-edu-game/client
npm install sonner react-error-boundary
```

**Version verification:**
```bash
npm view sonner version        # confirmed 2.0.7
npm view react-error-boundary version  # confirmed 6.1.1
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast 2.6.0 | react-hot-toast slightly older API; sonner is the current de-facto standard for Vite/React 19 projects |
| sonner | react-toastify 11.0.5 | react-toastify is larger, requires CSS import, heavier API |
| react-error-boundary | Hand-rolled class component | Class components in React 19 are not idiomatic; react-error-boundary handles edge cases (async errors, reset) |

## Architecture Patterns

### Recommended Project Structure — changes only
```
client/src/
├── lib/
│   └── avatars.js          # NEW — unified AVATAR_EMOJIS constant (POL-07)
├── components/
│   ├── ui/
│   │   ├── OfflineBanner.jsx   # NEW — POL-04
│   │   └── ErrorFallback.jsx   # NEW — POL-02
│   └── pwa/
│       └── InstallPrompt.jsx   # NEW — POL-03
└── main.jsx                # Add <Toaster /> + <ErrorBoundary> here
```

### Pattern 1: Toast Notifications (POL-01)
**What:** Global `<Toaster />` in `main.jsx`, `toast()` calls at coin award, streak hit, and offline sync failure sites.
**When to use:** Any async event that silently succeeds or fails today.
**Example:**
```jsx
// Source: https://sonner.emilkowal.ski/
// client/src/main.jsx
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster position="top-center" richColors />
  </>
);

// At coin award site (e.g. after progressSync response):
import { toast } from 'sonner';
toast.success(`+${coinsDelta} coins! 🪙`);

// At streak event:
toast(`${streak} day streak! 🔥`, { icon: '🔥' });

// At offline sync failure:
toast.error('Progress not saved — reconnect and try again');
```

### Pattern 2: Error Boundary (POL-02)
**What:** Wrap the entire app tree in `<ErrorBoundary>` so any component render crash shows a recovery screen.
**When to use:** Top-level in main.jsx, outside all providers.
**Example:**
```jsx
// Source: https://github.com/bvaughn/react-error-boundary
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ui/ErrorFallback';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.assign('/')}>
    <App />
  </ErrorBoundary>
);

// ErrorFallback.jsx
export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg,#8BD4F2 0%,#3BBFE8 60%,#E8C87A 88%,#D4A84B 100%)' }}>
      <div style={{ fontSize: 64 }}>🐙</div>
      <h2 style={{ color: '#fff', fontFamily: 'Fredoka, sans-serif' }}>Oops! Something went wrong</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

### Pattern 3: PWA Install Prompt (POL-03)
**What:** Capture `beforeinstallprompt` event, store in ref, show UI nudge after 2nd visit tracked via `localStorage`.
**When to use:** After 2nd visit on mobile, shown once per device.
**Example:**
```jsx
// Source: https://web.dev/articles/customize-install (official Chrome docs)
// client/src/components/pwa/InstallPrompt.jsx
import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visits = parseInt(localStorage.getItem('kl_visits') || '0', 10) + 1;
    localStorage.setItem('kl_visits', visits);
    if (visits < 2) return;                   // only after 2nd visit
    if (localStorage.getItem('kl_pwa_dismissed')) return; // shown once

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    localStorage.setItem('kl_pwa_dismissed', '1');
    setShow(false);
  }

  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#6C5CE7', color: '#fff', borderRadius: 16, padding: '12px 20px',
      fontFamily: 'Fredoka, sans-serif', zIndex: 9999 }}>
      <span>Add KidsLearn to your home screen!</span>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => { localStorage.setItem('kl_pwa_dismissed', '1'); setShow(false); }}>✕</button>
    </div>
  );
}
```
**Important:** `beforeinstallprompt` only fires on Android Chrome/Edge. iOS Safari uses the "Add to Home Screen" flow from the share sheet — there is no programmatic prompt. For iOS, a small "tap Share → Add to Home Screen" instructional tooltip is the best UX alternative. Detecting iOS: `navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')`.

### Pattern 4: Offline Indicator (POL-04)
**What:** Listen to `online`/`offline` window events and show a banner when offline.
**Example:**
```jsx
// client/src/components/ui/OfflineBanner.jsx
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      background: '#EF4444', color: '#fff', textAlign: 'center', padding: '8px',
      fontFamily: 'Fredoka, sans-serif' }}>
      You are offline — progress may not save
    </div>
  );
}
```
Mount in `App.jsx` outside all route content, inside providers.

### Pattern 5: Vercel Security Headers (POL-05)
**What:** Add `headers` array to `client/vercel.json`. Currently only `rewrites` exists.
**Example:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-Content-Type-Options",     "value": "nosniff" },
        { "key": "Referrer-Policy",            "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://kids-edu-game-production.up.railway.app; media-src 'self' blob:; worker-src 'self' blob:;" }
      ]
    }
  ]
}
```
**CSP caution:** React apps with `'unsafe-inline'` in `script-src` are necessary if Vite injects inline scripts. The service worker (`worker-src blob:`) is required for `vite-plugin-pwa`. Tighten further in Phase 7 when Sentry is added (will need `connect-src sentry.io`).

### Pattern 6: OG Meta Tags (POL-06)
**What:** Add Open Graph and Twitter Card meta tags to `client/index.html`. The preview image (1200×630) should be placed at `client/public/og-image.png`.
**Example addition to `<head>`:**
```html
<!-- OG / Social Preview -->
<meta property="og:type"        content="website" />
<meta property="og:url"         content="https://kids-edu-game.vercel.app/" />
<meta property="og:title"       content="KidsLearn — Fun games for kids" />
<meta property="og:description" content="Letters, numbers, shapes and more — learn through play!" />
<meta property="og:image"       content="https://kids-edu-game.vercel.app/og-image.png" />
<meta name="twitter:card"       content="summary_large_image" />
<meta name="twitter:title"      content="KidsLearn — Fun games for kids" />
<meta name="twitter:description" content="Letters, numbers, shapes and more — learn through play!" />
<meta name="twitter:image"      content="https://kids-edu-game.vercel.app/og-image.png" />
```
The preview image can be created with Sharp (`npm run generate-icons` script already exists) or manually with any image editor at exactly 1200×630 px.

### Pattern 7: Unified Avatar Constant (POL-07)
**What:** Extract the full AVATAR_EMOJIS map to `client/src/lib/avatars.js` and replace the 6 local definitions.
**Discovery:** `ParentDashboard.jsx` has only 8 avatars; `KidHome.jsx` has 16. The canonical full set (16 avatars) lives in `KidHome.jsx`. The shared constant must use the 16-avatar version.
**Files to update (all import from avatars.js):**
1. `client/src/pages/KidHome.jsx` — delete local definition
2. `client/src/pages/ParentDashboard.jsx` — delete 8-avatar definition, import full map
3. `client/src/pages/Login.jsx` — delete local definition
4. `client/src/pages/ClassroomDetail.jsx` — delete local definition
5. `client/src/components/layout/KidLayout.jsx` — delete local definition
6. `client/src/components/classroom/LeaderboardTable.jsx` — delete local definition
7. `client/src/components/kid/KidCard.jsx` — delete local definition

```js
// client/src/lib/avatars.js
export const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦖', unicorn: '🦄',
};
```

### Pattern 8: Move computeStars to Server (POL-08)
**What:** Delete `computeStars` from `client/src/pages/MiniGame.jsx`. The server's `progressSync.js` already runs `computeStars` and stores `starsEarned` in the DB. The progress API response already returns `starsEarned` per module (confirmed in `routes/progress.js`). The client just needs to trust the returned value.
**Current client flow:** `handleGameComplete` → `computeStars(newScores)` → passes result to `recordLesson`.
**New client flow:** `handleGameComplete` → passes raw scores to `recordLesson` → server computes stars.
**The `useProgress` hook** (`client/src/hooks/useProgress.js`) calls the server's progress upsert endpoint. The hook already forwards all score fields. No server changes needed — just delete the function from `MiniGame.jsx` and remove `starsEarned: computeStars(newScores)` from the `update` object (the server will compute it from the score fields).

### Pattern 9: /api/daily-challenge/today Endpoint (POL-09)
**What:** Add a new `GET /api/daily-challenge/today` route that returns `{ moduleSlug }` without requiring a kidId or auth. The `getChallengeSlug()` function is already in `server/src/routes/dailyChallenge.js`.
**Server change:** Add one route above the existing `/:kidId` route in `dailyChallenge.js`.
**Client change:** Remove `getDailyChallengeSlug()` from `client/src/data/index.js`; components that used it fetch from the new endpoint instead.

```js
// server/src/routes/dailyChallenge.js — add before existing routes
router.get('/today', (req, res) => {
  res.json({ moduleSlug: getChallengeSlug() });
});
```
**Route ordering matters:** Express matches routes in order. `/today` must be registered before `/:kidId` so `today` is not treated as a kidId parameter.

### Anti-Patterns to Avoid
- **CSP `'unsafe-eval'`:** Not needed here — do not add it. It defeats XSS protection.
- **Installing a global state manager for toasts:** `sonner` uses its own internal singleton — no context provider needed.
- **Wrapping each page in its own ErrorBoundary:** One top-level boundary is sufficient for crash recovery. Fine-grained boundaries can be added in a future phase if needed.
- **Using `window.location.reload()` in Error Boundary reset:** Prefer `window.location.assign('/')` to force a clean navigation to root.
- **Defining AVATAR_EMOJIS in a component that gets lazy-loaded:** The shared constant belongs in `lib/`, not in a page, so all consumers can import it synchronously.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast UI + stacking + dismiss | Custom toast component | sonner | Handles z-index, stacking, auto-dismiss timers, accessibility (aria-live), animation, keyboard dismiss |
| Error Boundary class | Custom `class MyBoundary extends React.Component` | react-error-boundary | Handles `resetKeys`, `onReset`, `onError`, and `FallbackComponent` prop cleanly |
| Service Worker registration | Manual SW file | vite-plugin-pwa (already installed) | Handles SW lifecycle, update prompts, cache strategy config |

**Key insight:** The three hand-roll candidates in this phase all have edge cases (toast queuing, error boundary reset lifecycle, SW update race conditions) that the libraries handle but a quick custom implementation will miss.

## Common Pitfalls

### Pitfall 1: CSP breaking the app on deploy
**What goes wrong:** A `Content-Security-Policy` header that is too strict blocks Supabase API calls, the Railway backend, or Google Fonts — the app silently breaks in production.
**Why it happens:** Developers test locally where CSP is absent, then deploy a strict policy that blocks `connect-src`.
**How to avoid:** Include `https://*.supabase.co` and `https://kids-edu-game-production.up.railway.app` in `connect-src`. Include `https://fonts.googleapis.com` and `https://fonts.gstatic.com` in `style-src` / `font-src`.
**Warning signs:** Network tab shows CSP violation errors; fonts missing; API calls fail with no network error but `Refused to connect` in console.

### Pitfall 2: PWA install prompt never fires
**What goes wrong:** `beforeinstallprompt` event never fires even on mobile, so the install UI is never shown.
**Why it happens:** The event only fires when the browser decides the app meets installability criteria (valid manifest, HTTPS, SW registered). It also does not fire if the app is already installed.
**How to avoid:** Verify manifest has `display: standalone`, `start_url`, and both icon sizes (192 and 512). Verify SW is registered (check DevTools Application tab). Test on Android Chrome, not desktop.
**Warning signs:** Event listener attached but never called; app not showing install option in Chrome menu.

### Pitfall 3: `/today` route shadowed by `/:kidId`
**What goes wrong:** `GET /api/daily-challenge/today` hits the `/:kidId` handler with `kidId = "today"`, causing a DB lookup that returns a 403 or unexpected result.
**Why it happens:** Express route registration order — the first matching route wins.
**How to avoid:** Register `router.get('/today', ...)` before `router.get('/:kidId', ...)` in `dailyChallenge.js`.
**Warning signs:** `today` endpoint returns a 403 Forbidden (the kidId auth check treats "today" as an unauthorized kid ID).

### Pitfall 4: ParentDashboard shows fallback bear for store avatars
**What goes wrong:** POL-07 is the fix — `ParentDashboard` only has 8 avatars in its local map but the CoinStore has 16 options. When a kid buys avatar 9–16, `ParentDashboard` falls back to 🐻.
**Why it happens:** Each file defined its own partial copy of the map.
**How to avoid:** After POL-07, ParentDashboard imports the full 16-avatar map from `lib/avatars.js`. Verified the full set is in `KidHome.jsx`.

### Pitfall 5: sonner Toaster rendered inside a lazy Suspense boundary
**What goes wrong:** If `<Toaster />` is placed inside a `<Suspense>`, toasts that fire during lazy load will not appear because the Suspense fallback replaces the Toaster.
**Why it happens:** Toaster needs to be always-mounted at the root level.
**How to avoid:** Place `<Toaster />` in `main.jsx` at the same level as `createRoot`, outside `<App />` or in the same root fragment but outside the lazy boundaries.

## Code Examples

### sonner installation and mount
```jsx
// Source: https://sonner.emilkowal.ski/getting-started
// client/src/main.jsx
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ui/ErrorFallback';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.assign('/')}>
    <App />
    <Toaster position="top-center" richColors duration={3000} />
  </ErrorBoundary>
);
```

### Firing a toast at coin award (in useProgress.js or caller)
```js
// Source: https://sonner.emilkowal.ski/toast
import { toast } from 'sonner';
// After successful API response from progressSync:
if (result.coinsDelta > 0) toast.success(`+${result.coinsDelta} coins earned! 🪙`);
```

### vercel.json with headers + SPA rewrite
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://kids-edu-game-production.up.railway.app; media-src 'self' blob:; worker-src 'self' blob:;" }
    ]
  }]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-toastify (requires CSS import) | sonner (zero-CSS, built-in animations) | 2023–2024 | Simpler setup, smaller bundle |
| Hand-rolled Error Boundary class | react-error-boundary package | React 16+ | Handles reset, error reporting hooks |
| Separate `public/manifest.json` | Manifest embedded in vite-plugin-pwa config | vite-plugin-pwa v0.14+ | Single source of truth in vite.config.js |
| Separate `workbox-config.js` | Workbox config in vite-plugin-pwa `workbox:{}` key | vite-plugin-pwa v0.11+ | No separate config file needed |

**Deprecated/outdated:**
- `react-hot-toast`: Still maintained but sonner is the current recommendation for Vite/React projects.
- Separate `public/manifest.json`: This project already uses the embedded manifest approach via vite-plugin-pwa — do not create a separate file.

## Open Questions

1. **OG image creation tool**
   - What we know: `generate-icons.js` exists at project root and uses Sharp; `generate-images.js` also exists.
   - What's unclear: Whether `generate-icons.js` can be adapted to produce a 1200×630 OG card, or if it should be manually designed.
   - Recommendation: Create the OG image manually or use a simple Sharp script; the complexity of design means this is best done outside automated build.

2. **iOS PWA install UX**
   - What we know: `beforeinstallprompt` does not fire on iOS Safari.
   - What's unclear: Whether to show an iOS-specific instructional tooltip or skip iOS entirely for Phase 2.
   - Recommendation: Show a simple "tap Share → Add to Home Screen" tooltip on iOS. Detect with `navigator.userAgent`. Dismiss into localStorage same as Android prompt.

3. **Where to fire coin/streak toasts**
   - What we know: `useProgress.js` calls the server and gets back `coinsDelta` from `progressSync`. Streak events are fired from `progressSync.js` server-side but not returned to the client.
   - What's unclear: Whether the progress API response should return `streakUpdated: true` / `newStreak: N` so the client can show a streak toast.
   - Recommendation: Extend the `upsertProgress` return value and the progress API response to include `streakUpdated` and `newStreak` fields. Client reads these and fires the appropriate toast.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (server only, CJS mode) |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd /Users/Ja_Jang/Application/kids-edu-game/server && npm test` |
| Full suite command | `cd /Users/Ja_Jang/Application/kids-edu-game/server && npm test` |

**Client test framework:** Not installed. The client `package.json` has no test script and no Vitest/Jest config. Phase 2 is primarily client-side UI changes that are difficult to unit test without a browser environment. Manual verification is the primary validation path for POL-01 through POL-06.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POL-01 | Toast fires on coin award | manual | — | ❌ no client test infra |
| POL-02 | Error Boundary renders fallback on crash | manual | — | ❌ no client test infra |
| POL-03 | Install prompt shows on 2nd visit | manual (mobile) | — | ❌ no client test infra |
| POL-04 | Offline banner appears on network loss | manual | — | ❌ no client test infra |
| POL-05 | Security headers present in response | manual (curl/DevTools) | `curl -I https://kids-edu-game.vercel.app` | ❌ Wave 0 gap |
| POL-06 | OG image loads, title/description correct | manual (social preview tools) | — | ❌ Wave 0 gap |
| POL-07 | Avatar map export exists, 16 entries, all consumers import it | unit | `cd server && npm test` (server only) | ❌ Wave 0 gap |
| POL-08 | computeStars absent from MiniGame.jsx | static check | `grep -r "computeStars" client/src` (should return empty) | ❌ Wave 0 gap |
| POL-09 | /api/daily-challenge/today returns moduleSlug | unit (server) | `cd server && npm test -- --reporter=verbose` | ❌ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npm test`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npm test`
- **Phase gate:** Server tests green + manual browser verification of POL-01 through POL-06 before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/tests/polish/pol09-daily-today.test.js` — covers POL-09 (`/api/daily-challenge/today` endpoint)
- [ ] `server/tests/polish/pol08-computestars-server.test.js` — covers POL-08 (server `computeStars` in progressSync correctly computes stars, client no longer sends starsEarned)

*(Client-side POL-01 through POL-07 have no automated test path — verified manually in browser)*

## Sources

### Primary (HIGH confidence)
- Official sonner docs: https://sonner.emilkowal.ski/ — toast API, Toaster props, position, richColors
- Official react-error-boundary: https://github.com/bvaughn/react-error-boundary — FallbackComponent, onReset, resetKeys
- web.dev PWA install guide: https://web.dev/articles/customize-install — beforeinstallprompt pattern, userChoice
- Vercel headers docs: https://vercel.com/docs/edge-network/headers — headers array format, source pattern
- Open Graph Protocol: https://ogp.me/ — property names, image dimensions
- Twitter Card docs: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image — twitter:card, twitter:image
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/ — manifest configuration, workbox, already-installed state

### Secondary (MEDIUM confidence)
- npm registry (verified via `npm view`): sonner@2.0.7, react-error-boundary@6.1.1, vite-plugin-pwa@1.2.0

### Tertiary (LOW confidence)
- CSP connect-src directive details for Supabase — based on observed Supabase URL pattern `*.supabase.co`; exact domains should be verified in browser DevTools Network tab on first deploy

## Metadata

**Confidence breakdown:**
- Standard stack (sonner, react-error-boundary): HIGH — verified current versions from npm registry; both are maintained
- Architecture (patterns 1–9): HIGH — based on direct codebase inspection; all file locations and current code confirmed
- Pitfalls: HIGH — route ordering, CSP breakage, avatar map mismatch all confirmed by reading actual source files
- Validation: MEDIUM — client test gap is real; server Vitest config confirmed

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable libraries; Vercel header format is stable)
