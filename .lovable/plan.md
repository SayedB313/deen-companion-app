

# Feature Plan: AI Ayah Explainer + Community Accountability

## Feature 1: "Explain this Ayah" Button (Small)

### What it does
Adds a small button on each ayah card in Memorization Mode that sends the ayah text to the existing Deen Coach edge function, requesting tafsir (explanation), practical application, and related hadith. The response appears inline in an expandable section below the ayah card.

### Implementation

**Modified file: `src/components/QuranMemorizationMode.tsx`**
- Add an "Explain" button (using the `BookOpen` or `Sparkles` icon) next to each ayah's play button
- When clicked, call the existing `deen-coach` edge function with a pre-built prompt: "Explain Surah {name}, Ayah {number}: '{arabic text}'. Provide brief tafsir, practical lesson, and any related hadith."
- Store the explanation in local state (`Map<number, string>`) so it persists while the dialog is open
- Render the AI response in a collapsible section below the ayah card using `ReactMarkdown`, with a loading spinner while streaming
- Uses the same streaming pattern as `useCoach` but as a one-shot call (no conversation history needed)

**New hook: `src/hooks/useAyahExplainer.ts`**
- Lightweight hook that takes surah name + ayah number + arabic text
- Calls the `deen-coach` edge function with a focused system-like prompt embedded in the user message
- Streams the response and returns `{ explanation, loading, explain() }`
- No database persistence needed -- explanations are ephemeral per session

**No database changes required.** Reuses the existing `deen-coach` edge function as-is.

---

## Feature 2: Community Accountability -- Partner Streaks & Weekly Comparison (Medium)

### What it does
Users can link with an accountability partner via a simple invite code system. Once paired, both users can see each other's streaks and a weekly comparison card on the dashboard showing side-by-side progress.

### Database Changes (2 new tables)

**Table: `accountability_partners`**
- `id` (uuid, PK)
- `user_id` (uuid, not null) -- the user who created the link
- `partner_id` (uuid, nullable) -- filled when partner accepts
- `invite_code` (text, unique, not null) -- 6-character code
- `status` (text, default 'pending') -- 'pending' | 'active' | 'dissolved'
- `created_at` (timestamptz, default now())
- RLS: users can read/update rows where `user_id = auth.uid() OR partner_id = auth.uid()`

**Table: `weekly_snapshots`**
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `week_start` (date, not null)
- `prayers_logged` (int, default 0)
- `quran_ayahs_reviewed` (int, default 0)
- `dhikr_completed` (int, default 0)
- `fasting_days` (int, default 0)
- `streak_days` (int, default 0)
- `deen_minutes` (int, default 0)
- `created_at` (timestamptz, default now())
- UNIQUE(user_id, week_start)
- RLS: users can read own rows AND rows of their active partner

The weekly snapshot RLS policy will use a subquery:
```
auth.uid() = user_id 
OR user_id IN (
  SELECT partner_id FROM accountability_partners WHERE user_id = auth.uid() AND status = 'active'
  UNION
  SELECT user_id FROM accountability_partners WHERE partner_id = auth.uid() AND status = 'active'
)
```

### New Files

**`src/hooks/useAccountabilityPartner.ts`**
- Generate invite code, accept invite code, dissolve partnership
- Fetch partner's display name and weekly snapshot
- Compute current week's snapshot for the logged-in user on the fly (query salah_logs, quran_progress, dhikr_logs, fasting_log, daily_logs, time_logs for the current week)

**`src/components/PartnerCard.tsx`**
- Dashboard widget showing:
  - Partner name + their current streak vs your streak
  - Side-by-side weekly comparison bars (prayers, Quran, dhikr, fasting, deen time)
  - "No partner yet" state with "Generate Invite Code" and "Enter Code" buttons
  - Color indicators: green when you're ahead, amber when tied, red when behind (friendly motivation)

**`src/components/PartnerSettings.tsx`**
- Settings section for managing partnership: view partner name, copy invite code, dissolve partnership
- Added to Settings page

### Modified Files

**`src/pages/Index.tsx`** -- Add `<PartnerCard />` widget to the dashboard (after streak cards)

**`src/pages/Settings.tsx`** -- Add `<PartnerSettings />` section

### Snapshot Strategy
- Weekly snapshots are computed client-side when the PartnerCard mounts (for the current week)
- The snapshot is upserted to `weekly_snapshots` so the partner can read it
- This avoids needing a cron job -- each user's app keeps their snapshot fresh

---

## Summary of All Changes

| Area | Files | Type |
|------|-------|------|
| Ayah Explainer | `useAyahExplainer.ts` | New hook |
| Ayah Explainer | `QuranMemorizationMode.tsx` | Modified |
| Accountability DB | Migration SQL | New migration |
| Accountability | `useAccountabilityPartner.ts` | New hook |
| Accountability | `PartnerCard.tsx` | New component |
| Accountability | `PartnerSettings.tsx` | New component |
| Accountability | `Index.tsx`, `Settings.tsx` | Modified |

