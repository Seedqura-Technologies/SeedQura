import type { NextConfig } from "next";
import path from "node:path";
import os from "node:os";

const isDev = process.env.NODE_ENV === "development";

const cacheDir =
  process.env.NEXT_DIST_DIR ??
  (isDev ? path.join(os.homedir(), ".cache", "seedqura-next") : ".next");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["72.60.206.223"],
  // Dev cache on local disk — external drives (T7) corrupt .next after HMR.
  distDir: cacheDir,
  // Explicit empty turbopack config so `next build` works alongside webpack watchOptions.
  turbopack: {},

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Experimental perf flags
  experimental: {
    // Optimize package imports so only used exports are bundled
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/postprocessing",
    ],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.git/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
