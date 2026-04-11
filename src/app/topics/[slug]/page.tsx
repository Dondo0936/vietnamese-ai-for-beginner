import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTopicBySlug, getAllTopics } from "@/topics/registry";
import TopicLoader from "@/topics/topic-loader";
import AppShell from "@/components/layout/AppShell";

export function generateStaticParams() {
  return getAllTopics().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: `${topic.title} — ${topic.titleVi} | AI Cho Mọi Người`,
    description: topic.description,
    openGraph: {
      title: `${topic.title} — ${topic.titleVi}`,
      description: topic.description,
      type: "article",
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return (
    <AppShell>
      <TopicLoader meta={topic} />
    </AppShell>
  );
}
