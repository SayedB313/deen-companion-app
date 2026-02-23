import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Extend ServiceWorkerRegistration for PushManager
declare global {
  interface ServiceWorkerRegistration {
    pushManager: {
      getSubscription(): Promise<PushSubscription | null>;
      subscribe(options: { userApplicationServerKey?: Uint8Array; applicationServerKey?: Uint8Array }): Promise<PushSubscription>;
    };
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function useNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;

      // Get the VAPID public key from env
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID public key not configured");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userApplicationServerKey: urlBase64ToUint8Array(vapidKey),
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        }
      );

      if (res.ok) {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Push subscription failed:", e);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setIsSubscribed(false);
    } catch (e) {
      console.error("Unsubscribe failed:", e);
    }
  }, []);

  const sendNotification = useCallback(
    async (title: string, body: string) => {
      // Try Web Push first via edge function
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ title, body }),
            }
          );
          return;
        }
      } catch {
        // fallback below
      }
      // Fallback to basic notification
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/pwa-192x192.png" });
      }
    },
    []
  );

  // Streak-at-risk check at 9 PM
  useEffect(() => {
    if (!user || !isSubscribed) return;
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
  }, [user, isSubscribed, sendNotification]);

  return { subscribe, unsubscribe, sendNotification, isSubscribed };
}
