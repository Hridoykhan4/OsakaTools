import type { NextConfig } from "next";

// Browser requests go to /api on the website's own origin and are proxied to the
// backend service. Server components call API_INTERNAL_URL directly.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://localhost:5000/api";
const indexable = process.env.SITE_INDEXABLE === "true";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Staging and previews stay out of search indexes until production is approved.
  ...(indexable ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Optional separate build directory for local verification builds.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  poweredByHeader: false,
  htmlLimitedBots: /.*/,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/:path*` }];
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/resources", permanent: true },
      { source: "/blog/:slug", destination: "/resources/:slug", permanent: true },
      { source: "/services", destination: "/distribution", permanent: true },
      { source: "/projects", destination: "/industries", permanent: true },
      { source: "/products/directory", destination: "/products", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "www.osakatool.com" }], destination: "https://osakatool.com/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
      ] },
    ];
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.primegadgets.ae" },
    ],
  },
};

export default nextConfig;
