import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, ChevronRight, UtensilsCrossed, Moon, Sun,
  BookOpen, Star, Check,
} from "lucide-react";
import FastingHeatmap from "@/components/FastingHeatmap";

const fastTypes = [
  { value: "ramadan", label: "Ramadan" },
  { value: "monday_thursday", label: "Mon/Thu" },
  { value: "ayyam_al_bid", label: "Ayyam al-Bid" },
  { value: "voluntary", label: "Voluntary" },
  { value: "shawwal", label: "Shawwal" },
  { value: "dhul_hijjah", label: "Dhul Hijjah" },
  { value: "ashura", label: "Ashura" },
  { value: "other", label: "Other" },
];

function getHijriMonth(): { month: number; day: number; year: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric", month: "numeric", year: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    return {
      month: parseInt(parts.find((p) => p.type === "month")?.value || "0"),
      day: parseInt(parts.find((p) => p.type === "day")?.value || "0"),
      year: parseInt(parts.find((p) => p.type === "year")?.value || "0"),
    };
  } catch { return { month: 0, day: 0, year: 0 }; }
}

const Fasting = () => {
  const { user } = useAuth();
  const hijri = useMemo(() => getHijriMonth(), []);
  const isRamadan = hijri.month === 9;
  const ramadanDay = isRamadan ? hijri.day : 0;

  const [fasts, setFasts] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedType, setSelectedType] = useState("voluntary");
  const [hijriDate, setHijriDate] = useState("");

  // Ramadan-specific state
  const [taraweeh, setTaraweeh] = useState<Record<string, boolean>>({});
  const [khatmJuz, setKhatmJuz] = useState<Record<number, boolean>>({});
  const [suhoorTime, setSuhoorTime] = useState("");
  const [iftarTime, setIftarTime] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const ramadanFasts = fasts.filter((f) => f.fast_type === "ramadan").length;
  const taraweehCount = Object.values(taraweeh).filter(Boolean).length;
  const completedJuz = Object.values(khatmJuz).filter(Boolean).length;

  // Fetch hijri date
  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const res = await fetch(
          `https://api.aladhan.com/v1/gpiToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
        );
        const json = await res.json();
        const h = json.data.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
      } catch {}
    })();
  }, []);

  // Fetch suhoor/iftar times
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const today = new Date();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`
        );
        const json = await res.json();
        setSuhoorTime(json.data.timings.Imsak || json.data.timings.Fajr);
        setIftarTime(json.data.timings.Maghrib);
      } catch {}
    }, () => {});
  }, []);

  // Load fasts
  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("fasting_log").select("*").eq("user_id", user.id);
    if (data) setFasts(data);
  };
  useEffect(() => { load(); }, [user]);

  // Load taraweeh
  useEffect(() => {
    if (!user) return;
    supabase.from("salah_logs").select("date, prayed")
      .eq("user_id", user.id).eq("prayer", "taraweeh")
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        data?.forEach((d) => { map[d.date] = d.prayed; });
        setTaraweeh(map);
      });
  }, [user]);

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toggleDay = async (day: number) => {
    if (!user) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = fasts.find((f) => f.date === dateStr);
    if (existing) {
      await supabase.from("fasting_log").delete().eq("id", existing.id);
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: dateStr, fast_type: selectedType });
    }
    load();
  };

  const isDayFasted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return fasts.find((f) => f.date === dateStr);
  };

  const monthFasts = fasts.filter((f) => {
    const d = new Date(f.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

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
    const { data: existing } = await supabase.from("fasting_log")
      .select("id").eq("user_id", user.id).eq("date", todayStr).eq("fast_type", "ramadan");
    if (existing?.length) {
      await supabase.from("fasting_log").delete().eq("id", existing[0].id);
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: todayStr, fast_type: "ramadan" });
    }
    load();
  };

  const toggleJuz = (juz: number) => {
    setKhatmJuz((prev) => ({ ...prev, [juz]: !prev[juz] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" /> Fasting & Ramadan
          </h1>
          <p className="text-muted-foreground">
            {isRamadan
              ? `Day ${ramadanDay} of Ramadan ${hijri.year} AH`
              : `${fasts.length} total days fasted`}
          </p>
        </div>
        {hijriDate && <Badge variant="secondary" className="text-sm">{hijriDate}</Badge>}
      </div>

      <Tabs defaultValue={isRamadan ? "ramadan" : "tracker"}>
        <TabsList className="w-full">
          <TabsTrigger value="tracker" className="flex-1">Fasting Tracker</TabsTrigger>
          <TabsTrigger value="heatmap" className="flex-1">Heatmap</TabsTrigger>
          <TabsTrigger value="ramadan" className="flex-1">
            Ramadan {isRamadan && <Moon className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        {/* ── Fasting Tracker Tab ── */}
        <TabsContent value="tracker" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Fast type:</span>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fastTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base">
                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const fasted = isDayFasted(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        fasted ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {monthFasts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {monthFasts.map((f) => (
                    <Badge key={f.id} variant="secondary" className="text-xs">
                      {new Date(f.date).getDate()} — {fastTypes.find((t) => t.value === f.fast_type)?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fastTypes.slice(0, 4).map((type) => {
              const count = fasts.filter((f) => f.fast_type === type.value).length;
              return (
                <Card key={type.value}>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">{type.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Heatmap Tab ── */}
        <TabsContent value="heatmap" className="mt-4">
          <FastingHeatmap fasts={fasts} />
        </TabsContent>

        {/* ── Ramadan Tab ── */}
        <TabsContent value="ramadan" className="space-y-4 mt-4">
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
                <Badge variant={ramadanFasts > 0 ? "default" : "outline"}>{ramadanFasts} days</Badge>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" onClick={toggleTaraweeh}>
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Taraweeh tonight</span>
                <Checkbox checked={!!taraweeh[todayStr]} />
              </label>
            </CardContent>
          </Card>

          {/* Fasting & Taraweeh Progress */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fasting Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{ramadanFasts}/30</span>
                  <span className="text-sm text-muted-foreground">{Math.round((ramadanFasts / 30) * 100)}%</span>
                </div>
                <Progress value={(ramadanFasts / 30) * 100} className="h-3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taraweeh — {taraweehCount} nights</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(taraweehCount / 30) * 100} className="h-3" />
              </CardContent>
            </Card>
          </div>

          {/* Quran Khatm */}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fasting;
