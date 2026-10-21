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
  it("takes the first X-Forwarded-For hop, then X-Real-Ip", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "10.0.0.5", "x-forwarded-for": "9.9.9.9, 10.0.0.5" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "1.1.1.1" } }))).toBe("1.1.1.1");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
