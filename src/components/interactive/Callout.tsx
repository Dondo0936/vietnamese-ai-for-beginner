import React from "react";
import { Lightbulb, AlertTriangle, Sparkles, Info } from "lucide-react";

type CalloutVariant = "tip" | "warning" | "insight" | "info";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}

const VARIANT_CONFIG: Record<
  CalloutVariant,
  {
    icon: React.ElementType;
    borderClass: string;
    bgClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  tip: {
    icon: Lightbulb,
    borderClass: "border-l-green-400 dark:border-l-green-600",
    bgClass: "bg-green-50 dark:bg-green-900/20",
    iconClass: "text-green-600 dark:text-green-400",
    titleClass: "text-green-800 dark:text-green-300",
  },
  warning: {
    icon: AlertTriangle,
    borderClass: "border-l-amber-400 dark:border-l-amber-600",
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    iconClass: "text-amber-600 dark:text-amber-400",
    titleClass: "text-amber-800 dark:text-amber-300",
  },
  insight: {
    icon: Sparkles,
    borderClass: "border-l-accent",
    bgClass: "bg-accent-light dark:bg-accent/10",
    iconClass: "text-accent",
    titleClass: "text-accent-dark dark:text-accent",
  },
  info: {
    icon: Info,
    borderClass: "border-l-blue-400 dark:border-l-blue-600",
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    iconClass: "text-blue-600 dark:text-blue-400",
    titleClass: "text-blue-800 dark:text-blue-300",
  },
};

export default function Callout({ variant = "info", title, children }: CalloutProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className={`border-l-4 rounded-r-xl p-4 space-y-1.5 ${config.borderClass} ${config.bgClass}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${config.iconClass}`} />
        {title && (
          <span className={`text-sm font-semibold ${config.titleClass}`}>{title}</span>
        )}
      </div>
      <div className="text-sm text-foreground leading-relaxed pl-6">{children}</div>
    </div>
  );
}
