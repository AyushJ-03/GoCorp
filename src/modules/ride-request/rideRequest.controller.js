import { RideRequest } from "./rideRequest.model.js"
import { Office } from "../office/office.model.js"
import { User } from "../user/user.model.js"
import ApiResponse from "../../utils/ApiResponse.js"
import ApiError from "../../utils/ApiError.js"
import {
  isWithinOfficeHours,
  isDuplicateBooking,
  isLateRequest,
  isOneEndOffice,
  validateInvitedEmployees,
  getInvitedPeopleForRide,
  findRidesInvitingEmployee,
  getEmployeesInRideGroup
} from "./rideRequest.service.js"
import { validationResult } from "express-validator"
import { getRoute } from "../../utils/osrm.js";

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
      solo_preference,
      invited_employee_ids = []
    } = req.body

    if (!employee_id || !office_id || !scheduled_at) {
      throw new ApiError(400, "Missing required fields")
    }

    // Validate invited employees
    const inviteValidation = validateInvitedEmployees(invited_employee_ids);
    if (!inviteValidation.valid) {
      throw new ApiError(400, inviteValidation.message);
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
      is_late_request: isLate,
      invited_employee_ids,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    })

    if (ride) {
      // Update User's recent locations
      try {
        const user = await User.findById(employee_id);
        if (user) {
          const newLocs = [...user.recent_locations];
          
          // Helper to upsert location
          const addLoc = (addr, pos) => {
            const idx = newLocs.findIndex(l => l.addr === addr);
            if (idx > -1) newLocs.splice(idx, 1);
            newLocs.unshift({ addr, pos, last_used: new Date() });
          };

          if (pickup_address) addLoc(pickup_address, pickup_location.coordinates);
          if (drop_address) addLoc(drop_address, drop_location.coordinates);
          
          user.recent_locations = newLocs.slice(0, 5); // Keep last 5
          await user.save();
        }
      } catch (err) {
        console.error("Failed to update recent locations:", err);
      }

      res.status(201).json(new ApiResponse(201, "Ride booked successfully", ride))
    } else {
      throw new ApiError(500, "Failed to book ride")
    }

  } catch (error) {
    next(error || new ApiError(500, "Ride booking error"))
  }
}


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

export const getInvitedPeople = async (req, res, next) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      throw new ApiError(400, "Employee ID is required");
    }

    // Validate employee_id format
    if (!employee_id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid employee ID format");
    }

    const result = await getInvitedPeopleForRide(employee_id);

    res.status(200).json(
      new ApiResponse(200, "Invited people retrieved successfully", result)
    );
  } catch (error) {
    next(error || new ApiError(500, "Error retrieving invited people"));
  }
};

// For clustering service: Get rides where this employee was invited
export const getRidesWithEmployeeInvite = async (req, res, next) => {
  try {
    const { employee_id, scheduled_at } = req.query;

    if (!employee_id || !scheduled_at) {
      throw new ApiError(400, "Employee ID and scheduled time are required");
    }

    const rides = await findRidesInvitingEmployee(employee_id, scheduled_at);

    res.status(200).json(
      new ApiResponse(200, "Rides with invites retrieved", { 
        count: rides.length,
        rides 
      })
    );
  } catch (error) {
    next(error || new ApiError(500, "Error retrieving rides with invites"));
  }
};

// For clustering service: Get all employees in a ride (requester + invited)
export const getRideEmployeeGroup = async (req, res, next) => {
  try {
    const { ride_id } = req.params;

    if (!ride_id) {
      throw new ApiError(400, "Ride ID is required");
    }

    const employees = await getEmployeesInRideGroup(ride_id);

    res.status(200).json(
      new ApiResponse(200, "Ride employee group retrieved", { 
        total: employees.length,
        employee_ids: employees 
      })
    );
  } catch (error) {
    next(error || new ApiError(500, "Error retrieving ride employee group"));
  }
};

export const cancelRide = async (req, res, next) => {
  try {
    const { ride_id } = req.params;
    const { cancel_reason } = req.body;

    if (!ride_id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid ride ID format");
    }

    const ride = await RideRequest.findById(ride_id);
    if (!ride) throw new ApiError(404, "Ride not found");

    // Ensure the requesting user owns this ride
    if (ride.employee_id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to cancel this ride");
    }

    // Only allow cancellation of PENDING or IN_CLUSTERING rides
    if (!["PENDING", "IN_CLUSTERING"].includes(ride.status)) {
      throw new ApiError(400, `Cannot cancel a ride with status: ${ride.status}`);
    }

    ride.status = "CANCELLED";
    ride.cancelled_at = new Date();
    ride.cancel_reason = cancel_reason || "Cancelled by user";
    await ride.save();

    res.status(200).json(new ApiResponse(200, "Ride cancelled successfully", ride));
  } catch (error) {
    next(error || new ApiError(500, "Error cancelling ride"));
  }
};

export const getRideById = async (req, res, next) => {
  try {
    const { ride_id } = req.params;

    if (!ride_id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid ride ID format");
    }

    const ride = await RideRequest.findById(ride_id)
      .populate('employee_id', 'name email profile_image')
      .populate('office_id', 'name office_location shift_start shift_end')
      .populate('invited_employee_ids', 'name email profile_image');

    if (!ride) throw new ApiError(404, "Ride not found");

    const route = await getRoute(
      ride.pickup_location.coordinates,
      ride.drop_location.coordinates
    );

    res.status(200).json(new ApiResponse(200, "Ride retrieved successfully", { ...ride.toObject(), route }));
  } catch (error) {
    next(error || new ApiError(500, "Error retrieving ride"));
  }
};