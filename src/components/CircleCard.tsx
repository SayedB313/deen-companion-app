import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccountabilityCircle } from "@/hooks/useAccountabilityCircle";
import { useAuth } from "@/hooks/useAuth";
import { Users, Crown, Copy, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PartnerChat from "./PartnerChat";

interface CircleMember {
  user_id: string;
  role: string;
  display_name: string;
  deen_score: number;
}

export default function CircleCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { circles, leaveCircle, getLeaderboard } = useAccountabilityCircle();
  const [leaderboards, setLeaderboards] = useState<Record<string, CircleMember[]>>({});

  useEffect(() => {
    circles.forEach(async (c) => {
      const lb = await getLeaderboard(c.id);
      setLeaderboards(prev => ({ ...prev, [c.id]: lb }));
    });
  }, [circles, getLeaderboard]);

  if (circles.length === 0) return null;

  return (
    <>
      {circles.map(circle => {
        const lb = leaderboards[circle.id] || [];
        return (
          <Card key={circle.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {circle.name}
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {lb.length} members
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lb.map((m, i) => {
                const isMe = m.user_id === user?.id;
                return (
                  <div
                    key={m.user_id}
                    className={`flex items-center justify-between text-sm px-2 py-1 rounded ${
                      isMe ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-4">
                        {i + 1}.
                      </span>
                      <span className={isMe ? "font-medium" : ""}>
                        {m.display_name}
                        {isMe && " (you)"}
                      </span>
                      {m.role === "admin" && <Crown className="h-3 w-3 text-warning" />}
                    </div>
                    <span className="text-xs font-medium text-primary">{m.deen_score} pts</span>
                  </div>
                );
              })}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(circle.invite_code);
                    toast({ title: "Copied!" });
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> {circle.invite_code}
                </Button>
                <PartnerChat partnershipId={null} circleId={circle.id} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] ml-auto text-destructive"
                  onClick={() => leaveCircle(circle.id)}
                >
                  <LogOut className="h-3 w-3 mr-1" /> Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
