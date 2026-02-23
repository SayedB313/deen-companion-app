import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakAtRisk: boolean;
  todayLogged: boolean;
  achievements: string[];
  newAchievements: string[];
}

const STREAK_MILESTONES = [
  { key: "streak_7", threshold: 7, label: "7-Day Streak 🔥", message: "Masha Allah! 7 days strong!" },
  { key: "streak_14", threshold: 14, label: "14-Day Streak 🌟", message: "Two weeks of consistency!" },
  { key: "streak_30", threshold: 30, label: "30-Day Streak 💎", message: "A full month! SubhanAllah!" },
  { key: "streak_60", threshold: 60, label: "60-Day Streak 🏆", message: "60 days — truly dedicated!" },
  { key: "streak_100", threshold: 100, label: "100-Day Streak 👑", message: "100 days! Legendary consistency!" },
];

export const ACHIEVEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  streak_7: { label: "7-Day Streak", icon: "🔥" },
  streak_14: { label: "14-Day Streak", icon: "🌟" },
  streak_30: { label: "30-Day Streak", icon: "💎" },
  streak_60: { label: "60-Day Streak", icon: "🏆" },
  streak_100: { label: "100-Day Streak", icon: "👑" },
  prayers_50: { label: "50 Prayers", icon: "🕌" },
  prayers_100: { label: "100 Prayers", icon: "🕋" },
  quran_100: { label: "100 Ayahs", icon: "📖" },
};

export function useStreaks(): StreakData {
  const { user } = useAuth();
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    streakAtRisk: false,
    todayLogged: false,
    achievements: [],
    newAchievements: [],
  });

  const checkAndAwardAchievements = useCallback(
    async (streak: number, existingKeys: string[]) => {
      if (!user) return [];
      const newOnes: string[] = [];
      for (const m of STREAK_MILESTONES) {
        if (streak >= m.threshold && !existingKeys.includes(m.key)) {
          const { error } = await supabase
            .from("achievements")
            .upsert({ user_id: user.id, achievement_key: m.key }, { onConflict: "user_id,achievement_key" });
          if (!error) {
            newOnes.push(m.key);
            toast.success(m.message, { description: m.label, duration: 5000 });
          }
        }
      }
      return newOnes;
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    const calc = async () => {
      const [logsRes, achieveRes] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(400),
        supabase.from("achievements").select("achievement_key").eq("user_id", user.id),
      ]);

      const dates = logsRes.data?.map((d) => d.date) ?? [];
      const existingKeys = achieveRes.data?.map((a) => a.achievement_key) ?? [];
      const today = new Date().toISOString().split("T")[0];
      const todayLogged = dates.includes(today);

      // Current streak
      let currentStreak = 0;
      const startDate = new Date();
      // If not logged today, start checking from yesterday
      if (!todayLogged) startDate.setDate(startDate.getDate() - 1);
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(startDate);
        expected.setDate(expected.getDate() - (todayLogged ? i : i));
        const expectedStr = expected.toISOString().split("T")[0];
        if (dates.includes(expectedStr)) {
          currentStreak++;
        } else break;
        // Shift startDate for next iteration
        if (i === 0 && todayLogged) continue;
      }

      // Simpler recalculation
      currentStreak = 0;
      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        if (dates.includes(ds)) {
          currentStreak++;
        } else {
          // Allow today to not be logged yet (streak at risk)
          if (i === 0) continue;
          break;
        }
      }

      // Longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = [...new Set(dates)].sort();
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          tempStreak = diff === 1 ? tempStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // Streak at risk: it's past noon and not logged today
      const hour = new Date().getHours();
      const streakAtRisk = !todayLogged && hour >= 18 && currentStreak > 0;

      // Check achievements
      const newAchievements = await checkAndAwardAchievements(currentStreak, existingKeys);

      setData({
        currentStreak,
        longestStreak,
        streakAtRisk,
        todayLogged,
        achievements: [...existingKeys, ...newAchievements],
        newAchievements,
      });
    };
    calc();
  }, [user, checkAndAwardAchievements]);

  return data;
}
