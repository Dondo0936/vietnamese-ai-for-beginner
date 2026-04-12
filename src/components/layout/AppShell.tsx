"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import CommandPalette from "@/components/ui/CommandPalette";
import SignInToast from "@/components/auth/SignInToast";
import { AuthProvider } from "@/lib/auth-context";
import { ProgressProvider } from "@/lib/progress-context";
import { topicList } from "@/topics/registry";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <CommandPalette topics={topicList} />
        <Navbar />
        <main id="main-content" className="flex-1 has-bottom-nav">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <SignInToast />
      </ProgressProvider>
    </AuthProvider>
  );
}
