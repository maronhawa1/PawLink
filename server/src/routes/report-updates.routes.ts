import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/pool.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

const MAX_MESSAGE_LENGTH = 1000;

const createUpdateSchema = z.object({
  message: z
    .string({ error: "Message is required" })
    .trim()
    .min(1, "Message is required")
    .max(
      MAX_MESSAGE_LENGTH,
      `Message must be at most ${MAX_MESSAGE_LENGTH} characters`,
    ),
});

function parseReportId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Columns returned for every update, with the author's public name only.
// `alias` is the table alias of the reportUpdate rows in the query.
function updateColumns(alias: string) {
  return `
    ${alias}."id",
    ${alias}."reportId",
    ${alias}."message",
    ${alias}."status",
    ${alias}."createdAt",
    ${alias}."authorId",
    u."name" AS "authorName"
  `;
}

// GET /api/reports/:id/updates
// Logged-in users can read a report's progress updates, oldest first.
router.get("/:id/updates", requireAuth, async (req, res) => {
  const reportId = parseReportId(req.params.id);

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report id" });
    return;
  }

  try {
    const report = await pool.query(
      `SELECT 1 FROM public."report" WHERE "id" = $1`,
      [reportId],
    );

    if (report.rowCount === 0) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const result = await pool.query(
      `
        SELECT ${updateColumns("ru")}
        FROM public."reportUpdate" ru
        JOIN public."user" u ON u."id" = ru."authorId"
        WHERE ru."reportId" = $1
        ORDER BY ru."createdAt" ASC, ru."id" ASC
      `,
      [reportId],
    );

    res.status(200).json({ updates: result.rows });
  } catch (error) {
    console.error("Get report updates error:", error);
    res.status(500).json({ message: "Failed to get report updates" });
  }
});

// POST /api/reports/:id/updates
// The reporter or the assigned helper adds a progress note.
// The author and creation time are set by the server, never by the client.
router.post("/:id/updates", requireAuth, async (req, res) => {
  const reportId = parseReportId(req.params.id);

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report id" });
    return;
  }

  const parsed = createUpdateSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Invalid update",
    });
    return;
  }

  const userId: number = res.locals.userId;

  try {
    const report = await pool.query(
      `
        SELECT "status", "reporterId", "assignedToId"
        FROM public."report"
        WHERE "id" = $1
      `,
      [reportId],
    );

    const row = report.rows[0];

    if (!row) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    if (row.reporterId !== userId && row.assignedToId !== userId) {
      res.status(403).json({
        message:
          "Only the reporter or the assigned helper can add progress updates",
      });
      return;
    }

    // reportUpdate.status is required; a progress note records the
    // status the report had when the note was written.
    const inserted = await pool.query(
      `
        WITH created AS (
          INSERT INTO public."reportUpdate"
            ("reportId", "authorId", "status", "message")
          VALUES ($1, $2, $3, $4)
          RETURNING *
        )
        SELECT ${updateColumns("created")}
        FROM created
        JOIN public."user" u ON u."id" = created."authorId"
      `,
      [reportId, userId, row.status, parsed.data.message],
    );

    res.status(201).json({ update: inserted.rows[0] });
  } catch (error) {
    console.error("Create report update error:", error);
    res.status(500).json({ message: "Failed to add report update" });
  }
});

export default router;
