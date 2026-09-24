import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { authDomainForHost } from "./authDomain";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  terminate,
  clearIndexedDbPersistence,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: authDomainForHost(
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    window.location.hostname,
  ),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const configured = Object.values(config).every(Boolean);
const app = configured ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: false }),
      }),
    })
  : null;
export async function login() {
  if (!auth)
    throw new Error(
      "Cloud sync is not configured. You can use this device for now.",
    );
  const provider = new GoogleAuthProvider();
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ||
    window.matchMedia("(display-mode: standalone)").matches;
  if (mobile) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "auth/popup-blocked"
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}
let redirectResult: Promise<string> | undefined;
export function finishSignIn() {
  // Share the result across React Strict Mode effect mounts; do not consume it twice.
  return (redirectResult ??= auth
    ? getRedirectResult(auth)
        .then(() => "")
        .catch(
          () =>
            "Google sign-in did not finish. Please try Continue with Google again in this browser.",
        )
    : Promise.resolve(""));
}
export async function logout() {
  if (!auth || !db) return;
  await signOut(auth);
  await terminate(db);
  await clearIndexedDbPersistence(db);
  location.reload();
}
