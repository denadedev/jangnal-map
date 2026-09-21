import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("AdSense readiness", () => {
  it("publishes the exact authorized seller line", () => {
    const value = readFileSync(join(process.cwd(), "public/ads.txt"), "utf8");

    expect(value).toBe("google.com, pub-3237088758901901, DIRECT, f08c47fec0942fa0\n");
  });
});
