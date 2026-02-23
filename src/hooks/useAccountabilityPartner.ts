import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek } from "date-fns";

interface Partnership {
  id: string;
  user_id: string;
  partner_id: string | null;
  invite_code: string;
  status: string;
  user_wins: number;
  partner_wins: number;
  ties: number;
}

interface WeeklySnapshot {
  prayers_logged: number;
  quran_ayahs_reviewed: number;
  dhikr_completed: number;
  fasting_days: number;
  streak_days: number;
  deen_minutes: number;
}

const EMPTY_SNAPSHOT: WeeklySnapshot = {
  prayers_logged: 0,
  quran_ayahs_reviewed: 0,
  dhikr_completed: 0,
  fasting_days: 0,
  streak_days: 0,
  deen_minutes: 0,
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getWeekStart(): string {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
}

export function useAccountabilityPartner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [mySnapshot, setMySnapshot] = useState<WeeklySnapshot>(EMPTY_SNAPSHOT);
  const [partnerSnapshot, setPartnerSnapshot] = useState<WeeklySnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);

  // Load active partnership
  const loadPartnership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("accountability_partners")
      .select("*")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .in("status", ["pending", "active"])
      .limit(1)
      .single();

    setPartnership(data as Partnership | null);

    if (data?.status === "active") {
      const partnerId = data.user_id === user.id ? data.partner_id : data.user_id;
      if (partnerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", partnerId)
          .single();
        setPartnerName(profile?.display_name || "Partner");

        // Load partner snapshot
        const { data: snap } = await supabase
          .from("weekly_snapshots")
          .select("*")
          .eq("user_id", partnerId)
          .eq("week_start", getWeekStart())
          .single();
        if (snap) setPartnerSnapshot(snap as unknown as WeeklySnapshot);
      }
    }
    setLoading(false);
  }, [user]);

  // Compute and upsert own snapshot
  const syncMySnapshot = useCallback(async () => {
    if (!user) return;
    const weekStart = getWeekStart();
    const today = new Date().toISOString().split("T")[0];

    const [salahRes, quranRes, dhikrRes, fastRes, logsRes, timeRes] = await Promise.all([
      supabase.from("salah_logs").select("id").eq("user_id", user.id).gte("date", weekStart).lte("date", today).eq("prayed", true),
      supabase.from("ayah_revision_schedule").select("id").eq("user_id", user.id).gte("last_reviewed", weekStart),
      supabase.from("dhikr_logs").select("count, target").eq("user_id", user.id).gte("date", weekStart).lte("date", today),
      supabase.from("fasting_log").select("id").eq("user_id", user.id).gte("date", weekStart).lte("date", today),
      supabase.from("daily_logs").select("id").eq("user_id", user.id).gte("date", weekStart).lte("date", today),
      supabase.from("time_logs").select("duration_minutes").eq("user_id", user.id).gte("date", weekStart).lte("date", today).eq("is_deen", true),
    ]);

    const dhikrCompleted = dhikrRes.data?.filter(d => d.count >= d.target).length ?? 0;
    const deenMins = timeRes.data?.reduce((s, t) => s + t.duration_minutes, 0) ?? 0;

    const snapshot: WeeklySnapshot = {
      prayers_logged: salahRes.data?.length ?? 0,
      quran_ayahs_reviewed: quranRes.data?.length ?? 0,
      dhikr_completed: dhikrCompleted,
      fasting_days: fastRes.data?.length ?? 0,
      streak_days: logsRes.data?.length ?? 0,
      deen_minutes: deenMins,
    };

    setMySnapshot(snapshot);

    // Upsert to DB so partner can read it
    await supabase.from("weekly_snapshots").upsert(
      { user_id: user.id, week_start: weekStart, ...snapshot },
      { onConflict: "user_id,week_start" }
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadPartnership();
    syncMySnapshot();
  }, [user, loadPartnership, syncMySnapshot]);

  const createInvite = useCallback(async () => {
    if (!user) return null;
    const code = generateCode();
    const { data, error } = await supabase
      .from("accountability_partners")
      .insert({ user_id: user.id, invite_code: code, status: "pending" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
    setPartnership(data as Partnership);
    toast({ title: "Invite created!", description: `Share code: ${code}` });
    return code;
  }, [user, toast]);

  const acceptInvite = useCallback(async (code: string) => {
    if (!user) return false;
    const trimmed = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from("accountability_partners")
      .select("*")
      .eq("invite_code", trimmed)
      .eq("status", "pending")
      .single();

    if (error || !data) {
      toast({ title: "Invalid code", description: "Code not found or already used.", variant: "destructive" });
      return false;
    }

    if (data.user_id === user.id) {
      toast({ title: "Error", description: "You can't partner with yourself!", variant: "destructive" });
      return false;
    }

    const { error: updateError } = await supabase
      .from("accountability_partners")
      .update({ partner_id: user.id, status: "active" })
      .eq("id", data.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Partner linked!", description: "You're now accountability partners." });
    await loadPartnership();
    await syncMySnapshot();
    return true;
  }, [user, toast, loadPartnership, syncMySnapshot]);

  const dissolve = useCallback(async () => {
    if (!partnership) return;
    await supabase
      .from("accountability_partners")
      .update({ status: "dissolved" })
      .eq("id", partnership.id);
    setPartnership(null);
    setPartnerName(null);
    setPartnerSnapshot(EMPTY_SNAPSHOT);
    toast({ title: "Partnership dissolved" });
  }, [partnership, toast]);

  const isActive = partnership?.status === "active";
  const isPending = partnership?.status === "pending" && partnership.user_id === user?.id;

  return {
    partnership,
    partnerName,
    mySnapshot,
    partnerSnapshot,
    loading,
    isActive,
    isPending,
    inviteCode: partnership?.invite_code ?? null,
    createInvite,
    acceptInvite,
    dissolve,
  };
}
