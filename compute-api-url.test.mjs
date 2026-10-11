import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCAL_API_URL, PRODUCTION_API_URL, computeApiUrl } from "./compute-api-url.mjs";

test("local dev talks to wrangler dev", () => {
  assert.equal(computeApiUrl({}), LOCAL_API_URL);
  assert.equal(computeApiUrl(), LOCAL_API_URL);
});

test("a PR's deploy preview talks to that PR's own Worker", () => {
  assert.equal(
    computeApiUrl({ CONTEXT: "deploy-preview", REVIEW_ID: "42" }),
    "https://bet-on-anything-pr-42.noahwright87.workers.dev",
  );
});

test("production and branch deploys talk to the production Worker", () => {
  assert.equal(computeApiUrl({ CONTEXT: "production" }), PRODUCTION_API_URL);
  assert.equal(computeApiUrl({ CONTEXT: "branch-deploy" }), PRODUCTION_API_URL);
  assert.equal(PRODUCTION_API_URL, "https://bet-on-anything.noahwright87.workers.dev");
});

test("a preview build without a PR number falls back to production", () => {
  assert.equal(computeApiUrl({ CONTEXT: "deploy-preview" }), PRODUCTION_API_URL);
});

test("an explicit NEXT_PUBLIC_API_URL beats everything", () => {
  const env = { NEXT_PUBLIC_API_URL: "http://example.test", CONTEXT: "deploy-preview", REVIEW_ID: "1" };
  assert.equal(computeApiUrl(env), "http://example.test");
});
