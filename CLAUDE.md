# CLAUDE.md — Deen Tracker

## What is Deen Tracker?

Deen Tracker is a comprehensive Islamic lifestyle companion app designed to help Muslims build consistency in their daily worship and spiritual growth. It tracks Qur'an memorisation, prayers, fasting, dhikr (remembrance of Allah), knowledge acquisition, character development, and more — all in one unified Progressive Web App (PWA).

The app is built for mobile-first usage (installable as a PWA on iOS/Android) with full desktop support via a responsive sidebar layout.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite (with SWC for fast compilation) |
| **Styling** | Tailwind CSS + CSS variables (HSL-based design tokens) |
| **UI Components** | shadcn/ui (Radix UI primitives + Tailwind) |
| **Routing** | React Router DOM v6 |
| **State Management** | React Query (TanStack Query) for server state, React useState/useEffect for local state |
| **Backend** | Supabase (PostgreSQL database, Auth, Edge Functions, Row Level Security) |
| **Authentication** | Supabase Auth (email/password) |
| **Animations** | Framer Motion |
| **Internationalisation** | i18next + react-i18next (8 languages, RTL support) |
| **PWA** | vite-plugin-pwa (Workbox service worker, offline caching, push notifications) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Theming** | next-themes (dark/light mode, default dark) |
| **Forms** | React Hook Form + Zod validation |
| **Toasts** | Sonner + shadcn toast |
| **Platform** | Vercel (hosting, deployment) |

---

## Project Structure

