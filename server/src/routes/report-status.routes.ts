import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  getReportDetails,
  updateReportStatus,
} from "../controllers/report-status.controller.js";

const router = Router();

router.get("/:id", getReportDetails);
router.patch("/:id/status", requireAuth, updateReportStatus);

export default router;