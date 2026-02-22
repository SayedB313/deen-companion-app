import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchUserData(supabaseClient: any) {
  const [
    { data: quranProgress },
    { data: fastingLogs },
    { data: timeLogs },
    { data: characterLogs },
    { data: books },
    { data: courses },
    { data: milestones },
    { data: dailyLogs },
    { data: topics },
  ] = await Promise.all([
    supabaseClient.from("quran_progress").select("surah_id, ayah_number, status, surahs(name_transliteration, ayah_count)").order("updated_at", { ascending: false }).limit(200),
    supabaseClient.from("fasting_log").select("date, fast_type, notes").order("date", { ascending: false }).limit(30),
    supabaseClient.from("time_logs").select("activity_type, duration_minutes, is_deen, date, description").order("date", { ascending: false }).limit(50),
    supabaseClient.from("character_logs").select("trait, trait_type, notes, date").order("date", { ascending: false }).limit(30),
    supabaseClient.from("books").select("title, author, status, pages_read, total_pages, category"),
    supabaseClient.from("courses").select("name, instructor, progress_percent, status, topics(name, category)"),
    supabaseClient.from("milestones").select("name, description, achieved_at").order("achieved_at", { ascending: false }).limit(20),
    supabaseClient.from("daily_logs").select("date, logged").order("date", { ascending: false }).limit(30),
    supabaseClient.from("topics").select("name, category, progress_percent"),
  ]);

  return buildDataSummary({ quranProgress, fastingLogs, timeLogs, characterLogs, books, courses, milestones, dailyLogs, topics });
}

