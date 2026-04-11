import type { Difficulty } from "@/lib/types";

interface TagProps {
  label: string;
  variant?: "default" | "difficulty";
}

const difficultyColors: Record<Difficulty, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function Tag({ label, variant = "default" }: TagProps) {
  const base = "inline-block rounded-full px-3 py-1 text-sm font-medium";

  if (variant === "difficulty") {
    const colors =
      difficultyColors[label as Difficulty] ?? "bg-gray-100 text-gray-700";
    return <span className={`${base} ${colors}`}>{label}</span>;
  }

  return (
    <span className={`${base} bg-accent-light text-teal-700`}>{label}</span>
  );
}
