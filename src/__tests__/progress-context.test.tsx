import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock database module
const mockGetUserProgress = vi.fn();
const mockToggleBookmark = vi.fn();
vi.mock("@/lib/database", () => ({
  getUserProgress: () => mockGetUserProgress(),
  toggleBookmark: (slug: string) => mockToggleBookmark(slug),
  markTopicRead: vi.fn(),
}));

import { ProgressProvider, useProgress } from "@/lib/progress-context";

// Simple consumer component for testing
function ProgressConsumer() {
  const { readTopics, bookmarks, loading } = useProgress();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="read-count">{readTopics.length}</span>
      <span data-testid="bookmark-count">{bookmarks.length}</span>
    </div>
  );
}

// Two consumers to verify shared state
function DualConsumer() {
  return (
    <ProgressProvider>
      <ProgressConsumer />
      <ProgressConsumer />
    </ProgressProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserProgress.mockResolvedValue({
    readTopics: ["topic-a", "topic-b"],
    bookmarks: ["topic-a"],
    lastVisited: "topic-b",
  });
});

describe("ProgressProvider", () => {
  it("fetches progress once and provides it to consumers", async () => {
    render(
      <ProgressProvider>
        <ProgressConsumer />
      </ProgressProvider>
    );

    // Initially loading
    expect(screen.getByText("loading")).toBeInTheDocument();

    // After fetch completes
    await waitFor(() => {
      expect(screen.getByTestId("read-count")).toHaveTextContent("2");
      expect(screen.getByTestId("bookmark-count")).toHaveTextContent("1");
    });

    // Should have called getUserProgress exactly once
    expect(mockGetUserProgress).toHaveBeenCalledTimes(1);
  });

  it("shares the same data across multiple consumers without extra fetches", async () => {
    render(<DualConsumer />);

    await waitFor(() => {
      const readCounts = screen.getAllByTestId("read-count");
      expect(readCounts).toHaveLength(2);
      expect(readCounts[0]).toHaveTextContent("2");
      expect(readCounts[1]).toHaveTextContent("2");
    });

    // Still only one fetch
    expect(mockGetUserProgress).toHaveBeenCalledTimes(1);
  });
});
