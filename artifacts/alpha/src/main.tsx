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

async function initOneSignal() {
  try {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }

    await OneSignal.init({
      appId: "6aa9d9b0-5f97-4b5a-be06-c700d7e63c83",
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" },
    });

    if (import.meta.env.DEV) {
      OneSignal.Debug.setLogLevel("trace");
    }

    OneSignal.Notifications.requestPermission().catch(() => {});
  } catch (err) {
    console.warn("OneSignal init failed:", err);
  }
}

initOneSignal();
