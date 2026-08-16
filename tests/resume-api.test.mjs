import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { createPortalApp } from "../server/index.js";

const enrollmentKeys = {
  "TEST-2026": 2026,
  "TEST-2028": 2028,
};

const testAddress = {
  building: "B-102",
  street: "123 Test Street",
  city: "Mumbai",
  state: "Maharashtra",
  pinCode: "400001",
};

async function startTestServer(app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

async function createFixture(context) {
  const rootDirectory = await mkdtemp(join(tmpdir(), "ccd-portal-api-"));
  const uploadDirectory = join(rootDirectory, "resumes");
  const profileDirectory = join(rootDirectory, "profiles");
  const authDirectory = join(rootDirectory, "auth");
  const app = await createPortalApp({
    uploadDirectory,
    profileDirectory,
    authDirectory,
    enrollmentKeys,
    emailDomain: "spit.ac.in",
  });
  const server = await startTestServer(app);
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(rootDirectory, { recursive: true, force: true });
  });
  const address = server.address();
  return { authDirectory, baseUrl: `http://127.0.0.1:${address.port}`, uploadDirectory };
}

async function completeOnboarding(baseUrl, cookie, overrides = {}, includePhoto = true, suppliedPhoto = null) {
  const body = new FormData();
  const details = {
    dateOfBirth: "2004-06-15",
    gender: "Male",
    permanentAddress: JSON.stringify(testAddress),
    currentAddress: JSON.stringify(testAddress),
    photoDeclaration: "true",
    placementConsent: "true",
    ...overrides,
  };
  for (const [key, value] of Object.entries(details)) body.set(key, value);
  if (includePhoto) {
    const photo = suppliedPhoto ?? await sharp(randomBytes(600 * 600 * 3), {
      raw: { width: 600, height: 600, channels: 3 },
    }).jpeg({ quality: 82 }).toBuffer();
    body.set("profilePhoto", new Blob([photo], { type: "image/jpeg" }), "profile.jpg");
  }
  return fetch(`${baseUrl}/api/onboarding`, {
    method: "POST",
    headers: { Cookie: cookie },
    body,
  });
}

async function registerStudent(baseUrl, { email = "student@spit.ac.in", enrollmentKey = "TEST-2028" } = {}) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Student",
      email,
      personalEmail: "student@example.com",
      mobile: "+919876543210",
      enrollmentKey,
      password: "placement123",
    }),
  });
  const body = await response.json();
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  return { body, cookie, response };
}

test("requires authentication for student data", async (context) => {
  const { baseUrl } = await createFixture(context);
  const [jobsResponse, resumesResponse] = await Promise.all([
    fetch(`${baseUrl}/api/jobs`),
    fetch(`${baseUrl}/api/resumes`),
  ]);
  assert.equal(jobsResponse.status, 401);
  assert.equal(resumesResponse.status, 401);
});

test("registers an invited student and returns only their batch jobs", async (context) => {
  const { authDirectory, baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl, { enrollmentKey: "TEST-2026" });

  assert.equal(registration.response.status, 201);
  assert.equal(registration.body.user.graduationYear, 2026);
  assert.equal(registration.body.user.onboardingComplete, false);
  assert.ok(registration.cookie);

  const gatedJobsResponse = await fetch(`${baseUrl}/api/jobs`, { headers: { Cookie: registration.cookie } });
  assert.equal(gatedJobsResponse.status, 403);

  const onboardingResponse = await completeOnboarding(baseUrl, registration.cookie);
  const onboardingBody = await onboardingResponse.json();
  assert.equal(onboardingResponse.status, 200);
  assert.equal(onboardingBody.user.onboardingComplete, true);
  assert.equal(onboardingBody.user.profile.gender, "Male");
  assert.equal(onboardingBody.user.profile.permanentAddress.city, "Mumbai");
  assert.equal(onboardingBody.user.profile.currentAddress.pinCode, "400001");
  assert.equal(onboardingBody.user.profile.photoDeclaration, true);
  assert.ok(!("storedName" in onboardingBody.user.profile.profilePhoto));

  const jobsResponse = await fetch(`${baseUrl}/api/jobs`, { headers: { Cookie: registration.cookie } });
  const jobsBody = await jobsResponse.json();
  assert.equal(jobsResponse.status, 200);
  assert.deepEqual(jobsBody.jobs.map((job) => job.id), ["bnp", "blackrock", "versor"]);
  assert.ok(jobsBody.jobs.every((job) => !("eligibleYears" in job)));

  const storedUsers = await readFile(join(authDirectory, "users.json"), "utf8");
  assert.doesNotMatch(storedUsers, /placement123/);
  assert.match(storedUsers, /"passwordHash"/);
});

