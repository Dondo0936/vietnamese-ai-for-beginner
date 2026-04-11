import AppShell from "@/components/layout/AppShell";
import HomeContent from "@/components/home/HomeContent";
import { topicList, categories } from "@/topics/registry";

export default function Home() {
  return (
    <AppShell>
      <HomeContent topics={topicList} categories={categories} />
    </AppShell>
  );
}
