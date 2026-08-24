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

  // Skip the Next.js serverless proxy hop — forward auth API calls straight to Express.
  async rewrites() {
    const api = (process.env.API_URL || "http://localhost:3001").replace(
      /\/$/,
      ""
    );
    return [
      { source: "/api/student/:path*", destination: `${api}/api/student/:path*` },
      { source: "/api/admin/:path*", destination: `${api}/api/admin/:path*` },
      {
        source: "/api/payments/:path*",
        destination: `${api}/api/payments/:path*`,
      },
      { source: "/api/courses", destination: `${api}/api/courses` },
      { source: "/api/courses/:id", destination: `${api}/api/courses/:id` },
      { source: "/api/contact", destination: `${api}/api/contact` },
      { source: "/api/apply", destination: `${api}/api/apply` },
    ];
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
