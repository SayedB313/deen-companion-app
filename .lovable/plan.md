

# Quran Overhaul: Dual-Mode Player + Spaced Repetition

## Overview

Redesign the Quran surah dialog with two distinct modes -- **Listening Mode** and **Memorization Mode** -- plus properly wire the SM-2 spaced repetition algorithm into the revision flow.

---

## 1. Dual-Mode Tabs in Surah Dialog

When a user opens a surah, they see a tab switcher at the top: **Listening** | **Memorization**

### Listening Mode (clean, distraction-free)
- **No ayah dropdown selector** -- instead, clicking any ayah number button starts playback from that ayah
- Simplified transport: Play/Pause, Stop, Previous, Next ayah
- Auto-play toggle (continuous / surah loop / off)
- Reciter selector
- Volume control + seek bar
- The ayah grid highlights the currently playing ayah with a ring indicator
- Clicking an ayah number = start playing that ayah (not cycle status)
- Long-press or a small icon on each ayah to cycle memorization status

### Memorization Mode (study tools)
- **Playback speed control** (0.5x, 0.75x, 1x, 1.25x) -- slows down the reciter for easier following
- **Repeat ayah N times** (2, 3, 5, 7, 10, 20) for drilling
- **Arabic text display** -- fetched from `api.alquran.cloud/v1/surah/{id}/quran-uthmani` showing full Arabic verse text
- **Transliteration display** -- fetched from `api.alquran.cloud/v1/surah/{id}/en.transliteration`
- Each ayah shown as a card with: Arabic text (large), transliteration below, and a play button + status toggle
- Scroll-to and highlight the currently playing ayah
- Auto-advance toggle to move to next ayah after repeats complete
- Reciter selector + volume

---

## 2. SM-2 Spaced Repetition Enhancement

The `RevisionScheduler` already has a basic SM-2 function. Enhancements:

- **Ayah-level granularity**: Track SM-2 per-ayah (not just per-surah) using a new `revision_schedule` approach -- add columns or a new table for ayah-level intervals
- **Review inside Memorization Mode**: After listening to a repeated ayah, prompt "How well did you recall?" with Hard (quality=2) / Good (quality=4) / Easy (quality=5) buttons
- **Auto-queue next due ayah**: In memorization mode, a "Next Due" button jumps to the next ayah due for review within the current surah
- **Visual indicators**: Ayah buttons in both modes show color-coded borders for SM-2 urgency (overdue = red ring, due today = amber, safe = green)

### Database Changes
- Add a new table `ayah_revision_schedule` with columns:
  - `id`, `user_id`, `surah_id`, `ayah_number`, `last_reviewed` (date), `next_review` (date), `interval_days` (int), `ease_factor` (numeric), `created_at`
  - Unique constraint on `(user_id, surah_id, ayah_number)`
  - RLS: users manage own rows
- Keep the existing surah-level `revision_schedule` as a summary/overview

---

## 3. File Changes

### New Files
- **`src/components/QuranListeningMode.tsx`** -- Listening mode UI: simplified player + clickable ayah grid
- **`src/components/QuranMemorizationMode.tsx`** -- Memorization mode UI: Arabic/transliteration text, speed control, repeat, SM-2 review buttons
- **`src/hooks/useQuranText.ts`** -- Hook to fetch and cache Arabic text + transliteration from alquran.cloud API
- **`src/hooks/useAyahRevision.ts`** -- Hook for ayah-level SM-2: load schedule, review ayah, get next due

### Modified Files
- **`src/pages/Quran.tsx`** -- Replace the single dialog body with a Tabs component switching between Listening and Memorization modes
- **`src/components/QuranAudioPlayer.tsx`** -- Refactor to accept a `mode` prop; add `playbackRate` support (`audio.playbackRate`); remove the ayah dropdown in listening mode; expose `playAyah(n)` via a ref or callback
- **`src/components/RevisionScheduler.tsx`** -- Link "Review" action to open the surah in Memorization mode; show ayah-level stats

### Database Migration
- Create `ayah_revision_schedule` table with RLS policies

---

## 4. Technical Details

### Playback Speed
The HTML5 Audio API natively supports `audio.playbackRate`. Values: 0.5, 0.75, 1.0, 1.25. Applied via a slider or button group in memorization mode.

### Quran Text API
```text
Arabic:          GET https://api.alquran.cloud/v1/surah/{id}/quran-uthmani
Transliteration: GET https://api.alquran.cloud/v1/surah/{id}/en.transliteration
```
Response shape: `{ data: { ayahs: [{ number, text, numberInSurah }] } }`

Cached in React state per surah to avoid re-fetching. The hook will store results in a `Map<number, { arabic: string, transliteration: string }[]>`.

### SM-2 Algorithm (already exists in RevisionScheduler)
```text
quality: 0-5 (user self-rating)
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
EF' = max(1.3, EF')
interval: q < 3 -> 1 day, first review -> 1, second -> 6, then interval * EF
```
Applied at ayah level in memorization mode after each repeat drill.

### Ayah-Level Revision Table Schema
```text
ayah_revision_schedule
  id: uuid (PK, default gen_random_uuid())
  user_id: uuid (FK, not null)
  surah_id: integer (not null)
  ayah_number: integer (not null)
  last_reviewed: date (default CURRENT_DATE)
  next_review: date (default CURRENT_DATE)
  interval_days: integer (default 1)
  ease_factor: numeric (default 2.5)
  created_at: timestamptz (default now())
  UNIQUE(user_id, surah_id, ayah_number)
  RLS: auth.uid() = user_id
```

---

## 5. User Flow Summary

```text
Open Surah Dialog
  |
  +-- [Listening Tab]
  |     Click ayah number -> plays that ayah
  |     Transport: play/pause/stop/prev/next
  |     Auto-play toggle for continuous listening
  |     No dropdown clutter
  |
  +-- [Memorization Tab]
        Shows Arabic text + transliteration per ayah
        Speed: 0.5x / 0.75x / 1x / 1.25x
        Repeat ayah x times for drilling
        After drill -> "How was your recall?" -> Hard/Good/Easy
        SM-2 schedules next review date per ayah
        "Next Due" button jumps to next overdue ayah
        Color rings on ayah cards show review urgency
```

