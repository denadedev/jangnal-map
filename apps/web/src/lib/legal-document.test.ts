import { afterEach, describe, expect, it, vi } from "vitest";

import { extractLegalDocumentHtml, fetchLegalDocumentHtml, LEGAL_HUB_URL } from "./legal-document";

const hubHtml = `<!doctype html><html><head><link rel="stylesheet" href="/styles.css"></head><body>
<header class="site-header"><a href="/" class="brand">Legal Hub</a></header>
<main><article class="document"><nav class="breadcrumbs"><a href="/">서비스 문서</a><span>/</span><a href="/kmarketday/">오늘 장날</a></nav>
<div class="eyebrow">오늘 장날</div><h1>개인정보 처리방침</h1>
<div class="operator"><span>문의</span><strong>denadedev@gmail.com</strong></div>
<section id="section-1"><h2>1. 처리 목적</h2><p onclick="alert(1)">본문</p><script>alert(1)</script></section>
<div class="document-actions"><a href="/kmarketday/history/">변경 이력 보기</a><button type="button" onclick="window.print()">인쇄</button></div></article></main>
<footer>법률 문서</footer></body></html>`;

afterEach(() => vi.unstubAllGlobals());

describe("extractLegalDocumentHtml", () => {
  it("keeps the document body without hub chrome", () => {
    const html = extractLegalDocumentHtml(hubHtml);

    expect(html).toContain("<h1>개인정보 처리방침</h1>");
    expect(html).toContain('<section id="section-1">');
    expect(html).toContain("denadedev@gmail.com");
    expect(html).not.toContain("breadcrumbs");
    expect(html).not.toContain("Legal Hub");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("법률 문서");
  });

  it("removes scripts and inline event handlers", () => {
    const html = extractLegalDocumentHtml(hubHtml);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
  });

  it("points hub-relative links to the hub domain", () => {
    expect(extractLegalDocumentHtml(hubHtml)).toContain(`href="${LEGAL_HUB_URL}/kmarketday/history/"`);
  });

  it("returns undefined when the document article is missing", () => {
    expect(extractLegalDocumentHtml("<html><body>없음</body></html>")).toBeUndefined();
  });
});

describe("fetchLegalDocumentHtml", () => {
  it("fetches the service document from the hub", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(hubHtml));
    vi.stubGlobal("fetch", fetchMock);

    const html = await fetchLegalDocumentHtml("privacy");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${LEGAL_HUB_URL}/kmarketday/privacy/`);
    expect(html).toContain("<h1>개인정보 처리방침</h1>");
  });

  it("returns undefined when the hub responds with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    expect(await fetchLegalDocumentHtml("terms")).toBeUndefined();
  });

  it("returns undefined when the hub is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    expect(await fetchLegalDocumentHtml("terms")).toBeUndefined();
  });
});
