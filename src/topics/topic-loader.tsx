"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { TopicMeta } from "@/lib/types";
import TopicLayout from "@/components/topic/TopicLayout";

const componentCache = new Map<string, React.ComponentType>();

function getTopicComponent(slug: string) {
  if (!componentCache.has(slug)) {
    const Component = dynamic(() => import(`@/topics/${slug}`), {
      loading: () => (
        <div className="space-y-6 py-4">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      ),
    });
    componentCache.set(slug, Component);
  }
  return componentCache.get(slug)!;
}

interface TopicLoaderProps {
  meta: TopicMeta;
}

export default function TopicLoader({ meta }: TopicLoaderProps) {
  const TopicContent = useMemo(() => getTopicComponent(meta.slug), [meta.slug]);

  return (
    <TopicLayout meta={meta}>
      <TopicContent />
    </TopicLayout>
  );
}