test("rejects invalid enrollment keys", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl, { enrollmentKey: "NOT-A-KEY" });
  assert.equal(registration.response.status, 400);
  assert.equal(registration.body.message, "The enrollment key is invalid or inactive.");
});

test("requires a real profile photo before completing onboarding", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl);
  const response = await completeOnboarding(baseUrl, registration.cookie, {}, false);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Upload a valid profile photo to continue." });
});

test("requires the student to confirm their face is visible", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl);
  const response = await completeOnboarding(baseUrl, registration.cookie, { photoDeclaration: "false" });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Confirm that your face is visible in the profile photo." });
});

test("rejects incomplete structured addresses", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl);
  const invalidAddress = JSON.stringify({ ...testAddress, pinCode: "400" });
  const response = await completeOnboarding(baseUrl, registration.cookie, { currentAddress: invalidAddress });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Enter your complete current address with a valid six-digit PIN code." });
});

test("logs students in and clears their session on logout", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl);
  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: registration.cookie },
  });
  assert.equal(logoutResponse.status, 204);

  const expiredSessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: registration.cookie },
  });
  assert.equal(expiredSessionResponse.status, 401);

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@spit.ac.in", password: "placement123" }),
  });
  assert.equal(loginResponse.status, 200);
  assert.equal((await loginResponse.json()).user.graduationYear, 2028);
  assert.match(loginResponse.headers.get("set-cookie") ?? "", /^ccd_session=/);
});

test("uploads and lists resumes only for the signed-in student", async (context) => {
  const { baseUrl, uploadDirectory } = await createFixture(context);
  const firstStudent = await registerStudent(baseUrl);
  assert.equal((await completeOnboarding(baseUrl, firstStudent.cookie)).status, 200);
  const formData = new FormData();
  formData.set("resume", new Blob(["%PDF-1.4 test resume"], { type: "application/pdf" }), "resume.pdf");

  const uploadResponse = await fetch(`${baseUrl}/api/resumes`, {
    method: "POST",
    headers: { Cookie: firstStudent.cookie },
    body: formData,
  });
  const uploadBody = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201);
  assert.equal(uploadBody.resume.name, "resume.pdf");

  const listResponse = await fetch(`${baseUrl}/api/resumes`, { headers: { Cookie: firstStudent.cookie } });
  const listBody = await listResponse.json();
  assert.equal(listBody.resumes.length, 1);
  assert.equal(await readFile(join(uploadDirectory, listBody.resumes[0].storedName), "utf8"), "%PDF-1.4 test resume");

  const secondStudent = await registerStudent(baseUrl, { email: "another@spit.ac.in" });
  assert.equal((await completeOnboarding(baseUrl, secondStudent.cookie)).status, 200);
  const secondListResponse = await fetch(`${baseUrl}/api/resumes`, { headers: { Cookie: secondStudent.cookie } });
  assert.deepEqual(await secondListResponse.json(), { resumes: [] });
});

test("rejects unsupported resume formats", async (context) => {
  const { baseUrl } = await createFixture(context);
  const registration = await registerStudent(baseUrl);
  assert.equal((await completeOnboarding(baseUrl, registration.cookie)).status, 200);
  const formData = new FormData();
  formData.set("resume", new Blob(["not a resume"], { type: "text/plain" }), "resume.txt");
  const response = await fetch(`${baseUrl}/api/resumes`, {
    method: "POST",
    headers: { Cookie: registration.cookie },
    body: formData,
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Choose a PDF, DOC, or DOCX resume." });
});
