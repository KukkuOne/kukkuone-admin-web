import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setOnUnauthorized } from './api';
import { adminSession, forgetAdminSession, keepAdminSession, type Staff } from './session';

interface AuthState {
  email: string | null;
  name: string | null;
  /** Set when the console was signed out by an expired or refused session, for the sign-in notice. */
  ended: boolean;
  signIn: (token: string, expiresAt: string, staff: Staff) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  email: null,
  name: null,
  ended: false,
  signIn: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [who, setWho] = useState(() => adminSession());
  const [ended, setEnded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setOnUnauthorized(() => {
      forgetAdminSession();
      setWho((prev) => {
        if (prev) setEnded(true);
        return null;
      });
      queryClient.clear();
    });
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      email: who?.email ?? null,
      name: who?.name ?? null,
      ended,
      signIn: (token, expiresAt, staff) => {
        keepAdminSession(token, expiresAt, staff);
        setEnded(false);
        setWho(adminSession());
      },
      logout: () => {
        forgetAdminSession();
        queryClient.clear();
        setEnded(false);
        setWho(null);
      },
    }),
    [who, ended, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
