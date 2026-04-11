import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeContent from "@/components/home/HomeContent";
import { topicList, categories } from "@/topics/registry";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HomeContent topics={topicList} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
