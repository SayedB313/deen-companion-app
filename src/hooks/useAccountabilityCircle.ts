import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek } from "date-fns";

interface Circle {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  max_members: number;
}

interface CircleMember {
  user_id: string;
  role: string;
  display_name: string;
  deen_score: number;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useAccountabilityCircle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCircles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get circle IDs user belongs to
    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const ids = memberships.map(m => m.circle_id);
    const { data } = await supabase
      .from("accountability_circles")
      .select("*")
      .in("id", ids);

    setCircles((data || []) as Circle[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadCircles(); }, [loadCircles]);

  const createCircle = useCallback(async (name: string) => {
    if (!user) return null;
    const code = generateCode();

    const { data, error } = await supabase
      .from("accountability_circles")
      .insert({ name, created_by: user.id, invite_code: code })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Add self as admin
    await supabase.from("circle_members").insert({
      circle_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    toast({ title: "Circle created!", description: `Share code: ${code}` });
    await loadCircles();
    return data as Circle;
  }, [user, toast, loadCircles]);

  const joinCircle = useCallback(async (code: string) => {
    if (!user) return false;
    const trimmed = code.trim().toUpperCase();

    const { data: circle, error } = await supabase
      .from("accountability_circles")
      .select("*")
      .eq("invite_code", trimmed)
      .single();

    if (error || !circle) {
      toast({ title: "Invalid code", description: "Circle not found.", variant: "destructive" });
      return false;
    }

    // Check member count
    const { count } = await supabase
      .from("circle_members")
      .select("id", { count: "exact", head: true })
      .eq("circle_id", circle.id);

    if ((count || 0) >= circle.max_members) {
      toast({ title: "Circle full", description: `Max ${circle.max_members} members.`, variant: "destructive" });
      return false;
    }

    const { error: joinErr } = await supabase
      .from("circle_members")
      .insert({ circle_id: circle.id, user_id: user.id });

    if (joinErr) {
      if (joinErr.code === "23505") {
        toast({ title: "Already a member" });
      } else {
        toast({ title: "Error", description: joinErr.message, variant: "destructive" });
      }
      return false;
    }

    toast({ title: "Joined circle!", description: circle.name });
    await loadCircles();
    return true;
  }, [user, toast, loadCircles]);

  const leaveCircle = useCallback(async (circleId: string) => {
    if (!user) return;
    await supabase
      .from("circle_members")
      .delete()
      .eq("circle_id", circleId)
      .eq("user_id", user.id);

    toast({ title: "Left circle" });
    await loadCircles();
  }, [user, toast, loadCircles]);

  const getLeaderboard = useCallback(async (circleId: string): Promise<CircleMember[]> => {
    if (!user) return [];

    const { data: members } = await supabase
      .from("circle_members")
      .select("user_id, role")
      .eq("circle_id", circleId);

    if (!members || members.length === 0) return [];

    const userIds = members.map(m => m.user_id);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];

    const [profilesRes, snapshotsRes] = await Promise.all([
      supabase.from("partner_profiles").select("user_id, display_name").in("user_id", userIds),
      supabase.from("weekly_snapshots").select("*").in("user_id", userIds).eq("week_start", weekStart),
    ]);

    const profiles = new Map((profilesRes.data || []).map(p => [p.user_id, p.display_name]));
    const snapshots = new Map((snapshotsRes.data || []).map(s => [s.user_id, s]));

    return members.map(m => {
      const snap = snapshots.get(m.user_id);
      const score = snap
        ? (snap.prayers_logged * 2) + snap.quran_ayahs_reviewed + (snap.dhikr_completed * 3) + (snap.fasting_days * 5) + Math.floor(snap.deen_minutes / 10)
        : 0;
      return {
        user_id: m.user_id,
        role: m.role,
        display_name: profiles.get(m.user_id) || "Member",
        deen_score: score,
      };
    }).sort((a, b) => b.deen_score - a.deen_score);
  }, [user]);

  return { circles, loading, createCircle, joinCircle, leaveCircle, getLeaderboard, reload: loadCircles };
}
