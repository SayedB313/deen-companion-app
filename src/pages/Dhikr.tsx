import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Check, Pencil, Check as CheckIcon } from "lucide-react";

const defaultDhikrs = [
  { type: "SubhanAllah", target: 33, arabic: "سبحان الله" },
  { type: "Alhamdulillah", target: 33, arabic: "الحمد لله" },
  { type: "Allahu Akbar", target: 34, arabic: "الله أكبر" },
  { type: "La ilaha illAllah", target: 100, arabic: "لا إله إلا الله" },
  { type: "Astaghfirullah", target: 100, arabic: "أستغفر الله" },
  { type: "La hawla wa la quwwata illa billah", target: 33, arabic: "لا حول ولا قوة إلا بالله" },
];

const today = new Date().toISOString().split("T")[0];

const Dhikr = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Record<string, { id?: string; count: number; target: number }>>({});
  const [customTargets, setCustomTargets] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Load saved custom targets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dhikr-targets");
    if (saved) {
      try { setCustomTargets(JSON.parse(saved)); } catch {}
    }
  }, []);

  const getTarget = (type: string, defaultTarget: number) => customTargets[type] ?? defaultTarget;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("dhikr_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today);
    const map: typeof logs = {};
    if (data) {
      for (const d of data) {
        map[d.dhikr_type] = { id: d.id, count: d.count, target: d.target };
      }
    }
    setLogs(map);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const tap = async (type: string, target: number) => {
    if (!user) return;
    const current = logs[type];
    const newCount = (current?.count ?? 0) + 1;

    setLogs(prev => ({ ...prev, [type]: { ...prev[type], count: newCount, target } }));

    if (current?.id) {
      await supabase.from("dhikr_logs").update({ count: newCount, target }).eq("id", current.id);
    } else {
      const { data } = await supabase.from("dhikr_logs").insert({
        user_id: user.id, dhikr_type: type, count: newCount, target, date: today,
      }).select("id").single();
      if (data) {
        setLogs(prev => ({ ...prev, [type]: { id: data.id, count: newCount, target } }));
      }
    }
  };

  const reset = async (type: string, target: number) => {
    if (!user) return;
    const current = logs[type];
    setLogs(prev => ({ ...prev, [type]: { ...prev[type], count: 0, target } }));
    if (current?.id) {
      await supabase.from("dhikr_logs").update({ count: 0 }).eq("id", current.id);
    }
  };

  const startEdit = (type: string, currentTarget: number) => {
    setEditing(type);
    setEditValue(String(currentTarget));
  };

  const saveTarget = async (type: string) => {
    const val = Math.max(1, parseInt(editValue) || 1);
    const updated = { ...customTargets, [type]: val };
    setCustomTargets(updated);
    localStorage.setItem("dhikr-targets", JSON.stringify(updated));

    // Also update DB if there's an existing log for today
    const current = logs[type];
    if (current?.id) {
      await supabase.from("dhikr_logs").update({ target: val }).eq("id", current.id);
      setLogs(prev => ({ ...prev, [type]: { ...prev[type], target: val } }));
    }

    setEditing(null);
  };

  const totalCompleted = defaultDhikrs.filter(d => {
    const target = getTarget(d.type, d.target);
    return (logs[d.type]?.count ?? 0) >= target;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Dhikr</h1>
        <p className="text-muted-foreground">{totalCompleted}/{defaultDhikrs.length} completed today</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {defaultDhikrs.map((dhikr) => {
          const target = getTarget(dhikr.type, dhikr.target);
          const current = logs[dhikr.type];
          const count = current?.count ?? 0;
          const done = count >= target;
          const pct = Math.min(100, Math.round((count / target) * 100));
          const isEditing = editing === dhikr.type;

          return (
            <Card key={dhikr.type} className={done ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{dhikr.type}</CardTitle>
                  {done && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="font-arabic text-2xl text-right leading-relaxed">{dhikr.arabic}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <span className="text-4xl font-bold tabular-nums">{count}</span>
                  <span className="text-muted-foreground text-sm"> / </span>
                  {isEditing ? (
                    <span className="inline-flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveTarget(dhikr.type)}
                        className="w-20 h-7 text-sm inline-block"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveTarget(dhikr.type)}>
                        <CheckIcon className="h-3 w-3" />
                      </Button>
                    </span>
                  ) : (
                    <button
                      onClick={() => startEdit(dhikr.type, target)}
                      className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {target} <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-14 text-lg"
                    variant={done ? "secondary" : "default"}
                    onClick={() => tap(dhikr.type, target)}
                  >
                    Tap
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-14 w-14"
                    onClick={() => reset(dhikr.type, target)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dhikr;
