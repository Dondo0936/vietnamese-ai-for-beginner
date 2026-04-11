import Link from "next/link";
import { topicMap } from "@/topics/registry";

interface RelatedTopicsProps {
  slugs: string[];
}

export default function RelatedTopics({ slugs }: RelatedTopicsProps) {
  const validTopics = slugs
    .map((s) => topicMap[s])
    .filter(Boolean);

  if (validTopics.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Chủ đề liên quan
      </h2>
      <div className="flex flex-wrap gap-2">
        {validTopics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            className="rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-accent/20"
          >
            {topic.title} — {topic.titleVi}
          </Link>
        ))}
      </div>
    </section>
  );
}
