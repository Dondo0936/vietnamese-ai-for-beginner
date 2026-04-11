import React from "react";

interface ProgressStepsProps {
  current: number;
  total: number;
  labels?: string[];
}

export default function ProgressSteps({ current, total, labels }: ProgressStepsProps) {
  const label = labels?.[current - 1] ?? `Bước ${current}/${total}`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;

          let widthClass = "w-4";
          let bgClass = "bg-surface";

          if (isCurrent) {
            widthClass = "w-8";
            bgClass = "bg-accent";
          } else if (isCompleted) {
            widthClass = "w-6";
            bgClass = "bg-accent";
          }

          return (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${widthClass} ${bgClass}`}
            />
          );
        })}
      </div>

      <span className="text-sm text-muted whitespace-nowrap">{label}</span>
    </div>
  );
}