```
├── public/                    # Static assets (favicon, PWA icons, service worker)
├── src/
│   ├── App.tsx                # Root component — routing, providers, auth guards
│   ├── main.tsx               # Entry point — renders App, initialises i18n
│   ├── index.css              # Global styles, CSS variables, Tailwind config
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── knowledge/         # Knowledge tab components (redesigned)
│   │   │   ├── knowledgeTypes.ts    # Shared types, constants, encode/parse helpers
│   │   │   ├── ResourceCard.tsx     # Unified card for all 5 resource types
│   │   │   └── AddResourceModal.tsx # Two-step add-resource modal
│   │   ├── AppLayout.tsx      # Main layout — sidebar (desktop), bottom nav (mobile), header
│   │   ├── AppSidebar.tsx     # Desktop navigation sidebar
│   │   ├── MobileBottomNav.tsx # Mobile bottom tab bar + "More" sheet
│   │   ├── CoachPanel.tsx     # AI Coach floating panel
│   │   ├── ThemeToggle.tsx    # Dark/light mode toggle
│   │   ├── QuranReadingMode.tsx
│   │   ├── QuranListeningMode.tsx
│   │   ├── QuranMemorizationMode.tsx
│   │   ├── RevisionScheduler.tsx  # SM-2 spaced repetition scheduler
│   │   ├── FastingHeatmap.tsx     # GitHub-style yearly fasting heatmap
│   │   ├── DhikrFocusMode.tsx     # Full-screen dhikr counter
│   │   ├── PrayerTimes.tsx        # Prayer times via Aladhan API
│   │   ├── DashboardCharts.tsx    # Weekly activity charts
│   │   ├── WeeklyReportCard.tsx   # Weekly progress summary
│   │   ├── StreakBadges.tsx       # Achievement badges
│   │   ├── GoalsWidget.tsx        # Goal tracking widget
│   │   ├── InspirationCard.tsx    # Daily hadith/quote card
│   │   ├── TodayHub.tsx           # Dashboard "Today" summary
│   │   ├── CircleManager.tsx      # Accountability circles management
│   │   ├── PartnerCard.tsx        # Accountability partner display
│   │   ├── PartnerChat.tsx        # Partner messaging
│   │   └── ...
│   ├── pages/
│   │   ├── Landing.tsx        # Public marketing/landing page (/welcome)
│   │   ├── Auth.tsx           # Sign in / Sign up
│   │   ├── Onboarding.tsx     # New user onboarding flow
│   │   ├── Index.tsx          # Dashboard (home)
│   │   ├── Quran.tsx          # Qur'an tracker (reading, listening, memorisation)
│   │   ├── Dhikr.tsx          # Dhikr counter with focus mode
│   │   ├── Duas.tsx           # Duas & Adhkar collection
│   │   ├── Fasting.tsx        # Fasting tracker + heatmap + Ramadan mode
│   │   ├── Knowledge.tsx      # Learning dashboard (Library/Topics/Scholars/Notes tabs)
│   │   ├── TimeTracker.tsx    # Deen vs dunya time tracking
│   │   ├── Character.tsx      # Character trait tracking (good/bad habits)
│   │   ├── Coach.tsx          # AI Deen Coach chat interface
│   │   ├── Community.tsx      # Accountability partners & circles
│   │   ├── Reports.tsx        # Weekly/monthly analytics
│   │   ├── Qibla.tsx          # Qibla compass
│   │   ├── ShareCards.tsx     # Shareable progress cards
│   │   ├── Settings.tsx       # Account, data export, language, danger zone
│   │   └── NotFound.tsx       # 404 page
│   ├── hooks/
│   │   ├── useAuth.tsx        # Auth context provider + hook
│   │   ├── useCoach.ts        # AI Coach conversation logic
│   │   ├── useStreaks.ts      # Daily streak calculation
│   │   ├── useDhikrStreaks.ts # Dhikr-specific streaks
│   │   ├── useQuranText.ts    # Fetch Qur'an text from Islamic API
│   │   ├── useAyahRevision.ts # Per-ayah SM-2 revision scheduling
│   │   ├── useAyahExplainer.ts # AI-powered ayah tafsir
│   │   ├── useAccountabilityPartner.ts
│   │   ├── useAccountabilityCircle.ts
│   │   ├── usePartnerChat.ts
│   │   ├── usePartnerRequests.ts
│   │   ├── useNotifications.ts    # Push notification management
│   │   ├── useDailyInspiration.ts # Daily hadith/quote rotation
│   │   ├── useDirection.ts        # RTL/LTR direction hook
│   │   └── use-mobile.tsx         # Mobile breakpoint detection
│   ├── i18n/
│   │   ├── index.ts           # i18next configuration + RTL detection
│   │   └── locales/
│   │       ├── en.json        # English (complete)
│   │       ├── ar.json        # Arabic (complete, RTL)
│   │       ├── ur.json        # Urdu (complete, RTL)
│   │       ├── es.json        # Spanish (nav + common)
│   │       ├── fr.json        # French (nav + common)
│   │       ├── ru.json        # Russian (nav + common)
│   │       ├── tr.json        # Turkish (nav + common)
│   │       └── ms.json        # Malay (nav + common)
│   ├── config/
│   │   └── mobileNav.ts       # Mobile nav tab definitions with i18n keys
│   ├── data/
│   │   ├── dailyInspiration.ts # Curated daily quotes/hadith
│   │   └── duas.ts             # Dua collection data
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client initialisation
│   │       └── types.ts       # Auto-generated database types (DO NOT EDIT)
│   └── lib/
│       └── utils.ts           # Utility functions (cn, etc.)
├── supabase/
│   ├── config.toml            # Supabase local config
│   ├── functions/             # Supabase Edge Functions (Deno)
│   │   ├── deen-coach/        # AI Coach endpoint (calls Lovable AI gateway)
│   │   ├── delete-account/    # Account deletion with full data cleanup
│   │   ├── partner-nudge/     # Send nudge notifications to partners
│   │   ├── push-subscribe/    # Register push notification subscriptions
│   │   ├── send-push/         # Send push notifications via Web Push API
│   │   ├── smart-reminders/   # Intelligent reminder scheduling
│   │   └── weekly-report/     # Generate weekly progress reports
│   └── migrations/            # Database migrations (DO NOT EDIT directly)
├── tailwind.config.ts         # Tailwind configuration with semantic colour tokens
├── vite.config.ts             # Vite config with PWA, SWC, caching strategies
└── components.json            # shadcn/ui configuration
```

