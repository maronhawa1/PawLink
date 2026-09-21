import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import petsRoutes from "./routes/pets.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "PawLink API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/pets", petsRoutes);
export default app;