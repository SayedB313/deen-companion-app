

# AI Coach Sidebar -- Available Everywhere

## Overview
Add the AI Coach as a slide-out right panel on desktop and a floating chat button on mobile, so you can talk to it from any page without navigating away. The existing dedicated `/coach` page stays unchanged.

The key bonus: **context awareness**. The AI will automatically know which page you're on and can tailor its responses accordingly (e.g., on the Dhikr page it can discuss your dhikr progress, on Quran it focuses on memorisation).

## What Changes

### 1. Shared Chat Hook (`src/hooks/useCoach.ts`)
Extract all chat logic (messages, send, loading, history) from `Coach.tsx` into a reusable hook. Both the full page and the sidebar/drawer will use the same hook, sharing the same conversation.

The hook will accept an optional `pageContext` string (e.g., `"quran"`, `"dhikr"`, `"dashboard"`) that gets sent along with messages to the edge function.

### 2. Context-Aware AI
Update the edge function to accept a `pageContext` field. When present, the system prompt will include a line like:

> "The user is currently viewing their **Quran** page. Prioritise advice related to this area when relevant."

This means when you open the coach from the Dhikr page, it naturally focuses on dhikr topics without you needing to explain.

### 3. Desktop: Right Sidebar Panel (`src/components/CoachPanel.tsx`)
- A slide-out panel on the right side (~380px wide), toggled by a button in the top header bar
- Uses a Sheet (side="right") so it overlays content rather than squishing it
- Contains the same chat UI as the full page but in a compact format
- Close button to dismiss, or click the toggle again
- The panel knows which route you're on and passes it as context

### 4. Mobile: Floating Chat Button + Drawer
- A floating action button (FAB) with a chat icon, positioned above the bottom nav bar
- Tapping it opens a full-screen Drawer (bottom sheet) with the chat interface
- Same shared hook, same context awareness
- The FAB is hidden when you're already on the `/coach` page (no double UI)

### 5. Layout Integration
- `AppLayout.tsx` gets the coach toggle button in the header and the CoachPanel/FAB
- Uses `useLocation()` to determine current page context automatically
- A simple mapping object converts routes to human-readable context names

## What Stays the Same
- The `/coach` page remains as a dedicated full-screen experience
- All existing navigation (sidebar, bottom nav) is untouched
- Chat history is shared -- messages sent from the panel appear on the full page and vice versa

## Technical Details

**New files:**
- `src/hooks/useCoach.ts` -- shared chat state and send logic (extracted from Coach.tsx)
- `src/components/CoachPanel.tsx` -- the right sidebar chat panel (desktop Sheet + mobile Drawer)

**Modified files:**
- `src/pages/Coach.tsx` -- refactored to use `useCoach` hook instead of inline logic
- `src/components/AppLayout.tsx` -- add coach toggle button in header, render CoachPanel, add FAB on mobile
- `supabase/functions/deen-coach/index.ts` -- accept optional `pageContext` field, add context line to system prompt

**Route-to-context mapping (in AppLayout or a small util):**

```text
/         -> "Dashboard (overview of all progress)"
/quran    -> "Qur'an memorisation and revision"
/dhikr    -> "Daily dhikr and remembrance"
/knowledge -> "Islamic knowledge, books, and courses"
/fasting  -> "Fasting tracker"
/time     -> "Time management and productivity"
/character -> "Self-accountability and character development"
/settings -> "App settings"
```

**No new dependencies required.**

