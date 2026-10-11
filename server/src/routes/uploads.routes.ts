import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middleware/require-auth.js";
import {
  IMAGE_FOLDERS,
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  STORAGE_BUCKET,
  getStorageClient,
  type ImageContentType,
  type ImageFolder,
} from "../config/storage.js";

const router = Router();

// Keep the file in memory: it is checked and then sent straight to Supabase.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_MAX_BYTES,
    files: 1,
    fields: 5,
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many uploads. Please try again later." },
});

const allowedTypesText = "JPEG, PNG or WebP";
const maxSizeText = `${IMAGE_MAX_BYTES / (1024 * 1024)} MB`;

// Detects the real image type from the file's first bytes. The browser's
// declared type and the file name can be faked, so they are not trusted.
export function detectImageType(bytes: Buffer): ImageContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, i) => bytes[i] === byte)) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// Runs multer and turns its errors into clear 4xx responses.
const receiveImage: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ message: `Image must be at most ${maxSizeText}` });
        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE" || error.code === "LIMIT_FILE_COUNT") {
        res.status(400).json({
          message: 'Send exactly one file in a form field named "image"',
        });
        return;
      }

      res.status(400).json({ message: "Invalid upload" });
      return;
    }

    res.status(400).json({
      message: "Upload must be multipart/form-data with an \"image\" field",
    });
  });
};

// POST /api/uploads/:folder   (folder = pets | reports)
// Logged-in users upload one image; the response contains its public URL,
// which is then saved as Pet.photoUrl or Report.photoUrl.
router.post(
  "/:folder",
  requireAuth,
  uploadLimiter,
  (req, res, next) => {
    if (!IMAGE_FOLDERS.includes(req.params.folder as ImageFolder)) {
      res.status(404).json({
        message: `Upload folder must be one of: ${IMAGE_FOLDERS.join(", ")}`,
      });
      return;
    }

    if (!getStorageClient()) {
      res.status(503).json({ message: "Image uploads are not configured" });
      return;
    }

    next();
  },
  receiveImage,
  async (req, res) => {
    const file = req.file;

    if (!file || file.size === 0) {
      res.status(400).json({ message: 'An image file is required in the "image" field' });
      return;
    }

    const contentType = detectImageType(file.buffer);

    if (!contentType) {
      res.status(415).json({ message: `Image must be ${allowedTypesText}` });
      return;
    }

    const storage = getStorageClient()!;
    const folder = req.params.folder as ImageFolder;
    const userId: number = res.locals.userId;

    // Random file name: avoids collisions and never uses the client's name.
    const path = `${folder}/${userId}/${randomUUID()}.${IMAGE_TYPES[contentType]}`;

    try {
      const { error } = await storage.storage
        .from(STORAGE_BUCKET)
        .upload(path, file.buffer, {
          contentType,
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        res.status(502).json({ message: "Failed to store the image" });
        return;
      }

      const { data } = storage.storage.from(STORAGE_BUCKET).getPublicUrl(path);

      res.status(201).json({
        url: data.publicUrl,
        path,
        contentType,
        size: file.size,
      });
    } catch (error) {
      console.error("Upload image error:", error);
      res.status(500).json({ message: "Failed to upload the image" });
    }
  },
);

export default router;
