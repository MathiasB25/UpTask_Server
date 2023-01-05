import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'
import userRoutes from './routes/userRoutes.js'
import proyectRoutes from './routes/proyectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const app = express()
app.use(express.json())

dotenv.config()

connectDB()

// CORS
const whitelist = [process.env.CLIENT_URL]

const corsOptions = {
    origin: function(origin, callback) {
        if(whitelist.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('CORS Error'))
        }
    }
}

app.use(cors(corsOptions))

// Routing
app.use('/api/users', userRoutes)
app.use('/api/projects', proyectRoutes)
app.use('/api/tasks', taskRoutes)

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
    console.log(`Server running in port ${PORT}`)
})

// Socket.io
import { Server } from 'socket.io'

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.CLIENT_URL
    }
})

io.on('connection', (socket) => {
    /* console.log('Conectado a socket.io') */

    // Socket.io events
    socket.on('openProject', (project) => {
        socket.join(project);
    })

    socket.on('newTask', (task) => {
        const project = task.project
        socket.to(project).emit('addTask', task)
    })
    
    socket.on('deleteTask', (task) => {
        const project = task.project
        socket.to(project).emit('deletedTask', task)
    })
    
    socket.on('editTask', (task) => {
        const project = task.project._id
        socket.to(project).emit('updatedTask', task)
    })
    
    socket.on('completeTask', (task) => {
        const project = task.project._id
        socket.to(project).emit('completedTask', task)
    })

})
