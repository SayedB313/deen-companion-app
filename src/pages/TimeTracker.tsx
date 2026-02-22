import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Trash2 } from "lucide-react";

const activityTypes = [
  { value: "quran", label: "Qur'an", deen: true },
  { value: "study", label: "Study", deen: true },
  { value: "prayer", label: "Prayer", deen: true },
  { value: "dhikr", label: "Dhikr", deen: true },
  { value: "reading", label: "Reading", deen: true },
  { value: "lecture", label: "Lecture", deen: true },
  { value: "other_deen", label: "Other Deen", deen: true },
  { value: "other", label: "Other (non-deen)", deen: false },
];

const TimeTracker = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ activity_type: "quran", duration_minutes: 30, description: "" });
  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("time_logs").select("*").eq("user_id", user.id).eq("date", today).order("created_at", { ascending: false });
    if (data) setLogs(data);
  };

  useEffect(() => { load(); }, [user]);

  const addLog = async () => {
    if (!user) return;
    const isDeen = activityTypes.find((a) => a.value === form.activity_type)?.deen ?? true;
    await supabase.from("time_logs").insert({
      user_id: user.id,
      date: today,
      activity_type: form.activity_type,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
      is_deen: isDeen,
    });

    // Auto-log daily activity
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

  const deenMinutes = logs.filter((l) => l.is_deen).reduce((s, l) => s + l.duration_minutes, 0);
  const totalMinutes = logs.reduce((s, l) => s + l.duration_minutes, 0);
  const goalMinutes = 420;
  const deenPercent = Math.min(100, Math.round((deenMinutes / goalMinutes) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <p className="text-muted-foreground">70% deen goal — 7 hours / day</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today's Deen Time</span>
            <span className="text-sm font-bold text-primary">{Math.floor(deenMinutes / 60)}h {deenMinutes % 60}m / 7h</span>
          </div>
          <Progress value={deenPercent} className="h-4" />
          <p className="text-xs text-muted-foreground mt-1">{deenPercent}% of goal • Total tracked: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
        </CardContent>
      </Card>

      <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Log Time</Button>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{activityTypes.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-24"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <Button size="sm" onClick={addLog}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">{activityTypes.find((a) => a.value === log.activity_type)?.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">{log.duration_minutes}m</span>
                  {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteLog(log.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimeTracker;
