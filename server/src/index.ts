import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Register all API routes
registerRoutes(app);

// Base status endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Simplest Automation Platform API running on port ${PORT}`);
});
