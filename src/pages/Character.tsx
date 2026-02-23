import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Heart, ShieldAlert, TrendingUp, TrendingDown, Minus,
  ChevronDown, Sparkles,
} from "lucide-react";
import GoalsWidget from "@/components/GoalsWidget";
import WeeklyReflection from "@/components/WeeklyReflection";

const commonVirtues = ["Sabr (Patience)", "Shukr (Gratitude)", "Ihsan (Excellence)", "Tawakkul (Trust in Allah)", "Honesty", "Generosity", "Humility"];
const commonHabits = ["Backbiting", "Anger", "Laziness", "Arrogance", "Envy", "Wasting time", "Lying"];

const Character = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("character_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(200);
    if (data) setLogs(data);
  };

  useEffect(() => { load(); }, [user]);

  const quickLog = async (trait: string, traitType: "virtue" | "habit_to_reduce") => {
    if (!user) return;
    await supabase.from("character_logs").insert({ user_id: user.id, trait, trait_type: traitType });
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: new Date().toISOString().split("T")[0], logged: true },
      { onConflict: "user_id,date" }
    );
    load();
  };

  /* ── stats ── */
  const today = new Date().toISOString().split("T")[0];
  const thisWeek = new Date(); thisWeek.setDate(thisWeek.getDate() - 7);
  const thisWeekStr = thisWeek.toISOString().split("T")[0];
  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 14);
  const lastWeekStr = lastWeek.toISOString().split("T")[0];

  const virtuesThisWeek = logs.filter(l => l.trait_type === "virtue" && l.date >= thisWeekStr).length;
  const virtuesLastWeek = logs.filter(l => l.trait_type === "virtue" && l.date >= lastWeekStr && l.date < thisWeekStr).length;
  const habitsThisWeek = logs.filter(l => l.trait_type === "habit_to_reduce" && l.date >= thisWeekStr).length;
  const habitsLastWeek = logs.filter(l => l.trait_type === "habit_to_reduce" && l.date >= lastWeekStr && l.date < thisWeekStr).length;

  const virtuesTrend = virtuesThisWeek - virtuesLastWeek;
  const habitsTrend = habitsThisWeek - habitsLastWeek;

  /* ── weekly overview ── */
  const goalsHit = 0; // computed inside GoalsWidget; for the hero we use a simpler proxy
  const motivationalLine = useMemo(() => {
    const total = virtuesThisWeek + habitsThisWeek;
    if (total >= 10) return "Strong week so far, keep going! 💪";
    if (total >= 5) return "Good momentum — stay consistent!";
    if (total > 0) return "Every small step counts. Keep it up!";
    return "Start logging to build your streak ✨";
  }, [virtuesThisWeek, habitsThisWeek]);

  function TrendIcon({ diff }: { diff: number }) {
    if (diff > 0) return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (diff < 0) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold">My Growth</h1>
        <p className="text-muted-foreground text-sm">{motivationalLine}</p>
      </div>

      {/* ── Section 1: Weekly Overview ── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{virtuesThisWeek}</p>
              <p className="text-xs text-muted-foreground">Virtues logged</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{habitsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Habits tracked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{virtuesThisWeek + habitsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Total entries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Active Goals ── */}
      <GoalsWidget />

      {/* ── Section 3: Character Tracker ── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Character Tracker</h2>

        {/* summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-1">
                <Heart className="h-4 w-4 text-primary" />
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon diff={virtuesTrend} />
                  <span className="text-muted-foreground">{virtuesTrend >= 0 ? "+" : ""}{virtuesTrend} vs last wk</span>
                </div>
              </div>
              <p className="text-xl font-bold">{virtuesThisWeek}</p>
              <p className="text-xs text-muted-foreground">Virtues this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-1">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon diff={habitsTrend} />
                  <span className="text-muted-foreground">{habitsTrend >= 0 ? "+" : ""}{habitsTrend} vs last wk</span>
                </div>
              </div>
              <p className="text-xl font-bold">{habitsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Habits tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* quick-log chips */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick log a virtue:</p>
          <div className="flex flex-wrap gap-1.5">
            {commonVirtues.map(v => (
              <Button
                key={v} size="sm" variant="outline"
                className="text-xs h-7 rounded-full"
                onClick={() => quickLog(v, "virtue")}
              >
                <Heart className="h-3 w-3 mr-1 text-primary" /> {v}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick log a habit to reduce:</p>
          <div className="flex flex-wrap gap-1.5">
            {commonHabits.map(h => (
              <Button
                key={h} size="sm" variant="outline"
                className="text-xs h-7 rounded-full"
                onClick={() => quickLog(h, "habit_to_reduce")}
              >
                <ShieldAlert className="h-3 w-3 mr-1 text-warning" /> {h}
              </Button>
            ))}
          </div>
        </div>

        {/* expandable log history */}
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-xs w-full">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${logOpen ? "rotate-180" : ""}`} />
              {logOpen ? "Hide" : "View"} recent log ({logs.length} entries)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {logs.slice(0, 20).map(l => (
              <Card key={l.id}>
                <CardContent className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {l.trait_type === "virtue"
                      ? <Heart className="h-3.5 w-3.5 text-primary" />
                      : <ShieldAlert className="h-3.5 w-3.5 text-warning" />}
                    <span className="text-sm">{l.trait}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{l.date}</span>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ── Section 4: Weekly Reflection (inline) ── */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold">Weekly Reflection</h2>
        <WeeklyReflection />
      </div>
    </div>
  );
};

export default Character;
