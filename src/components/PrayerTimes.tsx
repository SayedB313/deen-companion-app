import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, BellOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrayerTime {
  name: string;
  time: string;
}

const TRACKABLE_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_STATES = ["not_prayed", "on_time", "late", "missed"] as const;
type PrayerState = typeof PRAYER_STATES[number];

const stateConfig: Record<PrayerState, { label: string; color: string; emoji: string }> = {
  not_prayed: { label: "Not prayed", color: "bg-muted/50", emoji: "" },
  on_time: { label: "On time", color: "bg-primary/15 border border-primary/30 text-primary", emoji: "✓" },
  late: { label: "Late", color: "bg-warning/15 border border-warning/30 text-warning", emoji: "⏰" },
  missed: { label: "Missed", color: "bg-destructive/15 border border-destructive/30 text-destructive", emoji: "✗" },
};

const CALC_METHODS = [
  { value: "2", label: "ISNA (N. America)" },
  { value: "1", label: "University of Islamic Sciences, Karachi" },
  { value: "3", label: "Muslim World League" },
  { value: "4", label: "Umm Al-Qura, Makkah" },
  { value: "5", label: "Egyptian General Authority" },
  { value: "0", label: "Shia Ithna-Ashari" },
];

const PrayerTimes = () => {
  const { user } = useAuth();
  const { sendNotification, isSubscribed } = useNotifications();
  const { toast } = useToast();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [prayerStates, setPrayerStates] = useState<Record<string, PrayerState>>({});
  const [countdown, setCountdown] = useState("");
  const [nextPrayerName, setNextPrayerName] = useState("");
  const [calcMethod, setCalcMethod] = useState(() => localStorage.getItem("prayer-calc-method") || "2");
  const [prayerNotifs, setPrayerNotifs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("prayer-notifs") || "{}"); } catch { return {}; }
  });
  const notifTimers = useRef<NodeJS.Timeout[]>([]);
  const isFriday = new Date().getDay() === 5;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 51.5074, lng: -0.1278 }),
        { timeout: 5000 }
      );
    } else {
      setLocation({ lat: 51.5074, lng: -0.1278 });
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    const fetchPrayers = async () => {
      try {
        const today = new Date();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${location.lat}&longitude=${location.lng}&method=${calcMethod}`
        );
        const json = await res.json();
        const timings = json.data.timings;
        const prayerList: PrayerTime[] = [
          { name: "Fajr", time: timings.Fajr },
          { name: "Sunrise", time: timings.Sunrise },
          { name: "Dhuhr", time: timings.Dhuhr },
          { name: "Asr", time: timings.Asr },
          { name: "Maghrib", time: timings.Maghrib },
          { name: "Isha", time: timings.Isha },
        ];
        if (isFriday) {
          prayerList[2] = { name: "Jumu'ah", time: timings.Dhuhr };
        }
        setPrayers(prayerList);
        const hijri = json.data.date.hijri;
        setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
      } catch (e) {
        console.error("Failed to fetch prayer times:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, [location, calcMethod, isFriday]);

  // Load today's salah states
  useEffect(() => {
    if (!user) return;
    const loadSalah = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("salah_logs")
        .select("prayer, prayed")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .eq("is_sunnah", false);
      const map: Record<string, PrayerState> = {};
      data?.forEach((d) => {
        map[d.prayer] = d.prayed ? "on_time" : "not_prayed";
      });
      setPrayerStates(map);
    };
    loadSalah();
  }, [user]);

  // Set up prayer notification timers
  useEffect(() => {
    notifTimers.current.forEach(clearTimeout);
    notifTimers.current = [];

    if (!isSubscribed || prayers.length === 0) return;

    const now = new Date();
    const nowMs = now.getTime();

    prayers.forEach(p => {
      if (!prayerNotifs[p.name]) return;
      const [h, m] = p.time.split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(h, m, 0, 0);
      // 10 min before
      const alertTime = prayerTime.getTime() - 10 * 60 * 1000;
      if (alertTime > nowMs) {
        const timer = setTimeout(() => {
          sendNotification(`${p.name} in 10 minutes 🕌`, `Prepare for ${p.name} prayer at ${p.time}`);
        }, alertTime - nowMs);
        notifTimers.current.push(timer);
      }
    });

    return () => notifTimers.current.forEach(clearTimeout);
  }, [prayers, prayerNotifs, isSubscribed, sendNotification]);

  // Countdown timer
  useEffect(() => {
    if (prayers.length === 0) return;
    const tick = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const next = prayers.find((p) => {
        const [h, m] = p.time.split(":").map(Number);
        return h * 60 + m > nowMinutes;
      });
      if (next) {
        const [h, m] = next.time.split(":").map(Number);
        const diff = (h * 60 + m) - nowMinutes;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        setNextPrayerName(next.name);
        setCountdown(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
      } else {
        setNextPrayerName("");
        setCountdown("");
      }
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [prayers]);

  const cyclePrayerState = async (prayerName: string) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const key = prayerName.toLowerCase() === "jumu'ah" ? "dhuhr" : prayerName.toLowerCase();
    const current = prayerStates[key] || "not_prayed";
    const states: PrayerState[] = ["not_prayed", "on_time", "late", "missed"];
    const nextIdx = (states.indexOf(current) + 1) % states.length;
    const nextState = states[nextIdx];

    setPrayerStates(prev => ({ ...prev, [key]: nextState }));

    await supabase.from("salah_logs").upsert(
      {
        user_id: user.id,
        date: todayStr,
        prayer: key,
        prayed: nextState === "on_time" || nextState === "late",
        is_sunnah: false,
      },
      { onConflict: "user_id,date,prayer,is_sunnah" }
    );
  };

  const toggleNotif = (prayerName: string) => {
    const updated = { ...prayerNotifs, [prayerName]: !prayerNotifs[prayerName] };
    setPrayerNotifs(updated);
    localStorage.setItem("prayer-notifs", JSON.stringify(updated));
    toast({
      title: updated[prayerName] ? `🔔 ${prayerName} reminder enabled` : `🔕 ${prayerName} reminder disabled`,
      description: updated[prayerName] ? "You'll be notified 10 min before" : undefined,
    });
  };

  const changeMethod = (val: string) => {
    setCalcMethod(val);
    localStorage.setItem("prayer-calc-method", val);
  };

  // Find next prayer
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextPrayer = prayers.find((p) => {
    const [h, m] = p.time.split(":").map(Number);
    return h * 60 + m > nowMinutes;
  });

  const prayedCount = TRACKABLE_PRAYERS.filter(p => {
    const key = p.toLowerCase();
    return prayerStates[key] === "on_time" || prayerStates[key] === "late";
  }).length;

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prayer Times</CardTitle>
            {nextPrayerName && countdown && (
              <Badge variant="outline" className="text-xs font-normal">
                {nextPrayerName} in {countdown}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs font-normal bg-primary/10 text-primary border-0">
              {prayedCount}/5 prayed
            </Badge>
            {hijriDate && <Badge variant="secondary" className="text-xs font-normal">{hijriDate}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {prayers.map((p) => {
            const isTrackable = TRACKABLE_PRAYERS.includes(p.name) || p.name === "Jumu'ah";
            const key = p.name.toLowerCase() === "jumu'ah" ? "dhuhr" : p.name.toLowerCase();
            const state = prayerStates[key] || "not_prayed";
            const cfg = stateConfig[state];
            const isNext = nextPrayer?.name === p.name;
            const hasNotif = prayerNotifs[p.name];

            return (
              <div
                key={p.name}
                className={`text-center rounded-lg p-2 transition-colors relative ${
                  isNext
                    ? "bg-primary/10 border border-primary/30"
                    : isTrackable
                    ? cfg.color
                    : "bg-muted/50"
                }`}
              >
                <div className="text-xs text-muted-foreground">
                  {p.name}
                  {p.name === "Jumu'ah" && " 🕌"}
                </div>
                <div className={`text-sm font-semibold tabular-nums ${isNext ? "text-primary" : ""}`}>
                  {p.time}
                </div>
                {isTrackable && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => cyclePrayerState(p.name)}
                      className="text-xs font-medium px-1.5 py-0.5 rounded transition-colors hover:bg-accent"
                      title={`Tap to cycle: ${cfg.label}`}
                    >
                      {cfg.emoji || "○"} <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                    {isSubscribed && (
                      <button
                        onClick={() => toggleNotif(p.name)}
                        className="text-muted-foreground hover:text-foreground"
                        title={hasNotif ? "Disable reminder" : "Enable 10min reminder"}
                      >
                        {hasNotif ? <Bell className="h-3 w-3 text-primary" /> : <BellOff className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Calculation method selector */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Method:</span>
          <Select value={calcMethod} onValueChange={changeMethod}>
            <SelectTrigger className="h-7 text-xs flex-1 max-w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALC_METHODS.map(m => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
