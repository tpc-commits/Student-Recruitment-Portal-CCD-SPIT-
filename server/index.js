import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";

const allowedResumeTypes = new Map([
  ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

const defaultUploadDirectory = fileURLToPath(new URL("../uploads/resumes", import.meta.url));

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

export async function createResumeApp({
  uploadDirectory = defaultUploadDirectory,
  clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
} = {}) {
  await mkdir(uploadDirectory, { recursive: true });
  const indexPath = join(uploadDirectory, "index.json");
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

  app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", clientOrigin);
    response.header("Access-Control-Allow-Headers", "Content-Type");
    response.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    next();
  });

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/resumes", async (_request, response, next) => {
    try {
      response.json({ resumes: await readResumeIndex(indexPath) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/resumes", upload.single("resume"), async (request, response, next) => {
    try {
      if (!request.file) {
        return response.status(400).json({ message: "Choose a PDF, DOC, or DOCX resume." });
      }

      const resume = {
        id: request.file.filename.slice(0, request.file.filename.lastIndexOf(".")),
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

  app.get("/api/resumes/:id/download", async (request, response, next) => {
    try {
      const resumes = await readResumeIndex(indexPath);
      const resume = resumes.find((item) => item.id === request.params.id);
      if (!resume) return response.status(404).json({ message: "Resume not found." });
      response.download(join(uploadDirectory, resume.storedName), resume.name);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return response.status(413).json({ message: "Resume files must be 5 MB or smaller." });
    }
    console.error(error);
    response.status(500).json({ message: "The resume could not be uploaded. Please try again." });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.API_PORT ?? 3002);
  const host = process.env.API_HOST ?? "127.0.0.1";
  const app = await createResumeApp();
  app.listen(port, host, () => {
    console.log(`Resume API listening on http://${host}:${port}`);
  });
}
