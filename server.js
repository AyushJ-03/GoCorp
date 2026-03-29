import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DB } from "./src/config/db.js";
import companyRoutes from "./src/modules/company/company.routes.js"
import officeRoutes from "./src/modules/office/office.routes.js"
import userRoutes from "./src/modules/user/user.routes.js"
import rideRequestRoutes from "./src/modules/rideRequest/rideRequest.routes.js"
import driverRoutes from "./src/modules/driver/driver.routes.js"
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

app.use("/api/company", companyRoutes)

app.use("/api/office", officeRoutes)

app.use("/api/user", userRoutes)

app.use("/api/rideRequest", rideRequestRoutes) 

app.use("/api/driver", driverRoutes)

app.use("/api/rideProcess", rideProcessRoutes)

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  })
})

DB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port http://localhost:${process.env.PORT}`);
  });
})

