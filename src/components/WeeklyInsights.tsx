import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const WeeklyInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const generate = async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStr = weekAgo.toISOString().split("T")[0];

      const [quran, fasting, time, dhikr] = await Promise.all([
        supabase.from("quran_progress").select("status").eq("user_id", user.id).gte("updated_at", weekStr),
        supabase.from("fasting_log").select("id").eq("user_id", user.id).gte("date", weekStr),
        supabase.from("time_logs").select("duration_minutes, is_deen").eq("user_id", user.id).gte("date", weekStr),
        supabase.from("dhikr_logs").select("count, target").eq("user_id", user.id).gte("date", weekStr),
      ]);

      const tips: string[] = [];
      const memorisedThisWeek = quran.data?.filter(a => a.status === "memorised").length ?? 0;
      if (memorisedThisWeek > 0) tips.push(`📖 You memorised ${memorisedThisWeek} ayah${memorisedThisWeek > 1 ? "s" : ""} this week. Masha Allah!`);
      
      const fastsThisWeek = fasting.data?.length ?? 0;
      if (fastsThisWeek > 0) tips.push(`🌙 ${fastsThisWeek} fast${fastsThisWeek > 1 ? "s" : ""} this week — keep it up!`);
      
      const deenMins = time.data?.filter(t => t.is_deen).reduce((s, t) => s + t.duration_minutes, 0) ?? 0;
      if (deenMins > 0) tips.push(`⏱️ ${Math.round(deenMins / 60)} hours of deen time logged this week.`);

      const dhikrCompleted = dhikr.data?.filter(d => d.count >= d.target).length ?? 0;
      if (dhikrCompleted > 0) tips.push(`📿 ${dhikrCompleted} dhikr sessions completed this week.`);

      if (tips.length === 0) tips.push("Start logging your daily activities to see weekly insights here! 🌟");
      setInsights(tips);
    };
    generate();
  }, [user]);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" /> Weekly Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {insights.map((tip, i) => (
            <li key={i} className="text-sm">{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default WeeklyInsights;
