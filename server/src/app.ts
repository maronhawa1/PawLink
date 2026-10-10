import "dotenv/config";
import express from "express";
import uploadsRoutes from "./routes/uploads.routes.js";
import cors from "cors";
import reportUpdatesRoutes from "./routes/report-updates.routes.js";
import authRoutes from "./routes/auth.routes.js";
import petsRoutes from "./routes/pets.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      callback(
        null,
        origin === undefined || allowedOrigins.includes(origin),
      );
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "PawLink API is running",
  });
});

app.use("/api/uploads", uploadsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportUpdatesRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/reports", reportsRoutes);

export default app;