import { describe, it, expect } from "vitest";
import {
  getPathNeighbors,
  getPathStages,
  getPathNameVi,
  isAdultPathId,
  PATHS,
  ADULT_PATH_IDS,
} from "@/lib/paths";

describe("paths-lib: registry shape", () => {
  it("has all 4 adult paths", () => {
    expect(Object.keys(PATHS).sort()).toEqual(
      ["ai-engineer", "ai-researcher", "office", "student"].sort()
    );
  });

  it("each path's stages have at least one slug", () => {
    for (const id of ADULT_PATH_IDS) {
      const stages = getPathStages(id);
      const total = stages.reduce((n, s) => n + s.slugs.length, 0);
      expect(total).toBeGreaterThan(0);
    }
  });

  it("getPathNameVi returns the path's Vietnamese name", () => {
    expect(getPathNameVi("student")).toBe("Học sinh · Sinh viên");
    expect(getPathNameVi("office")).toBe("Nhân viên văn phòng");
    expect(getPathNameVi("ai-engineer")).toBe("AI Engineer");
    expect(getPathNameVi("ai-researcher")).toBe("AI Researcher");
  });

  it("isAdultPathId accepts known ids and rejects others", () => {
    expect(isAdultPathId("student")).toBe(true);
    expect(isAdultPathId("ai-engineer")).toBe(true);
    expect(isAdultPathId("kids-nhi")).toBe(false);
    expect(isAdultPathId("")).toBe(false);
    expect(isAdultPathId(null)).toBe(false);
    expect(isAdultPathId(undefined)).toBe(false);
    expect(isAdultPathId(42)).toBe(false);
  });
});

describe("getPathNeighbors", () => {
  it("returns null for an unknown path id", () => {
    expect(getPathNeighbors("fake-path", "what-is-ml")).toBeNull();
  });

  it("returns null for null/undefined path id", () => {
    expect(getPathNeighbors(null, "what-is-ml")).toBeNull();
    expect(getPathNeighbors(undefined, "what-is-ml")).toBeNull();
  });

  it("returns null when slug is not in the path", () => {
    // knn is in student path, not in ai-researcher path
    expect(getPathNeighbors("ai-researcher", "knn")).toBeNull();
  });

  it("resolves student path — first topic (what-is-ml)", () => {
    const n = getPathNeighbors("student", "what-is-ml");
    expect(n).not.toBeNull();
    expect(n!.prev).toBeNull();
    expect(n!.next?.slug).toBe("math-readiness");
    expect(n!.current).toBe(1);
    expect(n!.total).toBeGreaterThanOrEqual(30);
    expect(n!.pathId).toBe("student");
    expect(n!.nameVi).toBe("Học sinh · Sinh viên");
    expect(n!.currentStageTitle).toBe("Giới thiệu");
  });

  it("resolves student path — linear-regression → linear-regression-in-housing", () => {
    const n = getPathNeighbors("student", "linear-regression");
    expect(n!.next?.slug).toBe("linear-regression-in-housing");
  });

  it("resolves student path — knn → knn-in-symptom-checker", () => {
    const n = getPathNeighbors("student", "knn");
    expect(n!.next?.slug).toBe("knn-in-symptom-checker");
  });

  it("resolves student path — decision-trees → decision-trees-in-loan-scoring", () => {
    const n = getPathNeighbors("student", "decision-trees");
    expect(n!.next?.slug).toBe("decision-trees-in-loan-scoring");
  });

  it("resolves student path — loss-functions → loss-functions-in-recommendation", () => {
    const n = getPathNeighbors("student", "loss-functions");
    expect(n!.next?.slug).toBe("loss-functions-in-recommendation");
  });

  it("resolves student path — gradient-descent → gradient-descent-in-training", () => {
    const n = getPathNeighbors("student", "gradient-descent");
    expect(n!.next?.slug).toBe("gradient-descent-in-training");
  });

  it("crosses stage boundaries — last topic of a stage → first of next stage", () => {
    // In the student path: "Giới thiệu" stage ends with data-and-datasets, then stage 2
    // starts with vectors-and-matrices
    const n = getPathNeighbors("student", "data-and-datasets");
    expect(n!.next?.slug).toBe("vectors-and-matrices");
    expect(n!.next?.stageTitle).toBe("Nền tảng toán");
    expect(n!.currentStageTitle).toBe("Giới thiệu");
  });

  it("returns null next for the last topic of the path", () => {
    // end-to-end-ml-project is the last topic in the student path
    const n = getPathNeighbors("student", "end-to-end-ml-project");
    expect(n!.next).toBeNull();
  });

  it("resolves office path correctly", () => {
    const n = getPathNeighbors("office", "llm-overview");
    expect(n!.prev?.slug).toBe("getting-started-with-ai");
    expect(n!.next?.slug).toBe("prompt-engineering");
    expect(n!.nameVi).toBe("Nhân viên văn phòng");
  });

  it("handles a shared slug differently per path", () => {
    // rag is in both office and ai-engineer paths but at different positions
    const office = getPathNeighbors("office", "rag");
    const engineer = getPathNeighbors("ai-engineer", "rag");
    expect(office).not.toBeNull();
    expect(engineer).not.toBeNull();
    // prev and next differ between the two paths
    expect(office!.next?.slug).not.toBe(engineer!.next?.slug);
  });
});
