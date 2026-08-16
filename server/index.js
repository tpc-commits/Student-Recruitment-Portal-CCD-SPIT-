import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import sharp from "sharp";
import { AuthError, createAuthService } from "./auth.js";
import { getJobsForYear } from "./jobs.js";

const allowedResumeTypes = new Map([
  ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

const defaultUploadDirectory = fileURLToPath(new URL("../uploads/resumes", import.meta.url));
const defaultProfileDirectory = fileURLToPath(new URL("../uploads/profiles", import.meta.url));
const defaultAuthDirectory = fileURLToPath(new URL("../data/local", import.meta.url));
const sessionCookieName = "ccd_session";
const sessionDurationMs = 8 * 60 * 60 * 1000;
const developmentEnrollmentKeys = {
  "CCD-2026-DEMO": 2026,
  "CCD-2027-DEMO": 2027,
  "CCD-2028-DEMO": 2028,
  "CCD-2029-DEMO": 2029,
};

async function readResumeIndex(indexPath) {
  try {
    return JSON.parse(await readFile(indexPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeResumeIndex(indexPath, resumes) {
  const temporaryPath = `${indexPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(resumes, null, 2));
  await rename(temporaryPath, indexPath);
}

async function validateProfilePhoto(file) {
  try {
    const image = sharp(file.path, { failOn: "error" });
    const metadata = await image.metadata();
    const width = metadata.autoOrient?.width ?? metadata.width ?? 0;
    const height = metadata.autoOrient?.height ?? metadata.height ?? 0;

    if (!["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new AuthError("The uploaded file is not a supported photo.");
    }

    return {
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storedName: file.filename,
      width,
      height,
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("The uploaded file could not be read as a valid photo.");
  }
}

function enrollmentKeysFromEnvironment() {
  const configuredKeys = process.env.ENROLLMENT_KEYS_JSON;
  if (!configuredKeys) return developmentEnrollmentKeys;

  const parsedKeys = JSON.parse(configuredKeys);
  return Object.fromEntries(
    Object.entries(parsedKeys).map(([key, graduationYear]) => [
      key.trim().toUpperCase(),
      Number(graduationYear),
    ]),
  );
}

function readCookie(request, name) {
  const cookies = request.headers.cookie?.split(";") ?? [];
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split("=");
    if (cookieName === name) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

function setSessionCookie(response, token) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionDurationMs,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function createPortalApp({
  uploadDirectory = defaultUploadDirectory,
  profileDirectory = defaultProfileDirectory,
  authDirectory = defaultAuthDirectory,
  clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  enrollmentKeys = enrollmentKeysFromEnvironment(),
  emailDomain = process.env.COLLEGE_EMAIL_DOMAIN ?? "spit.ac.in",
} = {}) {
  await mkdir(uploadDirectory, { recursive: true });
  await mkdir(profileDirectory, { recursive: true });
  const indexPath = join(uploadDirectory, "index.json");
  const authService = await createAuthService({
    storageDirectory: authDirectory,
    enrollmentKeys,
    emailDomain,
  });
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDirectory,
      filename(_request, file, callback) {
        callback(null, `${randomUUID()}${allowedResumeTypes.get(file.mimetype) ?? extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter(_request, file, callback) {
      callback(null, allowedResumeTypes.has(file.mimetype));
    },
  });
  const profileUpload = multer({
    storage: multer.diskStorage({
      destination: profileDirectory,
      filename(_request, file, callback) {
        callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: 3 * 1024 * 1024, files: 1 },
    fileFilter(_request, file, callback) {
      if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(null, true);
      callback(new AuthError("Choose a JPG, PNG, or WEBP profile photo."));
    },
  });

  app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", clientOrigin);
    response.header("Access-Control-Allow-Credentials", "true");
    response.header("Access-Control-Allow-Headers", "Content-Type");
    response.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "32kb" }));

  async function requireStudent(request, response, next) {
    try {
      const student = await authService.authenticate(readCookie(request, sessionCookieName));
      if (!student) return response.status(401).json({ message: "Sign in to continue." });
      request.student = student;
      next();
    } catch (error) {
      next(error);
    }
  }

  function requireCompletedOnboarding(request, response, next) {
    if (!request.student.onboardingComplete) {
      return response.status(403).json({ message: "Complete student onboarding to continue." });
    }
    next();
  }

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/api/auth/register", async (request, response, next) => {
    try {
      const result = await authService.register(request.body ?? {});
      setSessionCookie(response, result.token);
      response.status(201).json({ user: result.user });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (request, response, next) => {
    try {
      const result = await authService.login(request.body ?? {});
      setSessionCookie(response, result.token);
      response.json({ user: result.user });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", requireStudent, (request, response) => {
    response.json({ user: request.student });
  });

  app.post("/api/auth/logout", (request, response) => {
    authService.logout(readCookie(request, sessionCookieName));
    response.clearCookie(sessionCookieName, { path: "/" });
    response.sendStatus(204);
  });

  app.post("/api/onboarding", requireStudent, profileUpload.single("profilePhoto"), async (request, response, next) => {
    try {
      const profilePhoto = request.file ? await validateProfilePhoto(request.file) : null;
      const user = await authService.completeOnboarding(request.student.id, request.body ?? {}, profilePhoto);
      response.json({ user });
    } catch (error) {
      if (request.file) await unlink(request.file.path).catch(() => undefined);
      next(error);
    }
  });

  app.get("/api/profile/photo", requireStudent, requireCompletedOnboarding, async (request, response, next) => {
    try {
      const profilePhoto = await authService.getProfilePhoto(request.student.id);
      if (!profilePhoto) return response.status(404).json({ message: "Profile photo not found." });
      response.type(profilePhoto.mimeType).sendFile(join(profileDirectory, profilePhoto.storedName));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs", requireStudent, requireCompletedOnboarding, (request, response) => {
    response.json({ jobs: getJobsForYear(request.student.graduationYear) });
  });

  app.get("/api/resumes", requireStudent, requireCompletedOnboarding, async (request, response, next) => {
    try {
      const resumes = await readResumeIndex(indexPath);
      response.json({ resumes: resumes.filter((resume) => resume.userId === request.student.id) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/resumes", requireStudent, requireCompletedOnboarding, upload.single("resume"), async (request, response, next) => {
    try {
      if (!request.file) {
        return response.status(400).json({ message: "Choose a PDF, DOC, or DOCX resume." });
      }

      const resume = {
        id: request.file.filename.slice(0, request.file.filename.lastIndexOf(".")),
        userId: request.student.id,
        name: request.file.originalname,
        mimeType: request.file.mimetype,
        size: request.file.size,
        uploadedAt: new Date().toISOString(),
        storedName: request.file.filename,
      };
      const resumes = await readResumeIndex(indexPath);
      resumes.unshift(resume);
      await writeResumeIndex(indexPath, resumes);
      response.status(201).json({ resume });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/resumes/:id/download", requireStudent, requireCompletedOnboarding, async (request, response, next) => {
    try {
      const resumes = await readResumeIndex(indexPath);
      const resume = resumes.find(
        (item) => item.id === request.params.id && item.userId === request.student.id,
      );
      if (!resume) return response.status(404).json({ message: "Resume not found." });
      response.download(join(uploadDirectory, resume.storedName), resume.name);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error);
    if (error instanceof AuthError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      const message = error.field === "profilePhoto"
        ? "Profile photos must be 3 MB or smaller."
        : "Resume files must be 5 MB or smaller.";
      return response.status(413).json({ message });
    }
    console.error(error);
    response.status(500).json({ message: "The request could not be completed. Please try again." });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.API_PORT ?? 3002);
  const host = process.env.API_HOST ?? "127.0.0.1";
  const app = await createPortalApp();
  app.listen(port, host, () => {
    console.log(`Portal API listening on http://${host}:${port}`);
  });
}
