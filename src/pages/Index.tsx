import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, UtensilsCrossed, Clock, Flame, Trophy, TrendingUp, AlertTriangle, Award } from "lucide-react";
import TodayHub from "@/components/TodayHub";
import PrayerTimes from "@/components/PrayerTimes";
import DashboardCharts from "@/components/DashboardCharts";
import WeeklyInsights from "@/components/WeeklyInsights";
import GoalsWidget from "@/components/GoalsWidget";
import StreakBadges from "@/components/StreakBadges";
import InspirationCard from "@/components/InspirationCard";
import WeeklyReportCard from "@/components/WeeklyReportCard";
import { useStreaks } from "@/hooks/useStreaks";
import { useDailyInspiration } from "@/hooks/useDailyInspiration";

const Dashboard = () => {
  const { user } = useAuth();
  const streakData = useStreaks();
  const { inspiration, loading: inspirationLoading } = useDailyInspiration();
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState({
    totalAyahs: 0,
    memorisedAyahs: 0,
    booksRead: 0,
    totalBooks: 0,
    daysFasted: 0,
    deenMinutesToday: 0,
  });

  // Fetch display name
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [quranRes, booksRes, fastingRes, timeRes] = await Promise.all([
        supabase.from("quran_progress").select("status").eq("user_id", user.id),
        supabase.from("books").select("status").eq("user_id", user.id),
        supabase.from("fasting_log").select("id").eq("user_id", user.id),
        supabase.from("time_logs").select("duration_minutes").eq("user_id", user.id).eq("date", new Date().toISOString().split("T")[0]).eq("is_deen", true),
      ]);

      const memorised = quranRes.data?.filter((a) => a.status === "memorised").length ?? 0;
      const booksComplete = booksRes.data?.filter((b) => b.status === "completed").length ?? 0;
      const deenMins = timeRes.data?.reduce((s, t) => s + t.duration_minutes, 0) ?? 0;

      setStats({
        totalAyahs: 6236,
        memorisedAyahs: memorised,
        booksRead: booksComplete,
        totalBooks: booksRes.data?.length ?? 0,
        daysFasted: fastingRes.data?.length ?? 0,
        deenMinutesToday: deenMins,
      });
    };
    fetchStats();
  }, [user]);

  const deenGoalMinutes = 420;
  const deenPercent = Math.min(100, Math.round((stats.deenMinutesToday / deenGoalMinutes) * 100));
  const quranPercent = Math.round((stats.memorisedAyahs / stats.totalAyahs) * 100);

  const greeting = displayName
    ? `Assalamu Alaikum, ${displayName}`
    : "Assalamu Alaikum";

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Personalized Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-muted-foreground">Your deen journey at a glance</p>
      </div>

      {/* Daily Inspiration */}
      <InspirationCard text={inspiration.text} source={inspiration.source} loading={inspirationLoading} />

      {/* Unified Today Hub */}
      <TodayHub />

      {/* Prayer Times + Salah Tracker */}
      <PrayerTimes />

      {/* Streak & Deen Time */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={streakData.streakAtRisk ? "border-warning/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Streak</CardTitle>
            {streakData.streakAtRisk ? (
              <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
            ) : (
              <Flame className="h-4 w-4 text-warning" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{streakData.currentStreak}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">days</p>
              <p className="text-xs text-muted-foreground">Best: {streakData.longestStreak}</p>
            </div>
            {streakData.streakAtRisk && (
              <p className="text-xs text-warning mt-1 font-medium">⚠️ Log today to keep your streak!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deen Time Today</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.floor(stats.deenMinutesToday / 60)}h {stats.deenMinutesToday % 60}m</div>
            <Progress value={deenPercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{deenPercent}% of 7h goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qur'an Memorised</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quranPercent}%</div>
            <Progress value={quranPercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.memorisedAyahs} / {stats.totalAyahs} ayahs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Books Read</CardTitle>
            <Trophy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.booksRead}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalBooks} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {streakData.achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-warning" /> Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakBadges achievements={streakData.achievements} />
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      <GoalsWidget compact />

      {/* Weekly Insights */}
      <WeeklyInsights />

      {/* AI Weekly Report */}
      <WeeklyReportCard />

      {/* Charts */}
      <DashboardCharts />

      {/* Fasting summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days Fasted</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.daysFasted}</div>
            <p className="text-xs text-muted-foreground">total logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Keep logging daily to build your streak and unlock milestones. Consistency is the key to growth.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
