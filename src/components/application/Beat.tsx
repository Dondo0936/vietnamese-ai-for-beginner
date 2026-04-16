import type { ReactNode } from "react";

interface BeatProps {
  step: number;
  children: ReactNode;
}

export default function Beat({ step, children }: BeatProps) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold"
      >
        {step}
      </span>
      <div className="prose prose-sm max-w-none">{children}</div>
    </li>
  );
}
