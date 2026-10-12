import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  getReportUpdates,
  addReportUpdate,
} from "../controllers/report-updates.controller.js";

const router = Router();

router.get("/:id/updates", requireAuth, getReportUpdates);
router.post("/:id/updates", requireAuth, addReportUpdate);

export default router;