/**
 * Firebase Google sign-in scaffolding.
 *
 * Everything here is inert unless `VITE_AUTH_PROVIDER === 'firebase'`. In the
 * default dev mode `firebaseEnabled` is false, no `firebase/*` module is ever
 * imported (the imports are dynamic, inside async helpers), and the exported
 * sign-in/token helpers throw if somehow called.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

const AUTH_PROVIDER = (import.meta.env.VITE_AUTH_PROVIDER as string) ?? 'dev';

/** True only when the app is built/run with Firebase auth selected. */
export const firebaseEnabled = AUTH_PROVIDER === 'firebase';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Module-scoped memoized instances so init happens at most once.
let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;

function hasConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

async function getApp(): Promise<FirebaseApp> {
  if (!firebaseEnabled) throw new Error('Firebase not enabled');
  if (!hasConfig()) throw new Error('Firebase config missing (VITE_FIREBASE_* env vars)');
  if (!appPromise) {
    appPromise = (async () => {
      const { getApps, initializeApp } = await import('firebase/app');
      const existing = getApps();
      return existing.length ? existing[0] : initializeApp(firebaseConfig as Record<string, string>);
    })();
  }
  return appPromise;
}

async function getFirebaseAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getApp();
      const { getAuth } = await import('firebase/auth');
      return getAuth(app);
    })();
  }
  return authPromise;
}

/** Start the Google sign-in popup flow. Throws when Firebase is not enabled. */
export async function signInWithGoogle(): Promise<void> {
  if (!firebaseEnabled) throw new Error('Firebase not enabled');
  const auth = await getFirebaseAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

/** Sign the current Firebase user out. Throws when Firebase is not enabled. */
export async function firebaseSignOut(): Promise<void> {
  if (!firebaseEnabled) throw new Error('Firebase not enabled');
  const auth = await getFirebaseAuth();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

/** Fresh Firebase ID token for the current user, or null if signed out. */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!firebaseEnabled) throw new Error('Firebase not enabled');
  const auth = await getFirebaseAuth();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

/**
 * Subscribe to Firebase auth state. Invokes `cb` with the signed-in user's
 * email (or null). Returns an unsubscribe function. Throws when not enabled.
 */
export function onFirebaseAuth(cb: (email: string | null) => void): () => void {
  if (!firebaseEnabled) throw new Error('Firebase not enabled');
  let unsub: (() => void) | null = null;
  let cancelled = false;
  void (async () => {
    const auth = await getFirebaseAuth();
    const { onAuthStateChanged } = await import('firebase/auth');
    if (cancelled) return;
    unsub = onAuthStateChanged(auth, (user) => cb(user?.email ?? null));
  })();
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}
