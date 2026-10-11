import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import TermsPage from "./page";

const hubHtml = `<html><body><article class="document"><h1>이용약관</h1>
<section id="section-1"><h2>1. 목적</h2><p>약관 본문</p></section></article></body></html>`;

afterEach(() => vi.unstubAllGlobals());

it("renders the legal hub terms on the site domain", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(hubHtml));
  vi.stubGlobal("fetch", fetchMock);
  render(await TermsPage());

  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://legal-hub.denadedev.workers.dev/kmarketday/terms/");
  expect(screen.getByRole("heading", { level: 1, name: "이용약관" })).toBeInTheDocument();
  expect(screen.getByText("약관 본문")).toBeInTheDocument();
});
