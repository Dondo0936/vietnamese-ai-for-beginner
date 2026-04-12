import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkles } from "lucide-react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AppShell", () => ({
  default: ({ children }: any) => <div data-testid="app-shell">{children}</div>,
}));
vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({ readTopics: [], loading: false }),
}));
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {
    "may-nhin-pixel": {
      slug: "may-nhin-pixel",
      title: "How machines see pixels",
      titleVi: "Máy nhìn pixel thế nào?",
      difficulty: "beginner" as const,
      tier: "nhi" as const,
      durationMinutes: 6,
    },
  },
}));

import KidsPathPage from "@/components/paths/KidsPathPage";

describe("KidsPathPage", () => {
  it("renders the tier name, mascot stub, and description", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi="Bé làm quen AI — 18 bài, có audio"
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[]}
      />
    );
    expect(screen.getByText("Lộ trình Nhí")).toBeInTheDocument();
    expect(screen.getByText("Bé làm quen AI — 18 bài, có audio")).toBeInTheDocument();
    expect(screen.getByText("🐙")).toBeInTheDocument();
  });

  it("renders an empty-state message when stages is empty", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi=""
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[]}
      />
    );
    expect(screen.getByText(/đang được chuẩn bị/i)).toBeInTheDocument();
  });

  it("renders stage topics when stages contain known kid slugs", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi=""
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[{ title: "Chặng 1", slugs: ["may-nhin-pixel"] }]}
      />
    );
    expect(screen.getByText("Chặng 1")).toBeInTheDocument();
    expect(screen.getByText("Máy nhìn pixel thế nào?")).toBeInTheDocument();
  });
});