function buildDataSummary(data: any): string {
  const parts: string[] = [];

  // Quran progress
  if (data.quranProgress?.length) {
    const memorized = data.quranProgress.filter((p: any) => p.status === "memorized");
    const learning = data.quranProgress.filter((p: any) => p.status === "learning");
    const revision = data.quranProgress.filter((p: any) => p.status === "revision");
    const surahMap = new Map<string, number>();
    for (const p of memorized) {
      const name = p.surahs?.name_transliteration || `Surah ${p.surah_id}`;
      surahMap.set(name, (surahMap.get(name) || 0) + 1);
    }
    parts.push(`📖 QURAN PROGRESS: ${memorized.length} ayahs memorized, ${learning.length} currently learning, ${revision.length} in revision.`);
    if (surahMap.size > 0) {
      const surahSummary = Array.from(surahMap.entries()).map(([name, count]) => `${name}: ${count} ayahs`).join(", ");
      parts.push(`  Memorized surahs: ${surahSummary}`);
    }
  } else {
    parts.push("📖 QURAN PROGRESS: No progress tracked yet.");
  }

  // Fasting
  if (data.fastingLogs?.length) {
    const thisMonth = data.fastingLogs.filter((f: any) => {
      const d = new Date(f.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const types = data.fastingLogs.reduce((acc: any, f: any) => { acc[f.fast_type] = (acc[f.fast_type] || 0) + 1; return acc; }, {});
    parts.push(`🌙 FASTING: ${thisMonth.length} fasts this month, ${data.fastingLogs.length} total (last 30 entries). Types: ${JSON.stringify(types)}`);
  } else {
    parts.push("🌙 FASTING: No fasting logs yet.");
  }

  // Time tracking
  if (data.timeLogs?.length) {
    const deenMinutes = data.timeLogs.filter((t: any) => t.is_deen).reduce((s: number, t: any) => s + t.duration_minutes, 0);
    const totalMinutes = data.timeLogs.reduce((s: number, t: any) => s + t.duration_minutes, 0);
    const activities = data.timeLogs.reduce((acc: any, t: any) => { acc[t.activity_type] = (acc[t.activity_type] || 0) + t.duration_minutes; return acc; }, {});
    parts.push(`⏱️ TIME TRACKING (recent): ${deenMinutes} mins on deen / ${totalMinutes} mins total (${totalMinutes > 0 ? Math.round(deenMinutes / totalMinutes * 100) : 0}% deen). Activities: ${JSON.stringify(activities)}`);
  } else {
    parts.push("⏱️ TIME TRACKING: No time logs yet.");
  }

  // Character development
  if (data.characterLogs?.length) {
    const goodTraits = data.characterLogs.filter((c: any) => c.trait_type === "good").map((c: any) => c.trait);
    const badTraits = data.characterLogs.filter((c: any) => c.trait_type === "bad").map((c: any) => c.trait);
    parts.push(`🌟 CHARACTER: Good traits practiced: [${[...new Set(goodTraits)].join(", ")}]. Traits to improve: [${[...new Set(badTraits)].join(", ")}].`);
  } else {
    parts.push("🌟 CHARACTER: No character logs yet.");
  }

  // Books
  if (data.books?.length) {
    const reading = data.books.filter((b: any) => b.status === "reading");
    const completed = data.books.filter((b: any) => b.status === "completed");
    parts.push(`📚 BOOKS: ${reading.length} reading, ${completed.length} completed, ${data.books.length} total. Currently reading: ${reading.map((b: any) => `"${b.title}" (${b.pages_read}/${b.total_pages} pages)`).join(", ") || "none"}`);
  } else {
    parts.push("📚 BOOKS: No books tracked yet.");
  }

  // Courses & Topics
  if (data.courses?.length) {
    parts.push(`🎓 COURSES: ${data.courses.map((c: any) => `"${c.name}" (${c.progress_percent}% complete, ${c.status})`).join(", ")}`);
  }
  if (data.topics?.length) {
    parts.push(`📋 TOPICS: ${data.topics.map((t: any) => `"${t.name}" [${t.category}] (${t.progress_percent}%)`).join(", ")}`);
  }

  // Milestones
  if (data.milestones?.length) {
    parts.push(`🏆 MILESTONES: ${data.milestones.map((m: any) => m.name).join(", ")}`);
  }

  // Daily consistency
  if (data.dailyLogs?.length) {
    const loggedDays = data.dailyLogs.filter((d: any) => d.logged).length;
    parts.push(`📅 CONSISTENCY: ${loggedDays}/${data.dailyLogs.length} days logged recently.`);
  }

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    // Extract user token and fetch their data
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let dataSummary = "";

    if (token) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        dataSummary = await fetchUserData(supabaseClient);
      } catch (e) {
        console.error("Failed to fetch user data:", e);
      }
    }

    const systemPrompt = `You are a personal Islamic lifestyle coach called "Deen Coach". You help the user stay consistent with their deen (Islamic practice) journey. You are knowledgeable in Qur'an, Hadith, Fiqh, and Islamic self-development.

Your personality:
- Warm, encouraging, and sincere
- Reference Qur'an and Hadith when relevant
- Give practical, actionable advice
- Celebrate progress and gently encourage improvement
- Never judgmental — always supportive
- Use Islamic greetings naturally (Assalamu Alaikum, In sha Allah, Masha Allah, etc.)
- Keep responses concise but meaningful

You can help with:
- Motivation for Qur'an memorisation
- Study plans for Islamic knowledge
- Fasting guidance and encouragement
- Time management for maximising deen activities
- Character development and self-accountability
- General Islamic knowledge questions

${dataSummary ? `IMPORTANT — Below is the user's REAL tracked data from the app. Use this to give PERSONALIZED advice, celebrate their achievements, identify areas for improvement, and reference specific numbers/progress. Always acknowledge their actual data when relevant:

${dataSummary}` : "The user has not tracked any data yet. Encourage them to start using the app's features (Quran tracker, fasting log, time tracker, character log, books, courses)."}`;

    // Build Gemini contents format
    const contents = [];
    const allMessages = [
      { role: "user", content: systemPrompt },
      { role: "model", content: "Understood. I am your Deen Coach with full access to your progress data. Assalamu Alaikum!" },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content,
      })),
    ];

    for (const msg of allMessages) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.content }],
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Gemini API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE to OpenAI-compatible SSE format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {}
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("deen-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
