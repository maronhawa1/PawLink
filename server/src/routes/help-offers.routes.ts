
import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  createHelpOffer,
  getReportHelpOffers,
  getMyHelpOffers,
  respondToHelpOffer,
  withdrawHelpOffer,
} from "../controllers/help-offers.controller.js";

const router = Router();

router.get("/offers/mine", requireAuth, getMyHelpOffers);

router.patch(
  "/offers/:offerId/withdraw",
  requireAuth,
  withdrawHelpOffer,
);
router.post("/:id/offers", requireAuth, createHelpOffer);

router.get("/:id/offers", requireAuth, getReportHelpOffers);

router.patch(
  "/:id/offers/:offerId",
  requireAuth,
  respondToHelpOffer,
);

export default router;
