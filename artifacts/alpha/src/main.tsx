import React from "react";
import ReactDOM from "react-dom/client";
import OneSignal from "react-onesignal";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fire-and-forget push setup. Never allowed to block or crash app startup.
async function initOneSignal() {
  try {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return; // No Notifications API (common in WebView) — skip entirely
    }

    await OneSignal.init({
      appId: "6aa9d9b0-5f97-4b5a-be06-c700d7e63c83",
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" },
      notifyButton: {
        enable: false,
        prenotify: false,
        showCredit: false,
        text: {},
      },
    });

    if (import.meta.env.DEV) {
      OneSignal.Debug.setLogLevel("trace");
    }

    // Don't await this — some WebViews never resolve the permission prompt.
    OneSignal.Notifications.requestPermission().catch(() => {});
  } catch (err) {
    console.warn("OneSignal init failed, continuing without push:", err);
  }
}

initOneSignal();
