

# Mobile-Ready Deen Tracker

## Overview
Your app already has basic mobile responsiveness (the sidebar collapses into a hamburger menu, grids stack on small screens). However, to make it feel like a true mobile app, we need a few targeted improvements plus PWA (Progressive Web App) setup so users can install it on their home screen.

## What Changes

### 1. Bottom Navigation Bar (Mobile Only)
On mobile, replace the hamburger sidebar menu with a fixed bottom tab bar -- the standard mobile app pattern. This gives instant access to key sections with one thumb tap instead of opening a drawer.

- Shows 5 primary tabs: Dashboard, Quran, Dhikr, Coach, More
- "More" opens the remaining pages (Knowledge, Fasting, Time, Character, Settings)
- Hidden on desktop -- desktop keeps the existing sidebar
- Active tab highlighted with the primary color

### 2. Mobile Layout Adjustments
- Reduce main content padding from `p-6` to `p-4` on mobile
- Add bottom padding so content doesn't hide behind the tab bar
- Make the top header slimmer on mobile
- Ensure the AI Coach chat input doesn't get covered by the tab bar

### 3. PWA Setup (Installable App)
Turn the app into an installable web app so users can add it to their home screen:

- Install and configure `vite-plugin-pwa`
- Add a web app manifest with app name, icons, and theme colors
- Add mobile-optimized meta tags to `index.html` (viewport, theme-color, apple-touch-icon)
- Create PWA icons (192x192 and 512x512)
- The app will work offline for cached pages and load like a native app

### 4. Touch-Friendly Refinements
- Ensure all tap targets are at least 44px (most already are)
- Make the dhikr "Tap" buttons even larger on mobile for easy one-hand use
- Adjust card spacing for thumb-friendly scrolling

## What Stays the Same
- Desktop layout is untouched -- sidebar, spacing, everything stays as-is
- All existing functionality works identically
- Future desktop changes automatically apply to mobile since it's the same codebase

## Technical Details

**Files to create:**
- `src/components/MobileBottomNav.tsx` -- Bottom tab bar component
- PWA config files (manifest, service worker via vite-plugin-pwa)

**Files to modify:**
- `src/components/AppLayout.tsx` -- Add MobileBottomNav, adjust padding
- `src/pages/Coach.tsx` -- Adjust chat height calculation for mobile
- `index.html` -- Add PWA meta tags
- `vite.config.ts` -- Add PWA plugin config

**New dependency:**
- `vite-plugin-pwa` -- Generates service worker and manifest automatically

