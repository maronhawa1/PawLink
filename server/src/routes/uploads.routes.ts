import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middleware/require-auth.js";
import {
  checkUploadFolder,
  receiveImage,
  uploadImage,
} from "../controllers/uploads.controller.js";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many uploads. Please try again later." },
});

router.post(
  "/:folder",
  requireAuth,
  uploadLimiter,
  checkUploadFolder,
  receiveImage,
  uploadImage,
);

export default router;