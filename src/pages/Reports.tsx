import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--destructive))"];

const Reports = () => {
  const { user } = useAuth();
  const [salahData, setSalahData] = useState<any[]>([]);
  const [dhikrData, setDhikrData] = useState<any[]>([]);
  const [deenTimeData, setDeenTimeData] = useState<any[]>([]);
  const [fastingData, setFastingData] = useState<any[]>([]);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (!user) return;
    const days = period === "week" ? 7 : 30;
    const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

    const fetchAll = async () => {
      const [salah, dhikr, time, fasting] = await Promise.all([
        supabase.from("salah_logs").select("prayer, prayed, date").eq("user_id", user.id).gte("date", startDate).eq("is_sunnah", false),
        supabase.from("dhikr_logs").select("dhikr_type, count, target, date").eq("user_id", user.id).gte("date", startDate),
        supabase.from("time_logs").select("duration_minutes, date, is_deen, activity_type").eq("user_id", user.id).gte("date", startDate),
        supabase.from("fasting_log").select("date, fast_type").eq("user_id", user.id).gte("date", startDate),
      ]);

      // Build daily salah chart data
      const dateRange = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
      const salahByDay = dateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayPrayers = salah.data?.filter((s) => s.date === dateStr && s.prayed) ?? [];
        return {
          date: format(d, period === "week" ? "EEE" : "d MMM"),
          prayers: dayPrayers.length,
        };
      });
      setSalahData(salahByDay);

      // Dhikr completion by type
      const dhikrMap: Record<string, { completed: number; total: number }> = {};
      for (const d of dhikr.data ?? []) {
        if (!dhikrMap[d.dhikr_type]) dhikrMap[d.dhikr_type] = { completed: 0, total: 0 };
        dhikrMap[d.dhikr_type].total++;
        if (d.count >= d.target) dhikrMap[d.dhikr_type].completed++;
      }
      setDhikrData(
        Object.entries(dhikrMap).map(([name, v]) => ({
          name: name.length > 15 ? name.slice(0, 15) + "…" : name,
          rate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
        }))
      );

      // Deen time trend
      const timeByDay = dateRange.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const dayMins = time.data?.filter((t) => t.date === dateStr && t.is_deen).reduce((s, t) => s + t.duration_minutes, 0) ?? 0;
        return {
          date: format(d, period === "week" ? "EEE" : "d MMM"),
          hours: Math.round((dayMins / 60) * 10) / 10,
        };
      });
      setDeenTimeData(timeByDay);

      // Fasting by type
      const fastTypeMap: Record<string, number> = {};
      for (const f of fasting.data ?? []) {
        fastTypeMap[f.fast_type] = (fastTypeMap[f.fast_type] || 0) + 1;
      }
      setFastingData(
        Object.entries(fastTypeMap).map(([name, value]) => ({ name, value }))
      );
    };

    fetchAll();
  }, [user, period]);

  const totalPrayers = salahData.reduce((s, d) => s + d.prayers, 0);
  const maxPossible = salahData.length * 5;
  const salahRate = maxPossible > 0 ? Math.round((totalPrayers / maxPossible) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress Reports</h1>
          <p className="text-muted-foreground">Your deen journey visualised</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="week">7 days</TabsTrigger>
            <TabsTrigger value="month">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{salahRate}%</p>
            <p className="text-xs text-muted-foreground">Salah completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{deenTimeData.reduce((s, d) => s + d.hours, 0).toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Total deen time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{fastingData.reduce((s, d) => s + d.value, 0)}</p>
            <p className="text-xs text-muted-foreground">Days fasted</p>
          </CardContent>
        </Card>
      </div>

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
        {/* Dhikr completion rates */}
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

        {/* Fasting breakdown */}
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
