import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
