"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase";
import { mapAuthError } from "./auth-errors";

interface AuthContextValue {
  user: User | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUpGoogle: () => Promise<{ error?: string }>;
  signInGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEFAULT: AuthContextValue = {
  user: null,
  isAnonymous: false,
  isAuthenticated: false,
  loading: true,
  signUp: async () => ({ error: "Auth not initialized" }),
  signIn: async () => ({ error: "Auth not initialized" }),
  signUpGoogle: async () => ({ error: "Auth not initialized" }),
  signInGoogle: async () => ({ error: "Auth not initialized" }),
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(DEFAULT);

const PENDING_PASSWORD_PREFIX = "pending-password-";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial fetch
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    // Stash password in sessionStorage — the callback page will use it after email verification
    try {
      sessionStorage.setItem(
        PENDING_PASSWORD_PREFIX + email.toLowerCase(),
        password
      );
    } catch {
      // sessionStorage unavailable — continue; user will see password form on callback page
    }

    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      // Clean up stashed password if signup failed
      try {
        sessionStorage.removeItem(
          PENDING_PASSWORD_PREFIX + email.toLowerCase()
        );
      } catch {}
      return { error: mapAuthError(error) };
    }
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signUpGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signInGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const isAnonymous = user?.is_anonymous === true;
  const isAuthenticated = user !== null && !isAnonymous;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAnonymous,
        isAuthenticated,
        loading,
        signUp,
        signIn,
        signUpGoogle,
        signInGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
