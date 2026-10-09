import { Router } from "express";
import { db } from "../prisma/db.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { name, species, sex } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Pet name is required" });
    return;
  }

  if (!["DOG", "CAT", "OTHER"].includes(species)) {
    res.status(400).json({ message: "Invalid species" });
    return;
  }

  if (
    sex !== undefined &&
    !["MALE", "FEMALE", "UNKNOWN"].includes(sex)
  ) {
    res.status(400).json({ message: "Invalid sex" });
    return;
  }

  try {
    const pet = await db.orm.public.Pet.create({
      name: name.trim(),
      species,
      sex: sex ?? "UNKNOWN",
      ownerId: res.locals.userId,
    });

    res.status(201).json({ pet });
  } catch (error) {
    console.error("Create pet error:", error);
    res.status(500).json({ message: "Failed to create pet" });
  }
});
router.get("/", requireAuth, async (_req, res) => {
  try {
    const pets = await db.orm.public.Pet
      .where({ ownerId: res.locals.userId })
      .all();

    res.status(200).json({ pets });
  } catch (error) {
    console.error("Get pets error:", error);
    res.status(500).json({ message: "Failed to get pets" });
  }
});
export default router;