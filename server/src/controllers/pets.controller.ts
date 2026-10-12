import type { RequestHandler } from "express";
import { z } from "zod";
import { db } from "../prisma/db.js";

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && !value.trim()) {
    return undefined;
  }

  return value;
}

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const createPetSchema = z.object({
  name: z.string().trim().min(1).max(60),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  sex: z.preprocess(
    emptyToUndefined,
    z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  ),
  breed: optionalText(60),
  color: optionalText(40),
  microchipNumber: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{9,15}$/, "Microchip number must be 9 to 15 digits")
      .optional(),
  ),
  birthDate: z.preprocess(
    emptyToUndefined,
    z.iso
      .date()
      .refine(
        (value) => new Date(value) <= new Date(),
        "Birth date cannot be in the future",
      )
      .optional(),
  ),
  photoUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(2048)
      .url()
      .regex(/^https?:\/\//i, "Photo URL must use HTTP or HTTPS")
      .optional(),
  ),
  medicalNotes: optionalText(2000),
});

function parsePetId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function optionalString(value: unknown): string | undefined | false {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return false;
  }

  return value.trim() || undefined;
}

async function findOwnedPet(petId: number, userId: number) {
  return db.orm.public.Pet.where({ id: petId, ownerId: userId }).first();
}

export const createPet: RequestHandler = async (req, res) => {
  const result = createPetSchema.safeParse(req.body ?? {});

  if (!result.success) {
    res.status(400).json({
      message: "Invalid pet details",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const data = result.data;

  try {
    if (data.microchipNumber) {
      const existing = await db.orm.public.Pet.where({
        microchipNumber: data.microchipNumber,
      }).first();

      if (existing) {
        res.status(409).json({
          message: "This microchip number is already registered",
        });
        return;
      }
    }

    const pet = await db.orm.public.Pet.create({
      name: data.name,
      species: data.species,
      sex: data.sex ?? "UNKNOWN",
      breed: data.breed,
      color: data.color,
      microchipNumber: data.microchipNumber,
      birthDate: data.birthDate
        ? new Date(data.birthDate).toISOString()
        : undefined,
      photoUrl: data.photoUrl,
      medicalNotes: data.medicalNotes,
      ownerId: res.locals.userId,
    });

    res.status(201).json({ pet });
  } catch (error) {
    console.error("Create pet error:", error);
    res.status(500).json({ message: "Failed to create pet" });
  }
};

export const getPets: RequestHandler = async (_req, res) => {
  try {
    const pets = await db.orm.public.Pet
      .where({ ownerId: res.locals.userId })
      .orderBy([(pet) => pet.id.desc()])
      .all();

    res.status(200).json({ pets });
  } catch (error) {
    console.error("Get pets error:", error);
    res.status(500).json({ message: "Failed to get pets" });
  }
};

export const getPet: RequestHandler = async (req, res) => {
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

    res.status(200).json({ pet });
  } catch (error) {
    console.error("Get pet error:", error);
    res.status(500).json({ message: "Failed to get pet" });
  }
};

export const getVaccinations: RequestHandler = async (req, res) => {
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
};

export const addVaccination: RequestHandler = async (req, res) => {
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

  const clinic = optionalString(clinicName);
  const noteText = optionalString(notes);
  const document = optionalString(documentUrl);

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
};