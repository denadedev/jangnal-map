import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage SEO", () => {
  it("renders WebSite structured data with the preferred site name", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain(
      '{"@context":"https://schema.org","@type":"WebSite","name":"오늘 장날","alternateName":["장날 지도","오늘장날"],"url":"https://jangnal.spamfam.kr"}',
    );
  });
});
