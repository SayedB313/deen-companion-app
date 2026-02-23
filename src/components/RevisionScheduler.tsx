import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

interface RevisionItem {
  id: string;
  surah_id: number;
  surah_name: string;
  surah_arabic: string;
  next_review: string;
  interval_days: number;
  ease_factor: number;
}

// Simple SM-2 algorithm
function calculateNextReview(quality: number, intervalDays: number, easeFactor: number) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  if (quality < 3) {
    newInterval = 1; // Reset on poor recall
  } else if (intervalDays <= 1) {
    newInterval = 1;
  } else if (intervalDays <= 6) {
    newInterval = 6;
  } else {
    newInterval = Math.round(intervalDays * newEF);
  }

  return { intervalDays: newInterval, easeFactor: newEF };
}

interface RevisionSchedulerProps {
  surahs: { id: number; name_arabic: string; name_transliteration: string; ayah_count: number }[];
  memorisedSurahIds: number[];
}

const RevisionScheduler = ({ surahs, memorisedSurahIds }: RevisionSchedulerProps) => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("user_id", user.id)
      .order("next_review", { ascending: true });

    if (data) {
      const items: RevisionItem[] = data.map((d: any) => {
        const surah = surahs.find((s) => s.id === d.surah_id);
        return {
          id: d.id,
          surah_id: d.surah_id,
          surah_name: surah?.name_transliteration ?? `Surah ${d.surah_id}`,
          surah_arabic: surah?.name_arabic ?? "",
          next_review: d.next_review,
          interval_days: d.interval_days,
          ease_factor: Number(d.ease_factor),
        };
      });
      setSchedule(items);
    }
    setLoading(false);
  }, [user, surahs]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-add memorised surahs that aren't in the schedule yet
  useEffect(() => {
    if (!user || loading || surahs.length === 0) return;

    const scheduledIds = new Set(schedule.map((s) => s.surah_id));
    const missing = memorisedSurahIds.filter((id) => !scheduledIds.has(id));

    if (missing.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const rows = missing.map((surah_id) => ({
        user_id: user.id,
        surah_id,
        last_reviewed: today,
        next_review: today,
        interval_days: 1,
        ease_factor: 2.5,
      }));

      supabase
        .from("revision_schedule")
        .upsert(rows, { onConflict: "user_id,surah_id" })
        .then(() => load());
    }
  }, [user, loading, memorisedSurahIds, schedule, surahs, load]);

  const reviewSurah = async (item: RevisionItem, quality: number) => {
    if (!user) return;
    const { intervalDays, easeFactor } = calculateNextReview(quality, item.interval_days, item.ease_factor);
    const today = new Date();
    const nextReview = new Date(today);
    nextReview.setDate(today.getDate() + intervalDays);

    await supabase
      .from("revision_schedule")
      .update({
        last_reviewed: today.toISOString().split("T")[0],
        next_review: nextReview.toISOString().split("T")[0],
        interval_days: intervalDays,
        ease_factor: easeFactor,
      })
      .eq("id", item.id);

    load();
  };

  const today = new Date().toISOString().split("T")[0];
  const dueToday = schedule.filter((s) => s.next_review <= today);
  const upcoming = schedule.filter((s) => s.next_review > today).slice(0, 5);

  if (schedule.length === 0 && !loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Revision Schedule
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Spaced repetition for memorised surahs
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {dueToday.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {dueToday.length} due for review today
            </p>
            {dueToday.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.surah_name}</p>
                  <p className="text-xs font-arabic">{item.surah_arabic}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => reviewSurah(item, 2)}
                    title="Hard — review again soon"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Hard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => reviewSurah(item, 4)}
                    title="Good — standard interval"
                  >
                    Good
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => reviewSurah(item, 5)}
                    title="Easy — extend interval"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Easy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {dueToday.length === 0 && (
          <p className="text-sm text-muted-foreground">
            ✅ All caught up! No reviews due today.
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1">
                <span className="truncate">{item.surah_name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {new Date(item.next_review).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevisionScheduler;
