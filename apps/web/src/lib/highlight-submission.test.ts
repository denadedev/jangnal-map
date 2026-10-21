import { describe, expect, it } from "vitest";

import { highlightNameKey, parseHighlightSubmission } from "./highlight-submission";

describe("parseHighlightSubmission", () => {
  it("tidies spaces and drops an empty description", () => {
    expect(parseHighlightSubmission({ name: "  안동   간고등어 ", description: "  ", category: "specialty" }))
      .toEqual({ name: "안동 간고등어", description: null, category: "specialty" });
  });

  it.each([
    [{ name: "", category: "food" }],
    [{ name: "가".repeat(31), category: "food" }],
    [{ name: "국밥", description: "가".repeat(101), category: "food" }],
    [{ name: "국밥", category: "맛집" }],
    [{ name: "국밥" }],
  ])("rejects %j", (body) => {
    expect(parseHighlightSubmission(body)).toBeNull();
  });

  it("counts characters, not UTF-16 units", () => {
    expect(parseHighlightSubmission({ name: "🍜".repeat(30), category: "food" })).not.toBeNull();
  });

  it("compares names without spaces", () => {
    expect(highlightNameKey(" 안동 간 고등어 ")).toBe("안동간고등어");
  });
});
