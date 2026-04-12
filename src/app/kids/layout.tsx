import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kids — AI Cho Mọi Người",
    template: "%s · AI Cho Mọi Người (Kids)",
  },
  description: "Lộ trình AI dành cho bé 6–15 tuổi — tiếng Việt, tương tác, có audio.",
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  // tier is set per-sub-route (/kids/nhi sets "nhi", etc.) via nested
  // KidsModeProvider. This top-level provider just ensures useKidsMode()
  // never throws on /kids/* routes.
  return <KidsModeProvider>{children}</KidsModeProvider>;
}
