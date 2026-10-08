import "dotenv/config";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { db } from "../prisma/db.js";

const router = Router();
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET must contain at least 32 characters in server/.env",
  );
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.includes("@") ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    res.status(400).json({
      message: "Invalid registration details",
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (existingUser) {
      res.status(409).json({
        message: "Email already registered",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await db.orm.public.User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    try {
      const existingUser = await db.orm.public.User.where({
        email: normalizedEmail,
      }).first();

      if (existingUser) {
        res.status(409).json({
          message: "Email already registered",
        });
        return;
      }
    } catch (lookupError) {
      console.error("Registration lookup error:", lookupError);
    }

    console.error("Register user error:", error);

    res.status(500).json({
      message: "Failed to register user",
    });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    res.status(400).json({
      message: "Email and password are required",
    });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      { sub: String(user.id) },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "1h",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login user error:", error);
    res.status(500).json({
      message: "Failed to login",
    });
  }
});

export default router;