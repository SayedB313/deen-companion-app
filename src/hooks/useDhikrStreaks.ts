import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame } from "lucide-react";

interface DhikrStreakData {
  currentStreak: number;
  longestStreak: number;
}

export function useDhikrStreaks(): DhikrStreakData {
  const { user } = useAuth();
  const [data, setData] = useState<DhikrStreakData>({ currentStreak: 0, longestStreak: 0 });

  const load = useCallback(async () => {
    if (!user) return;

    // Get distinct dates where user completed at least one dhikr fully
    const { data: logs } = await supabase
      .from("dhikr_logs")
      .select("date, count, target")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!logs || logs.length === 0) return;

    // Find dates where at least one dhikr hit its target
    const completedDatesSet = new Set<string>();
    for (const log of logs) {
      if (log.count >= log.target) {
        completedDatesSet.add(log.date);
      }
    }

    const sortedDates = Array.from(completedDatesSet).sort().reverse();
    if (sortedDates.length === 0) return;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (completedDatesSet.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        // Allow today to be missing (hasn't completed yet)
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let streak = 1;
    const ascending = [...sortedDates].reverse();
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(ascending[i - 1]);
      const curr = new Date(ascending[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    setData({ currentStreak, longestStreak });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return data;
}
