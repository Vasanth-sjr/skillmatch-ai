import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import profileRoutes from "./routes/profile";
import coursesRoutes from "./routes/courses";
import uploadsRoutes from "./routes/uploads";
import assessmentsRoutes from "./routes/assessments";
import aiAnalysisRoutes from "./routes/ai-analysis";

// Load env variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/ai", aiAnalysisRoutes);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 SkillMatch API server running on http://localhost:${PORT}`);
    console.log(`📡 API routes available at http://localhost:${PORT}/api`);
});
