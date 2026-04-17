import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { kidsTopicList, kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLoader from "@/topics/kids/kids-topic-loader";

export function generateStaticParams() {
  return kidsTopicList.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = kidsTopicMap[slug];
  if (!topic) return {};
  return {
    title: `${topic.titleVi} | Nhí — AI Cho Mọi Người`,
    description: topic.description,
  };
}

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
        <KidsTopicLoader meta={topic} />
      </AppShell>
    </KidsModeProvider>
  );
}
