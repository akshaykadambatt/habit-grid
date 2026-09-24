import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, terminate, clearIndexedDbPersistence } from 'firebase/firestore';

const config = {apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const configured = Object.values(config).every(Boolean);
const app = configured ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentSingleTabManager({forceOwnership:false})})}) : null;
export async function login() { if(!auth) throw new Error('Cloud sync is not configured. You can use this device for now.'); await signInWithPopup(auth,new GoogleAuthProvider()); }
export async function logout() {
  if(!auth||!db)return;
  await signOut(auth);
  await terminate(db);
  await clearIndexedDbPersistence(db);
  location.reload();
}
