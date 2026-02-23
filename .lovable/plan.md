

# Plan: Multi-Lingual (i18n) Infrastructure + Cleanup

## Housekeeping First

1. **Delete dead file** `src/pages/Ramadan.tsx` -- the route already redirects to `/fasting`, so this file is orphaned.

2. **Fix edge function input validation** (last remaining error-level security issue) -- add Zod-based validation to `deen-coach`, `send-push`, and `push-subscribe` edge functions.

---

## i18n Infrastructure Setup

### Approach
Use `react-i18next` with JSON translation files. Start with English as the base, then add empty translation stubs for all 7 languages so translators (or AI) can fill them in incrementally.

### Languages
English (default), Arabic, Spanish, French, Russian, Urdu, Turkish, Malay

### Steps

**Step 1: Install dependencies**
- `react-i18next` and `i18next` for the translation framework
- `i18next-browser-languagedetector` for auto-detecting browser language

**Step 2: Create translation file structure**

```text
src/
  i18n/
    index.ts          <-- i18n init config
    locales/
      en.json         <-- Full English strings (extracted from current UI)
      ar.json         <-- Arabic stubs
      es.json         <-- Spanish stubs
      fr.json         <-- French stubs
      ru.json         <-- Russian stubs
      ur.json         <-- Urdu stubs
      tr.json         <-- Turkish stubs
      ms.json         <-- Malay stubs
```

**Step 3: Extract English strings**
Pull all user-facing text from the main pages and components into `en.json` with organized keys:

```text
nav.home, nav.quran, nav.dhikr, ...
dashboard.title, dashboard.nextUp, ...
fasting.title, fasting.heatmap, fasting.ramadan, ...
settings.language, settings.notifications, ...
common.save, common.cancel, common.comingSoon, ...
```

**Step 4: Initialize i18n in `src/main.tsx`**
Import and configure i18next before the React app renders.

**Step 5: Add RTL support**
- Detect when Arabic or Urdu is active
- Apply `dir="rtl"` to the document root
- Add Tailwind RTL utilities where needed (e.g., `rtl:` prefix for directional spacing)

**Step 6: Add language selector to Settings**
- Replace the greyed-out "Coming Soon" multi-lingual card with a working language dropdown
- Persist selection in `localStorage` and optionally in the user's Supabase profile
- On change, switch the app language instantly (no reload needed)

**Step 7: Wire up key components**
Replace hardcoded strings with `t()` calls in these priority files:
- `AppSidebar.tsx` and `mobileNav.ts` (navigation labels)
- `AppLayout.tsx` (header)
- `Settings.tsx` (settings labels)
- `Landing.tsx` (public-facing page)
- Other pages will use `t()` progressively

### What won't change yet
- Non-English translation content (stubs only -- actual translations added later)
- Every single string in the app (we'll do the most visible ones first, then expand)

---

## Technical Details

### i18n Configuration (`src/i18n/index.ts`)
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
// ... other locale imports

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ... },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

### RTL Handling
A small utility hook `useDirection()` that returns `'rtl'` or `'ltr'` based on the active language, and sets `document.documentElement.dir` accordingly.

### Estimated scope
- ~10 new files (i18n config + 8 locale JSONs + RTL hook)
- ~8-10 modified files (main.tsx, settings, sidebar, nav, layout, landing)
- 1 deleted file (Ramadan.tsx)
- 3 edge functions updated with Zod validation

