import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/pool.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

const reportStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

type ReportStatus = (typeof reportStatuses)[number];

// Which statuses a report can move to from its current status.
// RESOLVED and CLOSED reports can be reopened.
const allowedTransitions: Record<ReportStatus, ReportStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["OPEN"],
  CLOSED: ["OPEN"],
};

// The assigned helper may only start or pause work.
// Resolving, closing and reopening stay with the reporter.
const helperTransitions: Partial<Record<ReportStatus, ReportStatus[]>> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["OPEN"],
};

const updateStatusSchema = z.object({
  status: z.enum(reportStatuses),
  message: z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && !value.trim())
        ? undefined
        : value,
    z.string().trim().max(500).optional(),
  ),
});

function parseReportId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /api/reports/:id
// Public: report details plus its full status history (oldest first).
router.get("/:id", async (req, res) => {
  const reportId = parseReportId(req.params.id);

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report id" });
    return;
  }

  try {
    const reportResult = await pool.query(
      `
        SELECT
          r."id",
          r."title",
          r."description",
          r."type",
          r."status",
          r."animalType",
          r."photoUrl",
          r."locationText",
          r."latitude",
          r."longitude",
          r."reporterId",
          r."assignedToId",
          r."createdAt",
          r."updatedAt",
          u."name" AS "reporterName"
        FROM public."report" r
        JOIN public."user" u ON u."id" = r."reporterId"
        WHERE r."id" = $1
      `,
      [reportId],
    );

    const report = reportResult.rows[0];

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const historyResult = await pool.query(
      `
        SELECT
          ru."id",
          ru."status",
          ru."message",
          ru."createdAt",
          ru."authorId",
          u."name" AS "authorName"
        FROM public."reportUpdate" ru
        JOIN public."user" u ON u."id" = ru."authorId"
        WHERE ru."reportId" = $1
        ORDER BY ru."createdAt" ASC, ru."id" ASC
      `,
      [reportId],
    );

    res.status(200).json({
      report,
      history: historyResult.rows,
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Failed to get report" });
  }
});

// PATCH /api/reports/:id/status
// Changes the report status and records the change in its history.
// Allowed for the reporter, and in a limited way for the assigned helper.
router.patch("/:id/status", requireAuth, async (req, res) => {
  const reportId = parseReportId(req.params.id);

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report id" });
    return;
  }

  const parsed = updateStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: `Status must be one of: ${reportStatuses.join(", ")}`,
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { status: nextStatus, message } = parsed.data;
  const userId: number = res.locals.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the row so two simultaneous updates cannot both pass the checks.
    const current = await client.query(
      `
        SELECT "status", "reporterId", "assignedToId"
        FROM public."report"
        WHERE "id" = $1
        FOR UPDATE
      `,
      [reportId],
    );

    const report = current.rows[0];

    if (!report) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const currentStatus = report.status as ReportStatus;
    const isReporter = report.reporterId === userId;
    const isHelper = report.assignedToId === userId;

    if (!isReporter && !isHelper) {
      await client.query("ROLLBACK");
      res.status(403).json({
        message: "Only the reporter or assigned helper can update this report",
      });
      return;
    }

    if (currentStatus === nextStatus) {
      await client.query("ROLLBACK");
      res.status(409).json({
        message: `Report is already ${currentStatus}`,
      });
      return;
    }

    const allowed = isReporter
      ? allowedTransitions[currentStatus]
      : helperTransitions[currentStatus] ?? [];

    if (!allowed.includes(nextStatus)) {
      await client.query("ROLLBACK");
      res.status(isReporter ? 409 : 403).json({
        message: `Cannot change status from ${currentStatus} to ${nextStatus}`,
      });
      return;
    }

    const updated = await client.query(
      `
        UPDATE public."report"
        SET "status" = $1, "updatedAt" = now()
        WHERE "id" = $2
        RETURNING "id", "status", "updatedAt"
      `,
      [nextStatus, reportId],
    );

    const historyEntry = await client.query(
      `
        INSERT INTO public."reportUpdate"
          ("reportId", "authorId", "status", "message")
        VALUES ($1, $2, $3, $4)
        RETURNING "id", "status", "message", "createdAt", "authorId"
      `,
      [reportId, userId, nextStatus, message ?? null],
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Report status updated",
      report: updated.rows[0],
      update: historyEntry.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Update report status error:", error);
    res.status(500).json({ message: "Failed to update report status" });
  } finally {
    client.release();
  }
});

export default router;
