import { RideRequest } from "./rideRequest.model.js";
import { getDistance } from "../../utils/geo.js";

export const isWithinOfficeHours = (scheduledAt, office) => {
  const date = new Date(scheduledAt);
  if (date.getTime() < Date.now()) {
    return false;
  }

  const scheduledDay = date.getDay();

  if (!office.working_days.includes(scheduledDay)) return false;

  const scheduledMinutes =
    date.getHours() * 60 + date.getMinutes();

  const [startH, startM] = office.shift_start.split(":").map(Number);
  const [endH, endM] = office.shift_end.split(":").map(Number);

  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  return scheduledMinutes >= start && scheduledMinutes <= end;
};

export const isDuplicateBooking = async (employeeId, scheduledAt) => {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + 10 * 60 * 1000);

  const ride = await RideRequest.findOne({
    employee_id: employeeId,
    scheduled_at: { $gte: start, $lte: end },
    status: { $ne: "CANCELLED" }
  });
  if (ride) return true
  else return false
};

export const isLateRequest = (scheduledAt) => {
  const now = Date.now();
  const threshold = now + 30 * 60 * 1000;
  return new Date(scheduledAt).getTime() < threshold;
};

export const isOneEndOffice = (pickupLocation, dropLocation, officeLocation) => {
  const pickup = pickupLocation.coordinates;
  const drop = dropLocation.coordinates;
  const office = officeLocation.coordinates;

  return (
    getDistance(pickup, office) < 100 ||
    getDistance(drop, office) < 100
  );
};