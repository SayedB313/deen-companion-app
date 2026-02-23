import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountabilityCircle } from "@/hooks/useAccountabilityCircle";
import { Users, Plus, Loader2 } from "lucide-react";

export default function CircleManager() {
  const { circles, createCircle, joinCircle } = useAccountabilityCircle();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await createCircle(name.trim());
    setName("");
    setMode("idle");
    setBusy(false);
  };

  const handleJoin = async () => {
    if (code.length < 6) return;
    setBusy(true);
    await joinCircle(code);
    setCode("");
    setMode("idle");
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Accountability Circles
        </CardTitle>
        <CardDescription>
          Small groups of 3–7 for halaqah-style accountability.
          {circles.length > 0 && ` You're in ${circles.length} circle${circles.length > 1 ? "s" : ""}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mode === "idle" && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => setMode("create")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Circle
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setMode("join")}>
              Enter Code
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Circle name…"
              maxLength={40}
            />
            <Button size="sm" disabled={!name.trim() || busy} onClick={handleCreate}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        )}

        {mode === "join" && (
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono tracking-widest uppercase max-w-[160px]"
            />
            <Button size="sm" disabled={code.length < 6 || busy} onClick={handleJoin}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
