import { describe, expect, it } from "vitest";

import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows five per ten minutes for each key", () => {
    const allow = createRateLimiter(5, 10 * 60 * 1000);
    for (let i = 0; i < 5; i += 1) expect(allow("a", i)).toBe(true);
    expect(allow("a", 6)).toBe(false);
    expect(allow("b", 6)).toBe(true);
    expect(allow("a", 10 * 60 * 1000 + 1)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the proxy's X-Real-Ip, then the last X-Forwarded-For hop", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9" } }))).toBe("1.1.1.1");
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "9.9.9.9, 2.2.2.2" } }))).toBe("2.2.2.2");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