---

## Core Features

### 1. Qur'an Tracker (`/quran`)
- **Reading Mode**: Full Arabic text (Uthmani script) with English translation, surah navigation, per-ayah bookmarks
- **Listening Mode**: Audio playback from Islamic CDN with speed control, per-ayah status tracking
- **Memorisation Mode**: SM-2 spaced repetition algorithm, AI-powered tafsir (ayah explanations), Arabic text with transliteration
- **Revision Scheduler**: Automatic spaced repetition scheduling for memorised surahs, due-today alerts
- **Progress Tracking**: Per-ayah status (not started → in progress → memorised → needs review), surah-level completion percentages
- **Search & Filter**: Search by surah name/number, filter by Juz

### 2. Salah (Prayer) Tracking (Dashboard)
- Log 5 daily prayers + Sunnah prayers
- On-time / Late / Missed status
- Prayer times via Aladhan API with geolocation
- Weekly prayer completion charts

### 3. Dhikr Counter (`/dhikr`)
- Full-screen focus mode with large counter
- Haptic feedback on count
- Custom dhikr creation (name, Arabic text, default target)
- Pre-built dhikr library (SubhanAllah, Alhamdulillah, etc.)
- Daily/weekly streak tracking

### 4. Fasting & Ramadan (`/fasting`)
- **Fasting Tracker**: Calendar-based logging with fast types (Ramadan, Mon/Thu, Ayyam al-Bid, Shawwal, etc.)
- **Heatmap**: GitHub-style 52-week activity heatmap, colour-coded by fast type
- **Ramadan Mode**: Suhoor/Iftar timings via geolocation + Aladhan API, daily checklist (fast + taraweeh), 30-Juz Qur'an Khatm tracker

### 5. Duas & Adhkar (`/duas`)
- Categorised dua collection (Morning, Evening, Salah, Travel, etc.)
- Arabic text + transliteration + English translation
- Favourites system

### 6. Knowledge Tracker (`/knowledge`) — *fully redesigned*
A unified Islamic learning dashboard supporting five content types:
- **Books** — title, author, category, page-level progress tracking
- **Articles / PDFs** — read/unread toggle, optional source URL saved as a linked note
- **Online Courses** — Bayyinah, SeekersGuidance, Coursera, etc. — progress slider
- **YouTube Series / Lectures** — channel/scholar, progress slider
- **Podcasts / Audio** — host/series, progress slider

**Four tabs:**
- **Library** — unified grid of all resources; filter by type (All / Books / Courses / YouTube / Podcasts / Articles); sort by Recent, Progress, or A→Z; global search with in-card highlight
- **Topics** — Islamic disciplines (Aqeedah, Fiqh, Tafsir, etc.) with editable progress slider (inline Slider component), linked resource count, notes
- **Scholars** — auto-aggregated view grouping resources by author/instructor; initials avatar, type badges, avg progress per scholar
- **Notes** — all notes across all resources and topics; markdown rendered via ReactMarkdown; grouped by resource; search-filtered

**Architecture (`src/components/knowledge/`):**
- `knowledgeTypes.ts` — shared types (`Resource`, `ResourceType`, `BookRow`, `CourseRow`, `TopicRow`, `NoteRow`), `CATEGORIES` constant, `encodeInstructor()` / `parseInstructor()`, `normaliseBook()` / `normaliseCourse()`
- `ResourceCard.tsx` — unified card for all 5 resource types; type chip + colour icon; hover-reveal actions; books use page input, others use collapsible Slider; Framer Motion staggered entrance
- `AddResourceModal.tsx` — two-step modal (step 1: pick type; step 2: type-specific fields); handles `[YT]||`, `[POD]||`, `[COURSE]||` instructor-field encoding for non-book resources

**Notes linkage (no DB schema change):**
- Book notes: `notes.title = "book:${book.id}"` (stable, ID-based — fixes old title-matching bug)
- Course/YouTube/Podcast notes: `notes.course_id = resource.id`
- Topic notes: `notes.topic_id = topic.id`

