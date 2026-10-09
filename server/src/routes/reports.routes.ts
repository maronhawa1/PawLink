import { Router } from "express";
import { z } from "zod";
import { db } from "../prisma/db.js";
import { requireAuth } from "../middleware/require-auth.js";
import { pool } from "../config/pool.js";

const router = Router();

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
    type: z.enum(["INJURED", "LOST", "FOUND", "NEEDS_RESCUE"]),

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
        WHERE "latitude" BETWEEN -90 AND 90
          AND "longitude" BETWEEN -180 AND 180
        ORDER BY "createdAt" DESC, "id" DESC
        LIMIT $1 OFFSET $2
      `,
      [limit + 1, offset],
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