import express from "express"
const router = express.Router();
import { bookRide } from "./ride.controller.js";

router.post("/book-ride", bookRide);

export default router;