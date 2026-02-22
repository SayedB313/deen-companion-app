

# Top 10 Improvements for Deen Tracker

## 1. Markdown Rendering in AI Coach
**Current:** AI responses display as plain text, losing all formatting.
**Improvement:** Use `react-markdown` (already installed!) to render the coach's responses with proper headings, bold text, bullet lists, and Qur'anic verse formatting.

---

## 2. Dashboard Weekly/Monthly Charts
**Current:** Dashboard only shows static number cards with no trend visualization.
**Improvement:** Add Recharts line/bar charts showing weekly deen time trends, fasting patterns, and Qur'an memorization progress over time. This is already in your plan but not built yet.

---

## 3. Prayer Times Integration
**Current:** No prayer time awareness at all.
**Improvement:** Integrate a free prayer times API (e.g., Aladhan API) to show today's prayer times on the dashboard and optionally log which prayers were prayed on time vs. late. This is a core part of any Muslim's daily routine.

---

## 4. Hijri Calendar Support
**Current:** Everything uses Gregorian dates only.
**Improvement:** Display Hijri dates alongside Gregorian dates, especially on the fasting tracker (critical for Ramadan, Ayyam al-Bid, Ashura etc.). This makes the app feel authentically Islamic.

---

## 5. Daily Wird/Dhikr Counter
**Current:** No way to track daily adhkar or wird.
**Improvement:** Add a simple tap-to-count dhikr counter with preset wirds (SubhanAllah x33, Alhamdulillah x33, Allahu Akbar x34, etc.). Include daily targets and completion tracking. This is something users would open multiple times per day.

---

## 6. Quran Audio Recitation Player
**Current:** Quran page is purely a tracking grid with no content.
**Improvement:** Embed a Quran audio player (using free APIs like quran.com or mp3quran.net) so users can listen to the ayahs they're memorizing. Hearing recitation is essential for hifz.

---

## 7. Weekly AI-Generated Insights on Dashboard
**Current:** AI insights only available when you manually open the coach and ask.
**Improvement:** Auto-generate a weekly summary card on the dashboard (e.g., "You memorized 12 new ayahs this week, up from 5 last week. Your fasting streak is 3 Mondays strong."). Run this as a scheduled or on-demand edge function.

---

## 8. Goals and Targets System
**Current:** The 7-hour deen time goal is hardcoded. No other goals exist.
**Improvement:** Let users set custom daily/weekly/monthly goals for any tracked area (ayahs per day, pages per week, fasts per month). Show goal progress on the dashboard and let the AI coach reference them.

---

## 9. Data Export and Backup
**Current:** No way to export your data.
**Improvement:** Add a settings page with CSV/JSON export of all tracked data. Important for user trust and data ownership, especially for a personal accountability app.

---

## 10. Notifications and Reminders
**Current:** No reminders or nudges.
**Improvement:** Add browser push notifications or email reminders for:
- "You haven't logged today" (streak at risk)
- "Time for your daily Quran session"
- Weekly progress summary email
This drives retention and consistency, which is the whole point of the app.

---

## Technical Notes

| Suggestion | Complexity | New Dependencies |
|---|---|---|
| 1. Markdown in Coach | Low | None (react-markdown installed) |
| 2. Dashboard Charts | Medium | None (recharts installed) |
| 3. Prayer Times | Medium | None (fetch from API) |
| 4. Hijri Calendar | Medium | May need hijri-date library |
| 5. Dhikr Counter | Low | None |
| 6. Quran Audio | Medium | None (external API) |
| 7. Weekly AI Insights | Medium | New edge function |
| 8. Goals System | Medium | New DB table |
| 9. Data Export | Low | None |
| 10. Notifications | High | Web Push API |

Pick whichever ones excite you most and I will build them.
