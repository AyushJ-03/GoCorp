import { Router } from "express"
import { createUser } from "./user.controller.js"
import { body } from "express-validator"  

const router = Router()

router.post('/add-user', [
  
  body('name.first_name').isLength({ min: 3 }).not().isEmpty().withMessage('First name is required'),

  body('email').isEmail().withMessage('Please provide a valid email'),

  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  body('contact').isMobilePhone().withMessage('Please provide a valid phone number')

], createUser)

export default router