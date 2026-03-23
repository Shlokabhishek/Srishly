import * as React from 'react';

import { supabase } from '@/lib/supabase';
import { getCurrentSession, loginUser, logoutUser, mapSupabaseSession, registerUser } from '@/services/authApi';
import type { AuthLoginInput, AuthRegisterInput, AuthSession } from '@/types';

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  register: (input: AuthRegisterInput) => Promise<AuthSession>;
  login: (input: AuthLoginInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshSession = React.useCallback(async () => {
    try {
      const nextSession = await getCurrentSession();
      setSession(nextSession);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ? mapSupabaseSession(nextSession) : null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const register = React.useCallback(async (input: AuthRegisterInput) => {
    const nextSession = await registerUser(input);
    setSession(nextSession);
    return nextSession;
  }, []);

  const login = React.useCallback(async (input: AuthLoginInput) => {
    const nextSession = await loginUser(input);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = React.useCallback(async () => {
    await logoutUser();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        register,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
