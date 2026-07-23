import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// FCM is not supported in every environment (SSR, some browsers, non-HTTPS
// contexts), so we resolve it lazily instead of calling getMessaging()
// synchronously — that call throws if the environment lacks support.
export const messagingPromise: Promise<Messaging | null> = isSupported().then(
  (supported) => (supported ? getMessaging(app) : null)
);

// Convenience helper for use inside async functions/components.
export async function getMessagingInstance(): Promise<Messaging | null> {
  return messagingPromise;
}
