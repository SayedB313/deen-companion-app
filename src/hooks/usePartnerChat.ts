import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export const QUICK_MESSAGES = [
  "MashAllah keep it up! 🔥",
  "Don't forget your dhikr today 📿",
  "Let's both fast tomorrow 🌙",
  "How's your Qur'an going? 📖",
  "Stay consistent, you got this! 💪",
];

export function usePartnerChat(partnershipId: string | null, circleId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!user || (!partnershipId && !circleId)) return;
    setLoading(true);

    let query = supabase
      .from("partner_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);

    if (partnershipId) query = query.eq("partnership_id", partnershipId);
    else if (circleId) query = query.eq("circle_id", circleId);

    const { data } = await query;
    setMessages((data || []) as ChatMessage[]);
    setLoading(false);
  }, [user, partnershipId, circleId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!partnershipId && !circleId) return;

    const channel = supabase
      .channel(`chat-${partnershipId || circleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: partnershipId
            ? `partnership_id=eq.${partnershipId}`
            : `circle_id=eq.${circleId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partnershipId, circleId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || (!partnershipId && !circleId)) return false;
    if (content.length > 280) {
      toast({ title: "Too long", description: "Max 280 characters.", variant: "destructive" });
      return false;
    }

    const row: Record<string, unknown> = {
      sender_id: user.id,
      content: content.trim(),
    };
    if (partnershipId) row.partnership_id = partnershipId;
    if (circleId) row.circle_id = circleId;

    const { error } = await supabase.from("partner_messages").insert(row as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [user, partnershipId, circleId, toast]);

  return { messages, loading, sendMessage, reload: loadMessages };
}
