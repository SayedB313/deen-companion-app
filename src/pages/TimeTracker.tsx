import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Clock, Trash2, Settings2 } from "lucide-react";

const activityTypes = [
  { value: "quran", label: "Qur'an", deen: true },
  { value: "study", label: "Study", deen: true },
  { value: "prayer", label: "Prayer", deen: true },
  { value: "dhikr", label: "Dhikr", deen: true },
  { value: "reading", label: "Reading", deen: true },
  { value: "lecture", label: "Lecture", deen: true },
  { value: "arabic", label: "Arabic", deen: true },
  { value: "dawah", label: "Da'wah", deen: true },
  { value: "other_deen", label: "Other Deen", deen: true },
  { value: "work", label: "Work", deen: false },
  { value: "exercise", label: "Exercise", deen: false },
  { value: "other", label: "Other (non-deen)", deen: false },
];

const TAG_COLORS: Record<string, string> = {
  quran: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  study: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  prayer: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  dhikr: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  reading: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  lecture: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  arabic: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30",
  dawah: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/30",
  other_deen: "bg-lime-500/15 text-lime-700 dark:text-lime-400 border-lime-500/30",
  work: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  exercise: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  other: "bg-muted text-muted-foreground border-border",
};

const GOAL_KEY = "deen-tracker-daily-goal-hours";

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

const TimeTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalHours, setGoalHours] = useState(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? parseFloat(saved) : 7;
  });
  const [form, setForm] = useState({ activity_type: "quran", duration_minutes: 30, description: "" });
  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false });
    if (data) setLogs(data);
  };

  useEffect(() => { load(); }, [user]);

  const addLog = async () => {
    if (!user || form.duration_minutes <= 0) return;
    const isDeen = activityTypes.find((a) => a.value === form.activity_type)?.deen ?? true;
    await supabase.from("time_logs").insert({
      user_id: user.id,
      date: today,
      activity_type: form.activity_type,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
      is_deen: isDeen,
    });

    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: today, logged: true },
      { onConflict: "user_id,date" }
    );

    setForm({ activity_type: "quran", duration_minutes: 30, description: "" });
    setShowAdd(false);
    load();
  };

  const deleteLog = async (id: string) => {
    await supabase.from("time_logs").delete().eq("id", id);
    load();
  };

  const saveGoal = (hours: number) => {
    setGoalHours(hours);
    localStorage.setItem(GOAL_KEY, String(hours));
  };

  const deenMinutes = logs.filter((l) => l.is_deen).reduce((s, l) => s + l.duration_minutes, 0);
  const totalMinutes = logs.reduce((s, l) => s + l.duration_minutes, 0);
  const goalMinutes = goalHours * 60;
  const deenPercent = goalMinutes > 0 ? Math.min(100, Math.round((deenMinutes / goalMinutes) * 100)) : 0;

  // Group by activity type for summary
  const byType = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.activity_type] = (acc[l.activity_type] || 0) + l.duration_minutes;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <p className="text-muted-foreground">
          {Math.round(goalHours * 0.7)}h deen goal — {goalHours}h / day
        </p>
      </div>

      {/* Progress card */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Today's Deen Time</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {formatDuration(deenMinutes)} / {formatDuration(goalMinutes)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setShowGoalEdit(!showGoalEdit)}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Progress value={deenPercent} className="h-4" />
          <p className="text-xs text-muted-foreground">
            {deenPercent}% of goal • Total tracked: {formatDuration(totalMinutes)}
          </p>

          {/* Goal adjuster */}
          {showGoalEdit && (
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Daily goal (hours)</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[goalHours]}
                  onValueChange={([v]) => saveGoal(v)}
                  min={1}
                  max={16}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-12 text-right">{goalHours}h</span>
              </div>
            </div>
          )}

          {/* Activity tag summary */}
          {Object.keys(byType).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(byType).map(([type, mins]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={`text-xs ${TAG_COLORS[type] || TAG_COLORS.other}`}
                >
                  {activityTypes.find((a) => a.value === type)?.label || type} • {formatDuration(mins)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add button */}
      <Button size="sm" onClick={() => setShowAdd(true)}>
        <Plus className="h-4 w-4 mr-1" /> Log Time
      </Button>

      {/* Add form */}
      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Activity type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Activity</label>
              <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Deen</div>
                  {activityTypes.filter((a) => a.deen).map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Other</div>
                  {activityTypes.filter((a) => !a.deen).map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration: quick picks + slider + manual */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DURATIONS.map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={form.duration_minutes === d ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => setForm({ ...form, duration_minutes: d })}
                  >
                    {formatDuration(d)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[form.duration_minutes]}
                  onValueChange={([v]) => setForm({ ...form, duration_minutes: v })}
                  min={5}
                  max={480}
                  step={5}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="w-16 h-8 text-sm text-center"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Math.max(1, parseInt(e.target.value) || 0) })}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={addLog}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs list */}
      <div className="space-y-2">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No time logged today. Start tracking!</p>
        )}
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${TAG_COLORS[log.activity_type] || TAG_COLORS.other}`}
                    >
                      {activityTypes.find((a) => a.value === log.activity_type)?.label || log.activity_type}
                    </Badge>
                    <span className="text-sm font-medium">{formatDuration(log.duration_minutes)}</span>
                  </div>
                  {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteLog(log.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimeTracker;
