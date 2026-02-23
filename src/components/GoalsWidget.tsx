import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Target, Trash2, ArrowRight, BookOpen, Clock, Apple,
  BookOpenCheck, Hand, Heart, ShieldAlert, ChevronDown, CheckCircle2, Sparkles,
  type LucideIcon,
} from "lucide-react";

/* ───── goal area config ───── */
export type GoalAreaConfig = {
  value: string;
  label: string;
  unit: string;
  icon: LucideIcon;
  verb: string;
  description: string;
  achieveHint: string;
  achieveLink: string;
  suggestedTargets: Record<string, number[]>;
};

export const goalAreas: GoalAreaConfig[] = [
  {
    value: "quran_ayahs", label: "Qur'an Ayahs", unit: "ayahs",
    icon: BookOpen, verb: "Memorise", description: "Ayahs marked as memorised on the Qur'an page",
    achieveHint: "Log progress on the Qur'an page", achieveLink: "/quran",
    suggestedTargets: { daily: [1, 3, 5, 10], weekly: [7, 15, 30], monthly: [30, 60, 100] },
  },
  {
    value: "deen_hours", label: "Deen Time", unit: "hours",
    icon: Clock, verb: "Spend", description: "Hours of deen-related activities logged in Time Tracker",
    achieveHint: "Track deen time in Time Tracker", achieveLink: "/time",
    suggestedTargets: { daily: [1, 2, 3], weekly: [5, 7, 10], monthly: [20, 30, 50] },
  },
  {
    value: "fasts", label: "Fasts", unit: "days",
    icon: Apple, verb: "Fast", description: "Voluntary fasting days logged",
    achieveHint: "Log fasts on the Fasting page", achieveLink: "/fasting",
    suggestedTargets: { daily: [1], weekly: [1, 2, 3], monthly: [4, 6, 10] },
  },
  {
    value: "books_pages", label: "Book Pages", unit: "pages",
    icon: BookOpenCheck, verb: "Read", description: "Pages read across all books in Knowledge",
    achieveHint: "Update reading progress in Knowledge", achieveLink: "/knowledge",
    suggestedTargets: { daily: [5, 10, 20], weekly: [30, 50, 100], monthly: [100, 200, 500] },
  },
  {
    value: "dhikr_sessions", label: "Dhikr Sessions", unit: "sessions",
    icon: Hand, verb: "Complete", description: "Dhikr sessions where you hit your target count",
    achieveHint: "Complete sessions on the Dhikr page", achieveLink: "/dhikr",
    suggestedTargets: { daily: [1, 2, 3], weekly: [5, 7, 14], monthly: [20, 30, 60] },
  },
  {
    value: "virtues_practiced", label: "Virtues Practiced", unit: "times",
    icon: Heart, verb: "Practice", description: "Times you log practising a virtue (patience, gratitude, etc.)",
    achieveHint: "Log virtues in the Character section below", achieveLink: "/character",
    suggestedTargets: { daily: [1, 2, 3], weekly: [5, 7, 14], monthly: [20, 30] },
  },
  {
    value: "habits_avoided", label: "Habits Avoided", unit: "days",
    icon: ShieldAlert, verb: "Track", description: "Days where you catch and log a habit you want to reduce",
    achieveHint: "Log habits in the Character section below", achieveLink: "/character",
    suggestedTargets: { daily: [1], weekly: [3, 5, 7], monthly: [15, 20, 30] },
  },
];

/* ───── helpers ───── */
function goalLabel(area: GoalAreaConfig, target: number, period: string) {
  return `${area.verb} ${target} ${area.unit} ${period}`;
}

function statusColor(pct: number): string {
  if (pct >= 100) return "text-success";
  if (pct >= 60) return "text-warning";
  return "text-muted-foreground";
}

function progressBg(pct: number): string {
  if (pct >= 100) return "[&>div]:bg-success";
  if (pct >= 60) return "[&>div]:bg-warning";
  return "";
}

