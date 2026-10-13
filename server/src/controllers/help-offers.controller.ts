
import type { RequestHandler } from "express";
import { z } from "zod";
import { pool } from "../config/pool.js";

const offerSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const createHelpOffer: RequestHandler = async (req, res) => {
  const reportId = parseId(req.params.id);
  const parsed = offerSchema.safeParse(req.body);
  const userId: number = res.locals.userId;

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report ID" });
    return;
  }

  if (!parsed.success) {
    res.status(400).json({ message: "Please enter a message (max 1000 characters)" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public."helpOffer"
        ("reportId", "volunteerId", "message", "updatedAt")
       SELECT r."id", $2, $3, NOW()
       FROM public."report" r
       WHERE r."id" = $1
         AND r."reporterId" <> $2
         AND r."status" = 'OPEN'
         AND r."assignedToId" IS NULL
       ON CONFLICT ("reportId", "volunteerId") DO NOTHING
       RETURNING *`,
      [reportId, userId, parsed.data.message],
    );

    if (!result.rows[0]) {
      res.status(409).json({
        message: "Cannot offer help. The report may be unavailable or you may have already offered.",
      });
      return;
    }

    res.status(201).json({ offer: result.rows[0] });
  } catch (error) {
    console.error("Create help offer error:", error);
    res.status(500).json({ message: "Failed to offer help" });
  }
};


export const getReportHelpOffers: RequestHandler = async (req, res) => {
  const reportId = parseId(req.params.id);
  const userId: number = res.locals.userId;

  if (reportId === null) {
    res.status(400).json({ message: "Invalid report ID" });
    return;
  }

  try {
    const reportResult = await pool.query(
      `SELECT "reporterId"
       FROM public."report"
       WHERE "id" = $1`,
      [reportId],
    );

    const report = reportResult.rows[0];

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    if (report.reporterId !== userId) {
      res.status(403).json({
        message: "Only the reporter can view received offers",
      });
      return;
    }

    const result = await pool.query(
      `SELECT h.*, u."name" AS "volunteerName"
       FROM public."helpOffer" h
       JOIN public."user" u ON u."id" = h."volunteerId"
       WHERE h."reportId" = $1
       ORDER BY h."createdAt" DESC`,
      [reportId],
    );

    res.status(200).json({ offers: result.rows });
  } catch (error) {
    console.error("Get report offers error:", error);
    res.status(500).json({ message: "Failed to get offers" });
  }
};


export const getMyHelpOffers: RequestHandler = async (_req, res) => {
  const userId: number = res.locals.userId;

  try {
    const result = await pool.query(
      `SELECT h.*, r."title" AS "reportTitle",
              r."type" AS "reportType",
              r."status" AS "reportStatus"
       FROM public."helpOffer" h
       JOIN public."report" r ON r."id" = h."reportId"
       WHERE h."volunteerId" = $1
       ORDER BY h."createdAt" DESC`,
      [userId],
    );

    res.status(200).json({ offers: result.rows });
  } catch (error) {
    console.error("Get my offers error:", error);
    res.status(500).json({ message: "Failed to get your offers" });
  }
};

export const respondToHelpOffer: RequestHandler = async (req, res) => {
  const reportId = parseId(req.params.id);
  const offerId = parseId(req.params.offerId);
  const userId: number = res.locals.userId;
  const parsed = z.object({
    status: z.enum(["ACCEPTED", "DECLINED"]),
  }).safeParse(req.body);

  if (reportId === null || offerId === null || !parsed.success) {
    res.status(400).json({ message: "Invalid offer details" });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reportResult = await client.query(
      `SELECT "reporterId", "assignedToId", "status"
       FROM public."report"
       WHERE "id" = $1 FOR UPDATE`,
      [reportId],
    );

    const report = reportResult.rows[0];

    if (!report) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Report not found" });
      return;
    }

    if (report.reporterId !== userId) {
      await client.query("ROLLBACK");
      res.status(403).json({ message: "Only the reporter can respond to offers" });
      return;
    }

    const offerResult = await client.query(
      `SELECT * FROM public."helpOffer"
       WHERE "id" = $1 AND "reportId" = $2 FOR UPDATE`,
      [offerId, reportId],
    );

    const offer = offerResult.rows[0];

    if (!offer) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Offer not found" });
      return;
    }

    if (offer.status !== "PENDING") {
      await client.query("ROLLBACK");
      res.status(409).json({ message: "This offer has already been handled" });
      return;
    }

    if (
      parsed.data.status === "ACCEPTED" &&
      (report.status !== "OPEN" || report.assignedToId !== null)
    ) {
      await client.query("ROLLBACK");
      res.status(409).json({ message: "This report cannot accept a helper" });
      return;
    }

    const updated = await client.query(
      `UPDATE public."helpOffer"
       SET "status" = $1, "updatedAt" = NOW()
       WHERE "id" = $2 RETURNING *`,
      [parsed.data.status, offerId],
    );

    if (parsed.data.status === "ACCEPTED") {
      await client.query(
        `UPDATE public."report"
         SET "assignedToId" = $1,
             "status" = 'IN_PROGRESS',
             "updatedAt" = NOW()
         WHERE "id" = $2`,
        [offer.volunteerId, reportId],
      );

      await client.query(
        `INSERT INTO public."reportUpdate"
         ("reportId", "authorId", "status", "message")
         VALUES ($1, $2, 'IN_PROGRESS', $3)`,
        [reportId, userId, "A volunteer's offer was accepted"],
      );

      await client.query(
        `UPDATE public."helpOffer"
         SET "status" = 'DECLINED', "updatedAt" = NOW()
         WHERE "reportId" = $1
           AND "id" <> $2
           AND "status" = 'PENDING'`,
        [reportId, offerId],
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ offer: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Respond to help offer error:", error);
    res.status(500).json({ message: "Failed to respond to offer" });
  } finally {
    client.release();
  }
};

export const withdrawHelpOffer: RequestHandler = async (req, res) => {
  const offerId = parseId(req.params.offerId);
  const userId: number = res.locals.userId;

  if (offerId === null) {
    res.status(400).json({ message: "Invalid offer ID" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE public."helpOffer"
       SET "status" = 'WITHDRAWN', "updatedAt" = NOW()
       WHERE "id" = $1
         AND "volunteerId" = $2
         AND "status" = 'PENDING'
       RETURNING *`,
      [offerId, userId],
    );

    if (!result.rows[0]) {
      res.status(409).json({ message: "Offer cannot be withdrawn" });
      return;
    }

    res.status(200).json({ offer: result.rows[0] });
  } catch (error) {
    console.error("Withdraw help offer error:", error);
    res.status(500).json({ message: "Failed to withdraw offer" });
  }
};
