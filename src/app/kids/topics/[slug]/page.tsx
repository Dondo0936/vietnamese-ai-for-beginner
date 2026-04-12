import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { kidsTopicMap } from "@/topics/kids/kids-registry";

/**
 * Kid topic page. Resolves slug from kidsTopicMap; 404s for unknown slugs.
 * Phase 1 ships with an empty registry — all slugs 404 until Phase 3
 * adds the first exemplars. Phase 3 also wires in the dynamic-import
 * renderer for the topic file's default export (mirrors the adult
 * /topics/[slug] pattern).
 *
 * Spec §10.1, §11.1.
 */

export default async function KidTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = kidsTopicMap[slug];

  if (!topic) {
    notFound();
  }

  return (
    <KidsModeProvider initialTier={topic.tier}>
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
          <h1 className="text-xl font-bold text-foreground mb-4">{topic.titleVi}</h1>
          <p className="text-sm text-muted">
            (Phase 3 sẽ nạp nội dung bài học ở đây.)
          </p>
        </div>
      </AppShell>
    </KidsModeProvider>
  );
}
