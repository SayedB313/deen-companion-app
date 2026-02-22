import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deen-coach`;

/** Route-to-context mapping for context-aware AI responses */
export const PAGE_CONTEXT_MAP: Record<string, string> = {
  "/": "Dashboard (overview of all progress)",
  "/quran": "Qur'an memorisation and revision",
  "/dhikr": "Daily dhikr and remembrance",
  "/knowledge": "Islamic knowledge, books, and courses",
  "/fasting": "Fasting tracker",
  "/time": "Time management and productivity",
  "/character": "Self-accountability and character development",
  "/settings": "App settings",
  "/coach": "AI Coach (dedicated page)",
};

export function useCoach(pageContext?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const historyLoaded = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history (only once)
  useEffect(() => {
    if (!user || historyLoaded.current) return;
    historyLoaded.current = true;
    supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.filter((m) => m.role !== "system") as Msg[]);
      });
  }, [user]);

  const send = useCallback(async () => {
    if (!input.trim() || loading || !user) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    await supabase.from("chat_history").insert({ user_id: user.id, role: "user", content: userMsg.content });

    let assistantSoFar = "";
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(-20),
          pageContext,
        }),
      });

      if (resp.status === 429) {
        toast({ title: "Rate limited", description: "Please try again in a moment.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Credits required", description: "Please add credits to continue.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await supabase.from("chat_history").insert({ user_id: user.id, role: "assistant", content: assistantSoFar });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, messages, pageContext, toast]);

  return { messages, input, setInput, loading, send, endRef };
}
