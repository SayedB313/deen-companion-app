import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PrayerTime {
  name: string;
  time: string;
}

const TRACKABLE_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PrayerTimes = () => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [prayedMap, setPrayedMap] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState("");
  const [nextPrayerName, setNextPrayerName] = useState("");

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
        const dd = today.getDate();
        const mm = today.getMonth() + 1;
        const yyyy = today.getFullYear();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${location.lat}&longitude=${location.lng}&method=2`
        );
        const json = await res.json();
        const timings = json.data.timings;
        setPrayers([
          { name: "Fajr", time: timings.Fajr },
          { name: "Sunrise", time: timings.Sunrise },
          { name: "Dhuhr", time: timings.Dhuhr },
          { name: "Asr", time: timings.Asr },
          { name: "Maghrib", time: timings.Maghrib },
          { name: "Isha", time: timings.Isha },
        ]);
        const hijri = json.data.date.hijri;
        setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
      } catch (e) {
        console.error("Failed to fetch prayer times:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, [location]);

  // Load today's salah logs
  useEffect(() => {
    if (!user) return;
    const loadSalah = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("salah_logs")
        .select("prayer, prayed")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("is_sunnah", false);
      const map: Record<string, boolean> = {};
      data?.forEach((d) => { map[d.prayer] = d.prayed; });
      setPrayedMap(map);
    };
    loadSalah();
  }, [user]);

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

  const togglePrayer = async (prayerName: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const newVal = !prayedMap[prayerName.toLowerCase()];
    setPrayedMap((prev) => ({ ...prev, [prayerName.toLowerCase()]: newVal }));

    await supabase
      .from("salah_logs")
      .upsert(
        {
          user_id: user.id,
          date: today,
          prayer: prayerName.toLowerCase(),
          prayed: newVal,
          is_sunnah: false,
        },
        { onConflict: "user_id,date,prayer,is_sunnah" }
      );
  };

  // Find next prayer
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextPrayer = prayers.find((p) => {
    const [h, m] = p.time.split(":").map(Number);
    return h * 60 + m > nowMinutes;
  });

  const prayedCount = TRACKABLE_PRAYERS.filter((p) => prayedMap[p.toLowerCase()]).length;

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
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {prayers.map((p) => {
            const isTrackable = TRACKABLE_PRAYERS.includes(p.name);
            const isPrayed = prayedMap[p.name.toLowerCase()];
            return (
              <div
                key={p.name}
                className={`text-center rounded-lg p-2 transition-colors ${
                  nextPrayer?.name === p.name
                    ? "bg-primary/10 border border-primary/30"
                    : isPrayed
                    ? "bg-success/10 border border-success/30"
                    : "bg-muted/50"
                }`}
              >
                <div className="text-xs text-muted-foreground">{p.name}</div>
                <div className={`text-sm font-semibold tabular-nums ${nextPrayer?.name === p.name ? "text-primary" : ""}`}>
                  {p.time}
                </div>
                {isTrackable && (
                  <div className="mt-1 flex justify-center">
                    <Checkbox
                      checked={!!isPrayed}
                      onCheckedChange={() => togglePrayer(p.name)}
                      className="h-4 w-4"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
