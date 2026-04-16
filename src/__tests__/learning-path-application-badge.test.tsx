import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkles } from "lucide-react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/layout/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));
vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({ readTopics: [], loading: false }),
}));
vi.mock("@/topics/registry", () => ({
  topicMap: {
    "k-means": {
      slug: "k-means",
      title: "K-means",
      titleVi: "K-means",
      description: "K-means clustering.",
      category: "ml-fundamentals",
      tags: ["clustering"],
      difficulty: "intermediate",
      relatedSlugs: [],
      vizType: "interactive",
    },
    "k-means-in-music-recs": {
      slug: "k-means-in-music-recs",
      title: "K-means in Music Recs",
      titleVi: "K-means trong gợi ý nhạc",
      description: "Spotify uses K-means.",
      category: "ai-applications",
      tags: ["application"],
      difficulty: "beginner",
      relatedSlugs: ["k-means"],
      vizType: "interactive",
      applicationOf: "k-means",
    },
  },
}));

import LearningPathPage, {
  type Stage,
} from "@/components/paths/LearningPathPage";

const stages: Stage[] = [
  {
    title: "ML cơ bản",
    slugs: ["k-means", "k-means-in-music-recs"],
  },
];

describe("<LearningPathPage> application badge", () => {
  it("renders ' · Ứng dụng' after application topic titles", () => {
    render(
      <LearningPathPage
        pathId="student"
        nameVi="Học sinh · Sinh viên"
        descriptionVi="Test description"
        icon={Sparkles}
        stages={stages}
      />
    );
    expect(
      screen.getByText(/K-means trong gợi ý nhạc/)
    ).toBeInTheDocument();
    expect(screen.getByText(/· Ứng dụng/)).toBeInTheDocument();
  });

  it("does NOT render the badge on theory topic rows", () => {
    const { container } = render(
      <LearningPathPage
        pathId="student"
        nameVi="Học sinh · Sinh viên"
        descriptionVi="Test description"
        icon={Sparkles}
        stages={stages}
      />
    );
    // Find all topic entry links and identify the theory row (the one whose
    // titleVi is exactly "K-means" without the application suffix text).
    const topicLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>(
        "a[href^='/topics/k-means']"
      )
    );
    const theoryLink = topicLinks.find(
      (a) => a.getAttribute("href") === "/topics/k-means?path=student"
    );
    expect(theoryLink).toBeTruthy();
    expect(theoryLink?.textContent).not.toContain("Ứng dụng");

    const appLink = topicLinks.find(
      (a) =>
        a.getAttribute("href") === "/topics/k-means-in-music-recs?path=student"
    );
    expect(appLink).toBeTruthy();
    expect(appLink?.textContent).toContain("Ứng dụng");
  });
});
