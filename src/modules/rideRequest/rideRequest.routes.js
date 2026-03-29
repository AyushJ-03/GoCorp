import { Router } from "express";
import { bookRide } from "./rideRequest.controller.js";
import { authUser } from "../../middleware/auth.middleware.js";
import { body } from "express-validator"
import { getAllRideRequestsWithRoutes } from "./rideRequest.controller.js";

const router = Router();

router.post("/book-ride", [

  body('employee_id').notEmpty().withMessage('Employee ID is required'),

  body('office_id').notEmpty().withMessage('Office ID is required'),

  body('pickup_location').notEmpty().withMessage('Pickup location is required'),

  body('drop_location').notEmpty().withMessage('Drop location is required'),

  body('scheduled_at').notEmpty().withMessage('Scheduled time is required')
    .isISO8601().withMessage('Scheduled time must be a valid ISO 8601 date'),

], authUser, bookRide);

router.get("/map", getAllRideRequestsWithRoutes);

export default router;