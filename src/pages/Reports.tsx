import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { BarChart3, TrendingUp, Calendar, Download, Trophy, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--destructive))"];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salahData, setSalahData] = useState<any[]>([]);
  const [prevSalahData, setPrevSalahData] = useState<any[]>([]);
  const [dhikrData, setDhikrData] = useState<any[]>([]);
  const [deenTimeData, setDeenTimeData] = useState<any[]>([]);
  const [prevDeenTimeData, setPrevDeenTimeData] = useState<any[]>([]);
  const [fastingData, setFastingData] = useState<any[]>([]);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const days = period === "week" ? 7 : 30;
    const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    const prevStartDate = format(subDays(new Date(), days * 2 - 1), "yyyy-MM-dd");
    const prevEndDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    const fetchAll = async () => {
      const [salah, prevSalah, dhikr, time, prevTime, fasting] = await Promise.all([
        supabase.from("salah_logs").select("prayer, prayed, date").eq("user_id", user.id).gte("date", startDate).eq("is_sunnah", false),
        supabase.from("salah_logs").select("prayer, prayed, date").eq("user_id", user.id).gte("date", prevStartDate).lte("date", prevEndDate).eq("is_sunnah", false),
        supabase.from("dhikr_logs").select("dhikr_type, count, target, date").eq("user_id", user.id).gte("date", startDate),
        supabase.from("time_logs").select("duration_minutes, date, is_deen, activity_type").eq("user_id", user.id).gte("date", startDate),
        supabase.from("time_logs").select("duration_minutes, date, is_deen").eq("user_id", user.id).gte("date", prevStartDate).lte("date", prevEndDate),
        supabase.from("fasting_log").select("date, fast_type").eq("user_id", user.id).gte("date", startDate),
      ]);

      const dateRange = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
      const prevDateRange = eachDayOfInterval({ start: subDays(new Date(), days * 2 - 1), end: subDays(new Date(), days) });

      // Current period salah
      const salahByDay = dateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayPrayers = salah.data?.filter((s) => s.date === dateStr && s.prayed) ?? [];
        return { date: format(d, period === "week" ? "EEE" : "d MMM"), prayers: dayPrayers.length };
      });
      setSalahData(salahByDay);

      // Previous period salah
      const prevSalahByDay = prevDateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayPrayers = prevSalah.data?.filter((s) => s.date === dateStr && s.prayed) ?? [];
        return { prayers: dayPrayers.length };
      });
      setPrevSalahData(prevSalahByDay);

      // Dhikr
      const dhikrMap: Record<string, { completed: number; total: number }> = {};
      for (const d of dhikr.data ?? []) {
        if (!dhikrMap[d.dhikr_type]) dhikrMap[d.dhikr_type] = { completed: 0, total: 0 };
        dhikrMap[d.dhikr_type].total++;
        if (d.count >= d.target) dhikrMap[d.dhikr_type].completed++;
      }
      setDhikrData(Object.entries(dhikrMap).map(([name, v]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "…" : name,
        rate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
      })));

      // Current deen time
      const timeByDay = dateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayMins = time.data?.filter((t) => t.date === dateStr && t.is_deen).reduce((s, t) => s + t.duration_minutes, 0) ?? 0;
        return { date: format(d, period === "week" ? "EEE" : "d MMM"), hours: Math.round((dayMins / 60) * 10) / 10 };
      });
      setDeenTimeData(timeByDay);

      // Previous deen time
      const prevTimeByDay = prevDateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayMins = prevTime.data?.filter((t) => t.date === dateStr && t.is_deen).reduce((s, t) => s + t.duration_minutes, 0) ?? 0;
        return { hours: Math.round((dayMins / 60) * 10) / 10 };
      });
      setPrevDeenTimeData(prevTimeByDay);

      // Fasting
      const fastTypeMap: Record<string, number> = {};
      for (const f of fasting.data ?? []) {
        fastTypeMap[f.fast_type] = (fastTypeMap[f.fast_type] || 0) + 1;
      }
      setFastingData(Object.entries(fastTypeMap).map(([name, value]) => ({ name, value })));
    };

    fetchAll();
  }, [user, period]);

  const totalPrayers = salahData.reduce((s, d) => s + d.prayers, 0);
  const maxPossible = salahData.length * 5;
  const salahRate = maxPossible > 0 ? Math.round((totalPrayers / maxPossible) * 100) : 0;

  const prevTotalPrayers = prevSalahData.reduce((s, d) => s + d.prayers, 0);
  const prevMaxPossible = prevSalahData.length * 5;
  const prevSalahRate = prevMaxPossible > 0 ? Math.round((prevTotalPrayers / prevMaxPossible) * 100) : 0;

  const totalDeenHours = deenTimeData.reduce((s, d) => s + d.hours, 0);
  const prevDeenHours = prevDeenTimeData.reduce((s, d) => s + d.hours, 0);

  const totalFasting = fastingData.reduce((s, d) => s + d.value, 0);

  const bestPrayerDay = salahData.reduce((best, d) => d.prayers > (best?.prayers ?? 0) ? d : best, salahData[0]);
  const bestDeenDay = deenTimeData.reduce((best, d) => d.hours > (best?.hours ?? 0) ? d : best, deenTimeData[0]);

  const getDelta = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "same" };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "same" };
  };

  const salahDelta = getDelta(salahRate, prevSalahRate);
  const deenDelta = getDelta(totalDeenHours, prevDeenHours);

  const exportReport = useCallback(() => {
    // Create a text summary for export
    const lines = [
      `Deen Tracker — ${period === "week" ? "Weekly" : "Monthly"} Report`,
      `Generated: ${format(new Date(), "PPP")}`,
      "",
      `Salah Rate: ${salahRate}% (${salahDelta.direction === "up" ? "↑" : salahDelta.direction === "down" ? "↓" : "—"} ${salahDelta.value}%)`,
      `Deen Time: ${totalDeenHours.toFixed(1)}h (${deenDelta.direction === "up" ? "↑" : deenDelta.direction === "down" ? "↓" : "—"} ${deenDelta.value}%)`,
      `Days Fasted: ${totalFasting}`,
      "",
      "Daily Salah:",
      ...salahData.map(d => `  ${d.date}: ${d.prayers}/5 prayers`),
      "",
      "Dhikr Completion:",
      ...dhikrData.map(d => `  ${d.name}: ${d.rate}%`),
      "",
      bestPrayerDay ? `Best Prayer Day: ${bestPrayerDay.date} (${bestPrayerDay.prayers}/5)` : "",
      bestDeenDay ? `Best Deen Day: ${bestDeenDay.date} (${bestDeenDay.hours}h)` : "",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deen-report-${format(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported 📄" });
  }, [salahData, dhikrData, deenTimeData, salahRate, totalDeenHours, totalFasting, period, bestPrayerDay, bestDeenDay, salahDelta, deenDelta, toast]);

  const DeltaIcon = ({ direction }: { direction: string }) => {
    if (direction === "up") return <ArrowUpRight className="h-3.5 w-3.5 text-success" />;
    if (direction === "down") return <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Progress Reports</h1>
          <p className="text-muted-foreground">Your deen journey visualised</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">7 days</TabsTrigger>
              <TabsTrigger value="month">30 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary with comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{salahRate}%</p>
            <p className="text-xs text-muted-foreground">Salah completion</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <DeltaIcon direction={salahDelta.direction} />
              <span className={`text-xs font-medium ${salahDelta.direction === "up" ? "text-success" : salahDelta.direction === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                {salahDelta.value}% vs previous
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{totalDeenHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Deen time</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <DeltaIcon direction={deenDelta.direction} />
              <span className={`text-xs font-medium ${deenDelta.direction === "up" ? "text-success" : deenDelta.direction === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                {deenDelta.value}% vs previous
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{totalFasting}</p>
            <p className="text-xs text-muted-foreground">Days fasted</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Bests */}
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" /> Personal Bests This Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {bestPrayerDay && bestPrayerDay.prayers > 0 && (
              <Badge variant="secondary" className="gap-1">
                🕌 Best prayer day: {bestPrayerDay.date} ({bestPrayerDay.prayers}/5)
              </Badge>
            )}
            {bestDeenDay && bestDeenDay.hours > 0 && (
              <Badge variant="secondary" className="gap-1">
                ⏱️ Most deen time: {bestDeenDay.date} ({bestDeenDay.hours}h)
              </Badge>
            )}
            {dhikrData.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                📿 Top dhikr: {dhikrData.reduce((best, d) => d.rate > (best?.rate ?? 0) ? d : best, dhikrData[0])?.name} ({dhikrData.reduce((best, d) => d.rate > (best?.rate ?? 0) ? d : best, dhikrData[0])?.rate}%)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salah chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Daily Salah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salahData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="prayers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deen time trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Deen Time Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={deenTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {dhikrData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dhikr Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dhikrData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {fastingData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fasting Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fastingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {fastingData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
