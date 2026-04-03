import { RideRequest } from "../ride-request/rideRequest.model.js";
import { Ride } from "../ride/ride.model.js";
import { clusterRequests } from "./clustering.service.js";
import { buildRoute } from "./route.service.js";

export async function processRideRequests(scheduled_at, office_id) {

  const start = new Date(scheduled_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const requests = await RideRequest.find({
    scheduled_at: {
      $gte: start,
      $lt: end
    },
    office_id,
    status: "PENDING",
    is_late_request: false
  });

  if (!requests.length) return [];

  const clusters = clusterRequests(requests);

  const createdRides = [];

  for (let cluster of clusters) {

    const route = await buildRoute(cluster);

    const stops = [];

    for (let req of cluster) {
      stops.push({
        type: "pickup",
        request_id: req._id,
        location: req.pickup_location
      });

      stops.push({
        type: "drop",
        request_id: req._id,
        location: req.drop_location
      });
    }

    const ride = await Ride.create({
      office_id,
      scheduled_at,
      requests: cluster.map(r => r._id),
      stops,
      route
    });

    createdRides.push(ride);

    await RideRequest.updateMany(
      { _id: { $in: cluster.map(r => r._id) } },
      {
        status: "CLUSTERED",
        parent_request_id: ride._id
      }
    );
  }

  return createdRides;
}