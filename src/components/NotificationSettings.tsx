import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Bell, Clock, BookOpen, Moon, BarChart3, Flame, Sparkles, HandHeart,
} from "lucide-react";

interface NotifPrefs {
  push_enabled: boolean;
  streak_reminder: boolean;
  streak_reminder_time: string;
  salah_reminders: boolean;
  quran_revision_reminder: boolean;
  fasting_reminders: boolean;
  weekly_report: boolean;
  motivational_quotes: boolean;
}

const defaultPrefs: NotifPrefs = {
  push_enabled: false,
  streak_reminder: true,
  streak_reminder_time: "21:00",
  salah_reminders: false,
  quran_revision_reminder: true,
  fasting_reminders: false,
  weekly_report: true,
  motivational_quotes: false,
};

const timeOptions = [
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "23:00", label: "11:00 PM" },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const { subscribe, unsubscribe, isSubscribed } = useNotifications();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);

  // Load preferences
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          push_enabled: data.push_enabled,
          streak_reminder: data.streak_reminder,
          streak_reminder_time: (data.streak_reminder_time as string)?.slice(0, 5) || "21:00",
          salah_reminders: data.salah_reminders,
          quran_revision_reminder: data.quran_revision_reminder,
          fasting_reminders: data.fasting_reminders,
          weekly_report: data.weekly_report,
          motivational_quotes: data.motivational_quotes,
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const savePrefs = async (updated: Partial<NotifPrefs>) => {
    if (!user) return;
    const newPrefs = { ...prefs, ...updated };
    setPrefs(newPrefs);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...newPrefs,
          streak_reminder_time: newPrefs.streak_reminder_time + ":00",
        },
        { onConflict: "user_id" }
      );

    if (error) {
      toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
    }
  };

  const toggleMasterSwitch = async () => {
    if (prefs.push_enabled) {
      await unsubscribe();
      savePrefs({ push_enabled: false });
      toast({ title: "Notifications disabled" });
    } else {
      const granted = await subscribe();
      if (granted) {
        savePrefs({ push_enabled: true });
        toast({ title: "Notifications enabled", description: "You'll receive reminders to stay on track." });
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  const items: {
    key: keyof NotifPrefs;
    icon: React.ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      key: "streak_reminder",
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      title: "Streak-at-Risk Reminder",
      description: "Get notified if you haven't logged any activity before your chosen time",
    },
    {
      key: "salah_reminders",
      icon: <HandHeart className="h-4 w-4 text-emerald-500" />,
      title: "Salah Reminders",
      description: "Gentle nudges for daily prayers based on local prayer times",
    },
    {
      key: "quran_revision_reminder",
      icon: <BookOpen className="h-4 w-4 text-sky-500" />,
      title: "Qur'an Revision Due",
      description: "Reminded when a surah is due for review in your revision schedule",
    },
    {
      key: "fasting_reminders",
      icon: <Moon className="h-4 w-4 text-violet-500" />,
      title: "Fasting Day Reminders",
      description: "Reminders for recommended fasting days (Mon/Thu, White Days)",
    },
    {
      key: "weekly_report",
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      title: "Weekly Progress Summary",
      description: "A weekly overview of your ibadah and consistency stats",
    },
    {
      key: "motivational_quotes",
      icon: <Sparkles className="h-4 w-4 text-amber-500" />,
      title: "Daily Inspiration",
      description: "A daily Qur'an verse or hadith to start your morning",
    },
  ];

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notifications & Reminders
        </CardTitle>
        <CardDescription>
          Choose what you'd like to be reminded about. Works on iOS 16.4+, Android & desktop.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Master toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div>
            <p className="text-sm font-semibold">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {prefs.push_enabled ? "Enabled — notifications will be delivered to this device" : "Enable to receive notifications on this device"}
            </p>
          </div>
          <Switch checked={prefs.push_enabled || isSubscribed} onCheckedChange={toggleMasterSwitch} />
        </div>

        <Separator />

        {/* Individual notification types */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-3">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  {/* Streak reminder time picker */}
                  {item.key === "streak_reminder" && prefs.streak_reminder && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select
                        value={prefs.streak_reminder_time}
                        onValueChange={(v) => savePrefs({ streak_reminder_time: v })}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <Switch
                checked={prefs[item.key] as boolean}
                disabled={!prefs.push_enabled && !isSubscribed}
                onCheckedChange={(checked) => savePrefs({ [item.key]: checked })}
              />
            </div>
          ))}
        </div>

        {!prefs.push_enabled && !isSubscribed && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Enable push notifications above to customize individual reminders
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
