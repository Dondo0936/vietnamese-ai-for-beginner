import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import BrowseContent from "@/components/browse/BrowseContent";
import { topicList, categories } from "@/topics/registry";

export const metadata: Metadata = {
  title: "Tất cả chủ đề — AI Cho Mọi Người",
  description:
    "Tất cả chủ đề AI/ML có trong udemi.tech — lọc theo độ khó, duyệt theo danh mục, tìm bằng ⌘K.",
  alternates: { canonical: "/browse" },
};

export default function BrowsePage() {
  return (
    <AppShell>
      <BrowseContent topics={topicList} categories={categories} />
    </AppShell>
  );
}
