import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, BookOpen, Moon, Clock, Sparkles, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

/** SVG circular progress ring */
const ProgressRing = ({ percent, size = 120, strokeWidth = 8 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
};

/** "Next Up" prompt logic */
function getNextUpPrompt(data: TodayData, prayerTimes: { name: string; time: string }[]): string | null {
  // Check if all prayers done
  const prayersDone = FARD_PRAYERS.filter(p => data.salahFard[p]).length;
  if (prayersDone < 5 && prayerTimes.length > 0) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const nextPrayer = prayerTimes.find(p => {
      const [h, m] = p.time.split(":").map(Number);
      return h * 60 + m > nowMin;
    });
    if (nextPrayer) {
      const [h, m] = nextPrayer.time.split(":").map(Number);
      const diff = (h * 60 + m) - nowMin;
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${nextPrayer.name} in ${hrs > 0 ? `${hrs}h ` : ""}${mins}m`;
    }
  }
  if (data.dhikrDone < 3) return "Complete your daily adhkar";
  if (!data.quranLogged) return "Read some Qur'an today";
  if (data.deenMinutes === 0) return "Log some deen time";
  return null;
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
  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string }[]>([]);

  // Fetch prayer times for "Next Up"
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const d = new Date();
            const res = await fetch(
              `https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`
            );
            const json = await res.json();
            const t = json.data.timings;
            setPrayerTimes([
              { name: "Fajr", time: t.Fajr },
              { name: "Dhuhr", time: t.Dhuhr },
              { name: "Asr", time: t.Asr },
              { name: "Maghrib", time: t.Maghrib },
              { name: "Isha", time: t.Isha },
            ]);
          } catch {}
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

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
      await supabase.from("fasting_log").delete().eq("user_id", user.id).eq("date", today);
      setData((prev) => ({ ...prev, fastingToday: false }));
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: today, fast_type: "voluntary" });
      setData((prev) => ({ ...prev, fastingToday: true }));
    }
  };

  const fardCount = FARD_PRAYERS.filter((p) => data.salahFard[p]).length;
  const sunnahCount = SUNNAH_PRAYERS.filter((p) => data.salahSunnah[p.key]).length;

  const sections = [
    { done: fardCount === 5, label: "Salah" },
    { done: data.dhikrDone >= 3, label: "Dhikr" },
    { done: data.quranLogged, label: "Qur'an" },
    { done: data.deenMinutes > 0, label: "Time" },
  ];
  const completedSections = sections.filter((s) => s.done).length;
  const overallPct = Math.round((completedSections / sections.length) * 100);
  const nextUp = useMemo(() => getNextUpPrompt(data, prayerTimes), [data, prayerTimes]);

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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Ring Hero */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center shrink-0">
            <ProgressRing percent={overallPct} size={100} strokeWidth={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={overallPct}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-foreground"
              >
                {overallPct}%
              </motion.span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {sections.map(s => (
                <Badge
                  key={s.label}
                  variant={s.done ? "default" : "outline"}
                  className={`text-xs ${s.done ? "bg-primary/15 text-primary border-primary/30" : ""}`}
                >
                  {s.done && <Check className="h-3 w-3 mr-0.5" />}
                  {s.label}
                </Badge>
              ))}
            </div>
            {/* Next Up Prompt */}
            <AnimatePresence mode="wait">
              {nextUp && (
                <motion.div
                  key={nextUp}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>Next up: <span className="font-medium text-foreground">{nextUp}</span></span>
                </motion.div>
              )}
            </AnimatePresence>
            {overallPct === 100 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-primary font-medium"
              >
                ✨ MashaAllah! All done for today
              </motion.p>
            )}
          </div>
        </div>

        {/* Salah - Fard */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">🕌 Salah</span>
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

        {/* Fasting */}
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
