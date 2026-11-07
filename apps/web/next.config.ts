import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // 하단 탭을 오갈 때 30초 안에 다시 연 화면은 서버에 다시 묻지 않고 바로 보여 준다.
  experimental: { staleTimes: { dynamic: 30 } },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "spamfam.kr" }],
        destination: "https://kmarketday.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "jangnal-map.vercel.app" }],
        destination: "https://kmarketday.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "jangnal.spamfam.kr" }],
        destination: "https://kmarketday.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
