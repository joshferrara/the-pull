// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  transpilePackages: ["@the-pull/schema", "@the-pull/shared"],
  // Pin the monorepo root so Next.js doesn't accidentally pick the home-dir lockfile.
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

initOpenNextCloudflareForDev();

export default nextConfig;
