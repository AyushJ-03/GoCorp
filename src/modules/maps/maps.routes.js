import { Router } from "express";
import axios from "axios";
import { authUser } from "../../middleware/auth.middleware.js";

const router = Router();

// Proxy for Reverse Geocoding
router.get("/reverse", authUser, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
  }

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: 'json',
        lat,
        lon,
        zoom: 18,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Ride-Dispatch-App/1.0'
      }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Geocoding failed:", error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: "Geocoding failed",
      error: error.message 
    });
  }
});

// Proxy for Search Geocoding
router.get("/search", authUser, async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        format: 'json',
        q,
        limit: 5,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Ride-Dispatch-App/1.0'
      }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Search failed:", error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: "Search failed",
      error: error.message 
    });
  }
});

export default router;
