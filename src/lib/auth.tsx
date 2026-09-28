import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearAdminEmail, getAdminEmail, setAdminEmail } from './api';
import { firebaseEnabled, firebaseSignOut, onFirebaseAuth, signInWithGoogle } from './firebase';

type AuthMode = 'dev' | 'firebase';

interface AuthState {
  email: string | null;
  mode: AuthMode;
  /** Dev mode: pass the email to sign in. Firebase mode: no arg — starts Google sign-in. */
  login: (email?: string) => void | Promise<void>;
  logout: () => void | Promise<void>;
}

const AuthContext = createContext<AuthState>({
  email: null,
  mode: 'dev',
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(firebaseEnabled ? null : getAdminEmail());

  // Firebase mode: reflect the Firebase user's email in state.
  useEffect(() => {
    if (!firebaseEnabled) return;
    const unsub = onFirebaseAuth((e) => setEmail(e));
    return unsub;
  }, []);

  const value = useMemo<AuthState>(() => {
    if (firebaseEnabled) {
      return {
        email,
        mode: 'firebase',
        login: async () => {
          await signInWithGoogle();
        },
        logout: async () => {
          await firebaseSignOut();
        },
      };
    }
    return {
      email,
      mode: 'dev',
      login: (e?: string) => {
        if (!e) return;
        setAdminEmail(e);
        setEmail(e.trim().toLowerCase());
      },
      logout: () => {
        clearAdminEmail();
        setEmail(null);
      },
    };
  }, [email]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
