import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ReportPage from "./page";

afterEach(() => vi.unstubAllEnvs());

describe("report page", () => {
  it("renders a verified market report", async () => {
    render(await ReportPage({
      searchParams: Promise.resolve({ kind: "market", market: "market-45b640ccbe294100" }),
    }));

    expect(screen.getByRole("heading", { name: "운천전통시장 정보가 다른가요?" })).toBeInTheDocument();
    expect(screen.getByText("운천전통시장", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "장날·운영일" })).toBeInTheDocument();
  });

  it("renders a service report without a market", async () => {
    render(await ReportPage({ searchParams: Promise.resolve({ kind: "service" }) }));

    expect(screen.getByRole("heading", { name: "어떤 점이 불편했나요?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "화면·버튼 오류" })).toBeInTheDocument();
  });

  it("rejects an unknown market ID", async () => {
    render(await ReportPage({ searchParams: Promise.resolve({ kind: "market", market: "missing" }) }));

    expect(screen.getByRole("heading", { name: "시장을 다시 선택해 주세요" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "제보 보내기" })).not.toBeInTheDocument();
  });

  it("keeps reporting disabled for whitespace-only SMTP settings", async () => {
    vi.stubEnv("SMTP_USER", " ");
    vi.stubEnv("SMTP_PASS", " ");
    vi.stubEnv("REPORT_TO_EMAIL", " ");

    render(await ReportPage({ searchParams: Promise.resolve({ kind: "service" }) }));

    expect(screen.getByRole("button", { name: "제보 보내기" })).toBeDisabled();
  });
});
