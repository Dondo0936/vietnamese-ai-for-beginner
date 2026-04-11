import type { Difficulty } from "@/lib/types";

interface TagProps {
  label: string;
  variant?: "default" | "difficulty";
}

const difficultyLabels: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

export default function Tag({ label, variant = "default" }: TagProps) {
  const base = "inline-block rounded-full px-3 py-0.5 text-xs font-semibold";

  if (variant === "difficulty") {
    const tagClass =
      label === "beginner" ? "tag-beginner" :
      label === "intermediate" ? "tag-intermediate" :
      label === "advanced" ? "tag-advanced" :
      "bg-surface text-muted";

    return (
      <span className={`${base} ${tagClass}`}>
        {difficultyLabels[label] ?? label}
      </span>
    );
  }

  return (
    <span className={`${base} bg-surface text-muted`}>{label}</span>
  );
}
