import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportForm } from "./report-form";

describe("ReportForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("submits an anonymous market report with verified market context", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ReportForm
        supportEmail="help@example.com"
        configured
        scope="market"
        market={{ id: "market-45b640ccbe294100", name: "운천전통시장" }}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "장날·운영일" }));
    await user.type(screen.getByLabelText("알려주실 내용"), "실제 장날은 5일과 10일입니다.");
    await user.click(screen.getByRole("button", { name: "제보 보내기" }));

    expect(await screen.findByRole("status")).toHaveTextContent("제보를 받았습니다.");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      scope: "market",
      market_id: "market-45b640ccbe294100",
      market_name: "운천전통시장",
    });
  });

  it("requires consent only when contact is entered", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ReportForm configured supportEmail="help@example.com" scope="service" market={null} />);

    await user.click(screen.getByRole("radio", { name: "화면·버튼 오류" }));
    await user.type(screen.getByLabelText("알려주실 내용"), "검색 버튼을 눌러도 반응이 없습니다.");
    await user.type(screen.getByLabelText(/답변받을 연락처/), "010-1234-5678");
    await user.click(screen.getByRole("button", { name: "제보 보내기" }));

    expect(screen.getByText("연락처를 남기려면 개인정보 수집에 동의해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "연락처 수집·이용에 동의합니다." })).toHaveAttribute(
      "aria-describedby",
      "contact-consent-error",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps input values when submission fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    render(<ReportForm configured supportEmail="help@example.com" scope="service" market={null} />);

    await user.click(screen.getByRole("radio", { name: "지도·위치 문제" }));
    await user.type(screen.getByLabelText("알려주실 내용"), "현재 위치 버튼이 동작하지 않습니다.");
    await user.click(screen.getByRole("button", { name: "제보 보내기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("제보를 보내지 못했습니다.");
    expect(screen.getByLabelText("알려주실 내용")).toHaveValue("현재 위치 버튼이 동작하지 않습니다.");
  });

  it("offers the support email when the mail endpoint limits requests", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    render(
      <ReportForm configured supportEmail="help@example.com" scope="market" market={{ id: "market-45b640ccbe294100", name: "운천전통시장" }} />,
    );

    await user.click(screen.getByRole("radio", { name: "장날·운영일" }));
    await user.type(screen.getByLabelText("알려주실 내용"), "실제 장날은 5일과 10일입니다.");
    await user.type(screen.getByLabelText(/관련 홈페이지 주소/), "https://example.com/notice");
    await user.click(screen.getByRole("button", { name: "제보 보내기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("현재 제보 요청이 많아");
    const fallbackHref = screen.getByRole("link", { name: "help@example.com" }).getAttribute("href") ?? "";
    const decodedHref = decodeURIComponent(fallbackHref);
    expect(decodedHref).toContain("mailto:help@example.com");
    expect(decodedHref).toContain("운천전통시장 (market-45b640ccbe294100)");
    expect(decodedHref).toContain("장날·운영일");
    expect(decodedHref).toContain("https://example.com/notice");
    expect(screen.getByLabelText("알려주실 내용")).toHaveValue("실제 장날은 5일과 10일입니다.");
  });

  it("announces submission progress", async () => {
    const user = userEvent.setup();
    let finishRequest: ((value: { ok: boolean; status: number }) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((resolve) => { finishRequest = resolve; })));
    render(<ReportForm configured supportEmail="help@example.com" scope="service" market={null} />);

    await user.click(screen.getByRole("radio", { name: "기타" }));
    await user.type(screen.getByLabelText("알려주실 내용"), "글자가 너무 작습니다.");
    await user.click(screen.getByRole("button", { name: "제보 보내기" }));

    expect(screen.getByRole("status")).toHaveTextContent("제보를 보내는 중입니다.");
    finishRequest?.({ ok: true, status: 200 });
    expect(await screen.findByText("제보를 받았습니다.")).toBeInTheDocument();
  });

  it("disables submission when SMTP is not configured", () => {
    render(<ReportForm configured={false} supportEmail="help@example.com" scope="service" market={null} />);

    expect(screen.getByText("제보 접수를 준비하고 있습니다. 잠시 후 다시 이용해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "제보 보내기" })).toBeDisabled();
  });
});
