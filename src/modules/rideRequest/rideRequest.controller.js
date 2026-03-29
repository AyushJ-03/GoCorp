import { RideRequest } from "./rideRequest.model.js"
import { Office } from "../office/office.model.js"
import ApiResponse from "../../utils/ApiResponse.js"
import ApiError from "../../utils/ApiError.js"
import {
  isWithinOfficeHours,
  isDuplicateBooking,
  isLateRequest,
  isOneEndOffice
} from "./rideRequest.service.js"
import { validationResult } from "express-validator"

export const bookRide = async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array());
  }

  try {
    const {
      employee_id,
      office_id,
      destination_type,
      scheduled_at,
      pickup_address,
      pickup_location,
      drop_address,
      drop_location,
      solo_preference
    } = req.body

    if (!employee_id || !office_id || !scheduled_at) {
      throw new ApiError(400, "Missing required fields")
    }

    // step 1 — fetch office
    const office = await Office.findById(office_id)
    if (!office) throw new ApiError(404, "Office not found")

    // step 2 — check office hours
    if (!isWithinOfficeHours(scheduled_at, office)) {
      throw new ApiError(400, "Ride request is outside office hours")
    }

    // step 3 — check duplicate booking
    if (await isDuplicateBooking(employee_id, scheduled_at)) {
      throw new ApiError(400, "Duplicate ride request for the same time")
    }

    // step 4 — check one end is office
    if (!isOneEndOffice(pickup_location, drop_location, office.office_location)) {
      throw new ApiError(400, "Either pickup or drop location must be the office")
    }

    // step 5 — check late request
    const isLate = isLateRequest(scheduled_at);

    const ride = await RideRequest.create({
      employee_id,
      office_id,
      destination_type,
      scheduled_at,
      pickup_address,
      pickup_location,
      drop_address,
      drop_location,
      solo_preference: isLate ? true : solo_preference, // Force solo if it's a late request
      is_late_request: isLate
    })

    if (ride) {
      res.status(201).json(new ApiResponse(201, "Ride booked successfully", ride))
    } else {
      throw new ApiError(500, "Failed to book ride")
    }

  } catch (error) {
    next(error || new ApiError(500, "Ride booking error"))
  }
}

import { getRoute } from "../../utils/osrm.js";

export const getAllRideRequestsWithRoutes = async (req, res) => {
  try {
    const rides = await RideRequest.find();

    const result = [];

    for (let r of rides) {
      const pickup = r.pickup_location.coordinates;
      const drop = r.drop_location.coordinates;

      const route = await getRoute(pickup, drop);

      result.push({
        _id: r._id,
        pickup_location: r.pickup_location,
        drop_location: r.drop_location,
        route
      });
    }

    res.json({ success: true, rides: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};