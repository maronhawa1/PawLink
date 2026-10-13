import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  createPet,
  getPets,
  getPet,
  updatePet,
  deletePet,
  getVaccinations,
  addVaccination,
} from "../controllers/pets.controller.js";

const router = Router();

router.post("/", requireAuth, createPet);
router.get("/", requireAuth, getPets);
router.get("/:id", requireAuth, getPet);
router.patch("/:id", requireAuth, updatePet);
router.delete("/:id", requireAuth, deletePet);
router.get("/:id/vaccinations", requireAuth, getVaccinations);
router.post("/:id/vaccinations", requireAuth, addVaccination);

export default router;