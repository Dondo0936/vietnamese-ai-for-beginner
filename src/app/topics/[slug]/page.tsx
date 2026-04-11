import { notFound } from "next/navigation";
import { getTopicBySlug, getAllTopics } from "@/topics/registry";
import TopicLoader from "@/topics/topic-loader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export function generateStaticParams() {
  return getAllTopics().map((t) => ({ slug: t.slug }));
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
    <>
      <Navbar />
      <main className="flex-1">
        <TopicLoader meta={topic} />
      </main>
      <Footer />
    </>
  );
}
