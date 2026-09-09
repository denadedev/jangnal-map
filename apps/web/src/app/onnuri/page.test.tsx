import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OnnuriPage, { metadata } from "./page";

describe("온누리상품권 허브", () => {
  it("온누리상품권 검색을 위한 고유 메타데이터를 제공한다", () => {
    expect(metadata.title).toBe("온누리상품권 사용처·가맹점 찾기 | 오늘 장날");
    expect(metadata.alternates?.canonical).toBe("/onnuri");
    expect(metadata.description).toContain("전체·디지털·지류 가맹점 수");
  });

  it("간결한 이용안내와 공식 가맹점 찾기 링크를 제공한다", () => {
    render(<OnnuriPage />);

    expect(screen.getByRole("heading", { level: 1, name: "온누리상품권 이용안내" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "디지털형과 지류형" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "시장별 가맹점 찾기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "가맹점이 많은 전통시장" })).not.toBeInTheDocument();
    const officialLink = screen.getByRole("link", { name: "공식 온누리 가맹점 찾기" });
    expect(officialLink).toHaveAttribute("href", "https://www.onnuri.gift/place");
    expect(officialLink).not.toHaveAttribute("target");
  });
});