/* ───── types ───── */
interface GoalsWidgetProps {
  compact?: boolean;
}

/* ───── component ───── */
const GoalsWidget = ({ compact = false }: GoalsWidgetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [form, setForm] = useState({ area: "quran_ayahs", target_value: 5, period: "daily" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).eq("is_active", true);
    if (data) setGoals(data);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split("T")[0];
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const monthStr = monthAgo.toISOString().split("T")[0];

    const [quran, time, fasts, books, dhikr, charLogs] = await Promise.all([
      supabase.from("quran_progress").select("status").eq("user_id", user.id).eq("status", "memorised"),
      supabase.from("time_logs").select("duration_minutes, date").eq("user_id", user.id).eq("is_deen", true),
      supabase.from("fasting_log").select("date").eq("user_id", user.id),
      supabase.from("books").select("pages_read").eq("user_id", user.id),
      supabase.from("dhikr_logs").select("count, target, date").eq("user_id", user.id),
      supabase.from("character_logs").select("trait_type, date").eq("user_id", user.id),
    ]);

    const virtuesByPeriod = {
      daily: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date === today).length ?? 0,
      weekly: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date >= weekStr).length ?? 0,
      monthly: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date >= monthStr).length ?? 0,
    };
    const habitsByPeriod = {
      daily: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date === today).length ?? 0,
      weekly: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date >= weekStr).length ?? 0,
      monthly: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date >= monthStr).length ?? 0,
    };

    const prog: Record<string, Record<string, number>> = {
      quran_ayahs: {
        daily: quran.data?.length ?? 0, weekly: quran.data?.length ?? 0, monthly: quran.data?.length ?? 0,
      },
      deen_hours: {
        daily: Math.round((time.data?.filter(t => t.date === today).reduce((s, t) => s + t.duration_minutes, 0) ?? 0) / 60),
        weekly: Math.round((time.data?.filter(t => t.date >= weekStr).reduce((s, t) => s + t.duration_minutes, 0) ?? 0) / 60),
        monthly: Math.round((time.data?.filter(t => t.date >= monthStr).reduce((s, t) => s + t.duration_minutes, 0) ?? 0) / 60),
      },
      fasts: {
        daily: fasts.data?.filter(f => f.date === today).length ?? 0,
        weekly: fasts.data?.filter(f => f.date >= weekStr).length ?? 0,
        monthly: fasts.data?.filter(f => f.date >= monthStr).length ?? 0,
      },
      books_pages: {
        daily: books.data?.reduce((s, b) => s + b.pages_read, 0) ?? 0,
        weekly: books.data?.reduce((s, b) => s + b.pages_read, 0) ?? 0,
        monthly: books.data?.reduce((s, b) => s + b.pages_read, 0) ?? 0,
      },
      dhikr_sessions: {
        daily: dhikr.data?.filter(d => d.date === today && d.count >= d.target).length ?? 0,
        weekly: dhikr.data?.filter(d => d.date >= weekStr && d.count >= d.target).length ?? 0,
        monthly: dhikr.data?.filter(d => d.date >= monthStr && d.count >= d.target).length ?? 0,
      },
      virtues_practiced: virtuesByPeriod,
      habits_avoided: habitsByPeriod,
    };

    const flatProg: Record<string, number> = {};
    for (const goal of data || []) {
      flatProg[goal.id] = prog[goal.area]?.[goal.period] ?? 0;
    }
    setProgress(flatProg);
  };

  useEffect(() => { load(); }, [user]);

  const addGoal = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").insert({ user_id: user.id, ...form }).select().single();
    setOpen(false);
    if (data) setJustSaved(data.id);
    load();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").update({ is_active: false }).eq("id", id);
    load();
  };

  const displayGoals = compact ? goals.slice(0, 3) : goals;
  const selectedArea = goalAreas.find(a => a.value === form.area)!;

  /* ── compact empty state ── */
  if (compact && goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" /> No goals set yet
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/character")}>
            Set Goals <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ── goal creation dialog ── */
  const goalFormDialog = (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setJustSaved(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant={compact ? "ghost" : "default"} className="gap-1">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Set a New Goal</DialogTitle></DialogHeader>
        {justSaved ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
            <p className="font-medium">Goal saved!</p>
            <Link to={selectedArea.achieveLink} className="text-sm text-primary underline">
              Go log your first entry →
            </Link>
          </div>
        ) : (
          <GoalForm form={form} setForm={setForm} onSave={addGoal} />
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Active Goals
        </h2>
        {compact ? (
          <Button size="sm" variant="ghost" onClick={() => navigate("/character")} className="text-xs">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        ) : goalFormDialog}
      </div>

      {/* goal cards */}
      {displayGoals.length === 0 && !compact && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No goals yet. Set your first goal to start tracking.</p>
            {goalFormDialog}
          </CardContent>
        </Card>
      )}

      {displayGoals.map(goal => {
        const area = goalAreas.find(a => a.value === goal.area);
        if (!area) return null;
        const current = progress[goal.id] ?? 0;
        const pct = Math.min(100, Math.round((current / goal.target_value) * 100));
        const Icon = area.icon;
        const isComplete = pct >= 100;

        return (
          <Card key={goal.id} className={isComplete ? "border-success/30 bg-success/5" : ""}>
            <CardContent className="py-4 space-y-2">
              {/* top row: icon + label + fraction */}
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isComplete ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {goalLabel(area, goal.target_value, goal.period)}
                  </p>
                  <p className={`text-lg font-bold ${statusColor(pct)}`}>
                    {current}<span className="text-xs font-normal text-muted-foreground">/{goal.target_value} {area.unit}</span>
                  </p>
                </div>
                {!compact && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* progress bar */}
              <Progress value={pct} className={`h-2 ${progressBg(pct)}`} />

              {/* achieve hint */}
              {!compact && (
                <Link to={area.achieveLink} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  💡 {area.achieveHint}
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}

      {compact && goals.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">+{goals.length - 3} more goals</p>
      )}
    </div>
  );
};

/* ───── goal creation form ───── */
function GoalForm({ form, setForm, onSave }: { form: any; setForm: any; onSave: () => void }) {
  const area = goalAreas.find(a => a.value === form.area)!;
  const chips = area.suggestedTargets[form.period] || [];

  return (
    <div className="space-y-5">
      {/* area selector as cards */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">What do you want to track?</label>
        <div className="grid grid-cols-2 gap-2">
          {goalAreas.map(a => {
            const Icon = a.icon;
            const active = form.area === a.value;
            return (
              <button
                key={a.value}
                onClick={() => setForm({ ...form, area: a.value, target_value: a.suggestedTargets[form.period]?.[1] || 5 })}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                  active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{area.description}</p>
      </div>

      {/* period */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">How often?</label>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map(p => (
            <button
              key={p}
              onClick={() => setForm({ ...form, period: p, target_value: goalAreas.find(a => a.value === form.area)!.suggestedTargets[p]?.[1] || form.target_value })}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${
                form.period === p ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* target */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Target: how many {area.unit} per {form.period === "daily" ? "day" : form.period === "weekly" ? "week" : "month"}?
        </label>
        <div className="flex gap-2 flex-wrap mb-2">
          {chips.map(n => (
            <button
              key={n}
              onClick={() => setForm({ ...form, target_value: n })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                form.target_value === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={1}
          value={form.target_value}
          onChange={e => setForm({ ...form, target_value: parseInt(e.target.value) || 1 })}
          className="w-24"
        />
      </div>

      <Button onClick={onSave} className="w-full">Save Goal</Button>
    </div>
  );
}

export default GoalsWidget;
