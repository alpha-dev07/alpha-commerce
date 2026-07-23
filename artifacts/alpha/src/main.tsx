import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { auth, db, messagingPromise } from "./firebase";

const VAPID_KEY =
  "BOQLsLWzgzq73Mog2J4npkVLKTKuqYtXLSgqlwrlu1AhTUecb9_npPdDZ60k6l-DYQ0DO24BunNxlsJ88QXD4PE";

let foregroundListenerAttached = false;

// Registers the foreground message handler exactly once, independent of
// auth state, so repeated logins/logouts don't stack up duplicate listeners.
async function attachForegroundListener() {
  if (foregroundListenerAttached) return;

  const messaging = await messagingPromise;
  if (!messaging) return; // FCM not supported in this environment

  onMessage(messaging, (payload) => {
    console.log("Foreground FCM message received:", payload);
    // Hook in your own UI (toast, banner, etc.) here.
  });

  foregroundListenerAttached = true;
}

// Requests permission, fetches the FCM token, and saves it to the
// logged-in user's Firestore document.
async function saveFcmTokenForUser(uid: string) {
  try {
    const messaging = await messagingPromise;
    if (!messaging) return; // FCM not supported in this environment

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted:", permission);
      return;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) {
      console.warn("No FCM token available.");
      return;
    }

    await setDoc(
      doc(db, "users", uid),
      { fcmTokens: arrayUnion(token) },
      { merge: true }
    );
  } catch (err) {
    console.error("FCM setup failed:", err);
  }
}

// Set up messaging without blocking initial render.
attachForegroundListener();

onAuthStateChanged(auth, (user) => {
  if (user) {
    saveFcmTokenForUser(user.uid);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
