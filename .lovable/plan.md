
# Merge Goals into "Goals & Accountability" Hub

## Overview
Rename the current Self-Accountability (`/character`) page to **"Goals & Accountability"** and move the full Goals system there. The Dashboard keeps a compact, read-only summary that links to the full page. A new weekly reflection journal is added for end-of-week self-review.

## What Changes

### 1. Rename & Restructure the `/character` Page
- Page title becomes **"Goals & Accountability"**
- Three tabbed sections: **Goals**, **Character** (virtues/habits), **Reflections**
- The Goals tab contains the full GoalsWidget (add, edit, delete, progress bars) -- moved from the dashboard
- The Character tab keeps the existing virtue/habit logging
- The Reflections tab is a new weekly journal (simple text entries saved per week)

### 2. Dashboard Gets a Compact Goals Summary
- Replace the current full `GoalsWidget` on the Dashboard with a slim read-only card
- Shows top 3 active goals with progress bars, no add/delete controls
- A "View All" link navigates to `/character` (the full Goals & Accountability page)

### 3. New Goal Type: Character Goals
- Add two new goal areas: **"Virtues practiced"** and **"Habits avoided"** (pulled from `character_logs` data)
- This bridges the character tracking with the goals system so traits become measurable targets (e.g., "Practice patience 3x this week")

### 4. Weekly Reflection Journal
- Simple form: a text area to write a few sentences about your week
- Stored in a new `reflections` table (user_id, week_start, content, created_at)
- Past reflections viewable in a scrollable list
- Quick prompts like "What am I grateful for?" and "What can I improve?"

### 5. Navigation Updates
- Sidebar: rename "Self-Accountability" to "Goals"
- Mobile nav: update the label in `mobileNav.ts` from "Character" to "Goals"
- Icon stays as Heart (or switch to Target -- both work)

## What Stays the Same
- The `/character` route stays the same (no URL change needed)
- All existing character logging (virtues, habits) works identically inside the Character tab
- Dashboard still shows goal progress, just in a slimmer format

## Technical Details

**New database table:**
- `reflections` -- columns: `id` (uuid), `user_id` (uuid, FK), `week_start` (date), `content` (text), `created_at` (timestamptz). RLS: users can only read/write their own rows.

**Files to modify:**
- `src/pages/Character.tsx` -- restructure into 3-tab layout (Goals, Character, Reflections), embed GoalsWidget fully
- `src/components/GoalsWidget.tsx` -- add `compact` prop; when true, shows read-only top-3 with "View All" link; add "virtues_practiced" and "habits_avoided" goal areas
- `src/pages/Index.tsx` -- pass `compact` prop to GoalsWidget
- `src/components/AppSidebar.tsx` -- rename "Self-Accountability" to "Goals"
- `src/config/mobileNav.ts` -- rename "Character" to "Goals"

**New file:**
- `src/components/WeeklyReflection.tsx` -- the reflection journal component used inside the Reflections tab

**New migration:**
- Create `reflections` table with RLS policies
