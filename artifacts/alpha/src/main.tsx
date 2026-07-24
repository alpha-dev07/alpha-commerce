import React from "react";
import ReactDOM from "react-dom/client";
import OneSignal from "react-onesignal";
import App from "./App";
import "./index.css";

async function start() {
  await OneSignal.init({
    appId: "6aa9d9b0-5f97-4b5a-be06-c700d7e63c83",
    serviceWorkerPath: "/OneSignalSDKWorker.js",
    serviceWorkerParam: { scope: "/" },
    notifyButton: {
      enable: false,
    },
  });

  OneSignal.Debug.setLogLevel("trace");

  await OneSignal.Notifications.requestPermission();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

start();
