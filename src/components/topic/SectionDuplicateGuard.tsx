"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { TocSectionId } from "@/lib/types";

interface SectionGuardContextValue {
  registerSection: (id: TocSectionId, slug: string) => void;
  unregisterSection: (id: TocSectionId) => void;
}

const SectionGuardContext = createContext<SectionGuardContextValue | null>(null);

export function SectionDuplicateGuard({ children }: { children: React.ReactNode }) {
  const seen = useRef<Record<TocSectionId, number>>({ visualization: 0, explanation: 0 });

  const value = useMemo<SectionGuardContextValue>(
    () => ({
      registerSection: (id, slug) => {
        seen.current[id] += 1;
        if (seen.current[id] > 1 && process.env.NODE_ENV !== "production") {
          const componentName =
            id === "visualization" ? "VisualizationSection" : "ExplanationSection";
          // eslint-disable-next-line no-console
          console.warn(
            `[SectionDuplicateGuard] Duplicate "${id}" section — topic "${slug}" renders more than one <${componentName}/>. ` +
              `Wrap duplicates in <LessonSection label="..." step={N}> inside a single outer section instead. ` +
              `See src/topics/_template.tsx for the pattern.`
          );
        }
      },
      unregisterSection: (id) => {
        seen.current[id] = Math.max(0, seen.current[id] - 1);
      },
    }),
    []
  );

  return (
    <SectionGuardContext.Provider value={value}>
      {children}
    </SectionGuardContext.Provider>
  );
}

/**
 * Called by VisualizationSection / ExplanationSection.
 * No-op when used outside a SectionDuplicateGuard provider.
 *
 * Uses useEffect so the ref mutation inside registerSection happens after
 * commit — React 19 / React Compiler forbids accessing or mutating refs
 * during render.
 */
export function useSectionGuard(id: TocSectionId, slug: string) {
  const ctx = useContext(SectionGuardContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.registerSection(id, slug);
    return () => ctx.unregisterSection(id);
  }, [ctx, id, slug]);
}
