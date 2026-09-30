import { Router } from "express";
import { db } from "../prisma/db.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

const reportTypes = [
  "INJURED",
  "LOST",
  "FOUND",
  "NEEDS_RESCUE",
] as const;

const animalTypes = ["DOG", "CAT", "OTHER"] as const;

type ReportType = (typeof reportTypes)[number];
type AnimalType = (typeof animalTypes)[number];

function isReportType(value: unknown): value is ReportType {
  return (
    typeof value === "string" &&
    reportTypes.includes(value as ReportType)
  );
}

function isAnimalType(value: unknown): value is AnimalType {
  return (
    typeof value === "string" &&
    animalTypes.includes(value as AnimalType)
  );
}

router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    description,
    type,
    animalType,
    locationText,
    latitude,
    longitude,
  } = req.body ?? {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !isReportType(type)
  ) {
    res.status(400).json({
      message: "Title, description and a valid report type are required",
    });
    return;
  }

  if (animalType !== undefined && !isAnimalType(animalType)) {
    res.status(400).json({ message: "Invalid animal type" });
    return;
  }

  if (
    latitude !== undefined &&
    (typeof latitude !== "number" || latitude < -90 || latitude > 90)
  ) {
    res.status(400).json({ message: "Invalid latitude" });
    return;
  }

  if (
    longitude !== undefined &&
    (typeof longitude !== "number" || longitude < -180 || longitude > 180)
  ) {
    res.status(400).json({ message: "Invalid longitude" });
    return;
  }

  try {
    const report = await db.orm.public.Report.create({
      title: title.trim(),
      description: description.trim(),
      type,
      animalType,
      locationText:
        typeof locationText === "string"
          ? locationText.trim() || undefined
          : undefined,
      latitude,
      longitude,
      reporterId: res.locals.userId,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ message: "Failed to create report" });
  }
});

router.get("/mine", requireAuth, async (_req, res) => {
  try {
    const reports = await db.orm.public.Report
      .where({ reporterId: res.locals.userId })
      .all();

    res.status(200).json({ reports });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Failed to get reports" });
  }
});

export default router;