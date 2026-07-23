import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import OneSignal from "react-onesignal";

async function initOneSignal() {
  await OneSignal.init({
    appId: "6aa9d9b0-5f97-4b5a-be06-c700d7e63c83",
    allowLocalhostAsSecureOrigin: true,
  });

  createRoot(document.getElementById("root")!).render(<App />);
}

initOneSignal();
