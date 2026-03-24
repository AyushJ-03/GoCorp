import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    office_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    name: {
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      }
    },
    email: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "not a valid number"]
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COMPANY_ADMIN", "OFFICE_ADMIN", "EMPLOYEE", "DRIVER"],
      required: true
    },
    lastLogin: Date,
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);