import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createResumeApp } from "../server/index.js";

async function startTestServer(app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

test("uploads and lists a PDF resume", async (context) => {
  const uploadDirectory = await mkdtemp(join(tmpdir(), "ccd-resume-api-"));
  const app = await createResumeApp({ uploadDirectory });
  const server = await startTestServer(app);

  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(uploadDirectory, { recursive: true, force: true });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const formData = new FormData();
  formData.set("resume", new Blob(["%PDF-1.4 test resume"], { type: "application/pdf" }), "resume.pdf");

  const uploadResponse = await fetch(`${baseUrl}/api/resumes`, { method: "POST", body: formData });
  assert.equal(uploadResponse.status, 201);
  const uploadBody = await uploadResponse.json();
  assert.equal(uploadBody.resume.name, "resume.pdf");

  const listResponse = await fetch(`${baseUrl}/api/resumes`);
  const listBody = await listResponse.json();
  assert.equal(listBody.resumes.length, 1);
  assert.equal(listBody.resumes[0].name, "resume.pdf");
  assert.equal(await readFile(join(uploadDirectory, listBody.resumes[0].storedName), "utf8"), "%PDF-1.4 test resume");
});

test("rejects unsupported resume formats", async (context) => {
  const uploadDirectory = await mkdtemp(join(tmpdir(), "ccd-resume-api-"));
  const app = await createResumeApp({ uploadDirectory });
  const server = await startTestServer(app);

  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(uploadDirectory, { recursive: true, force: true });
  });

  const address = server.address();
  const formData = new FormData();
  formData.set("resume", new Blob(["not a resume"], { type: "text/plain" }), "resume.txt");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/resumes`, { method: "POST", body: formData });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Choose a PDF, DOC, or DOCX resume." });
});
