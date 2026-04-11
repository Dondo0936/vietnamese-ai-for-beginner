"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import CommandPalette from "@/components/ui/CommandPalette";
import { topicList } from "@/topics/registry";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <CommandPalette topics={topicList} />
      <Navbar />
      <main id="main-content" className="flex-1 has-bottom-nav">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
