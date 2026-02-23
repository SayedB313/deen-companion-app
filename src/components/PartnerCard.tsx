import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Copy, UserPlus, Loader2 } from "lucide-react";
import { useAccountabilityPartner } from "@/hooks/useAccountabilityPartner";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { key: "prayers_logged", label: "Prayers", max: 35 },
  { key: "quran_ayahs_reviewed", label: "Qur'an Ayahs", max: 50 },
  { key: "dhikr_completed", label: "Dhikr", max: 21 },
  { key: "fasting_days", label: "Fasting", max: 7 },
  { key: "deen_minutes", label: "Deen Mins", max: 2940 },
] as const;

export default function PartnerCard() {
  const {
    isActive, isPending, loading, inviteCode,
    partnerName, mySnapshot, partnerSnapshot,
    createInvite, acceptInvite,
  } = useAccountabilityPartner();
  const { toast } = useToast();
  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  if (loading) return null;

  // Active partnership — show comparison
  if (isActive) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Accountability Partner
            <Badge variant="outline" className="ml-auto text-xs">{partnerName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map(({ key, label, max }) => {
            const mine = mySnapshot[key];
            const theirs = partnerSnapshot[key];
            const myPct = Math.min(100, (mine / max) * 100);
            const theirPct = Math.min(100, (theirs / max) * 100);
            const ahead = mine > theirs;
            const tied = mine === theirs;

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={ahead ? "text-primary font-medium" : tied ? "text-muted-foreground" : "text-warning font-medium"}>
                    {mine} vs {theirs}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Progress value={myPct} className="h-1.5 flex-1" />
                  <Progress value={theirPct} className="h-1.5 flex-1 [&>div]:bg-muted-foreground/40" />
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Your progress (left) vs {partnerName}'s (right)
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pending invite — show code
  if (isPending && inviteCode) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Accountability Partner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Share this code with your partner:</p>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-3 py-1.5 rounded text-lg font-mono tracking-widest flex-1 text-center">
              {inviteCode}
            </code>
            <Button size="icon" variant="outline" onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              toast({ title: "Copied!" });
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Waiting for partner to join…</p>
        </CardContent>
      </Card>
    );
  }

  // No partnership — create or join
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Accountability Partner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Link with a friend to motivate each other with weekly progress comparisons.
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={createInvite}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Create Invite
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowJoin(!showJoin)}>
            Enter Code
          </Button>
        </div>
        {showJoin && (
          <div className="flex gap-2">
            <Input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono tracking-widest uppercase"
            />
            <Button
              size="sm"
              disabled={codeInput.length < 6 || joining}
              onClick={async () => {
                setJoining(true);
                await acceptInvite(codeInput);
                setJoining(false);
                setCodeInput("");
              }}
            >
              {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
