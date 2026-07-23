// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// NOTE: Service workers cannot access import.meta.env / Vite env variables,
// so these values are hardcoded here. They match src/firebase.ts.
firebase.initializeApp({
  apiKey: "AIzaSyC4aAB0ODXO70exSLAfIaASo91YlnWPWxU",
  authDomain: "alpha-620b1.firebaseapp.com",
  projectId: "alpha-620b1",
  storageBucket: "alpha-620b1.firebasestorage.app",
  messagingSenderId: "124984660406",
  appId: "1:124984660406:web:fe9b1b73c97c76f8967117",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background FCM message received:", payload);

  const notificationTitle = payload.notification?.title || "New notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/icon-192x192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === clickAction && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
