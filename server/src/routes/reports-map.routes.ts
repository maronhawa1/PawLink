import { Router } from "express";
import { pool } from "../config/pool.js";

const router = Router();

const reportTypes = ["INJURED", "LOST", "FOUND", "NEEDS_RESCUE"] as const;
const reportStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

// Upper bound on markers returned in one response, so a very large
// area cannot return the whole table. `truncated` tells the client.
const MAX_MAP_REPORTS = 500;

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

// Accepts ?type=INJURED, ?type=INJURED,LOST or ?type=INJURED&type=LOST.
function parseEnumList<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  name: string,
): ParseResult<T[] | undefined> {
  if (raw === undefined || raw === "") {
    return { ok: true, value: undefined };
  }

  const parts = (Array.isArray(raw) ? raw : [raw]).flatMap((part) =>
    typeof part === "string" ? part.split(",") : [null],
  );

  const values = new Set<T>();

  for (const part of parts) {
    const value = part?.trim().toUpperCase();

    if (!value || !allowed.includes(value as T)) {
      return {
        ok: false,
        message: `${name} must be one of: ${allowed.join(", ")}`,
      };
    }

    values.add(value as T);
  }

  return { ok: true, value: [...values] };
}

type Bounds = { south: number; west: number; north: number; east: number };

// ?bounds=south,west,north,east (the visible map area).
function parseBounds(raw: unknown): ParseResult<Bounds | undefined> {
  if (raw === undefined || raw === "") {
    return { ok: true, value: undefined };
  }

  const invalid = {
    ok: false as const,
    message:
      "bounds must be south,west,north,east with valid latitudes and longitudes",
  };

  if (typeof raw !== "string") {
    return invalid;
  }

  const numbers = raw.split(",").map((part) => Number(part.trim()));

  if (numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) {
    return invalid;
  }

  const [south, west, north, east] = numbers;

  if (
    south < -90 || south > 90 || north < -90 || north > 90 ||
    west < -180 || west > 180 || east < -180 || east > 180 ||
    south > north
  ) {
    return invalid;
  }

  return { ok: true, value: { south, west, north, east } };
}

// GET /api/reports/map
// Public. Returns every report that has coordinates, for map markers.
// Optional filters: type, status (single or comma-separated), bounds.
router.get("/map", async (req, res) => {
  const types = parseEnumList(req.query.type, reportTypes, "type");
  const statuses = parseEnumList(req.query.status, reportStatuses, "status");
  const bounds = parseBounds(req.query.bounds);

  for (const result of [types, statuses, bounds]) {
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
  }

  const conditions = [
    `"latitude" IS NOT NULL`,
    `"longitude" IS NOT NULL`,
    `"latitude" BETWEEN -90 AND 90`,
    `"longitude" BETWEEN -180 AND 180`,
  ];
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (types.ok && types.value) {
    conditions.push(`"type" = ANY(${addParam(types.value)}::text[])`);
  }

  if (statuses.ok && statuses.value) {
    conditions.push(`"status" = ANY(${addParam(statuses.value)}::text[])`);
  }

  if (bounds.ok && bounds.value) {
    const { south, west, north, east } = bounds.value;

    conditions.push(
      `"latitude" BETWEEN ${addParam(south)} AND ${addParam(north)}`,
    );

    // A view that crosses the antimeridian has west > east.
    conditions.push(
      west <= east
        ? `"longitude" BETWEEN ${addParam(west)} AND ${addParam(east)}`
        : `("longitude" >= ${addParam(west)} OR "longitude" <= ${addParam(east)})`,
    );
  }

  const limitParam = addParam(MAX_MAP_REPORTS + 1);

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
        LIMIT ${limitParam}
      `,
      params,
    );

    const truncated = result.rows.length > MAX_MAP_REPORTS;
    const reports = result.rows.slice(0, MAX_MAP_REPORTS);

    res.status(200).json({
      reports,
      count: reports.length,
      truncated,
      filters: {
        type: types.ok ? types.value ?? null : null,
        status: statuses.ok ? statuses.value ?? null : null,
        bounds: bounds.ok ? bounds.value ?? null : null,
      },
    });
  } catch (error) {
    console.error("Get map reports error:", error);
    res.status(500).json({ message: "Failed to get map reports" });
  }
});

export default router;
