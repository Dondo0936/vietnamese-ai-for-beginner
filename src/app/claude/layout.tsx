import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Cẩm nang Claude · AI Cho Mọi Người",
  description:
    "Hướng dẫn trực quan, tiếng Việt cho mọi tính năng của Claude — từ Chat đến Claude Code.",
};

export default function ClaudeLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
