import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OnnuriMerchantSummary } from "../lib/market";
import { OnnuriSummary } from "./onnuri-summary";

const summary: OnnuriMerchantSummary = {
  totalCount: 83,
  digitalCount: 71,
  paperCount: 65,
  referenceDate: "2025-07-31",
  source: {
    name: "소상공인시장진흥공단 전국 온누리상품권 가맹점 현황",
    url: "https://www.data.go.kr/data/3060079/fileData.do?recommendDataYn=Y",
  },
};

describe("OnnuriSummary", () => {
  it("전체·디지털·지류 가맹점 수와 기준일을 표시한다", () => {
    render(<OnnuriSummary marketName="운천전통시장" summary={summary} headingLevel={3} />);

    expect(screen.getByRole("heading", { level: 3, name: "온누리상품권" })).toBeInTheDocument();
    expect(screen.getByText("가맹점 총 83곳")).toBeInTheDocument();
    expect(screen.getByText("디지털 71곳")).toBeInTheDocument();
    expect(screen.getByText("지류 65곳")).toBeInTheDocument();
    expect(screen.getByText("2025.07.31 기준")).toBeInTheDocument();
  });

  it("집계가 없으면 0곳 대신 확인 필요 상태와 공식 링크를 표시한다", () => {
    render(<OnnuriSummary marketName="운천전통시장" summary={null} headingLevel={2} />);

    expect(screen.getByRole("heading", { level: 2, name: "온누리상품권" })).toBeInTheDocument();
    expect(screen.getByText("가맹점 수 확인 필요")).toBeInTheDocument();
    expect(screen.queryByText("0곳")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공식 가맹점 찾기" })).toHaveAttribute(
      "href",
      "https://www.onnuri.gift/place",
    );
    expect(screen.getByRole("link", { name: "공식 가맹점 찾기" })).not.toHaveAttribute("target");
    expect(screen.getByText(/방문 전 공식 가맹점 찾기에서 확인/)).toBeInTheDocument();
  });
});
