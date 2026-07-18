import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode indicator badge defaults to the bottom-left corner,
  // which sits directly on top of our own bottom nav's "Home" tab on
  // mobile widths. Dev-only (never renders in production) — disabled
  // here purely so it doesn't visually clash while testing locally.
  devIndicators: false,
};

export default nextConfig;
