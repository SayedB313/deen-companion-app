

# 10x Accountability Partner System

## Overview
Transform the basic 1:1 code-sharing system into a rich, interactive accountability experience with groups, messaging, nudges, smart matching, and weekly recaps.

## Changes

### 1. Fix the Broken "Invite" Flow on Discovery Profiles
**Problem**: Clicking "Invite" on a discovered profile just creates your own invite code -- it doesn't notify the other user at all.

**Solution**: Create a `partner_requests` table so clicking "Invite" sends a real request that appears in the other user's Community page as an incoming request they can accept or decline.

- New table: `partner_requests` (sender_id, receiver_id, message, status: pending/accepted/declined, created_at)
- Community page gets an "Incoming Requests" section showing pending requests with Accept/Decline buttons
- Accepting auto-creates the `accountability_partners` row with status `active`

### 2. Accountability Circles (Groups of 3-7)
**Problem**: Only 1:1 partnerships. Many people want a small halaqah-style group.

**Solution**: Add a `circles` system alongside the existing 1:1 partner system.

- New table: `accountability_circles` (id, name, created_by, invite_code, max_members default 7)
- New table: `circle_members` (circle_id, user_id, joined_at, role: admin/member)
- A new "Circles" tab on the Community page where you can create or join a circle
- Circle dashboard widget shows a mini-leaderboard of all members' weekly stats ranked by a composite "deen score"
- Circles use the same `weekly_snapshots` data -- no new tracking needed

### 3. Partner/Circle Chat (Lightweight Messaging)
**Problem**: Partners can see each other's stats but can't interact.

**Solution**: Add a simple in-app messaging system scoped to partnerships and circles.

- New table: `partner_messages` (id, partnership_id or circle_id, sender_id, content, created_at)
- A small chat drawer/sheet that opens from the PartnerCard or Circle widget
- Messages are short (max 280 chars) -- encouragement, not full conversations
- Pre-built quick messages: "MashAllah keep it up!", "Don't forget your dhikr today", "Let's both fast tomorrow"

### 4. Smart Nudges and Notifications
**Problem**: No proactive motivation. Users have to manually open the app to see partner data.

**Solution**: Add automated nudge notifications.

- New edge function: `partner-nudge` that runs daily
- Checks if your partner's streak is about to break (no activity logged today by evening)
- Sends a push notification: "Your partner hasn't logged today -- send them some encouragement!"
- Weekly recap notification: "This week you logged 28 prayers vs your partner's 25. You're leading!"
- Uses the existing push notification infrastructure (`push_subscriptions`, `send-push` edge function)

### 5. Weekly Head-to-Head Recap Card
**Problem**: Only current week data, no sense of progress over time.

**Solution**: Add a weekly recap that compares this week vs last week, and tracks your win/loss record against your partner.

- New field on `accountability_partners`: `user_wins` (int), `partner_wins` (int), `ties` (int)
- At the start of each new week, the app checks last week's snapshots and increments the appropriate counter
- PartnerCard shows: "You: 4 wins | Partner: 2 wins | 1 tie" as a running tally
- A "View History" expandable section showing week-by-week comparison chart (reuses existing recharts)

### 6. Smart Partner Matching
**Problem**: Discovery is a flat list sorted by streak. No compatibility signal.

**Solution**: Add a simple matching score based on shared focus areas and similar activity levels.

- When browsing profiles, compute a "compatibility" percentage based on overlapping focus areas and similar weekly snapshot ranges
- Sort by compatibility instead of just streak
- Show a "Good match" or "Great match" badge on profiles with >60% or >80% compatibility
- Filter controls: by focus area, by activity level (beginner/consistent/advanced based on weekly stats)

### 7. Shareable Accountability Cards
**Problem**: No way to celebrate progress together externally.

**Solution**: Generate a shareable image card showing your weekly partnership stats.

- "Share This Week" button on the PartnerCard
- Generates a styled card image (using the existing ShareCards page pattern) showing both names, side-by-side stats, and who's leading
- Can be copied to clipboard or shared via Web Share API

## Database Changes Summary

| Table | Type | Purpose |
|-------|------|---------|
| `partner_requests` | New | Proper invite/accept flow for discovered profiles |
| `accountability_circles` | New | Group accountability (3-7 members) |
| `circle_members` | New | Circle membership |
| `partner_messages` | New | Lightweight chat for partners and circles |
| `accountability_partners` | Modified | Add `user_wins`, `partner_wins`, `ties` columns |

## File Changes Summary

| File | Type | Purpose |
|------|------|---------|
| `src/pages/Community.tsx` | Modified | Add Incoming Requests section, Circles tab, smart matching sort, compatibility badges |
| `src/components/PartnerCard.tsx` | Modified | Add win/loss record, "View History" section, "Share This Week" button, chat button |
| `src/hooks/useAccountabilityPartner.ts` | Modified | Add partner request flow, win/loss tracking, history loading |
| `src/hooks/useAccountabilityCircle.ts` | New | Circle CRUD, join/leave, member list, leaderboard |
| `src/hooks/usePartnerChat.ts` | New | Send/receive messages, quick message templates |
| `src/components/PartnerChat.tsx` | New | Chat drawer/sheet UI |
| `src/components/CircleCard.tsx` | New | Dashboard widget for circle leaderboard |
| `src/components/CircleManager.tsx` | New | Create/manage circles on Community page |
| `supabase/functions/partner-nudge/index.ts` | New | Daily nudge edge function |
| Migration SQL | New | All new tables and schema changes |

## Implementation Order

1. Fix the broken invite flow (partner_requests) -- highest impact, simplest change
2. Weekly head-to-head recap with win/loss tracking
3. Lightweight partner chat with quick messages
4. Accountability Circles (groups)
5. Smart matching and compatibility scores
6. Nudge notifications edge function
7. Shareable accountability cards

## Technical Notes

- All new tables will have RLS policies scoped to participants only
- Circle messages and partner messages use the same table with a nullable `circle_id` or `partnership_id` to keep things simple
- The partner-nudge edge function can be triggered by the existing `smart-reminders` cron or a new daily cron
- Compatibility scoring is done client-side to avoid needing a new edge function -- it's a simple overlap calculation on focus_areas and a proximity check on weekly snapshot values
- Win/loss tallying happens on the client when the PartnerCard mounts and detects a new week has started since last check

