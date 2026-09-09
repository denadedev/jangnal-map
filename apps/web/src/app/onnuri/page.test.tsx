import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OnnuriPage, { metadata } from "./page";

describe("온누리상품권 허브", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("온누리상품권 검색을 위한 고유 메타데이터를 제공한다", () => {
    expect(metadata.title).toBe("온누리상품권 사용처·가맹점 찾기 | 오늘 장날");
    expect(metadata.alternates?.canonical).toBe("/onnuri");
    expect(metadata.description).toContain("전체·디지털·지류 가맹점 수");
  });

  it("이용안내와 주요 시장 링크를 서버 콘텐츠로 제공한다", () => {
    render(<OnnuriPage />);

    expect(screen.getByRole("heading", { level: 1, name: "온누리상품권 사용처 찾기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "디지털형과 지류형" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "가맹점이 많은 전통시장" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /가맹점 .*곳/ })).toHaveLength(12);
  });
});
