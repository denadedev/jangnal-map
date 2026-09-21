import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "./layout";

describe("Umami Analytics", () => {
  it("renders the tracker for the production domain", () => {
    const html = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    const document = new DOMParser().parseFromString(html, "text/html");
    const tracker = document.querySelector(
      'script[src="https://analytics.spamfam.kr/script.js"]',
    );

    expect(tracker?.getAttribute("data-website-id")).toBe(
      "17d5f5df-067f-4606-82ba-a8471bf84d28",
    );
    expect(tracker?.getAttribute("data-domains")).toBe("jangnal.spamfam.kr");
    expect(tracker?.getAttribute("data-exclude-search")).toBe("true");
  });
});

describe("AdSense", () => {
  it("uses ownership metadata without loading AdSense ads", () => {
    const html = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    const document = new DOMParser().parseFromString(html, "text/html");

    expect(metadata.other?.["google-adsense-account"]).toBe("ca-pub-3237088758901901");
    expect(html).not.toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
    expect(document.querySelector('meta[name="google-adsense-account"]')).toBeNull();
  });
});
