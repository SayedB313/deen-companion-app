
# Plan: Multi-Lingual (i18n) Infrastructure + Cleanup

## ✅ COMPLETED

### Housekeeping
1. ✅ Deleted orphaned `src/pages/Ramadan.tsx`
2. ✅ Added Zod input validation to `deen-coach`, `send-push`, and `push-subscribe` edge functions

### i18n Infrastructure
1. ✅ Installed `i18next`, `react-i18next`, `i18next-browser-languagedetector`
2. ✅ Created `src/i18n/index.ts` config with language detection + RTL support
3. ✅ Created 8 locale files (en full, ar/es/fr/ru/ur/tr/ms with nav + common stubs)
4. ✅ Initialized i18n in `src/main.tsx`
5. ✅ RTL support: auto-sets `dir="rtl"` for Arabic/Urdu
6. ✅ Working language selector in Settings (replaces "Coming Soon" placeholder)
7. ✅ Wired `t()` calls into AppSidebar, AppLayout, Settings
8. ✅ Created `useDirection()` hook
9. ✅ Deployed updated edge functions

### Remaining (progressive)
- Wire `t()` into Landing.tsx, MobileBottomNav, mobileNav.ts
- Add full translations for all languages (currently stubs with nav + common keys)
- Expand `en.json` to cover all pages progressively
