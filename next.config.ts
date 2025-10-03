import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);

module.exports = {
  eslint: {
    // Waarschuwing: dit negeert ESLint errors tijdens productie builds
    ignoreDuringBuilds: true,
  },
  // Je andere config...
}