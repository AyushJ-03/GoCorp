import { RideRequest } from "./ride.model.js"
import { Office } from "../office/office.model.js"
import ApiResponse from "../../utils/ApiResponse.js"
import ApiError from "../../utils/ApiError.js"
import {
  isWithinOfficeHours,
  isDuplicateBooking,
  isLateRequest,
  isOneEndOffice
} from "./ride.service.js"

export const bookRide = async (req, res, next) => {
  try {
    const {
      employee_id,
      office_id,
      direction,
      schedule_type,
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
    if (isLateRequest(scheduled_at)) {
      throw new ApiError(400, "Ride request must be made at least 30 minutes in advance")
    }

    const ride = await RideRequest.create({
      employee_id,
      office_id,
      direction,
      schedule_type,
      scheduled_at,
      pickup_address,
      pickup_location,
      drop_address,
      drop_location,
      solo_preference
    })

    if (ride) {
      res.status(201).json(new ApiResponse(201, "Ride booked successfully", ride))
    } else {
      throw new ApiError(500, "Failed to book ride")
    }

  } catch (e) {
    next(e)
  }
}