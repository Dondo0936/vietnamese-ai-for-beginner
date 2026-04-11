import { Lightbulb } from "lucide-react";

interface AnalogyCardProps {
  children: React.ReactNode;
}

export default function AnalogyCard({ children }: AnalogyCardProps) {
  return (
    <section id="analogy" className="my-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Lightbulb size={20} className="text-accent" />
        Ví dụ thực tế
      </h2>
      <div className="analogy-card">
        <div className="space-y-3 text-foreground/90 leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}
