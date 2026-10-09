import { Router } from "express";
import { z } from "zod";
import { db } from "../prisma/db.js";
import { requireAuth } from "../middleware/require-auth.js";
import { pool } from "../config/pool.js";

const router = Router();

const reportTypes = [
  "INJURED",
  "LOST",
  "FOUND",
  "NEEDS_RESCUE",
] as const;

const reportStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && !value.trim()) {
    return undefined;
  }

  return value;
}

const createReportSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(5000),
    type: z.enum(reportTypes),

    animalType: z.preprocess(
      (value) => value === null ? undefined : value,
      z.enum(["DOG", "CAT", "OTHER"]).optional(),
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

    locationText: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(300).optional(),
    ),

    latitude: z.preprocess(
      (value) => value === null ? undefined : value,
      z.number().finite().min(-90).max(90).optional(),
    ),

    longitude: z.preprocess(
      (value) => value === null ? undefined : value,
      z.number().finite().min(-180).max(180).optional(),
    ),
  })
  .refine(
    (data) =>
      (data.latitude === undefined) ===
      (data.longitude === undefined),
    {
      message: "Latitude and longitude must be provided together",
      path: ["longitude"],
    },
  );

router.get("/", async (req, res) => {
  const limitValue = req.query.limit ?? "50";
  const offsetValue = req.query.offset ?? "0";

  if (
    typeof limitValue !== "string" ||
    typeof offsetValue !== "string" ||
    !/^\d+$/.test(limitValue) ||
    !/^\d+$/.test(offsetValue)
  ) {
    res.status(400).json({
      message: "Invalid pagination parameters",
    });
    return;
  }

  const limit = Number(limitValue);
  const offset = Number(offsetValue);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    res.status(400).json({
      message:
        "Limit must be between 1 and 100, and offset must be non-negative",
    });
    return;
  }

  const typeValue = req.query.type;
  const statusValue = req.query.status;

  if (
    typeValue !== undefined &&
    (typeof typeValue !== "string" ||
      !reportTypes.includes(typeValue as (typeof reportTypes)[number]))
  ) {
    res.status(400).json({
      message: `Type must be one of: ${reportTypes.join(", ")}`,
    });
    return;
  }

  if (
    statusValue !== undefined &&
    (typeof statusValue !== "string" ||
      !reportStatuses.includes(
        statusValue as (typeof reportStatuses)[number],
      ))
  ) {
    res.status(400).json({
      message: `Status must be one of: ${reportStatuses.join(", ")}`,
    });
    return;
  }

  const conditions = [
    `"latitude" BETWEEN -90 AND 90`,
    `"longitude" BETWEEN -180 AND 180`,
  ];
  const params: unknown[] = [];

  if (typeValue !== undefined) {
    params.push(typeValue);
    conditions.push(`"type" = $${params.length}`);
  }

  if (statusValue !== undefined) {
    params.push(statusValue);
    conditions.push(`"status" = $${params.length}`);
  }

  params.push(limit + 1, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  try {
    const result = await pool.query(
      `
        SELECT
          "id",
          "title",
          "description",
          "type",
          "status",
          "animalType",
          "photoUrl",
          "locationText",
          "latitude",
          "longitude",
          "createdAt"
        FROM public."report"
        WHERE ${conditions.join(" AND ")}
        ORDER BY "createdAt" DESC, "id" DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      params,
    );

    const hasMore = result.rows.length > limit;

    res.status(200).json({
      reports: result.rows.slice(0, limit),
      pagination: {
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
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
  const result = createReportSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid report details",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const data = result.data;

  try {
    const report = await db.orm.public.Report.create({
      title: data.title,
      description: data.description,
      type: data.type,
      animalType: data.animalType,
      photoUrl: data.photoUrl,
      locationText: data.locationText,
      latitude: data.latitude,
      longitude: data.longitude,
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