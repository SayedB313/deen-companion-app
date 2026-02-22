import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Check } from "lucide-react";

const presetDhikrs = [
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
      await supabase.from("dhikr_logs").update({ count: newCount }).eq("id", current.id);
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

  const totalCompleted = presetDhikrs.filter(d => (logs[d.type]?.count ?? 0) >= d.target).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Dhikr</h1>
        <p className="text-muted-foreground">{totalCompleted}/{presetDhikrs.length} completed today</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presetDhikrs.map((dhikr) => {
          const current = logs[dhikr.type];
          const count = current?.count ?? 0;
          const done = count >= dhikr.target;
          const pct = Math.min(100, Math.round((count / dhikr.target) * 100));

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
                  <span className="text-muted-foreground text-sm"> / {dhikr.target}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-14 text-lg"
                    variant={done ? "secondary" : "default"}
                    onClick={() => tap(dhikr.type, dhikr.target)}
                  >
                    Tap
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-14 w-14"
                    onClick={() => reset(dhikr.type, dhikr.target)}
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
