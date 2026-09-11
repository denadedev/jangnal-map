import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import PrivacyPage from "./page";

afterEach(() => vi.unstubAllEnvs());

it("explains optional contact processing and deletion", () => {
  vi.stubEnv("REPORT_TO_EMAIL", "privacy@example.com");
  render(<PrivacyPage />);

  expect(screen.getByText(/전화번호 또는 이메일/)).toBeInTheDocument();
  expect(screen.getByText(/처리 완료 후 90일 이내/)).toBeInTheDocument();
  expect(screen.getByText(/운영 이메일로 전송/)).toBeInTheDocument();
  expect(screen.getByText(/Umami Analytics/)).toBeInTheDocument();
  expect(screen.getByText(/쿠키를 사용하지 않으며/)).toBeInTheDocument();
  expect(screen.getByText(/방문 페이지, 유입 경로, 브라우저와 기기 유형/)).toBeInTheDocument();
  expect(screen.queryByText(/Formspree/)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "privacy@example.com" })).toHaveAttribute(
    "href",
    "mailto:privacy@example.com?subject=%5B%EC%98%A4%EB%8A%98%EC%9E%A5%EB%82%A0%5D%20%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD",
  );
});
