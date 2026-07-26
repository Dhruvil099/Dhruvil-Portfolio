import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/research", destination: "/blogs", permanent: true },
      { source: "/research/:slug", destination: "/blogs/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
