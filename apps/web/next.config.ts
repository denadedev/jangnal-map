import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jangnal-map.vercel.app" }],
        destination: "https://jangnal.spamfam.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
