import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DB } from "./src/config/db.js";
import companyRoutes from "./src/modules/company/company.routes.js";
import officeRoutes from "./src/modules/office/office.routes.js";
import userRoutes from "./src/modules/user/user.routes.js";
import rideRequestRoutes from "./src/modules/ride-request/rideRequest.routes.js";
import driverRoutes from "./src/modules/driver/driver.routes.js";
import mapsRoutes from "./src/modules/maps/maps.routes.js";
import cookieParser from "cookie-parser";
import rideProcessRoutes from "./src/modules/ride/rideProcess.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Cab Platform API running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

app.use("/api/company", companyRoutes);
app.use("/api/office", officeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ride-request", rideRequestRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/rideProcess", rideProcessRoutes);

app.use((req, res, next) => {
  console.log(`[404] Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl} -`, err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

DB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});
