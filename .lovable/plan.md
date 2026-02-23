

# Goals & Character Page Overhaul

## Problems with the Current Page

1. **Goals are confusing** -- when you create a goal, there's no label explaining what the number means (e.g., "5" what? No context on how to actually accomplish it or what actions link to it)
2. **Goal form is too bare** -- just a dropdown, a number input, and a period selector. No descriptions, no icons, no guidance
3. **Character logging feels disconnected** -- virtues and habits are just a flat list of past entries with no visual impact or streaks
4. **Reflections are buried** -- hidden in a third tab that most users won't find
5. **No sense of progress** -- no visual celebration when goals are hit, no streaks, no weekly summary tying everything together
6. **The three tabs feel like three separate features** rather than one unified growth experience

## Redesigned Page: "My Growth"

Instead of three disconnected tabs, the page becomes a single scrollable view with clear sections that flow together.

### Section 1: Weekly Overview Card (Top of Page)
A hero card showing this week's snapshot at a glance:
- Circular progress ring showing overall "week completion" (% of active goals met)
- Quick stats row: goals hit, virtues logged, days reflected
- Motivational line that changes based on progress ("Strong week so far!" / "Let's pick it up!")

### Section 2: Active Goals (Redesigned)
Each goal becomes a rich, visual card instead of a tiny progress bar:
- Icon matching the goal area (Quran icon for ayahs, clock for deen time, etc.)
- Clear label: "Memorise 5 ayahs daily" not "Quran Ayahs (daily): 0/5"
- Circular progress indicator or a bold fraction (3/5) with the unit spelled out
- Color coding: green when complete, amber when close, default otherwise
- "How to achieve this" hint text (e.g., "Log progress on the Quran page" with a link)
- Tap/click to expand and see a mini history chart (last 7 days)

**Improved Goal Creation Form:**
- Each goal area shows an icon + description of what it tracks
- The number input has a label like "Target: how many ayahs per day?"
- Suggested targets shown as quick-pick chips (e.g., 3, 5, 10, 20 for ayahs)
- After saving, a confirmation with "Go log your first entry" link

### Section 3: Character Tracker (Visual Upgrade)
Instead of a flat log list:
- Two side-by-side summary cards: "Virtues This Week" and "Habits Tracked"
- Each shows a count with a small trend arrow (up/down vs last week)
- Quick-log buttons: tap a virtue/habit chip to instantly log it for today (one tap, no form)
- Expandable "View Log" to see the detailed history (currently the only view)

### Section 4: Weekly Reflection (Inline, Not Hidden)
- Always visible at the bottom, not behind a tab
- Current week's reflection with the prompt badges
- Collapsible "Past Reflections" accordion below it

## File Changes

| File | Change |
|------|--------|
| `src/pages/Character.tsx` | Complete rewrite -- rename conceptually to "My Growth", remove tabs, build as single scrollable page with the 4 sections above |
| `src/components/GoalsWidget.tsx` | Major rewrite -- rich goal cards with icons, color states, descriptions, "how to achieve" links, improved form with labels/suggestions |
| `src/components/WeeklyReflection.tsx` | Minor styling tweaks to fit inline (no structural changes) |
| `src/config/mobileNav.ts` | Update label from "Goals" to "My Growth" |
| `src/components/AppSidebar.tsx` | Update sidebar label to match |

## Technical Details

- No database changes needed -- all existing tables (`goals`, `character_logs`, `reflections`) stay the same
- Goal area metadata (icons, descriptions, suggested targets, "how to achieve" links) will be a static config array in GoalsWidget
- Weekly overview stats are computed client-side from the same queries GoalsWidget already makes
- Character quick-log uses the same `character_logs` insert that exists today, just triggered from a chip tap instead of a form
- The compact GoalsWidget on the dashboard will also get the icon + clearer label treatment

