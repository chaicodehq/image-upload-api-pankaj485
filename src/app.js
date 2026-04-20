import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { router as iamgeRouter } from "./routes/image.routes";

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

const validateUploadPaths = () => {
  const uploadPath = path.resolve(__dirname, "../uploads");
  const thumbnailPath = path.resolve(__dirname, "../uploads/thumbnails");
  console.log("validating file upload paths");

  if (!fs.existsSync) {
    console.log("Upload path doesn't exist. Creating it.");
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("File upload path created.");
  } else {
    console.log("File upload path exists.");
  }

  if (!fs.thumbnailPath) {
    console.log("Thumbnail Upload path doesn't exist. Creating it.");
    fs.mkdirSync(thumbnailPath, { recursive: true });
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

  app.use("/api/images", iamgeRouter);

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
