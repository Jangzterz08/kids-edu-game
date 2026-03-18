# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
kids-edu-game/
├── client/                     # React SPA (Vite) — deployed to Vercel
│   ├── public/                 # Static assets served verbatim
│   │   └── assets/
│   │       ├── images/         # Lesson images by module slug (*.webp)
│   │       └── sounds/         # Word audio files (*.mp3)
│   ├── src/
│   │   ├── main.jsx            # Vite entry point
│   │   ├── App.jsx             # Router + providers
│   │   ├── index.css           # Global CSS (ocean theme, CSS vars)
│   │   ├── context/            # React contexts (auth, kid selection)
│   │   ├── hooks/              # Custom hooks (useProgress)
│   │   ├── lib/                # Infrastructure (API client, sound, localStorage)
│   │   ├── data/               # Static lesson content registry
│   │   │   └── modules/        # One JS file per learning module
│   │   ├── pages/              # Route-level page components
│   │   └── components/         # Reusable UI components by domain
│   │       ├── auth/           # ProtectedRoute, PinKeypad, RoleSelector
│   │       ├── classroom/      # JoinClassroomModal, LeaderboardTable
│   │       ├── games/          # 8 game type components
│   │       ├── kid/            # AddKidModal, KidCard, AvatarPicker, SetPinModal
│   │       ├── layout/         # ParentLayout, KidLayout, TeacherLayout
│   │       ├── lesson/         # LessonCard, ProgressBar, SoundButton, SpeakAlongButton
│   │       ├── mascot/         # Mascot.jsx (Ollie)
│   │       ├── modules/        # ModuleCard, ProgressRing, StarBadge
│   │       └── ui/             # CelebrationModal, DotGrid
│   ├── dist/                   # Built output (generated, committed for reference)
│   ├── vite.config.js          # Vite + PWA config
│   └── package.json
│
├── server/                     # Express REST API — deployed to Railway
│   ├── src/
│   │   ├── index.js            # Express app entry point
│   │   ├── seed.js             # DB seeder (modules + lessons)
│   │   ├── lib/
│   │   │   └── db.js           # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js         # requireAuth (Supabase + kid JWT)
│   │   │   └── kidAuth.js      # signKidToken, verifyKidToken, decodeTokenType
│   │   ├── routes/
│   │   │   ├── auth.js         # /api/auth/*
│   │   │   ├── kids.js         # /api/kids/*
│   │   │   ├── modules.js      # /api/modules/*
│   │   │   ├── progress.js     # /api/progress/*
│   │   │   ├── achievements.js # /api/achievements/*
│   │   │   ├── classrooms.js   # /api/classrooms/*
│   │   │   └── dailyChallenge.js # /api/daily-challenge/*
│   │   └── services/
│   │       ├── progressSync.js # upsertProgress (stars, coins, streak)
│   │       └── weeklyDigest.js # Resend email cron service
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Sequential Prisma migrations
│   ├── scripts/
│   │   └── retroactive-coins.js # One-off migration script
│   └── package.json
│
├── generate-audio.js           # Root-level asset generation script
├── generate-icons.js           # Root-level asset generation script
├── generate-images.js          # Root-level asset generation script
├── PROJECT_LOG.md              # Chronological dev log
└── package.json                # Root (no workspace config — each sub-project manages its own deps)
```

## Directory Purposes

**`client/src/pages/`:**
- Purpose: One file per route; each page composes context + hooks into a full-screen view
- Contains: 15 page components (`.jsx`)
- Key files:
  - `client/src/pages/KidHome.jsx` — kid's module grid home screen
  - `client/src/pages/LessonPlayer.jsx` — swipeable lesson card carousel
  - `client/src/pages/MiniGame.jsx` — game orchestrator (cycles through `mod.games[]`)
  - `client/src/pages/ModuleComplete.jsx` — end-of-module results + daily challenge auto-complete
  - `client/src/pages/ParentDashboard.jsx` — progress charts per kid
  - `client/src/pages/TeacherDashboard.jsx` — classroom management
  - `client/src/pages/DailyChallenge.jsx` — daily challenge gameplay

**`client/src/components/games/`:**
- Purpose: Self-contained game type components; each accepts `lessons[]` prop and fires `onComplete(score)` callback
- Contains: 8 game components matching the 8 game types
- Key files:
  - `client/src/components/games/MatchingGame.jsx`
  - `client/src/components/games/TracingGame.jsx`
  - `client/src/components/games/QuizGame.jsx`
  - `client/src/components/games/SpellingGame.jsx`
  - `client/src/components/games/PhonicsGame.jsx`
  - `client/src/components/games/PatternGame.jsx`
  - `client/src/components/games/OddOneOutGame.jsx`
  - `client/src/components/games/WordScramble.jsx`

**`client/src/data/modules/`:**
- Purpose: Static content for all 13 learning modules; each file exports one module object
- Contains: 13 JS files (e.g., `alphabet.js`, `numbers.js`, `shapes.js`)
- Key files:
  - `client/src/data/index.js` — exports `MODULE_REGISTRY`, `getModule()`, `getLesson()`, `getDailyChallengeSlug()`, `buildQuizOptions()`

**`client/src/lib/`:**
- Purpose: Infrastructure utilities with no UI concerns
- Key files:
  - `client/src/lib/api.js` — all HTTP calls; automatically attaches kid or Supabase JWT
  - `client/src/lib/localStorage.js` — offline progress store (`edu_progress_{kidId}` key)
  - `client/src/lib/sound.js` — audio playback via Web Speech API or MP3 files
  - `client/src/lib/supabase.js` — Supabase client (returns `null` if env vars missing)

**`client/src/context/`:**
- Purpose: App-wide React state
- Key files:
  - `client/src/context/AuthContext.jsx` — `session`, `user`, `kidSession`; all auth methods
  - `client/src/context/KidContext.jsx` — `activeKid`, `kids[]`, `selectKid`, `refreshKids`

**`server/src/routes/`:**
- Purpose: Express routers; each file handles one resource group
- Pattern: All routes call `requireAuth` (applied in `index.js`), then validate ownership via `resolveKidAccess`/`resolveWriteAccess` helpers within each route file

**`server/src/services/`:**
- Purpose: Business logic that spans multiple route needs
- Key files:
  - `server/src/services/progressSync.js` — canonical star/coin/streak computation; called by both single-lesson and bulk-sync endpoints
  - `server/src/services/weeklyDigest.js` — email digest via Resend; scheduled Monday 08:00 by cron in `index.js`

**`server/prisma/migrations/`:**
- Purpose: Sequential Prisma migration SQL files
- Generated: Yes (via `prisma migrate dev`)
- Committed: Yes
- Key migrations:
  - `20260307202629_init` — base schema (User, KidProfile, Module, Lesson, LessonProgress, Achievement)
  - `20260313180422_adaptive_learning_phase1` — adds Classroom, ClassroomStudent, DailyChallenge, ReviewSchedule, ModuleDifficulty
  - `20260313191044_add_kid_pin` — adds `pin` hash column to KidProfile
  - `20260318000000_add_scramble_score` — adds `scrambleScore` to LessonProgress

**`client/public/assets/`:**
- Purpose: Static media served at `/assets/images/` and `/assets/sounds/`
- Generated: Yes (via root-level `generate-images.js` and `generate-audio.js`)
- Committed: Yes (required for production build)
- Structure mirrors module slugs: `images/alphabet/`, `images/animals/`, etc.

## Key File Locations

**Entry Points:**
- `client/src/main.jsx`: Client entry; mounts React app
- `client/src/App.jsx`: Router tree + context providers + all route definitions
- `server/src/index.js`: Express server; route registration + cron setup

**Configuration:**
- `client/vite.config.js`: Vite + PWA plugin configuration
- `server/prisma/schema.prisma`: Database schema source of truth
- `client/.env` / `server/.env`: Environment variables (not committed)

**Core Logic:**
- `server/src/services/progressSync.js`: Star/coin/streak computation
- `server/src/middleware/auth.js`: Dual-JWT auth gate
- `client/src/lib/api.js`: Client HTTP layer
- `client/src/data/index.js`: Module registry + lookup helpers

**Database:**
- `server/src/lib/db.js`: Prisma client singleton
- `server/src/seed.js`: Seed script — run once to populate Module + Lesson rows

## Naming Conventions

**Files:**
- Client components: PascalCase `.jsx` (e.g., `LessonPlayer.jsx`, `ProtectedRoute.jsx`)
- Client utilities: camelCase `.js` (e.g., `api.js`, `localStorage.js`, `useProgress.js`)
- Client data modules: camelCase `.js` (e.g., `alphabet.js`, `bodyParts.js`)
- Server routes/middleware/services: camelCase `.js` (e.g., `progressSync.js`, `kidAuth.js`)

**Directories:**
- Client: lowercase singular for domain groups (`auth/`, `games/`, `lesson/`, `modules/`)
- Server: lowercase singular (`routes/`, `middleware/`, `services/`, `lib/`)

**Exports:**
- Client contexts: named exports for provider + hook (e.g., `export function AuthProvider`, `export function useAuth`)
- Server modules: `module.exports = router` (CommonJS); route files with extra exports use `module.exports.handlerName`

**Slugs:**
- Lesson slugs: `kebab-case` matching DB `slug` column (e.g., `letter-a`, `number-5`, `body-parts`)
- Module slugs: `kebab-case` matching both `MODULE_REGISTRY` entries and DB (e.g., `alphabet`, `food-pyramid`, `body-parts`)

## Where to Add New Code

**New Learning Module:**
1. Create `client/src/data/modules/{moduleName}.js` — export module object with `slug`, `title`, `iconEmoji`, `games[]`, `lessons[]`
2. Import and add to `MODULE_REGISTRY` in `client/src/data/index.js`
3. Add image assets under `client/public/assets/images/{slug}/`
4. Add audio assets under `client/public/assets/sounds/words/`
5. Add module to `server/src/seed.js` `MODULES` array and re-run seed

**New Game Type:**
1. Create `client/src/components/games/{GameName}.jsx` — accept `lessons` prop, call `onComplete(score)` when done
2. Add import + conditional render in `client/src/pages/MiniGame.jsx`
3. Add score field mapping in `MiniGame.jsx` `handleGameComplete` (e.g., `if (gameType === 'newGame') update.newGameScore = score`)
4. Add score column to `LessonProgress` via Prisma migration
5. Add field to `SCORE_FIELDS` array in `server/src/services/progressSync.js`

**New API Endpoint:**
1. Add route to existing file in `server/src/routes/` or create a new route file
2. Register new route file in `server/src/index.js` with `app.use('/api/{resource}', requireAuth, require('./routes/{resource}'))`
3. Add corresponding API call to `client/src/lib/api.js` or call `api.get/post` directly from the page

**New Page:**
1. Create `client/src/pages/{PageName}.jsx`
2. Add lazy import and `<Route>` in `client/src/App.jsx` under the appropriate `ProtectedRoute` group

**New Shared Component:**
1. Place in the matching domain directory under `client/src/components/{domain}/`
2. Use PascalCase filename matching the component name

## Special Directories

**`client/dist/`:**
- Purpose: Vite production build output
- Generated: Yes (`npm run build`)
- Committed: Yes (in this repo)

**`server/prisma/migrations/`:**
- Purpose: Migration history applied by Railway on deploy
- Generated: Yes (`prisma migrate dev`)
- Committed: Yes — required for Railway deployment

**`client/public/audio/`:**
- Purpose: Additional audio files (separate from `assets/sounds/`)
- Generated: Partially — via `generate-audio.js`
- Committed: Yes

**`server/scripts/`:**
- Purpose: One-off administrative scripts not part of normal server operation
- Key files: `server/scripts/retroactive-coins.js` — back-fills coin balances
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-18*
