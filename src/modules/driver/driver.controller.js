import { Driver } from "./driver.model.js";
import ApiError from "../../utils/ApiError.js";
import { validationResult } from "express-validator";
import ApiResponse from "../../utils/ApiResponse.js";

export const createDriver = async (req, res, next) => {
  try {
    const { name, email, contact, password, vehicle } = req.body;

    if (!name || !email || !contact || !password || !vehicle) {
      throw new ApiError(400, "All fields are required");
    }

    const isDriverExists = await Driver.findOne({ email });
    if (isDriverExists) {
      throw new ApiError(401, "Email already exists");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation errors", errors.array());
    }

    const driver = await Driver.create({
      name,
      email,
      contact,
      password: await Driver.hashPassword(password),
      vehicle
    });

    const token = await driver.generateAuthToken();

    res.status(201).json(new ApiResponse(201, "Driver created successfully", { driver, token }))
  } catch (error) {
    next(error)
  }
}
