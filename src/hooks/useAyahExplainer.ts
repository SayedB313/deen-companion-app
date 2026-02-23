import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deen-coach`;

export function useAyahExplainer() {
  const { user } = useAuth();
  const [explanations, setExplanations] = useState<Map<string, string>>(new Map());
  const [loadingAyahs, setLoadingAyahs] = useState<Set<string>>(new Set());
  const abortRef = useRef<Map<string, AbortController>>(new Map());

  const getKey = (surahId: number, ayahNumber: number) => `${surahId}:${ayahNumber}`;

  const explain = useCallback(async (surahId: number, surahName: string, ayahNumber: number, arabicText: string) => {
    if (!user) return;
    const key = getKey(surahId, ayahNumber);

    // Toggle off if already shown
    if (explanations.has(key)) {
      setExplanations(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      return;
    }

    // Abort any existing request for this ayah
    abortRef.current.get(key)?.abort();
    const controller = new AbortController();
    abortRef.current.set(key, controller);

    setLoadingAyahs(prev => new Set(prev).add(key));

    const prompt = `Explain Surah ${surahName}, Ayah ${ayahNumber}: "${arabicText}". Provide:
1. **Brief Tafsir** — what this ayah means in context
2. **Practical Lesson** — how to apply it today
3. **Related Hadith** — one relevant hadith if applicable

Keep it concise (under 200 words).`;

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
          messages: [{ role: "user", content: prompt }],
          pageContext: "Qur'an memorisation — ayah explanation",
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

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
              fullText += content;
              setExplanations(prev => new Map(prev).set(key, fullText));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setExplanations(prev => new Map(prev).set(key, "Failed to load explanation. Please try again."));
      }
    } finally {
      setLoadingAyahs(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      abortRef.current.delete(key);
    }
  }, [user, explanations]);

  const getExplanation = useCallback((surahId: number, ayahNumber: number) => {
    return explanations.get(getKey(surahId, ayahNumber));
  }, [explanations]);

  const isLoading = useCallback((surahId: number, ayahNumber: number) => {
    return loadingAyahs.has(getKey(surahId, ayahNumber));
  }, [loadingAyahs]);

  return { explain, getExplanation, isLoading };
}
