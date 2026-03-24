import ApiResponse from '../../utils/ApiResponse.js';
import { User } from './user.model.js';
import { validationResult } from 'express-validator';

export const createUser = async (req, res, next) => {
  try {
    const {
      company_id,
      office_id,
      name,
      email,
      password,
      contact, 
      role
    } = req.body;

    if(!company_id || !office_id || !name || !email || !password || !contact || !role) {
      return res.status(400).json(new ApiResponse(400, "All fields are required"))
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(new ApiResponse(400, "Validation errors", errors.array()));
    }

    const user = await User.create({
      company_id,
      office_id,
      name,
      email,
      password: await User.hashPassword(password),
      contact, 
      role
    });

    const token = await user.generateAuthToken();

    res.status(201).json(new ApiResponse(201, "User registered successfully", { user, token }))
  } catch (error) {
    next(error)
  }
};