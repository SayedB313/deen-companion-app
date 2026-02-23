import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PartnerRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: string;
  created_at: string;
  sender_name?: string;
}

export function usePartnerRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incoming, setIncoming] = useState<PartnerRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [inRes, outRes] = await Promise.all([
      supabase
        .from("partner_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("partner_requests")
        .select("*")
        .eq("sender_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    const inData = (inRes.data || []) as PartnerRequest[];
    const outData = (outRes.data || []) as PartnerRequest[];

    // Enrich incoming with sender display names
    const senderIds = inData.map(r => r.sender_id);
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("partner_profiles")
        .select("user_id, display_name")
        .in("user_id", senderIds);
      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));
      inData.forEach(r => { r.sender_name = nameMap.get(r.sender_id) || "Someone"; });
    }

    setIncoming(inData);
    setOutgoing(outData);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const sendRequest = useCallback(async (receiverId: string, message?: string) => {
    if (!user) return false;

    // Check if already sent
    const { data: existing } = await supabase
      .from("partner_requests")
      .select("id")
      .eq("sender_id", user.id)
      .eq("receiver_id", receiverId)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      toast({ title: "Already sent", description: "You already have a pending request to this user." });
      return false;
    }

    const { error } = await supabase
      .from("partner_requests")
      .insert({ sender_id: user.id, receiver_id: receiverId, message: message || null });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Request sent!", description: "They'll see it on their Community page." });
    await loadRequests();
    return true;
  }, [user, toast, loadRequests]);

  const acceptRequest = useCallback(async (requestId: string, senderId: string) => {
    if (!user) return false;

    // Update request status
    const { error: updateErr } = await supabase
      .from("partner_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (updateErr) {
      toast({ title: "Error", description: updateErr.message, variant: "destructive" });
      return false;
    }

    // Create the partnership
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const { error: partnerErr } = await supabase
      .from("accountability_partners")
      .insert({
        user_id: senderId,
        partner_id: user.id,
        invite_code: code,
        status: "active",
      });

    if (partnerErr) {
      toast({ title: "Error creating partnership", description: partnerErr.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Partner accepted!", description: "You're now accountability partners." });
    await loadRequests();
    return true;
  }, [user, toast, loadRequests]);

  const declineRequest = useCallback(async (requestId: string) => {
    const { error } = await supabase
      .from("partner_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Request declined" });
    await loadRequests();
    return true;
  }, [toast, loadRequests]);

  return { incoming, outgoing, loading, sendRequest, acceptRequest, declineRequest, reload: loadRequests };
}
