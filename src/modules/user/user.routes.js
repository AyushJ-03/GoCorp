import { Router } from "express"
import { createUser } from "./user.controller.js"

const router = Router()

router.post('/add-user', createUser)

export default router