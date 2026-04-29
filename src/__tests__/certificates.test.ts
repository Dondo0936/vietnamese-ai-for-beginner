import { describe, it, expect } from "vitest";
import {
  buildPayload,
  canonicalJson,
  checkNameSimilarity,
  formatHours,
  shortCertId,
  signPayload,
  tokenize,
  verifyPayload,
} from "@/lib/certificates";

const TEST_PRIVATE_KEY =
  "MC4CAQAwBQYDK2VwBCIEIIY09Wv+/eZW0EA4ryh0v11VgbyaQosXmq0RM+xCu2L0";

describe("certificates · sign / verify", () => {
  it("roundtrip succeeds with the matching public key", async () => {
    const payload = buildPayload({
      certId: "11111111-2222-3333-4444-555555555555",
      userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      pathId: "office",
      pathName: "Nhân viên văn phòng",
      fullName: "Lê Hoàng Anh",
      lessonCount: 20,
      hoursSeconds: 17 * 3600 + 24 * 60,
      quizAvg: 92,
      completedAt: new Date("2026-04-28T00:00:00Z"),
      signedAt: new Date("2026-04-29T00:00:00Z"),
    });
    const signature = await signPayload(payload, TEST_PRIVATE_KEY);
    const ok = await verifyPayload(payload, signature);
    expect(ok).toBe(true);
  });

  it("tampering with the payload invalidates the signature", async () => {
    const payload = buildPayload({
      certId: "11111111-2222-3333-4444-555555555555",
      userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      pathId: "office",
      pathName: "Nhân viên văn phòng",
      fullName: "Lê Hoàng Anh",
      lessonCount: 20,
      hoursSeconds: 1000,
      quizAvg: 92,
      completedAt: new Date("2026-04-28T00:00:00Z"),
    });
    const signature = await signPayload(payload, TEST_PRIVATE_KEY);
    const tampered = { ...payload, fullName: "Someone Else" };
    const ok = await verifyPayload(tampered, signature);
    expect(ok).toBe(false);
  });

  it("canonical JSON is order-stable", () => {
    const payload = buildPayload({
      certId: "x",
      userId: "y",
      pathId: "office",
      pathName: "p",
      fullName: "n",
      lessonCount: 1,
      hoursSeconds: 60,
      quizAvg: 100,
      completedAt: new Date("2026-04-29T00:00:00Z"),
      signedAt: new Date("2026-04-29T00:00:00Z"),
    });
    const json = canonicalJson(payload);
    expect(json.startsWith('{"v":1,"certId":"x"')).toBe(true);
  });
});

describe("certificates · name similarity", () => {
  it("accepts 3-token reordering", () => {
    const r = checkNameSimilarity("Lê Hoàng Anh", "Hoàng Anh Lê");
    expect(r.ok).toBe(true);
    expect(r.matched).toContain("le");
    expect(r.matched).toContain("hoang");
    expect(r.matched).toContain("anh");
  });

  it("accepts mononym + extra family name", () => {
    const r = checkNameSimilarity("Phạm Trang", "Phạm Thị Trang");
    expect(r.ok).toBe(true);
  });

  it("rejects an unrelated name", () => {
    const r = checkNameSimilarity("Nguyễn Văn A", "Trần Thị B");
    expect(r.ok).toBe(false);
  });

  it("treats diacritic-stripped tokens as equal", () => {
    const r = checkNameSimilarity("Le Hoang Anh", "Lê Hoàng Anh");
    expect(r.matched).toEqual(
      expect.arrayContaining(["le", "hoang", "anh"]),
    );
    expect(r.ok).toBe(true);
  });

  it("normalises đ to d", () => {
    expect(tokenize("Đỗ Đăng")).toEqual(["do", "dang"]);
  });

  it("requires up to 4-token overlap when both names are long", () => {
    const r = checkNameSimilarity(
      "Nguyen Hoang Anh Thu",
      "Nguyen Hoang Bao Thu Linh",
    );
    // 3 matched (nguyen, hoang, thu) of 4 needed → reject
    expect(r.matched).toEqual(
      expect.arrayContaining(["nguyen", "hoang", "thu"]),
    );
    expect(r.ok).toBe(false);
  });
});

describe("certificates · UI helpers", () => {
  it("formats hours human-readably", () => {
    expect(formatHours(60)).toBe("1 phút");
    expect(formatHours(3600)).toBe("1 giờ");
    expect(formatHours(3600 * 17 + 24 * 60)).toBe("17 giờ 24 phút");
    expect(formatHours(0)).toBe("0 phút");
  });

  it("derives a stable short ID", () => {
    expect(shortCertId("a1b2c3d4-0000-0000-0000-000000000000")).toBe(
      "UDM-A1B2",
    );
  });
});
