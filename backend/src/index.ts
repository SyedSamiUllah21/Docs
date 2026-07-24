import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";
import sharingRoutes from "./routes/sharing";
import uploadRoutes from "./routes/uploads";
import commentRoutes from "./routes/comments";
import versionRoutes from "./routes/versions";
import presenceRoutes from "./routes/presence";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors({
  origin: "*",
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads folder
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents", sharingRoutes);
app.use("/api", uploadRoutes);
app.use("/api", commentRoutes);
app.use("/api", versionRoutes);
app.use("/api", presenceRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "FastDocs API", timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 FastDocs Backend REST Server running on http://localhost:${PORT}`);
  });
}

export default app;
