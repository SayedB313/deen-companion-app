import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lightbulb, Save } from "lucide-react";
import { format, startOfWeek } from "date-fns";

const prompts = [
  "What am I grateful for this week?",
  "What can I improve next week?",
  "What was my biggest win?",
  "Did I stay consistent with my goals?",
];

const WeeklyReflection = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pastReflections, setPastReflections] = useState<any[]>([]);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const load = async () => {
    if (!user) return;
    // Load current week
    const { data: current } = await supabase
      .from("reflections" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", currentWeekStart)
      .maybeSingle();
    if (current) setContent((current as any).content ?? "");

    // Load past reflections
    const { data: past } = await supabase
      .from("reflections" as any)
      .select("*")
      .eq("user_id", user.id)
      .neq("week_start", currentWeekStart)
      .order("week_start", { ascending: false })
      .limit(20);
    if (past) setPastReflections(past as any[]);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    await supabase.from("reflections" as any).upsert(
      { user_id: user.id, week_start: currentWeekStart, content: content.trim() } as any,
      { onConflict: "user_id,week_start" } as any
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Week of {format(new Date(currentWeekStart), "MMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {prompts.map((p) => (
              <Badge
                key={p}
                variant="outline"
                className="cursor-pointer text-xs hover:bg-accent"
                onClick={() => setContent(prev => prev ? `${prev}\n\n${p}\n` : `${p}\n`)}
              >
                <Lightbulb className="h-3 w-3 mr-1" /> {p}
              </Badge>
            ))}
          </div>
          <Textarea
            placeholder="Write your weekly reflection…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <Button size="sm" onClick={save} disabled={saving || !content.trim()}>
            <Save className="h-4 w-4 mr-1" /> {saved ? "Saved!" : saving ? "Saving…" : "Save Reflection"}
          </Button>
        </CardContent>
      </Card>

      {pastReflections.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Past Reflections</h3>
          {pastReflections.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Week of {format(new Date(r.week_start), "MMM d, yyyy")}
                </p>
                <p className="text-sm whitespace-pre-wrap">{r.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyReflection;
