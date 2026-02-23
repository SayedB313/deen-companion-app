import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BarChart3, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

const WeeklyReportCard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastDate, setLastDate] = useState<string | null>(null);

  // Load latest weekly report from chat_history
  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_history")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("role", "assistant")
      .like("content", "%Weekly Report%")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setReport(data[0].content);
          setLastDate(new Date(data[0].created_at).toLocaleDateString());
        }
      });
  }, [user]);

  const generateReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (data.reports?.[0]?.report) {
        const today = new Date().toISOString().split("T")[0];
        setReport(`📊 **Weekly Report — ${today}**\n\n${data.reports[0].report}`);
        setLastDate(new Date().toLocaleDateString());
      }
    } catch (e) {
      console.error("Failed to generate report:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> AI Weekly Report
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastDate && <Badge variant="outline" className="text-xs">{lastDate}</Badge>}
            <Button size="sm" variant="ghost" onClick={generateReport} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {report ? (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Get a personalized AI-powered summary of your week
            </p>
            <Button size="sm" onClick={generateReport} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyReportCard;
