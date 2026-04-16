import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// searchParams mock we can mutate per test
const searchParamsMock = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => searchParamsMock(),
  usePathname: () => "/topics/what-is-ml",
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("framer-motion", () => ({
  motion: {
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  useReducedMotion: () => false,
}));
vi.mock("@/lib/database", () => ({
  markTopicRead: vi.fn(),
}));
// Register a minimal set of topics the registry lookup needs for both
// the current topic and its path neighbors.
vi.mock("@/topics/registry", () => ({
  topicList: [
    { slug: "what-is-ml", title: "What is ML?", titleVi: "Machine Learning là gì?", category: "foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "math-readiness", title: "Math Readiness", titleVi: "Sẵn sàng cho toán ML", category: "math-foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "vectors-and-matrices", title: "Vectors & Matrices", titleVi: "Vector & Ma trận", category: "math-foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "python-for-ml", title: "Python for ML", titleVi: "Python cho ML", category: "foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "neural-network-overview", title: "Neural Network Overview", titleVi: "Tổng quan mạng nơ-ron", category: "foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "knn", title: "K-Nearest Neighbors", titleVi: "K-láng giềng gần nhất", category: "classic-ml", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "naive-bayes", title: "Naive Bayes", titleVi: "Naive Bayes", category: "classic-ml", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "k-means", title: "K-Means Clustering", titleVi: "Phân cụm K-Means", category: "classic-ml", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "decision-trees", title: "Decision Trees", titleVi: "Cây quyết định", category: "classic-ml", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
    { slug: "loss-functions", title: "Loss Functions", titleVi: "Hàm mất mát", category: "neural-fundamentals", difficulty: "intermediate", tags: [], relatedSlugs: [], description: "" },
    { slug: "epochs-batches", title: "Epochs, Batches & Iterations", titleVi: "Epochs, Batches & Iterations", category: "neural-fundamentals", difficulty: "intermediate", tags: [], relatedSlugs: [], description: "" },
  ],
  topicMap: {
    "what-is-ml": { slug: "what-is-ml", title: "What is ML?", titleVi: "Machine Learning là gì?" },
    "math-readiness": { slug: "math-readiness", title: "Math Readiness", titleVi: "Sẵn sàng cho toán ML" },
    "vectors-and-matrices": { slug: "vectors-and-matrices", title: "Vectors & Matrices", titleVi: "Vector & Ma trận" },
    "python-for-ml": { slug: "python-for-ml", title: "Python for ML", titleVi: "Python cho ML" },
    "neural-network-overview": { slug: "neural-network-overview", title: "Neural Network Overview", titleVi: "Tổng quan mạng nơ-ron" },
    "knn": { slug: "knn", title: "K-Nearest Neighbors", titleVi: "K-láng giềng gần nhất" },
    "knn-in-symptom-checker": { slug: "knn-in-symptom-checker", title: "KNN in Symptom Checker", titleVi: "KNN trong Kiểm tra Triệu chứng" },
    "naive-bayes": { slug: "naive-bayes", title: "Naive Bayes", titleVi: "Naive Bayes" },
    "k-means": { slug: "k-means", title: "K-Means Clustering", titleVi: "Phân cụm K-Means" },
    "decision-trees": { slug: "decision-trees", title: "Decision Trees", titleVi: "Cây quyết định" },
    "loss-functions": { slug: "loss-functions", title: "Loss Functions", titleVi: "Hàm mất mát" },
    "epochs-batches": { slug: "epochs-batches", title: "Epochs, Batches & Iterations", titleVi: "Epochs, Batches & Iterations" },
  },
}));
vi.mock("@/components/ui/Tag", () => ({
  default: ({ label }: any) => <span data-testid="tag">{label}</span>,
}));
vi.mock("@/components/topic/BookmarkButton", () => ({
  default: () => <button>bookmark</button>,
}));
vi.mock("@/components/topic/RelatedTopics", () => ({
  default: () => <div>related</div>,
}));
vi.mock("@/components/ui/ReadingProgressBar", () => ({
  default: () => <div>progress bar</div>,
}));
vi.mock("@/components/topic/TopicTOC", () => ({
  default: () => <div>toc</div>,
  DEFAULT_TOC_SECTIONS: [
    { id: "visualization", labelVi: "Minh họa" },
    { id: "explanation", labelVi: "Giải thích" },
  ],
}));

import TopicLayout from "@/components/topic/TopicLayout";

const whatIsMlMeta = {
  slug: "what-is-ml",
  title: "What is Machine Learning?",
  titleVi: "Machine Learning là gì?",
  description: "",
  category: "foundations" as const,
  tags: [],
  difficulty: "beginner" as const,
  relatedSlugs: [],
  vizType: "interactive" as const,
};

const knnMeta = {
  slug: "knn",
  title: "K-Nearest Neighbors",
  titleVi: "K-láng giềng gần nhất",
  description: "",
  category: "classic-ml" as const,
  tags: [],
  difficulty: "beginner" as const,
  relatedSlugs: [],
  vizType: "interactive" as const,
};

const lossFunctionsMeta = {
  slug: "loss-functions",
  title: "Loss Functions",
  titleVi: "Hàm mất mát",
  description: "",
  category: "neural-fundamentals" as const,
  tags: [],
  difficulty: "intermediate" as const,
  relatedSlugs: [],
  vizType: "interactive" as const,
};

beforeEach(() => {
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

describe("TopicLayout — path-aware navigation", () => {
  it("without ?path=, falls back to category-based counter on what-is-ml", () => {
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    // Category foundations has 4 mocked topics; what-is-ml is position 1
    expect(screen.getByText(/trong danh mục/i)).toBeInTheDocument();
  });

  it("without ?path=, back link goes to home (/)", () => {
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    const back = screen.getByRole("link", { name: /quay lại trang chủ/i });
    expect(back).toHaveAttribute("href", "/");
  });

  it("with ?path=student on what-is-ml, shows Bài 1/N — Giới thiệu counter", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    // Path-aware counter uses "Bài " prefix
    expect(screen.getByText(/Bài\s+1\s*\/\s*\d+/i)).toBeInTheDocument();
    // Stage title shown on desktop-size breakpoint — query by text content
    expect(screen.getByText(/Giới thiệu/)).toBeInTheDocument();
  });

  it("with ?path=student, back link goes to /paths/student", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    const back = screen.getByRole("link", { name: /quay lại lộ trình học sinh/i });
    expect(back).toHaveAttribute("href", "/paths/student");
  });

  it("with ?path=student on what-is-ml, Bài trước is null and Bài tiếp theo links to math-readiness", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    // No "Bài trước" link rendered for the first topic
    expect(screen.queryByText(/bài trước/i)).toBeNull();
    // Next link exists, points to math-readiness and preserves ?path=student
    const next = screen.getByRole("link", { name: /Math Readiness/ });
    expect(next).toHaveAttribute("href", "/topics/math-readiness?path=student");
  });

  it("with ?path=student on knn, Bài tiếp theo is knn-in-symptom-checker (application topic follows theory)", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={knnMeta}><p>body</p></TopicLayout>);
    const next = screen.getByRole("link", { name: /Symptom/ });
    expect(next).toHaveAttribute("href", "/topics/knn-in-symptom-checker?path=student");
  });

  it("with ?path=student on loss-functions, Bài tiếp theo is epochs-batches (audit fix)", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={lossFunctionsMeta}><p>body</p></TopicLayout>);
    const next = screen.getByRole("link", { name: /Epochs, Batches/ });
    expect(next).toHaveAttribute("href", "/topics/epochs-batches?path=student");
  });

  it("with ?path=fake (unknown path), silently falls back to category behavior", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=fake"));
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    expect(screen.getByText(/trong danh mục/i)).toBeInTheDocument();
    // Back link should still be home since path is invalid
    expect(screen.getByRole("link", { name: /quay lại trang chủ/i })).toBeInTheDocument();
  });

  it("shows a Lộ trình tag in the header when on a valid path", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    expect(screen.getByText(/Lộ trình:\s*Học sinh/i)).toBeInTheDocument();
  });

  it("does NOT show the Lộ trình tag when navigating without ?path=", () => {
    render(<TopicLayout meta={whatIsMlMeta}><p>body</p></TopicLayout>);
    expect(screen.queryByText(/Lộ trình:/i)).toBeNull();
  });
});
