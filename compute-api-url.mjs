// Which Worker the app talks to, decided at build time and baked into the bundle
// (next.config.mjs passes the result to the browser as NEXT_PUBLIC_API_URL). Pure, so it is
// testable with plain `node --test` (see compute-api-url.test.mjs).
//
// Netlify sets CONTEXT and REVIEW_ID on every build by itself, with nothing configured in
// this repo. REVIEW_ID is the pull request number, which lines up with the Worker that
// .github/workflows/preview-worker.yml deploys for that PR, so a PR's Netlify preview points
// at that PR's own preview Worker automatically.

// <name>.<account's workers.dev subdomain>. The subdomain is the same one the VR repo uses.
export const WORKERS_SUBDOMAIN = "noahwright87";
export const WORKER_NAME = "bet-on-anything";

export const PRODUCTION_API_URL = `https://${WORKER_NAME}.${WORKERS_SUBDOMAIN}.workers.dev`;
export const LOCAL_API_URL = "http://localhost:8787"; // `npm run dev` in worker/

export const previewApiUrl = (prNumber) => `https://${WORKER_NAME}-pr-${prNumber}.${WORKERS_SUBDOMAIN}.workers.dev`;

/** `env` is process.env. An explicit NEXT_PUBLIC_API_URL always wins (e.g. to try another Worker). */
export function computeApiUrl(env = {}) {
  if (env.NEXT_PUBLIC_API_URL) return env.NEXT_PUBLIC_API_URL;
  if (env.CONTEXT === "deploy-preview" && env.REVIEW_ID) return previewApiUrl(env.REVIEW_ID);
  if (env.CONTEXT) return PRODUCTION_API_URL; // any other Netlify build (production, branch deploys)
  return LOCAL_API_URL; // not on Netlify: local dev
}
