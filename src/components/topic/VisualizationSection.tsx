import { Eye } from "lucide-react";

interface VisualizationSectionProps {
  children: React.ReactNode;
}

export default function VisualizationSection({
  children,
}: VisualizationSectionProps) {
  return (
    <section className="my-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Eye size={20} className="text-accent" />
        Hình minh họa
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}
