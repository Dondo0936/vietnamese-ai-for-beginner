"use client";

import { createContext, useContext, useState } from "react";
import type { KidProfile, KidTier } from "./types";

interface KidsModeState {
  /** Currently-active kid profile, or null if no one is logged in as a kid. */
  profile: KidProfile | null;
  /** Current tier — derived from profile, or set explicitly for route-level defaults. */
  tier: KidTier | null;
  /** Audio narration on? Default: on for Nhí, off for Teen. User-toggleable. */
  audioNarration: boolean;
  setAudioNarration: (next: boolean) => void;
}

const defaultState: KidsModeState = {
  profile: null,
  tier: null,
  audioNarration: false,
  setAudioNarration: () => {},
};

const KidsModeContext = createContext<KidsModeState>(defaultState);

interface KidsModeProviderProps {
  children: React.ReactNode;
  /** Override tier at the route level (e.g. /kids/nhi sets "nhi"). */
  initialTier?: KidTier | null;
  /** Phase 2 will populate this once parent auth is wired. */
  profile?: KidProfile | null;
}

export function KidsModeProvider({
  children,
  initialTier = null,
  profile = null,
}: KidsModeProviderProps) {
  const [audioNarration, setAudioNarration] = useState<boolean>(
    initialTier === "nhi"
  );

  const value: KidsModeState = {
    profile,
    tier: initialTier,
    audioNarration,
    setAudioNarration,
  };

  return <KidsModeContext.Provider value={value}>{children}</KidsModeContext.Provider>;
}

export function useKidsMode(): KidsModeState {
  return useContext(KidsModeContext);
}
