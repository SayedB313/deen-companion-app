// Push notification service worker handler
// This file is loaded by the main service worker via importScripts

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      vibrate: [200, 100, 200],
      data: { url: "/" },
      actions: [{ action: "open", title: "Open Deen Tracker" }],
    };
    event.waitUntil(self.registration.showNotification(data.title || "Deen Tracker", options));
  } catch {
    const text = event.data.text();
    event.waitUntil(self.registration.showNotification("Deen Tracker", { body: text }));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/");
    })
  );
});
