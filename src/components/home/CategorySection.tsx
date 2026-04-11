import Link from "next/link";
import type { TopicMeta, Category } from "@/lib/types";

interface CategorySectionProps {
  categories: Category[];
  topicsByCategory: Record<string, TopicMeta[]>;
}

export default function CategorySection({
  categories,
  topicsByCategory,
}: CategorySectionProps) {
  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const topics = topicsByCategory[cat.slug];
        if (!topics || topics.length === 0) return null;

        return (
          <div key={cat.slug}>
            <h3 className="text-base font-semibold text-foreground mb-3">
              {cat.nameVi}
            </h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  className="inline-flex items-center rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-teal-700 hover:bg-teal-200 transition-colors"
                >
                  {topic.titleVi}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
