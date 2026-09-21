import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("exposes trust and correction links", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "서비스 소개" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "데이터 출처와 편집 기준" })).toHaveAttribute("href", "/about#data-policy");
    expect(screen.getByRole("link", { name: "정보 수정 제보" })).toHaveAttribute("href", "/report?kind=service");
  });
});
