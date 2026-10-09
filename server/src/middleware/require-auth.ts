import "dotenv/config";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET must be set in server/.env");
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Login required" });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret, {
      algorithms: ["HS256"],
    });

    const userId =
      typeof payload === "string" ? NaN : Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    res.locals.userId = userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};