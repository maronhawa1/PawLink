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

function parsePetId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Accepts an ISO date or date-time string; returns a normalized ISO string.
function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function optionalText(value: unknown): string | undefined | false {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return false;
  }

  return value.trim() || undefined;
}

// Returns the pet only when it belongs to the logged-in user.
// A pet owned by someone else is reported as "not found" so its existence is not revealed.
async function findOwnedPet(petId: number, userId: number) {
  return db.orm.public.Pet.where({ id: petId, ownerId: userId }).first();
}

router.get("/:id/vaccinations", requireAuth, async (req, res) => {
  const petId = parsePetId(req.params.id);

  if (petId === null) {
    res.status(400).json({ message: "Invalid pet id" });
    return;
  }

  try {
    const pet = await findOwnedPet(petId, res.locals.userId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const vaccinations = await db.orm.public.Vaccination
      .where({ petId })
      .orderBy([(v) => v.vaccinatedAt.desc(), (v) => v.id.desc()])
      .all();

    res.status(200).json({ vaccinations });
  } catch (error) {
    console.error("Get vaccinations error:", error);
    res.status(500).json({ message: "Failed to get vaccinations" });
  }
});

router.post("/:id/vaccinations", requireAuth, async (req, res) => {
  const petId = parsePetId(req.params.id);

  if (petId === null) {
    res.status(400).json({ message: "Invalid pet id" });
    return;
  }

  const { name, vaccinatedAt, nextDueAt, clinicName, notes, documentUrl } =
    req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Vaccine name is required" });
    return;
  }

  const vaccinatedAtIso = parseDate(vaccinatedAt);

  if (!vaccinatedAtIso) {
    res.status(400).json({ message: "A valid vaccination date is required" });
    return;
  }

  let nextDueAtIso: string | undefined;

  if (nextDueAt !== undefined && nextDueAt !== null && nextDueAt !== "") {
    const parsed = parseDate(nextDueAt);

    if (!parsed) {
      res.status(400).json({ message: "Invalid next due date" });
      return;
    }

    if (parsed < vaccinatedAtIso) {
      res.status(400).json({
        message: "Next due date cannot be before the vaccination date",
      });
      return;
    }

    nextDueAtIso = parsed;
  }

  const clinic = optionalText(clinicName);
  const noteText = optionalText(notes);
  const document = optionalText(documentUrl);

  if (clinic === false || noteText === false || document === false) {
    res.status(400).json({
      message: "clinicName, notes and documentUrl must be text",
    });
    return;
  }

  try {
    const pet = await findOwnedPet(petId, res.locals.userId);

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const vaccination = await db.orm.public.Vaccination.create({
      name: name.trim(),
      vaccinatedAt: vaccinatedAtIso,
      nextDueAt: nextDueAtIso,
      clinicName: clinic,
      notes: noteText,
      documentUrl: document,
      petId,
    });

    res.status(201).json({ vaccination });
  } catch (error) {
    console.error("Create vaccination error:", error);
    res.status(500).json({ message: "Failed to create vaccination" });
  }
});

export default router;