

# Deen Tracker — Full Implementation Plan

## Overview
A comprehensive personal Islamic lifestyle and study tracking web app. Clean, minimal design with green accents. Uses Lovable Cloud (Supabase) for backend persistence and Lovable AI (Gemini) as a built-in companion. Single-user app with email auth.

---

## 1. Dashboard (Home Page)
- At-a-glance stats: Qur'an memorisation %, books read, days fasted, today's deen time %
- **Daily deen time tracker** — shows how much of your day you've spent on deen vs. your 70% goal (progress ring/bar)
- Current streak counter (days logged)
- Recent activity feed
- Weekly/monthly progress charts (Recharts)
- Milestone badges earned
- Quick-add buttons to log activity from the dashboard

---

## 2. Qur'an Memorisation Tracker
- Visual surah grid — all 114 surahs, color-coded (not started / in progress / memorised)
- Click a surah to mark individual ayahs as memorised or "needs review"
- Overall progress bar (e.g. "847 / 6,236 ayahs")
- Juz-level summary derived from ayah data
- Log daily Qur'an reading time and pages read

---

## 3. Theology & Fiqh Tracker
- Customisable topic categories (Aqeedah, Usul al-Fiqh, Fiqh, Seerah, Hadith Sciences, etc.)
- Sub-topics with completion percentage per topic
- Courses/classes log — name, instructor, status, progress %
- Notes section attached to any topic or course

---

## 4. Book Tracker
- Add books with title, author, category, page count
- Status: Want to Read → Reading → Completed
- Per-book progress bar (pages read)
- Stats: total books read, books this month/year

---

## 5. Fasting Tracker
- Calendar view to mark days fasted (Ramadan, Mondays/Thursdays, Ayyam al-Bid, voluntary)
- Categorise fasts by type
- Monthly/yearly fasting stats and streaks
- Visual calendar with fasted days highlighted

---

## 6. Daily Time Tracker (70% Deen Goal)
- Log time blocks spent on deen activities (study, prayer, dhikr, reading, etc.) vs. other activities
- Set your daily target (default 70% of a 10-hour day = 7 hours)
- Visual progress ring showing today's deen time vs. goal
- Weekly and monthly trend charts
- Breakdown by activity type (how much time on Qur'an vs. fiqh vs. reading, etc.)

---

## 7. Character & Self-Accountability Tracker
- Track positive traits practised (sabr/patience, shukr/gratitude, ihsan, honesty, etc.)
- Log sins or negative habits to hold yourself accountable (private, only you see this)
- Weekly summary: "You practised sabr 3 times this week, up from 0 last week"
- Progress bars per trait over time
- Categorised as virtues to grow and habits to reduce

---

## 8. AI Companion (Deen Coach)
- Built-in chat interface powered by Lovable AI (Gemini)
- The AI has access to your tracked data and gives personalised insights, e.g.:
  - "You read 20 pages of Qur'an today — 25% improvement vs. last week"
  - "You've been consistent with Monday fasts for 4 weeks straight"
  - "Your sabr practice increased this week — keep it up"
- Proactive weekly summary/insights on the dashboard
- Can ask questions and get motivational feedback

---

## 9. Motivational Features
- **Daily streaks** — logs when you record any activity
- **Milestone badges** — auto-awarded (First Juz, 10 Books, 30-Day Streak, 100 Days Fasted, etc.)
- **Progress charts** — line/bar charts for all tracked areas
- **Daily goals** — set targets (ayahs/day, hours/day, pages/day) and track against them
- **Weekly AI-generated summary** on the dashboard

---

## 10. Backend (Lovable Cloud / Supabase)
- Database tables: Qur'an progress, topics, courses, notes, books, fasting log, time logs, character traits, daily logs, milestones, chat history
- Pre-seeded surah data (114 surahs with ayah counts)
- Email authentication
- Edge function for AI companion (calls Lovable AI gateway)

---

## 11. Design & Navigation
- Clean & minimal white theme with subtle green accent
- Sidebar navigation: Dashboard, Qur'an, Knowledge (theology/fiqh/books), Fasting, Time Tracker, Self-Accountability, AI Coach
- Mobile-responsive for logging on the go
- Clear typography, generous whitespace

