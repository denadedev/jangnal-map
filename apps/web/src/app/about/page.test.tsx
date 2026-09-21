import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPage from "./page";

describe("AboutPage", () => {
  it("explains the service, sources, editorial rules, and corrections", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: "오늘 장날 서비스 소개" })).toBeInTheDocument();
    expect(screen.getByText(/운영 주체: 오늘 장날 운영자/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "데이터 출처와 편집 기준" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정보 수정과 제보" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "정보 수정 제보" })).toHaveAttribute("href", "/report?kind=service");
  });
});
