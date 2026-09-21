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
        destination: "https://spamfam.kr/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "jangnal.spamfam.kr" }],
        destination: "https://spamfam.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
