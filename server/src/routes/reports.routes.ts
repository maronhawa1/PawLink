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

function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

router.get("/", async (_req, res) => {
  try {
    const reports = await db.orm.public.Report.all();

    const reportsWithLocation = reports.filter(
      (report) =>
        report.latitude !== null &&
        report.latitude !== undefined &&
        report.longitude !== null &&
        report.longitude !== undefined
    );

    res.status(200).json({
      reports: reportsWithLocation,
    });
  } catch (error) {
    console.error("Get public reports error:", error);

    res.status(500).json({
      message: "Failed to get reports",
    });
  }
});

router.get("/mine", requireAuth, async (_req, res) => {
  try {
    const reports = await db.orm.public.Report
      .where({
        reporterId: res.locals.userId,
      })
      .all();

    res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("Get user reports error:", error);

    res.status(500).json({
      message: "Failed to get user reports",
    });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    description,
    type,
    animalType,
    photoUrl,
    locationText,
    latitude,
    longitude,
  } = req.body ?? {};

  if (
    typeof title !== "string" ||
    title.trim().length === 0 ||
    typeof description !== "string" ||
    description.trim().length === 0 ||
    !isReportType(type)
  ) {
    res.status(400).json({
      message:
        "Title, description and a valid report type are required",
    });
    return;
  }

  if (
    animalType !== undefined &&
    animalType !== null &&
    !isAnimalType(animalType)
  ) {
    res.status(400).json({
      message: "Invalid animal type",
    });
    return;
  }

  if (
    photoUrl !== undefined &&
    photoUrl !== null &&
    typeof photoUrl !== "string"
  ) {
    res.status(400).json({
      message: "Invalid photo URL",
    });
    return;
  }

  if (
    locationText !== undefined &&
    locationText !== null &&
    typeof locationText !== "string"
  ) {
    res.status(400).json({
      message: "Invalid location",
    });
    return;
  }

  if (
    latitude !== undefined &&
    latitude !== null &&
    !isValidLatitude(latitude)
  ) {
    res.status(400).json({
      message: "Invalid latitude",
    });
    return;
  }

  if (
    longitude !== undefined &&
    longitude !== null &&
    !isValidLongitude(longitude)
  ) {
    res.status(400).json({
      message: "Invalid longitude",
    });
    return;
  }

  try {
    const report = await db.orm.public.Report.create({
      title: title.trim(),
      description: description.trim(),
      type,
      animalType: animalType ?? undefined,
      photoUrl:
        typeof photoUrl === "string"
          ? photoUrl.trim() || undefined
          : undefined,
      locationText:
        typeof locationText === "string"
          ? locationText.trim() || undefined
          : undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      reporterId: res.locals.userId,
    });

    res.status(201).json({
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    console.error("Create report error:", error);

    res.status(500).json({
      message: "Failed to create report",
    });
  }
});

export default router;