import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

const tables = [
  { name: "quran_progress", label: "Quran Progress" },
  { name: "fasting_log", label: "Fasting Log" },
  { name: "time_logs", label: "Time Logs" },
  { name: "character_logs", label: "Character Logs" },
  { name: "books", label: "Books" },
  { name: "courses", label: "Courses" },
  { name: "daily_logs", label: "Daily Logs" },
  { name: "dhikr_logs", label: "Dhikr Logs" },
  { name: "goals", label: "Goals" },
] as const;

type TableName = typeof tables[number]["name"];

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requestPermission } = useNotifications();
  const [exporting, setExporting] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  const enableNotifications = async () => {
    const granted = await requestPermission();
    setNotifEnabled(granted);
    toast({ title: granted ? "Notifications enabled" : "Notifications blocked", description: granted ? "You'll get reminders to keep your streak alive." : "Please enable notifications in your browser settings." });
  };

  const exportData = async (format: "json" | "csv") => {
    if (!user) return;
    setExporting(true);
    try {
      const allData: Record<string, any[]> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table.name).select("*").eq("user_id", user.id);
        allData[table.name] = data || [];
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(allData, null, 2);
        filename = `deen-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else {
        // CSV: combine all tables
        const csvParts: string[] = [];
        for (const [tableName, rows] of Object.entries(allData)) {
          if (rows.length === 0) continue;
          csvParts.push(`\n--- ${tableName} ---`);
          const headers = Object.keys(rows[0]);
          csvParts.push(headers.join(","));
          for (const row of rows) {
            csvParts.push(headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
          }
        }
        content = csvParts.join("\n");
        filename = `deen-tracker-export-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: `Downloaded ${filename}` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your data and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Export & Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download all your tracked data. Your data belongs to you.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => exportData("json")} disabled={exporting}>
              <FileJson className="h-4 w-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outline" onClick={() => exportData("csv")} disabled={exporting}>
              <FileText className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications & Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get reminders when your streak is at risk or it's time for Quran.
          </p>
          <Button onClick={enableNotifications} variant={notifEnabled ? "secondary" : "default"}>
            {notifEnabled ? <><BellOff className="h-4 w-4 mr-2" /> Notifications Enabled</> : <><Bell className="h-4 w-4 mr-2" /> Enable Notifications</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
