import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Download, FileJson, FileText, User, Lock, Mail,
  Trash2, AlertTriangle, Loader2, Save,
} from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import PartnerSettings from "@/components/PartnerSettings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


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

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Deen time goal
  const [deenGoal, setDeenGoal] = useState("7");

  // Export
  const [exporting, setExporting] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete account");
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your account and all data have been permanently removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Load profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      if (data?.display_name) setDisplayName(data.display_name);
    };
    loadProfile();
  }, [user]);

  const updateProfile = async () => {
    if (!user || !displayName.trim()) return;
    setLoadingProfile(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
    toast(error
      ? { title: "Error", description: error.message, variant: "destructive" }
      : { title: "Profile updated", description: "Your display name has been saved." }
    );
    setLoadingProfile(false);
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Confirmation sent", description: "Check your new email inbox to confirm the change." });
      setNewEmail("");
    }
    setEmailLoading(false);
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
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

  const clearChatHistory = async () => {
    if (!user) return;
    await supabase.from("chat_history").delete().eq("user_id", user.id);
    toast({ title: "Chat history cleared", description: "Your AI Coach conversation has been reset." });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and data</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
          <CardDescription>Your display name and account info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
              <Button onClick={updateProfile} disabled={loadingProfile} size="icon">
                {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Change Email
          </CardTitle>
          <CardDescription>A confirmation will be sent to your new email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>New Email Address</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              maxLength={255}
            />
          </div>
          <Button onClick={updateEmail} disabled={emailLoading || !newEmail.trim()}>
            {emailLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Update Email
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>Must be at least 6 characters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button onClick={updatePassword} disabled={passwordLoading || !newPassword || !confirmPassword}>
            {passwordLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Accountability Partner */}
      <PartnerSettings />

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Data Export & Backup
          </CardTitle>
          <CardDescription>Download all your tracked data — your data belongs to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* Clear Chat History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Coach Data</CardTitle>
          <CardDescription>Manage your AI Coach conversation history</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" /> Clear Chat History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your AI Coach conversations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearChatHistory}>Clear History</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Support & Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Help & Feedback
          </CardTitle>
          <CardDescription>Get help or suggest new features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                window.open("mailto:support@deentracker.app?subject=Support%20Request", "_blank");
                toast({ title: "Opening email client…" });
              }}
            >
              <Mail className="h-4 w-4" /> Contact Support
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                window.open("mailto:support@deentracker.app?subject=Feature%20Request&body=Hi%2C%20I%27d%20love%20to%20see%20the%20following%20feature%3A%0A%0A", "_blank");
                toast({ title: "Opening email client…" });
              }}
            >
              <FileText className="h-4 w-4" /> Request a Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out of all devices</p>
              <p className="text-xs text-muted-foreground">This will end all active sessions</p>
            </div>
            <Button variant="outline" size="sm" onClick={async () => {
              await supabase.auth.signOut({ scope: "global" });
              toast({ title: "Signed out everywhere" });
            }}>
              Sign Out All
            </Button>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground mb-3">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, all your tracked data (Quran progress, fasting logs, time logs, books, dhikr, goals, chat history), and cannot be undone.
                    <br /><br />
                    Type <strong>DELETE</strong> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    onClick={deleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Permanently Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
