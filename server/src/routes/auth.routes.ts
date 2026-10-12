import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, register } from "../controllers/auth.controller.js";

const router = Router();

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

router.post("/register", register);
router.post("/login", loginLimiter, login);

export default router;