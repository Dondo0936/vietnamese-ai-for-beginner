import React from "react";
import { ClipboardList } from "lucide-react";

interface MiniSummaryProps {
  title?: string;
  points: string[];
}

export default function MiniSummary({ title = "Tóm tắt", points }: MiniSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-accent shrink-0" />
        <span className="font-semibold text-foreground">{title}</span>
      </div>

      <ul className="space-y-2 pl-1">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
