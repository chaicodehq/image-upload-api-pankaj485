import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import imageRouter from "./routes/image.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

/**
 * TODO: Create Express app
 *
 * 1. Create app with express()
 * 2. Add express.json() middleware
 * 3. Create uploads directories if they don't exist:
 *    - uploads/
 *    - uploads/thumbnails/
 *    Use fs.mkdirSync with { recursive: true }
 * 4. Add GET /health route → { ok: true }
 * 5. Mount image routes at /api/images
 * 6. Add notFound middleware
 * 7. Add errorHandler middleware (must be last!)
 * 8. Return app
 */

export const UPLOAD_DIR = path.resolve(__dirname, "../uploads");
export const THUMBNAIL_DIR = path.resolve(__dirname, "../uploads/thumbnails");

const validateUploadPaths = () => {
  console.log("validating file upload paths");

  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log("Upload path doesn't exist. Creating it.");
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log("File upload path created.");
  } else {
    console.log("File upload path exists.");
  }

  if (!fs.existsSync(THUMBNAIL_DIR)) {
    console.log("Thumbnail Upload path doesn't exist. Creating it.");
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
    console.log("Thumbnail upload path created.");
  } else {
    console.log("Thumbnail upload path exists.");
  }
};

export function createApp() {
  validateUploadPaths();

  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/images", imageRouter);

  app.use("*", (req, res) => {
    res.status(404).send("Not found");
  });

  app.use((Error, req, res, next) => {
    return res.status(500).json({
      message: "Something went wrong",
    });
  });

  return app;
}
