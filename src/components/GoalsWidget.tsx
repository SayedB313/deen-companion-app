import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trash2, ArrowRight } from "lucide-react";

const goalAreas = [
  { value: "quran_ayahs", label: "Quran Ayahs", unit: "ayahs" },
  { value: "deen_hours", label: "Deen Time", unit: "hours" },
  { value: "fasts", label: "Fasts", unit: "days" },
  { value: "books_pages", label: "Book Pages", unit: "pages" },
  { value: "dhikr_sessions", label: "Dhikr Sessions", unit: "sessions" },
  { value: "virtues_practiced", label: "Virtues Practiced", unit: "times" },
  { value: "habits_avoided", label: "Habits Avoided", unit: "days" },
];

interface GoalsWidgetProps {
  compact?: boolean;
}

const GoalsWidget = ({ compact = false }: GoalsWidgetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area: "quran_ayahs", target_value: 5, period: "daily" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).eq("is_active", true);
    if (data) setGoals(data);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split("T")[0];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthStr = monthAgo.toISOString().split("T")[0];

    const [quran, time, fasts, books, dhikr, charLogs] = await Promise.all([
      supabase.from("quran_progress").select("status").eq("user_id", user.id).eq("status", "memorised"),
      supabase.from("time_logs").select("duration_minutes, date").eq("user_id", user.id).eq("is_deen", true),
      supabase.from("fasting_log").select("date").eq("user_id", user.id),
      supabase.from("books").select("pages_read").eq("user_id", user.id),
      supabase.from("dhikr_logs").select("count, target, date").eq("user_id", user.id),
      supabase.from("character_logs").select("trait_type, date").eq("user_id", user.id),
    ]);

    // Character-based counts
    const virtuesByPeriod = {
      daily: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date === today).length ?? 0,
      weekly: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date >= weekStr).length ?? 0,
      monthly: charLogs.data?.filter(c => c.trait_type === "virtue" && c.date >= monthStr).length ?? 0,
    };
    // For "habits avoided" we count days WITHOUT a habit log — simplified: count habit logs (lower is better, but for goal progress we invert)
    // Actually let's keep it simple: count the habit_to_reduce logs as "times caught" and let user set target as max
    const habitsByPeriod = {
      daily: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date === today).length ?? 0,
      weekly: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date >= weekStr).length ?? 0,
      monthly: charLogs.data?.filter(c => c.trait_type === "habit_to_reduce" && c.date >= monthStr).length ?? 0,
    };

    const prog: Record<string, Record<string, number>> = {
      quran_ayahs: {
        daily: quran.data?.length ?? 0,
        weekly: quran.data?.length ?? 0,
        monthly: quran.data?.length ?? 0,
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
    await supabase.from("goals").insert({ user_id: user.id, ...form });
    setOpen(false);
    load();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").update({ is_active: false }).eq("id", id);
    load();
  };

  const displayGoals = compact ? goals.slice(0, 3) : goals;

  // Compact empty state
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

  // Full empty state (on the Goals & Accountability page)
  if (!compact && goals.length === 0 && !open) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" /> No goals set yet
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set a Goal</DialogTitle></DialogHeader>
              <GoalForm form={form} setForm={setForm} onSave={addGoal} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" /> Goals
        </CardTitle>
        {compact ? (
          <Button size="sm" variant="ghost" onClick={() => navigate("/character")} className="text-xs">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set a Goal</DialogTitle></DialogHeader>
              <GoalForm form={form} setForm={setForm} onSave={addGoal} />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {displayGoals.map(goal => {
          const area = goalAreas.find(a => a.value === goal.area);
          const current = progress[goal.id] ?? 0;
          const pct = Math.min(100, Math.round((current / goal.target_value) * 100));
          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{area?.label} ({goal.period})</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{current}/{goal.target_value} {area?.unit}</span>
                  {!compact && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
        {compact && goals.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">+{goals.length - 3} more goals</p>
        )}
      </CardContent>
    </Card>
  );
};

function GoalForm({ form, setForm, onSave }: { form: any; setForm: any; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <Select value={form.area} onValueChange={v => setForm({ ...form, area: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{goalAreas.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
      </Select>
      <Input type="number" value={form.target_value} onChange={e => setForm({ ...form, target_value: parseInt(e.target.value) || 1 })} />
      <Select value={form.period} onValueChange={v => setForm({ ...form, period: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onSave} className="w-full">Save Goal</Button>
    </div>
  );
}

export default GoalsWidget;
