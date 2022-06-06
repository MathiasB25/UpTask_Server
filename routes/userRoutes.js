import express from 'express'
import { register, authenticate, confirm, forgotPass, checkToken, newPassword, profile } from '../controllers/userController.js'
import checkAuth from '../middleware/checkAuth.js'

const router = express.Router()

// Authentication, registration and confirmation of Users
router.post('/', register) //Create new user
router.post('/login', authenticate) //Authenticate user
router.get('/confirm/:token', confirm) // Confirm user
router.post('/reset-password', forgotPass)
router.route('/reset-password/:token').get(checkToken).post(newPassword)

router.get('/profile', checkAuth, profile)

export default router