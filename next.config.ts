import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` (no Node server required).
  output: "export",
  // GitHub Pages project sites are served from /<repo>; the deploy workflow
  // passes that prefix in. Empty for user/org pages or custom domains.
  basePath: process.env.PAGES_BASE_PATH,
  // The default image loader needs a server, so images are served as-is.
  images: { unoptimized: true },
  // Emit /about/index.html so GitHub Pages resolves `/about` without rewrites.
  trailingSlash: true,
}

export default nextConfig
