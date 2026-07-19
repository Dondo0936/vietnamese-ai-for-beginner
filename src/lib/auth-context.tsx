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
const PENDING_ANON_MERGE_KEY = "pending-anon-merge-token";

// Best-effort: reassigns an anonymous visitor's chat history to the account
// they just signed into. Only meaningful for a real identity switch
// (password sign-in to an *existing* account, or Google sign-in to one) —
// signUp/signUpGoogle upgrade the same anonymous user id in place, so they
// never need this.
async function mergeAnonymousHistory(oldAccessToken: string) {
  try {
    await fetch("/api/chat/merge-anonymous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldAccessToken }),
    });
  } catch {
    // Losing chat history on a failed merge isn't fatal — no-op.
  }
}

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

    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin + "/auth/callback" }
    );
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

    const {
      data: { session: oldSession },
    } = await supabase.auth.getSession();
    const wasAnonymous = oldSession?.user.is_anonymous === true;
    const oldAccessToken = oldSession?.access_token;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: mapAuthError(error) };

    if (wasAnonymous && oldAccessToken) {
      await mergeAnonymousHistory(oldAccessToken);
    }
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

    // Redirect-based — stash the anonymous token now so the callback page
    // can complete the merge once the new session lands (mirrors the
    // PENDING_PASSWORD_PREFIX pattern above).
    const {
      data: { session: oldSession },
    } = await supabase.auth.getSession();
    if (oldSession?.user.is_anonymous) {
      try {
        sessionStorage.setItem(PENDING_ANON_MERGE_KEY, oldSession.access_token);
      } catch {
        // sessionStorage unavailable — merge will simply be skipped.
      }
    }

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
