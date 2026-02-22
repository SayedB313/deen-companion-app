import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, ShieldAlert, TrendingUp } from "lucide-react";

const commonVirtues = ["Sabr (Patience)", "Shukr (Gratitude)", "Ihsan (Excellence)", "Tawakkul (Trust in Allah)", "Honesty", "Generosity", "Humility"];
const commonHabits = ["Backbiting", "Anger", "Laziness", "Arrogance", "Envy", "Wasting time", "Lying"];

const Character = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ trait: "", trait_type: "virtue" as "virtue" | "habit_to_reduce", notes: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("character_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100);
    if (data) setLogs(data);
  };

  useEffect(() => { load(); }, [user]);

  const addLog = async () => {
    if (!user || !form.trait) return;
    await supabase.from("character_logs").insert({
      user_id: user.id,
      trait: form.trait,
      trait_type: form.trait_type,
      notes: form.notes || null,
    });

    // Auto-log daily
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: new Date().toISOString().split("T")[0], logged: true },
      { onConflict: "user_id,date" }
    );

    setForm({ trait: "", trait_type: "virtue", notes: "" });
    setShowAdd(false);
    load();
  };

  const virtues = logs.filter((l) => l.trait_type === "virtue");
  const habits = logs.filter((l) => l.trait_type === "habit_to_reduce");

  // Weekly count per trait
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weeklyVirtues = virtues.filter((v) => new Date(v.date) >= thisWeek);
  const traitCounts: Record<string, number> = {};
  weeklyVirtues.forEach((v) => {
    traitCounts[v.trait] = (traitCounts[v.trait] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Self-Accountability</h1>
        <p className="text-muted-foreground">Track virtues to grow and habits to reduce</p>
      </div>

      <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Log Entry</Button>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Tabs value={form.trait_type} onValueChange={(v) => setForm({ ...form, trait_type: v as any })}>
              <TabsList>
                <TabsTrigger value="virtue"><Heart className="h-4 w-4 mr-1" /> Virtue</TabsTrigger>
                <TabsTrigger value="habit_to_reduce"><ShieldAlert className="h-4 w-4 mr-1" /> Habit to Reduce</TabsTrigger>
              </TabsList>
            </Tabs>

            <Input placeholder="Trait name" value={form.trait} onChange={(e) => setForm({ ...form, trait: e.target.value })} />
            <div className="flex flex-wrap gap-1">
              {(form.trait_type === "virtue" ? commonVirtues : commonHabits).map((t) => (
                <Button key={t} size="sm" variant="outline" className="text-xs h-7" onClick={() => setForm({ ...form, trait: t })}>
                  {t}
                </Button>
              ))}
            </div>
            <Textarea placeholder="Notes (optional, private)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2">
              <Button size="sm" onClick={addLog}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(traitCounts).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> This Week's Virtues</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(traitCounts).sort((a, b) => b[1] - a[1]).map(([trait, count]) => (
              <Badge key={trait} variant="secondary">{trait}: {count}x</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="virtues">
        <TabsList>
          <TabsTrigger value="virtues">Virtues ({virtues.length})</TabsTrigger>
          <TabsTrigger value="habits">Habits ({habits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="virtues" className="space-y-2">
          {virtues.slice(0, 20).map((v) => (
            <Card key={v.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{v.trait}</span>
                  <span className="text-xs text-muted-foreground">{v.date}</span>
                </div>
                {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="habits" className="space-y-2">
          {habits.slice(0, 20).map((h) => (
            <Card key={h.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{h.trait}</span>
                  <span className="text-xs text-muted-foreground">{h.date}</span>
                </div>
                {h.notes && <p className="text-xs text-muted-foreground mt-1">{h.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Character;
