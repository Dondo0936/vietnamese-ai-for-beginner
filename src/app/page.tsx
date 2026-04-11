import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSearch from "@/components/home/HeroSearch";
import TopicGrid from "@/components/home/TopicGrid";
import CategorySection from "@/components/home/CategorySection";
import { topicList, categories } from "@/topics/registry";

export default function Home() {
  // Group topics by category for the CategorySection
  const topicsByCategory: Record<string, typeof topicList> = {};
  for (const topic of topicList) {
    if (!topicsByCategory[topic.category]) {
      topicsByCategory[topic.category] = [];
    }
    topicsByCategory[topic.category].push(topic);
  }

  return (
    <>
      <Navbar />

      <main className="flex-1">
        <HeroSearch topics={topicList} />

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Tất cả chủ đề
          </h2>
          <TopicGrid topics={topicList} />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Theo danh mục
          </h2>
          <CategorySection
            categories={categories}
            topicsByCategory={topicsByCategory}
          />
        </section>
      </main>

      <Footer />
    </>
  );
}
