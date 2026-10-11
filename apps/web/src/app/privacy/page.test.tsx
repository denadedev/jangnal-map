import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import PrivacyPage from "./page";

const hubHtml = `<html><body><article class="document"><h1>개인정보 처리방침</h1>
<section id="section-3"><h2>3. Google AdSense</h2><p>광고 쿠키 안내</p></section></article></body></html>`;

afterEach(() => vi.unstubAllGlobals());

it("renders the legal hub privacy policy on the site domain", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(hubHtml)));
  render(await PrivacyPage());

  expect(screen.getByRole("heading", { level: 1, name: "개인정보 처리방침" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "3. Google AdSense" })).toBeInTheDocument();
});

it("links to the hub document when it cannot be loaded", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
  render(await PrivacyPage());

  expect(screen.getByRole("link", { name: "개인정보 처리방침 원문 보기" })).toHaveAttribute(
    "href",
    "https://legal-hub.denadedev.workers.dev/kmarketday/privacy/",
  );
});
