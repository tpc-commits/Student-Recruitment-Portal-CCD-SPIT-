import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function renderHomePage() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the student portal shell", async () => {
  const response = await renderHomePage();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Student Recruitment Portal<\/title>/i);
  assert.match(html, /Good afternoon, Aarav/);
  assert.match(html, /Job Profiles/);
  assert.match(html, /My Profile/);
  assert.doesNotMatch(html, /codex-preview|Starter Project|SkeletonPreview/i);
});

test("keeps the required application and deployment files", async () => {
  await Promise.all([
    access(new URL("app/page.tsx", projectRoot)),
    access(new URL("components/student-portal/StudentPortal.tsx", projectRoot)),
    access(new URL("styles/student-portal.css", projectRoot)),
    access(new URL("styles/ccd-theme.css", projectRoot)),
    access(new URL("server/index.js", projectRoot)),
    access(new URL("public/ccd-logo-light.png", projectRoot)),
    access(new URL("public/ccd-logo.png", projectRoot)),
    access(new URL("public/og.png", projectRoot)),
    access(new URL(".openai/hosting.json", projectRoot)),
    access(new URL("worker/index.ts", projectRoot)),
  ]);

  const portalSource = await readFile(
    new URL("components/student-portal/StudentPortal.tsx", projectRoot),
    "utf8",
  );
  assert.match(portalSource, /Imported from Exam Cell/);
  assert.match(portalSource, /Academic Correction Request/);
  assert.match(portalSource, /JobProfilesPage/);
  assert.match(portalSource, /\/ccd-logo-light\.png/);
  assert.match(portalSource, /\/api\/resumes/);
  assert.match(portalSource, /Open my profile/);
  assert.match(portalSource, /Go to homepage/);
});
