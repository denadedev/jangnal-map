import { describe, expect, it } from "vitest";

import { SITE_HOST, SITE_URL } from "./site-config";

describe("site configuration", () => {
  it("uses the canonical public URL and hostname", () => {
    expect(SITE_URL).toBe("https://kmarketday.com");
    expect(SITE_HOST).toBe("kmarketday.com");
  });
});
