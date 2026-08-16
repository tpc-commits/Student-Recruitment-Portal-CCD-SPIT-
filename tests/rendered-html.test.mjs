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

test("server-renders the student access screen", async () => {
  const response = await renderHomePage();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Student Recruitment Portal<\/title>/i);
  assert.match(html, /Welcome back/);
  assert.match(html, /Student Recruitment Portal/);
  assert.match(html, /Checking your session/);
  assert.doesNotMatch(html, /codex-preview|Starter Project|SkeletonPreview/i);
});

test("keeps the required application and deployment files", async () => {
  await Promise.all([
    access(new URL("app/page.tsx", projectRoot)),
    access(new URL("components/StudentRecruitmentApp.tsx", projectRoot)),
    access(new URL("components/auth/AuthScreen.tsx", projectRoot)),
    access(new URL("components/onboarding/ProfilePhotoCropper.tsx", projectRoot)),
    access(new URL("components/onboarding/StudentOnboarding.tsx", projectRoot)),
    access(new URL("components/student-portal/StudentPortal.tsx", projectRoot)),
    access(new URL("styles/student-portal.css", projectRoot)),
    access(new URL("styles/ccd-theme.css", projectRoot)),
    access(new URL("styles/onboarding.css", projectRoot)),
    access(new URL("server/index.js", projectRoot)),
    access(new URL("services/image-crop.ts", projectRoot)),
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
  assert.match(portalSource, /mini-avatar profile-photo/);
  assert.match(portalSource, /Notifications/);
  assert.match(portalSource, /Scrollable recruitment timeline/);
  assert.match(portalSource, /RecruitmentCalendarPage/);
  assert.doesNotMatch(portalSource, /stat-card-grid|metric-card/);
  assert.doesNotMatch(portalSource, /\{ id: "calendar", label:/);
  assert.match(portalSource, /Go to homepage/);
  assert.match(portalSource, /Sign out/);

  const onboardingSource = await readFile(
    new URL("components/onboarding/StudentOnboarding.tsx", projectRoot),
    "utf8",
  );
  assert.match(onboardingSource, /ProfilePhotoCropper/);
  assert.match(onboardingSource, /I confirm that my face is clearly visible/);
  assert.match(onboardingSource, /Building \/ Flat \/ House/);
  assert.match(onboardingSource, /onboarding-step-button/);
  assert.doesNotMatch(onboardingSource, /MediaPipe|validateProfileFace|face-validation/);
});
