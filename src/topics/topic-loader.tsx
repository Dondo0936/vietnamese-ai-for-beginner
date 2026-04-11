"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { TopicMeta } from "@/lib/types";
import TopicLayout from "@/components/topic/TopicLayout";

// Cache dynamic imports to avoid recreating on every render
const componentCache = new Map<string, React.ComponentType>();

function getTopicComponent(slug: string) {
  if (!componentCache.has(slug)) {
    const Component = dynamic(() => import(`@/topics/${slug}`), {
      loading: () => (
        <div className="text-center py-8 text-muted">
          <p>Đang tải...</p>
        </div>
      ),
      ssr: false,
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
