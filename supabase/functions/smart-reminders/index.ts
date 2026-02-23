import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all users with push enabled
    const { data: subs } = await client
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(subs.map((s: any) => s.user_id))];
    let sentCount = 0;

    for (const userId of userIds) {
      try {
        const notifications: { title: string; body: string }[] = [];

        // Check if user has logged salah today
        const { data: salahToday } = await client
          .from("salah_logs")
          .select("prayer")
          .eq("user_id", userId)
          .eq("date", today)
          .eq("is_sunnah", false)
          .eq("prayed", true);

        if (!salahToday?.length || salahToday.length < 3) {
          notifications.push({
            title: "🕌 Salah Reminder",
            body: `You've logged ${salahToday?.length || 0}/5 prayers today. Don't miss your salah!`,
          });
        }

        // Check dhikr streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const { data: dhikrYesterday } = await client
          .from("dhikr_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("date", yesterday)
          .limit(1);

        const { data: dhikrToday } = await client
          .from("dhikr_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("date", today)
          .limit(1);

        if (dhikrYesterday?.length && !dhikrToday?.length) {
          notifications.push({
            title: "📿 Dhikr Streak at Risk!",
            body: "You did dhikr yesterday but not today. Keep your streak alive!",
          });
        }

        // Check Ayyam al-Bid (13th, 14th, 15th of Hijri month)
        try {
          const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric" });
          const hijriDay = parseInt(formatter.format(new Date()));
          if ([13, 14, 15].includes(hijriDay)) {
            const { data: fastToday } = await client
              .from("fasting_log")
              .select("id")
              .eq("user_id", userId)
              .eq("date", today)
              .limit(1);
            if (!fastToday?.length) {
              notifications.push({
                title: "🌙 Ayyam al-Bid",
                body: `Today is the ${hijriDay}th of the Hijri month — a Sunnah fasting day!`,
              });
            }
          }
        } catch {}

        // Check Quran revision due
        const { data: revDue } = await client
          .from("revision_schedule")
          .select("surah_id, surahs(name_transliteration)")
          .eq("user_id", userId)
          .lte("next_review", today)
          .limit(3);

        if (revDue?.length) {
          const names = revDue.map((r: any) => r.surahs?.name_transliteration || `Surah ${r.surah_id}`).join(", ");
          notifications.push({
            title: "📖 Qur'an Revision Due",
            body: `Time to review: ${names}`,
          });
        }

        // Send first notification only (avoid spam)
        if (notifications.length > 0) {
          const notif = notifications[0];
          // Use the send-push function internally
          const userSubs = subs.filter((s: any) => s.user_id === userId);
          for (const sub of userSubs) {
            try {
              // Simple notification via fetch to send-push
              await fetch(`${supabaseUrl}/functions/v1/send-push`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  title: notif.title,
                  body: notif.body,
                  userId: userId,
                }),
              });
              sentCount++;
            } catch (e) {
              console.error("Push send failed:", e);
            }
          }
        }
      } catch (e) {
        console.error(`Reminder check failed for ${userId}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-reminders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
