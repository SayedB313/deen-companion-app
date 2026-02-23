import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Check, BookOpen, Moon, Clock, Sparkles, Plus,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const FARD_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const SUNNAH_PRAYERS = [
  { key: "fajr_sunnah", label: "Fajr Sunnah", count: 2 },
  { key: "dhuhr_before", label: "Dhuhr Before", count: 4 },
  { key: "dhuhr_after", label: "Dhuhr After", count: 2 },
  { key: "maghrib_after", label: "Maghrib After", count: 2 },
  { key: "isha_after", label: "Isha After", count: 2 },
];

const DEFAULT_DHIKRS = ["SubhanAllah", "Alhamdulillah", "Allahu Akbar"];

const today = new Date().toISOString().split("T")[0];

interface TodayData {
  salahFard: Record<string, boolean>;
  salahSunnah: Record<string, boolean>;
  dhikrDone: number;
  dhikrTotal: number;
  quranLogged: boolean;
  fastingToday: boolean;
  deenMinutes: number;
}

const TodayHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TodayData>({
    salahFard: {},
    salahSunnah: {},
    dhikrDone: 0,
    dhikrTotal: 0,
    quranLogged: false,
    fastingToday: false,
    deenMinutes: 0,
  });
  const [showSunnah, setShowSunnah] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [salahRes, dhikrRes, quranRes, fastRes, timeRes] = await Promise.all([
      supabase.from("salah_logs").select("prayer, prayed, is_sunnah").eq("user_id", user.id).eq("date", today),
      supabase.from("dhikr_logs").select("dhikr_type, count, target").eq("user_id", user.id).eq("date", today),
      supabase.from("quran_progress").select("id").eq("user_id", user.id).gte("updated_at", today + "T00:00:00").limit(1),
      supabase.from("fasting_log").select("id").eq("user_id", user.id).eq("date", today).limit(1),
      supabase.from("time_logs").select("duration_minutes").eq("user_id", user.id).eq("date", today).eq("is_deen", true),
    ]);

    const fardMap: Record<string, boolean> = {};
    const sunnahMap: Record<string, boolean> = {};
    salahRes.data?.forEach((s) => {
      if (s.is_sunnah) sunnahMap[s.prayer] = s.prayed;
      else fardMap[s.prayer] = s.prayed;
    });

    const dhikrTotal = dhikrRes.data?.length || DEFAULT_DHIKRS.length;
    const dhikrDone = dhikrRes.data?.filter((d) => d.count >= d.target).length ?? 0;

    setData({
      salahFard: fardMap,
      salahSunnah: sunnahMap,
      dhikrDone,
      dhikrTotal: Math.max(dhikrTotal, DEFAULT_DHIKRS.length),
      quranLogged: (quranRes.data?.length ?? 0) > 0,
      fastingToday: (fastRes.data?.length ?? 0) > 0,
      deenMinutes: timeRes.data?.reduce((s, t) => s + t.duration_minutes, 0) ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggleFard = async (prayer: string) => {
    if (!user) return;
    const newVal = !data.salahFard[prayer];
    setData((prev) => ({ ...prev, salahFard: { ...prev.salahFard, [prayer]: newVal } }));
    await supabase.from("salah_logs").upsert(
      { user_id: user.id, date: today, prayer, prayed: newVal, is_sunnah: false },
      { onConflict: "user_id,date,prayer,is_sunnah" }
    );
  };

  const toggleSunnah = async (prayer: string) => {
    if (!user) return;
    const newVal = !data.salahSunnah[prayer];
    setData((prev) => ({ ...prev, salahSunnah: { ...prev.salahSunnah, [prayer]: newVal } }));
    await supabase.from("salah_logs").upsert(
      { user_id: user.id, date: today, prayer, prayed: newVal, is_sunnah: true },
      { onConflict: "user_id,date,prayer,is_sunnah" }
    );
  };

  const toggleFasting = async () => {
    if (!user) return;
    if (data.fastingToday) {
      // Remove today's fast
      await supabase.from("fasting_log").delete().eq("user_id", user.id).eq("date", today);
      setData((prev) => ({ ...prev, fastingToday: false }));
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: today, fast_type: "voluntary" });
      setData((prev) => ({ ...prev, fastingToday: true }));
    }
  };

  const fardCount = FARD_PRAYERS.filter((p) => data.salahFard[p]).length;
  const sunnahCount = SUNNAH_PRAYERS.filter((p) => data.salahSunnah[p.key]).length;

  // Overall completion
  const sections = [
    { done: fardCount === 5, label: "Salah" },
    { done: data.dhikrDone >= 3, label: "Dhikr" },
    { done: data.quranLogged, label: "Qur'an" },
    { done: data.deenMinutes > 0, label: "Time" },
  ];
  const completedSections = sections.filter((s) => s.done).length;
  const overallPct = Math.round((completedSections / sections.length) * 100);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Today's Ibadah</CardTitle>
          <Badge variant={overallPct === 100 ? "default" : "secondary"} className="text-xs">
            {completedSections}/{sections.length} complete
          </Badge>
        </div>
        <Progress value={overallPct} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Salah - Fard */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              🕌 Salah
            </span>
            <span className="text-xs text-muted-foreground">{fardCount}/5</span>
          </div>
          <div className="flex gap-2">
            {FARD_PRAYERS.map((p) => {
              const done = data.salahFard[p];
              return (
                <button
                  key={p}
                  onClick={() => toggleFard(p)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium text-center transition-all ${
                    done
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {done && <Check className="h-3 w-3 mx-auto mb-0.5" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Sunnah toggle */}
          <button
            onClick={() => setShowSunnah(!showSunnah)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {showSunnah ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Sunnah Rawatib ({sunnahCount}/{SUNNAH_PRAYERS.length})
          </button>

          {showSunnah && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SUNNAH_PRAYERS.map((sp) => {
                const done = data.salahSunnah[sp.key];
                return (
                  <button
                    key={sp.key}
                    onClick={() => toggleSunnah(sp.key)}
                    className={`rounded-md px-2 py-1.5 text-xs text-center transition-all ${
                      done
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {sp.label} ({sp.count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dhikr */}
        <button
          onClick={() => navigate("/dhikr")}
          className="w-full flex items-center justify-between rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
        >
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-warning" /> Dhikr
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{data.dhikrDone}/{data.dhikrTotal}</span>
            {data.dhikrDone >= 3 && <Check className="h-4 w-4 text-primary" />}
          </div>
        </button>

        {/* Qur'an */}
        <button
          onClick={() => navigate("/quran")}
          className="w-full flex items-center justify-between rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
        >
          <span className="text-sm font-medium flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" /> Qur'an
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{data.quranLogged ? "Studied" : "Not yet"}</span>
            {data.quranLogged && <Check className="h-4 w-4 text-primary" />}
          </div>
        </button>

        {/* Fasting quick toggle */}
        <button
          onClick={toggleFasting}
          className={`w-full flex items-center justify-between rounded-lg p-3 transition-colors text-left ${
            data.fastingToday ? "bg-primary/10 border border-primary/20" : "bg-muted/30 hover:bg-muted/60"
          }`}
        >
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Moon className="h-4 w-4 text-info" /> Fasting
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{data.fastingToday ? "Fasting today" : "Not fasting"}</span>
            {data.fastingToday && <Check className="h-4 w-4 text-primary" />}
          </div>
        </button>

        {/* Deen Time */}
        <button
          onClick={() => navigate("/time")}
          className="w-full flex items-center justify-between rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
        >
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" /> Deen Time
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {data.deenMinutes > 0
                ? `${Math.floor(data.deenMinutes / 60)}h ${data.deenMinutes % 60}m`
                : "None yet"}
            </span>
            {data.deenMinutes > 0 && <Check className="h-4 w-4 text-primary" />}
          </div>
        </button>
      </CardContent>
    </Card>
  );
};

export default TodayHub;
