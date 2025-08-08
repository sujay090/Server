import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Initialize timezone configuration first
import { logTimezoneInfo } from "./config/timezone.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import posterRoutes from "./routes/posterRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import timezoneRoutes from "./routes/timezoneRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import "./controllers/cronJobs.js";

// Initialize database and timezone
connectDB();
logTimezoneInfo();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://poster-generetorapp-frontend.onrender.com",
      "https://post-generate-app-1.onrender.com"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Serve uploads folder
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/posters", posterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/timezone", timezoneRoutes);
app.use("/api/test", testRoutes);
// new the cron job

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
