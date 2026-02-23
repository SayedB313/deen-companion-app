import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all active partnerships
    const { data: partnerships } = await supabase
      .from("accountability_partners")
      .select("id, user_id, partner_id")
      .eq("status", "active");

    if (!partnerships || partnerships.length === 0) {
      return new Response(JSON.stringify({ message: "No active partnerships" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let nudgesSent = 0;

    for (const p of partnerships) {
      const userIds = [p.user_id, p.partner_id].filter(Boolean) as string[];

      // Check who has logged today
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("user_id")
        .in("user_id", userIds)
        .eq("date", today);

      const loggedUsers = new Set((logs || []).map(l => l.user_id));

      for (const uid of userIds) {
        const partnerId = uid === p.user_id ? p.partner_id : p.user_id;
        if (!partnerId) continue;

        // If partner hasn't logged today, notify this user
        if (!loggedUsers.has(partnerId)) {
          // Get push subscriptions for this user
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", uid);

          if (subs && subs.length > 0) {
            // Use the send-push function
            await supabase.functions.invoke("send-push", {
              body: {
                subscriptions: subs,
                title: "Partner check-in 🤝",
                body: "Your partner hasn't logged today — send them some encouragement!",
              },
            });
            nudgesSent++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ nudgesSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
