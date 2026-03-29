import express from "express";
import { processRideRequests } from "./batchProcessor.service.js";

const router = express.Router();

router.post("/process-rides", async (req, res) => {
  try {
    const { scheduled_at, office_id } = req.body;

    if (!scheduled_at || !office_id) {
      return res.status(400).json({
        success: false,
        message: "scheduled_at and office_id required"
      });
    }

    const rides = await processRideRequests(scheduled_at, office_id);

    res.json({
      success: true,
      rides
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;