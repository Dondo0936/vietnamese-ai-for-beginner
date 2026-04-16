"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { TocSectionId } from "@/lib/types";

interface SectionGuardContextValue {
  registerSection: (id: TocSectionId, slug: string) => void;
  unregisterSection: (id: TocSectionId) => void;
}

const SectionGuardContext = createContext<SectionGuardContextValue | null>(null);

const COMPONENT_NAMES: Record<TocSectionId, string> = {
  visualization: "VisualizationSection",
  explanation: "ExplanationSection",
  hero: "ApplicationHero",
  problem: "ApplicationProblem",
  mechanism: "ApplicationMechanism",
  metrics: "ApplicationMetrics",
  tryIt: "ApplicationTryIt",
  counterfactual: "ApplicationCounterfactual",
};

export function SectionDuplicateGuard({ children }: { children: React.ReactNode }) {
  const seen = useRef<Partial<Record<TocSectionId, number>>>({});

  const value = useMemo<SectionGuardContextValue>(
    () => ({
      registerSection: (id, slug) => {
        seen.current[id] = (seen.current[id] ?? 0) + 1;
        if ((seen.current[id] ?? 0) > 1 && process.env.NODE_ENV !== "production") {
          const componentName = COMPONENT_NAMES[id];
          // eslint-disable-next-line no-console
          console.warn(
            `[SectionDuplicateGuard] Duplicate "${id}" section — topic "${slug}" renders more than one <${componentName}/>. ` +
              `Wrap duplicates in <LessonSection label="..." step={N}> inside a single outer section instead. ` +
              `See src/topics/_template.tsx for the pattern.`
          );
        }
      },
      unregisterSection: (id) => {
        seen.current[id] = Math.max(0, (seen.current[id] ?? 0) - 1);
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
