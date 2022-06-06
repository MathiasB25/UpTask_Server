import express from 'express'
import checkAuth from '../middleware/checkAuth.js'
import { addTask, getTask, updateTask, deleteTask, changeState } from '../controllers/taskController.js'

const router = express.Router()

router.post('/', checkAuth, addTask)
router.route('/:id').get(checkAuth, getTask).put(checkAuth, updateTask).delete(checkAuth, deleteTask)
router.post('/state/:id', checkAuth, changeState)

export default router