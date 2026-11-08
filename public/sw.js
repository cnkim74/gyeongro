// Pothos 서비스워커 — 웹 푸시 알림 전용 (페이지 캐시는 하지 않음)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Pothos", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Pothos";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/push-icon-192.png",
      badge: "/push-badge.png",
      tag: data.tag || undefined,
      renotify: !!data.tag,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === url && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
