import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, BookOpen, Star, UtensilsCrossed, Check } from "lucide-react";

// Hijri calendar approximation for Ramadan detection
function getHijriMonth(): { month: number; day: number; year: number } {
  const greg = new Date();
  // Use the Intl API if available
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = formatter.formatToParts(greg);
    const month = parseInt(parts.find((p) => p.type === "month")?.value || "0");
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
    return { month, day, year };
  } catch {
    return { month: 0, day: 0, year: 0 };
  }
}

const Ramadan = () => {
  const { user } = useAuth();
  const hijri = useMemo(() => getHijriMonth(), []);
  const isRamadan = hijri.month === 9;
  const ramadanDay = isRamadan ? hijri.day : 0;

  const [taraweeh, setTaraweeh] = useState<Record<string, boolean>>({});
  const [khatmJuz, setKhatmJuz] = useState<Record<number, boolean>>({});
  const [fastingDays, setFastingDays] = useState(0);
  const [suhoorTime, setSuhoorTime] = useState("");
  const [iftarTime, setIftarTime] = useState("");

  // Fetch prayer times for suhoor/iftar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const today = new Date();
            const res = await fetch(
              `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`
            );
            const json = await res.json();
            setSuhoorTime(json.data.timings.Imsak || json.data.timings.Fajr);
            setIftarTime(json.data.timings.Maghrib);
          } catch {}
        },
        () => {}
      );
    }
  }, []);

  // Load fasting count for this Ramadan
  useEffect(() => {
    if (!user) return;
    supabase
      .from("fasting_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("fast_type", "ramadan")
      .then(({ data }) => setFastingDays(data?.length || 0));
  }, [user]);

  // Load taraweeh logs from salah_logs (prayer = "taraweeh")
  useEffect(() => {
    if (!user) return;
    supabase
      .from("salah_logs")
      .select("date, prayed")
      .eq("user_id", user.id)
      .eq("prayer", "taraweeh")
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        data?.forEach((d) => { map[d.date] = d.prayed; });
        setTaraweeh(map);
      });
  }, [user]);

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleTaraweeh = async () => {
    if (!user) return;
    const newVal = !taraweeh[todayStr];
    setTaraweeh((prev) => ({ ...prev, [todayStr]: newVal }));
    await supabase.from("salah_logs").upsert(
      { user_id: user.id, date: todayStr, prayer: "taraweeh", prayed: newVal, is_sunnah: true },
      { onConflict: "user_id,date,prayer,is_sunnah" }
    );
  };

  const toggleFastToday = async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("fasting_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .eq("fast_type", "ramadan");

    if (existing?.length) {
      await supabase.from("fasting_log").delete().eq("id", existing[0].id);
      setFastingDays((p) => p - 1);
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: todayStr, fast_type: "ramadan" });
      setFastingDays((p) => p + 1);
    }
  };

  const toggleJuz = (juz: number) => {
    setKhatmJuz((prev) => ({ ...prev, [juz]: !prev[juz] }));
  };

  const completedJuz = Object.values(khatmJuz).filter(Boolean).length;
  const taraweehCount = Object.values(taraweeh).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Moon className="h-6 w-6 text-primary" /> Ramadan Mode
        </h1>
        <p className="text-muted-foreground">
          {isRamadan
            ? `Day ${ramadanDay} of Ramadan ${hijri.year} AH`
            : `Ramadan is not currently active (Current Hijri month: ${hijri.month})`}
        </p>
      </div>

      {/* Suhoor & Iftar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <CardContent className="pt-6 text-center">
            <Moon className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
            <p className="text-xs text-muted-foreground mb-1">Suhoor ends at</p>
            <p className="text-3xl font-bold tabular-nums">{suhoorTime || "--:--"}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <CardContent className="pt-6 text-center">
            <Sun className="h-8 w-8 mx-auto mb-2 text-orange-400" />
            <p className="text-xs text-muted-foreground mb-1">Iftar at</p>
            <p className="text-3xl font-bold tabular-nums">{iftarTime || "--:--"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer" onClick={toggleFastToday}>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Fasting today</span>
            <Badge variant={fastingDays > 0 ? "default" : "outline"}>{fastingDays} days</Badge>
          </label>
          <label className="flex items-center gap-3 cursor-pointer" onClick={toggleTaraweeh}>
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Taraweeh tonight</span>
            <Checkbox checked={!!taraweeh[todayStr]} />
          </label>
        </CardContent>
      </Card>

      {/* Fasting Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Fasting Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{fastingDays}/30</span>
            <span className="text-sm text-muted-foreground">{Math.round((fastingDays / 30) * 100)}%</span>
          </div>
          <Progress value={(fastingDays / 30) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Taraweeh Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taraweeh Tracker — {taraweehCount} nights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(taraweehCount / 30) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Quran Khatm Tracker (30 Juz) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Qur'an Khatm — {completedJuz}/30 Juz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(completedJuz / 30) * 100} className="h-3 mb-4" />
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                onClick={() => toggleJuz(juz)}
                className={`h-9 w-full rounded text-xs font-medium transition-colors ${
                  khatmJuz[juz]
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {khatmJuz[juz] ? <Check className="h-3 w-3 mx-auto" /> : juz}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ramadan;
