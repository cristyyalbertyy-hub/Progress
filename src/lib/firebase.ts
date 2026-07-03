import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

declare global {
  interface Window {
    STUDIO9_FIREBASE?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      appId: string;
    };
  }
}

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? window.STUDIO9_FIREBASE?.apiKey ?? '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    window.STUDIO9_FIREBASE?.authDomain ??
    '',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ??
    window.STUDIO9_FIREBASE?.projectId ??
    '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? window.STUDIO9_FIREBASE?.appId ?? '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  if (!app) app = initializeApp(cfg);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export const ACCOUNT_URL =
  import.meta.env.VITE_ACCOUNT_URL ?? 'https://medical-science-lilac.vercel.app/conta/';
