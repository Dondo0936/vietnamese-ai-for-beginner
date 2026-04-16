"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { TopicMeta } from "@/lib/types";
import SourceCard from "./SourceCard";

interface ApplicationLayoutProps {
  metadata: TopicMeta;
  parentTitleVi: string;
  currentPath?: string;
  children: ReactNode;
}

export default function ApplicationLayout({
  metadata,
  parentTitleVi,
  currentPath,
  children,
}: ApplicationLayoutProps) {
  if (!metadata.applicationOf || !metadata.featuredApp) {
    throw new Error(
      `ApplicationLayout requires metadata.applicationOf and metadata.featuredApp; topic "${metadata.slug}" is missing one of them.`
    );
  }

  const ribbonHref = currentPath
    ? `/topics/${metadata.applicationOf}?path=${currentPath}`
    : `/topics/${metadata.applicationOf}`;

  return (
    <article>
      <nav
        aria-label="Liên kết với bài lý thuyết"
        className="mb-6 rounded-md border border-border/60 bg-surface/40 px-4 py-3 text-sm"
      >
        <Link href={ribbonHref} className="text-link hover:underline">
          ← Bạn vừa học {parentTitleVi}. Giờ xem cách{" "}
          <strong>{metadata.featuredApp.name}</strong> dùng nó.
        </Link>
      </nav>

      <div>{children}</div>

      {metadata.sources && metadata.sources.length > 0 && (
        <SourceCard sources={metadata.sources} />
      )}
    </article>
  );
}