### 7. Time Tracker (`/time`)
- Log daily activities with duration
- Categorise as Deen vs Dunya time
- Weekly trend charts showing spiritual vs worldly time allocation
- Goal setting for daily deen minutes

### 8. Character Development (`/character`)
- Track positive traits (good deeds, patience, generosity)
- Track negative traits (anger, backbiting, laziness)
- Daily logging with optional notes
- Growth visualisation over time

### 9. AI Deen Coach (`/coach`)
- Conversational AI powered by Lovable AI gateway
- Personalised guidance based on user's tracked data
- Tafsir explanations, goal advice, motivational messages
- Chat history persistence in Supabase
- Accessible via floating panel (all pages) or dedicated page

### 10. Community & Accountability (`/community`)
- **Accountability Partners**: Invite via code, track each other's progress, friendly competition (wins/ties)
- **Accountability Circles**: Group accountability with up to N members, shared chat
- **Partner Chat**: Real-time messaging between partners
- **Nudge System**: Send motivational nudges via push notifications

### 11. Reports & Analytics (`/reports`)
- Weekly snapshots (prayers, dhikr, Qur'an, fasting, time, streaks)
- Historical trend charts
- Weekly reflection journal
- Downloadable progress reports

### 12. Additional Tools
- **Qibla Compass** (`/qibla`): Device orientation-based Qibla direction finder
- **Share Cards** (`/share`): Generate shareable progress cards for social media
- **Streaks & Badges**: Daily consistency tracking with achievement milestones
- **Goals Widget**: Set and track goals across all tracked areas

---

## Database Schema (Supabase PostgreSQL)

### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profile (display name, onboarding status) |
| `surahs` | 114 surahs reference data (name, ayah count, juz) |
| `quran_progress` | Per-user, per-ayah memorisation status |
| `revision_schedule` | SM-2 surah-level revision scheduling |
| `ayah_revision_schedule` | SM-2 ayah-level revision scheduling |
| `salah_logs` | Daily prayer logs (5 prayers + sunnah) |
| `dhikr_logs` | Dhikr counting logs per type per day |
| `custom_dhikr` | User-created custom dhikr types |
| `fasting_log` | Fasting days with fast type and notes |
| `daily_logs` | Daily check-in logs for streak tracking |
| `time_logs` | Activity time logs (deen vs dunya) |
| `character_logs` | Character trait tracking entries |
| `books` | Book tracking (title, author, pages, status) |
| `courses` | Course tracking (name, instructor, progress) |
| `topics` | Knowledge topic organisation |
| `notes` | Notes linked to resources — `course_id` (courses/YT/podcasts), `topic_id` (topics), or `title="book:${id}"` (books) |
| `goals` | User goals per area with targets |
| `achievements` | Earned achievement badges |
| `milestones` | Custom milestone tracking |
| `reflections` | Weekly reflection journal entries |
| `weekly_snapshots` | Aggregated weekly progress data |
| `chat_history` | AI Coach conversation logs |

### Community Tables
| Table | Purpose |
|-------|---------|
| `accountability_partners` | Partner pairings with invite codes and scores |
| `accountability_circles` | Group circles with invite codes |
| `circle_members` | Circle membership with roles |
| `partner_messages` | Chat messages between partners/circles |
| `partner_profiles` | Public partner profile (display name, focus areas, streak) |
| `partner_requests` | Pending partnership requests |

### System Tables
| Table | Purpose |
|-------|---------|
| `notification_preferences` | Per-user notification settings |
| `push_subscriptions` | Web Push API subscription endpoints |

---

## Edge Functions (Supabase / Deno)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `deen-coach` | Proxies AI chat to Lovable AI gateway, maintains conversation context | Yes |
| `delete-account` | Cascading account deletion across all tables | Yes |
| `partner-nudge` | Sends motivational push notifications to accountability partners | Yes |
| `push-subscribe` | Registers Web Push API subscriptions | Yes |
| `send-push` | Sends push notifications via Web Push protocol | Yes |
| `smart-reminders` | Schedules intelligent reminders based on user habits | Yes |
| `weekly-report` | Generates weekly progress snapshot data | Yes |

All edge functions use **Zod** for input validation and return structured JSON responses.

---

## Authentication & Routing

- **Auth Provider**: Wraps the entire app, provides `user` and `loading` state via `useAuth()` hook
- **Protected Routes**: All app pages wrapped in `ProtectedRoute` — redirects to `/welcome` if not authenticated
- **Onboarding Gate**: New users redirected to `/onboarding` before accessing the main app
- **Public Routes**: `/welcome` (landing page), `/auth` (sign in/up) — redirect to `/` if already authenticated

---

## Internationalisation (i18n)

- **8 languages**: English, Arabic, Spanish, French, Russian, Urdu, Turkish, Malay
- **RTL support**: Automatic `dir="rtl"` for Arabic and Urdu
- **Detection**: Browser language auto-detection with localStorage persistence
- **Structure**: JSON translation files in `src/i18n/locales/`
- **Usage**: `useTranslation()` hook with `t('key')` calls throughout components
- **Language selector**: In Settings page, instant switching without page reload

---

## PWA & Offline Support

- **Service Worker**: Workbox-based with intelligent caching strategies
- **Caching strategies**:
  - `CacheFirst` for Qur'an audio, Islamic CDN, Google Fonts (long-lived)
  - `NetworkFirst` for Supabase API, prayer times (fresh data preferred)
  - `StaleWhileRevalidate` for hadith API
- **Offline banner**: Shown when network is unavailable
- **Push notifications**: Web Push API for reminders, partner nudges, weekly reports
- **Installable**: Full PWA manifest with app icons, standalone display mode

---

## Design System

### Colour Tokens (HSL-based in `index.css`)
- **Primary**: Green (`152 45% 38%`) — represents Islam/growth
- **Background**: Near-white (light) / dark green-black (dark)
- **Semantic colours**: `success`, `warning`, `info`, `destructive`
- **All colours defined as CSS variables** and mapped in `tailwind.config.ts`

### Typography
- **Body**: IBM Plex Sans
- **Display**: Playfair Display (headings on landing page)
- **Arabic**: Amiri (serif, for Qur'an text and Arabic names)

### Theming
- Dark mode default, toggle via `next-themes`
- Full light mode support with contrasting token values

---

## External APIs

| API | Usage |
|-----|-------|
| Aladhan API (`api.aladhan.com`) | Prayer times, Suhoor/Iftar timings |
| Islamic CDN (`cdn.islamic.network`) | Qur'an audio recitations, Qur'an text |
| Lovable AI Gateway (`ai.gateway.lovable.dev`) | AI Coach conversations |

---

## Development Notes

### Key Conventions
- **Semantic tokens only** — never use raw colours like `text-white` or `bg-black` in components; always use design system tokens (`text-foreground`, `bg-background`, etc.)
- **Component composition** — small, focused components; shadcn/ui primitives for all UI elements
- **Path aliases** — `@/` maps to `src/` for clean imports
- **TypeScript strict** — full type safety with Supabase-generated types

### Files NOT to edit
- `src/integrations/supabase/types.ts` — auto-generated from database schema
- `supabase/migrations/` — managed by Supabase migration system
- `package.json` / `package-lock.json` — managed by Lovable tooling

### Running Locally
```bash
npm install
npm run dev    # Starts Vite dev server on port 8080
npm run build  # Production build
npm run test   # Run Vitest tests
```

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/publishable key
- Edge function secrets managed via Supabase dashboard

---

## Deployment & Repository

| | |
|---|---|
| **Production URL** | https://deen-companion-app.vercel.app |
| **GitHub Repo** | https://github.com/SayedB313/deen-companion-app |
| **Vercel Project** | https://vercel.com/sbw919-gmailcoms-projects/deen-companion-app |
| **Hosting** | Vercel (auto-deploys on every push to `main`) |

### Deploy
```bash
git push origin main        # triggers auto-deploy on Vercel
vercel --prod               # manual production deploy via CLI
```
