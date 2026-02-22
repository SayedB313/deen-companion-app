import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useNotifications() {
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  // Check streak risk at 9 PM
  useEffect(() => {
    if (!user) return;
    const checkStreak = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .limit(1);

      if (!data?.length) {
        sendNotification(
          "Streak at risk! 🔥",
          "You haven't logged any activity today. Keep your streak alive!"
        );
      }
    };

    const now = new Date();
    const ninepm = new Date();
    ninepm.setHours(21, 0, 0, 0);
    
    if (now < ninepm) {
      const ms = ninepm.getTime() - now.getTime();
      const timer = setTimeout(checkStreak, ms);
      return () => clearTimeout(timer);
    }
  }, [user, sendNotification]);

  return { requestPermission, sendNotification };
}
