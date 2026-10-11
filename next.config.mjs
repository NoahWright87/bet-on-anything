import { computeApiUrl } from "./compute-api-url.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baked into the browser bundle: which Worker this build talks to (see compute-api-url.mjs).
  env: { NEXT_PUBLIC_API_URL: computeApiUrl(process.env) },
};

export default nextConfig;
