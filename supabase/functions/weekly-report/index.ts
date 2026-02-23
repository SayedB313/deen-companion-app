import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Support both cron (no auth) and user-initiated (with auth)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    let userIds: string[] = [];

    if (token && token !== supabaseKey) {
      // User-initiated: generate report for this user only
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userIds = [user.id];
    } else {
      // Cron: generate for all users with weekly_report enabled
      const adminClient = createClient(supabaseUrl, supabaseKey);
      const { data: prefs } = await adminClient
        .from("notification_preferences")
        .select("user_id")
        .eq("weekly_report", true);
      userIds = prefs?.map((p: any) => p.user_id) || [];
    }

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const reports: any[] = [];

    for (const userId of userIds.slice(0, 50)) {
      try {
        const report = await generateReport(adminClient, userId, GEMINI_API_KEY);
        reports.push({ userId, report });
      } catch (e) {
        console.error(`Report failed for ${userId}:`, e);
      }
    }

    return new Response(JSON.stringify({ generated: reports.length, reports }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateReport(client: any, userId: string, apiKey: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [salah, dhikr, quran, fasting, time, daily] = await Promise.all([
    client.from("salah_logs").select("prayer, prayed, date, is_sunnah").eq("user_id", userId).gte("date", weekAgoStr).lte("date", todayStr),
    client.from("dhikr_logs").select("dhikr_type, count, target, date").eq("user_id", userId).gte("date", weekAgoStr).lte("date", todayStr),
    client.from("quran_progress").select("status, updated_at").eq("user_id", userId).gte("updated_at", weekAgo.toISOString()),
    client.from("fasting_log").select("date, fast_type").eq("user_id", userId).gte("date", weekAgoStr).lte("date", todayStr),
    client.from("time_logs").select("duration_minutes, is_deen, date").eq("user_id", userId).gte("date", weekAgoStr).lte("date", todayStr),
    client.from("daily_logs").select("date, logged").eq("user_id", userId).gte("date", weekAgoStr).lte("date", todayStr),
  ]);

  const fardPrayed = salah.data?.filter((s: any) => !s.is_sunnah && s.prayed).length || 0;
  const fardTotal = salah.data?.filter((s: any) => !s.is_sunnah).length || 0;
  const sunnahPrayed = salah.data?.filter((s: any) => s.is_sunnah && s.prayed).length || 0;
  const dhikrCompleted = dhikr.data?.filter((d: any) => d.count >= d.target).length || 0;
  const dhikrTotal = dhikr.data?.length || 0;
  const newMemorized = quran.data?.filter((q: any) => q.status === "memorised").length || 0;
  const fastingDays = fasting.data?.length || 0;
  const deenMinutes = time.data?.filter((t: any) => t.is_deen).reduce((s: number, t: any) => s + t.duration_minutes, 0) || 0;
  const loggedDays = daily.data?.filter((d: any) => d.logged).length || 0;

  const dataSummary = `This week's data for the user:
- Salah: ${fardPrayed}/${fardTotal} fard prayers prayed, ${sunnahPrayed} sunnah prayers
- Dhikr: ${dhikrCompleted}/${dhikrTotal} sessions completed
- Quran: ${newMemorized} new ayahs memorised this week
- Fasting: ${fastingDays} days fasted
- Deen time: ${deenMinutes} minutes spent on deen activities
- Consistency: ${loggedDays}/7 days logged`;

  const prompt = `You are Deen Coach. Generate a concise, motivational weekly report (max 300 words, use markdown) for a Muslim user based on their data. Include:
1. A brief greeting with encouragement
2. Key stats with emoji
3. What they did well (celebrate!)
4. One area to improve with a specific actionable tip
5. A relevant Qur'an or Hadith quote
6. A motivational closing

${dataSummary}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini error: ${resp.status} ${t}`);
  }

  const result = await resp.json();
  const reportText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";

  // Store the report in chat_history as a weekly report
  await client.from("chat_history").insert({
    user_id: userId,
    role: "assistant",
    content: `📊 **Weekly Report — ${todayStr}**\n\n${reportText}`,
  });

  return reportText;
}
