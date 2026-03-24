import ApiResponse from '../../utils/ApiResponse.js';
import { User } from './user.model.js';

export const createUser = async (req, res, next) => {
  try {
    const {
      company_id,
      office_id,
      name,
      email,
      contact, 
      role
    } = req.body;

    const user = await User.create({
      company_id,
      office_id,
      name,
      email,
      contact, 
      role
    });

    res.status(201).json(new ApiResponse(201, "User registered successfully", user))
  } catch (error) {
    next(error)
  }
};