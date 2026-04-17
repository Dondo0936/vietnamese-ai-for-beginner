"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { KidsTopicMeta } from "@/lib/kids/types";

const componentCache = new Map<string, React.ComponentType>();

function getKidsTopicComponent(slug: string) {
  if (!componentCache.has(slug)) {
    const Component = dynamic(() => import(`@/topics/kids/${slug}`), {
      loading: () => (
        <div className="flex items-center justify-center py-20">
          <div className="text-4xl animate-bounce">🐙</div>
        </div>
      ),
    });
    componentCache.set(slug, Component);
  }
  return componentCache.get(slug)!;
}

interface KidsTopicLoaderProps {
  meta: KidsTopicMeta;
}

export default function KidsTopicLoader({ meta }: KidsTopicLoaderProps) {
  const TopicContent = useMemo(() => getKidsTopicComponent(meta.slug), [meta.slug]);
  return <TopicContent />;
}
