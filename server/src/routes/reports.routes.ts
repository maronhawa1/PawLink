import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  getReports,
  getMyReports,
  createReport,
} from "../controllers/reports.controller.js";

const router = Router();

router.get("/", getReports);
router.get("/mine", requireAuth, getMyReports);
router.post("/", requireAuth, createReport);

export default router;