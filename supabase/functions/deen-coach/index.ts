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
    { data: salahLogs },
    { data: achievements },
    { data: dhikrLogs },
    { data: revisionSchedule },
    { data: goals },
    { data: customDhikr },
    { data: reflections },
    { data: weeklySnapshots },
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
    supabaseClient.from("salah_logs").select("prayer, prayed, date").eq("is_sunnah", false).order("date", { ascending: false }).limit(50),
    supabaseClient.from("achievements").select("achievement_key, achieved_at").order("achieved_at", { ascending: false }),
    supabaseClient.from("dhikr_logs").select("dhikr_type, count, target, date").order("date", { ascending: false }).limit(50),
    supabaseClient.from("revision_schedule").select("surah_id, next_review, interval_days, surahs(name_transliteration)").order("next_review", { ascending: true }).limit(20),
    supabaseClient.from("goals").select("area, target_value, period").eq("is_active", true),
    supabaseClient.from("custom_dhikr").select("name, default_target"),
    supabaseClient.from("reflections").select("content, week_start").order("week_start", { ascending: false }).limit(4),
    supabaseClient.from("weekly_snapshots").select("week_start, prayers_logged, dhikr_completed, fasting_days, deen_minutes, quran_ayahs_reviewed, streak_days").order("week_start", { ascending: false }).limit(4),
  ]);

  return buildDataSummary({ quranProgress, fastingLogs, timeLogs, characterLogs, books, courses, milestones, dailyLogs, topics, salahLogs, achievements, dhikrLogs, revisionSchedule, goals, customDhikr, reflections, weeklySnapshots });
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

  // Salah tracking
  if (data.salahLogs?.length) {
    const today = new Date().toISOString().split("T")[0];
    const todayPrayers = data.salahLogs.filter((s: any) => s.date === today && s.prayed);
    const totalPrayed = data.salahLogs.filter((s: any) => s.prayed).length;
    parts.push(`🕌 SALAH: ${todayPrayers.length}/5 prayers today. ${totalPrayed} total prayers logged.`);
  } else {
    parts.push("🕌 SALAH: No prayer tracking yet.");
  }

  // Achievements
  if (data.achievements?.length) {
    parts.push(`🏅 ACHIEVEMENTS: ${data.achievements.map((a: any) => a.achievement_key).join(", ")}`);
  }

  // Dhikr tracking
  if (data.dhikrLogs?.length) {
    const today = new Date().toISOString().split("T")[0];
    const todayDhikr = data.dhikrLogs.filter((d: any) => d.date === today);
    const completedToday = todayDhikr.filter((d: any) => d.count >= d.target).length;
    const totalTypes = new Set(data.dhikrLogs.map((d: any) => d.dhikr_type)).size;
    parts.push(`📿 DHIKR: ${completedToday} completed today, ${totalTypes} dhikr types tracked. Recent: ${data.dhikrLogs.slice(0, 5).map((d: any) => `${d.dhikr_type}: ${d.count}/${d.target}`).join(", ")}`);
  } else {
    parts.push("📿 DHIKR: No dhikr logs yet.");
  }

  // Revision schedule
  if (data.revisionSchedule?.length) {
    const today = new Date().toISOString().split("T")[0];
    const due = data.revisionSchedule.filter((r: any) => r.next_review <= today);
    parts.push(`🔄 REVISION SCHEDULE: ${data.revisionSchedule.length} surahs tracked. ${due.length} due for review today. Upcoming: ${data.revisionSchedule.slice(0, 5).map((r: any) => `${r.surahs?.name_transliteration || 'Surah ' + r.surah_id} (due ${r.next_review}, interval ${r.interval_days}d)`).join(", ")}`);
  }

  // Goals
  if (data.goals?.length) {
    parts.push(`🎯 ACTIVE GOALS: ${data.goals.map((g: any) => `${g.area}: ${g.target_value} per ${g.period}`).join(", ")}`);
  }

  // Custom dhikr
  if (data.customDhikr?.length) {
    parts.push(`✨ CUSTOM DHIKR: ${data.customDhikr.map((d: any) => `${d.name} (target: ${d.default_target})`).join(", ")}`);
  }

  // Reflections
  if (data.reflections?.length) {
    parts.push(`💭 RECENT REFLECTIONS: ${data.reflections.map((r: any) => `Week of ${r.week_start}: "${r.content.slice(0, 100)}${r.content.length > 100 ? '...' : ''}"`).join(" | ")}`);
  } else {
    parts.push("💭 REFLECTIONS: No weekly reflections written yet.");
  }

  // Weekly snapshots
  if (data.weeklySnapshots?.length) {
    const latest = data.weeklySnapshots[0];
    parts.push(`📊 LATEST WEEKLY SNAPSHOT (${latest.week_start}): ${latest.prayers_logged} prayers, ${latest.dhikr_completed} dhikr, ${latest.fasting_days} fasts, ${latest.deen_minutes} mins deen, ${latest.quran_ayahs_reviewed} ayahs reviewed, ${latest.streak_days}-day streak.`);
    if (data.weeklySnapshots.length > 1) {
      const prev = data.weeklySnapshots[1];
      const prayerDiff = latest.prayers_logged - prev.prayers_logged;
      const deenDiff = latest.deen_minutes - prev.deen_minutes;
      parts.push(`  Trend vs previous week: prayers ${prayerDiff >= 0 ? '+' : ''}${prayerDiff}, deen time ${deenDiff >= 0 ? '+' : ''}${deenDiff} mins.`);
    }
  }

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pageContext } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    // Require authentication
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let dataSummary = "";
    try {
      dataSummary = await fetchUserData(supabaseClient);
    } catch (e) {
      console.error("Failed to fetch user data:", e);
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
- Motivation for Qur'an memorisation and revision schedules
- Study plans for Islamic knowledge (books, courses, topics)
- Fasting guidance and encouragement (voluntary & Ramadan)
- Time management for maximising deen activities
- Character development and self-accountability (virtues & habits)
- Duas & Adhkar guidance — recommending relevant supplications
- Goal setting and tracking advice
- Weekly reflection prompts and feedback
- General Islamic knowledge questions
- Qibla direction and prayer times
- Ramadan planning and spiritual growth

The app has these features the user can use: Dashboard, Qur'an Tracker, Dhikr Counter, Duas & Adhkar collection (50+ authentic duas), Fasting Log, Time Tracker, My Growth (goals + character + reflections), Knowledge Hub (books & courses), Ramadan Planner, Qibla Compass, Prayer Times, Share Progress Cards, Reports, and Community/Accountability Partners.

${pageContext ? `\nThe user is currently viewing their **${pageContext}** page. Prioritise advice and discussion related to this area when relevant, but still answer any question they ask.\n` : ""}
${dataSummary ? `IMPORTANT — Below is the user's REAL tracked data from the app. Use this to give PERSONALIZED advice, celebrate their achievements, identify areas for improvement, and reference specific numbers/progress. Always acknowledge their actual data when relevant:

${dataSummary}` : "The user has not tracked any data yet. Encourage them to start using the app's features (Quran tracker, dhikr counter, duas collection, fasting log, time tracker, character log, books, courses, goals)."}`;

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
