import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce Docker image size and memory footprint for self-hosting
  output: "standalone",

  // Hide Next.js version fingerprint
  poweredByHeader: false,

  // Strict mode for React
  reactStrictMode: true,

  experimental: {
    // Optimize imports for large icon/UI libraries
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },

  // Security headers incl. strict Content Security Policy
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.openrouter.ai https://generativelanguage.googleapis.com https://api.groq.com https://api-inference.huggingface.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
