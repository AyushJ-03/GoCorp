import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    office_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true
    },

    scheduled_at: {
      type: Date,
      required: true
    },

    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RideRequest"
      }
    ],

    stops: [
      {
        type: {
          type: String,
          enum: ["pickup", "drop"]
        },

        request_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RideRequest"
        },

        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point"
          },
          coordinates: [Number]
        }
      }
    ],

    route: {
      geometry: [],
      distance: Number,
      duration: Number
    },
    status: {
      type: String,
      enum: ["PLANNED", "ONGOING", "COMPLETED"],
      default: "PLANNED"
    }
  },
  {
    timestamps: true
  }
);

export const Ride = mongoose.model("Ride", rideSchema);