import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AyahRevision {
  id: string;
  surah_id: number;
  ayah_number: number;
  next_review: string;
  interval_days: number;
  ease_factor: number;
}

function sm2(quality: number, intervalDays: number, easeFactor: number) {
  let ef = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);
  let interval: number;
  if (quality < 3) interval = 1;
  else if (intervalDays <= 1) interval = 1;
  else if (intervalDays <= 6) interval = 6;
  else interval = Math.round(intervalDays * ef);
  return { intervalDays: interval, easeFactor: ef };
}

export function useAyahRevision(surahId: number | null) {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<AyahRevision[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user || !surahId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ayah_revision_schedule" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("surah_id", surahId)
      .order("ayah_number");
    if (data) setSchedule(data as any);
    setLoading(false);
  }, [user, surahId]);

  useEffect(() => { load(); }, [load]);

  const reviewAyah = useCallback(async (ayahNumber: number, quality: number) => {
    if (!user || !surahId) return;
    const existing = schedule.find(s => s.ayah_number === ayahNumber);
    const currentInterval = existing?.interval_days ?? 1;
    const currentEF = existing?.ease_factor ?? 2.5;
    const { intervalDays, easeFactor } = sm2(quality, currentInterval, currentEF);

    const today = new Date();
    const nextReview = new Date(today);
    nextReview.setDate(today.getDate() + intervalDays);

    await supabase
      .from("ayah_revision_schedule" as any)
      .upsert({
        user_id: user.id,
        surah_id: surahId,
        ayah_number: ayahNumber,
        last_reviewed: today.toISOString().split("T")[0],
        next_review: nextReview.toISOString().split("T")[0],
        interval_days: intervalDays,
        ease_factor: easeFactor,
      }, { onConflict: "user_id,surah_id,ayah_number" } as any);

    load();
  }, [user, surahId, schedule, load]);

  const getAyahStatus = useCallback((ayahNumber: number): "overdue" | "due" | "safe" | "new" => {
    const item = schedule.find(s => s.ayah_number === ayahNumber);
    if (!item) return "new";
    const today = new Date().toISOString().split("T")[0];
    if (item.next_review < today) return "overdue";
    if (item.next_review === today) return "due";
    return "safe";
  }, [schedule]);

  const getNextDue = useCallback((): number | null => {
    const today = new Date().toISOString().split("T")[0];
    const due = schedule
      .filter(s => s.next_review <= today)
      .sort((a, b) => a.next_review.localeCompare(b.next_review));
    return due.length > 0 ? due[0].ayah_number : null;
  }, [schedule]);

  return { schedule, loading, reviewAyah, getAyahStatus, getNextDue, reload: load };
}
