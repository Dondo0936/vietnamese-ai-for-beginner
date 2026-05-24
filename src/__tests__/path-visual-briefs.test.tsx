import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { PATHS } from "@/lib/paths";
import TopicLayout from "@/components/topic/TopicLayout";
import PathVisualBrief from "@/components/topic/PathVisualBrief";
import {
  AI_ENGINEER_VISUAL_BRIEFS,
  getPathVisualBrief,
  type PathVisualBriefData,
} from "@/components/topic/path-visual-briefs";
import { topicMap } from "@/topics/registry";

const EM_DASH = "\u2014";

beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });
});

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe("PathVisualBrief data", () => {
  const aiEngineerSlugs = PATHS["ai-engineer"].stages.flatMap(
    (stage) => stage.slugs
  );

  it("covers every AI Engineer path slug exactly once", () => {
    expect(Object.keys(AI_ENGINEER_VISUAL_BRIEFS).sort()).toEqual(
      [...aiEngineerSlugs].sort()
    );
  });

  it("keeps AI Engineer brief copy compact and free of em dashes", () => {
    const violations: Array<{ slug: string; text: string; issue: string }> = [];

    for (const [slug, brief] of Object.entries(AI_ENGINEER_VISUAL_BRIEFS)) {
      for (const text of collectStrings(brief)) {
        if (text.includes(EM_DASH)) {
          violations.push({ slug, text, issue: "em dash" });
        }
      }

      if (brief.title.length > 62) {
        violations.push({ slug, text: brief.title, issue: "title too long" });
      }
      if (brief.focus.length > 120) {
        violations.push({ slug, text: brief.focus, issue: "focus too long" });
      }
      for (const node of brief.nodes) {
        if (node.label.length > 32) {
          violations.push({ slug, text: node.label, issue: "node too long" });
        }
        if (node.caption.length > 64) {
          violations.push({
            slug,
            text: node.caption,
            issue: "caption too long",
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not leak shared slugs into the Office path", () => {
    expect(getPathVisualBrief("office", "prompt-engineering")).toBeNull();
    expect(getPathVisualBrief("office", "rag")).toBeNull();
    expect(getPathVisualBrief("ai-engineer", "rag")).not.toBeNull();
  });

  it("uses constrained visual data instead of class strings in content data", () => {
    const suspiciousKeys: string[] = [];

    for (const brief of Object.values<PathVisualBriefData>(
      AI_ENGINEER_VISUAL_BRIEFS
    )) {
      for (const key of Object.keys(brief)) {
        if (/class/i.test(key)) suspiciousKeys.push(`${brief.slug}.${key}`);
      }
      for (const [index, node] of brief.nodes.entries()) {
        for (const key of Object.keys(node)) {
          if (/class/i.test(key)) {
            suspiciousKeys.push(`${brief.slug}.nodes[${index}].${key}`);
          }
        }
      }
    }

    expect(suspiciousKeys).toEqual([]);
  });
});

describe("PathVisualBrief rendering", () => {
  it("renders a compact AI Engineer visual for a shared topic", () => {
    const stageTitle = PATHS["ai-engineer"].stages.find((stage) =>
      stage.slugs.includes("prompt-engineering")
    )?.title;

    render(
      <PathVisualBrief
        pathId="ai-engineer"
        slug="prompt-engineering"
        stageTitle={stageTitle}
      />
    );

    expect(screen.getByText("Prompt thành spec test được")).toBeInTheDocument();
    expect(screen.getByText(`Nhìn nhanh · ${stageTitle}`)).toBeInTheDocument();
    expect(screen.getByText("Schema")).toBeInTheDocument();
    expect(screen.getByText("Có ví dụ lỗi không")).toBeInTheDocument();
  });

  it("renders nothing when the active path has no brief data", () => {
    const { container } = render(
      <PathVisualBrief pathId="office" slug="prompt-engineering" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps OfficeVisualBrief for shared Office slugs", () => {
    window.history.pushState(
      {},
      "",
      "/topics/prompt-engineering?path=office"
    );

    render(
      <TopicLayout meta={topicMap["prompt-engineering"]}>
        <div>Body</div>
      </TopicLayout>
    );

    expect(
      screen.getByLabelText("Bản đồ trực quan cho nhân viên văn phòng")
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Bản đồ trực quan: Prompt thành spec test được/)
    ).not.toBeInTheDocument();
  });
});
