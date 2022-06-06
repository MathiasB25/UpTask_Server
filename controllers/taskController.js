import Proyect from '../models/Proyect.js'
import Task from '../models/Task.js'

const addTask = async (req, res) => {
    const { project: projectReq } = req.body

    const project = await Proyect.findById(projectReq)

    if(!project) {
        const error = new Error('No se encontró ese proyecto')
        return res.status(404).json({ msg: error.message })
    }

    if(project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("No tienes permisos para agregar una tarea")
        return res.status(403).json({ msg: error.message })
    }

    try {
        const newTask = await Task.create(req.body)
        project.tasks.push(newTask._id)
        await project.save()
        res.json(newTask)
    } catch (error) {
        console.log(error)
    }

}

const getTask = async (req, res) => {
    const { id } = req.params

    const task = await Task.findById(id).populate('proyect')

    if(!task) {
        const error = new Error('Task not found')
        return res.status(404).json({ msg: error.message })
    }

    if(task.proyect.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Invalid action")
        return res.status(403).json({ msg: error.message })
    }

    res.json(task)
}

const updateTask = async (req, res) => {
    const { id } = req.params

    const task = await Task.findById(id).populate('project')

    if (!task) {
        const error = new Error('Task not found')
        return res.status(404).json({ msg: error.message })
    }

    if (task.project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Invalid action")
        return res.status(403).json({ msg: error.message })
    }

    task.name = req.body.name || task.name
    task.description = req.body.description || task.description
    task.priority = req.body.priority || task.priority
    task.deliverDate = req.body.deliverDate || task.deliverDate

    try {
        const storeTask = await task.save()
        res.json(storeTask)
    } catch (error) {
        console.log(error)
    }
}

const deleteTask = async (req, res) => {
    const { id } = req.params

    const task = await Task.findById(id).populate('project')

    if (!task) {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }

    if (task.project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida")
        return res.status(403).json({ msg: error.message })
    }

    try {
        const project = await Proyect.findById(task.project)
        project.tasks.pull(task._id)

        await Promise.allSettled([ await project.save(), await task.deleteOne() ])
        
        res.json({ msg: 'Tarea eliminada' })
    } catch (error) {
        console.log(error)
    }
}

const changeState = async (req, res) => {
    const { id } = req.params

    const task = await Task.findById(id).populate('project')

    if (!task) {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }

    if (task.project.creator.toString() !== req.user._id.toString() && !task.project.collaborators.some(collaborator => collaborator._id.toString() === req.user._id.toString())) {
        const error = new Error("Acción no válida")
        return res.status(403).json({ msg: error.message })
    }

    task.state = !task.state
    task.completed = req.user._id
    await task.save()

    const storedTask = await Task.findById(id).populate('project').populate('completed')
    res.json(storedTask)
}

export {
    addTask,
    getTask,
    updateTask,
    deleteTask,
    changeState
}