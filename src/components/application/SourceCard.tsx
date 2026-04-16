"use client";

import { useState } from "react";
import type { SourceLink } from "@/lib/types";

const KIND_LABELS_VI: Record<SourceLink["kind"], string> = {
  "engineering-blog": "Blog kỹ thuật",
  "paper": "Bài báo khoa học",
  "keynote": "Bài thuyết trình",
  "news": "Báo chí",
  "patent": "Bằng sáng chế",
  "documentation": "Tài liệu chính thức",
};

interface SourceCardProps {
  sources: SourceLink[];
}

export default function SourceCard({ sources }: SourceCardProps) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  const grouped = sources.reduce<Record<string, SourceLink[]>>((acc, s) => {
    (acc[s.kind] ??= []).push(s);
    return acc;
  }, {});

  return (
    <section
      aria-labelledby="source-card-heading"
      className="mt-12 rounded-lg border border-border bg-surface/30 p-4"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2
          id="source-card-heading"
          className="text-sm font-semibold text-muted"
        >
          Tài liệu tham khảo ({sources.length})
        </h2>
        <span aria-hidden className="text-xs text-muted">
          {open ? "Ẩn" : "Hiện"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([kind, items]) => (
            <div key={kind}>
              <h3 className="text-xs uppercase tracking-wide text-muted/80">
                {KIND_LABELS_VI[kind as SourceLink["kind"]]}
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {items.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:underline"
                    >
                      {s.title}
                    </a>{" "}
                    <span className="text-muted">
                      — {s.publisher}, {s.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
