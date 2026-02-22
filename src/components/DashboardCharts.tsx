import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";

const DashboardCharts = () => {
  const { user } = useAuth();
  const [deenTimeData, setDeenTimeData] = useState<any[]>([]);
  const [fastingData, setFastingData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchChartData = async () => {
      // Last 7 days deen time
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const { data: timeLogs } = await supabase
        .from("time_logs")
        .select("date, duration_minutes, is_deen")
        .eq("user_id", user.id)
        .gte("date", days[0])
        .lte("date", days[6]);

      const deenByDay = days.map(date => {
        const dayLogs = timeLogs?.filter(l => l.date === date) || [];
        const deen = dayLogs.filter(l => l.is_deen).reduce((s, l) => s + l.duration_minutes, 0);
        const other = dayLogs.filter(l => !l.is_deen).reduce((s, l) => s + l.duration_minutes, 0);
        const dayName = new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
        return { day: dayName, deen: Math.round(deen / 60 * 10) / 10, other: Math.round(other / 60 * 10) / 10 };
      });
      setDeenTimeData(deenByDay);

      // Last 6 months fasting
      const { data: fasts } = await supabase
        .from("fasting_log")
        .select("date")
        .eq("user_id", user.id);

      const months: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const label = d.toLocaleDateString("en", { month: "short" });
        const count = fasts?.filter(f => {
          const fd = new Date(f.date);
          return fd.getMonth() === m && fd.getFullYear() === y;
        }).length ?? 0;
        months.push({ month: label, count });
      }
      setFastingData(months);
    };
    fetchChartData();
  }, [user]);

  const deenChartConfig = {
    deen: { label: "Deen (hrs)", color: "hsl(var(--primary))" },
    other: { label: "Other (hrs)", color: "hsl(var(--muted-foreground))" },
  };

  const fastingChartConfig = {
    count: { label: "Days Fasted", color: "hsl(var(--primary))" },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Deen Time</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
          <ChartContainer config={deenChartConfig} className="h-[200px] w-full">
            <BarChart data={deenTimeData} accessibilityLayer>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={25} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="deen" fill="var(--color-deen)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="other" fill="var(--color-other)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Fasting</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
          <ChartContainer config={fastingChartConfig} className="h-[200px] w-full">
            <LineChart data={fastingData} accessibilityLayer>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={25} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
