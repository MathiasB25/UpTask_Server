import Proyect from "../models/Proyect.js"
import User from "../models/User.js"

const getProyects = async (req, res) => {
    const proyects = await Proyect.find({
        '$or': [
            { 'collaborators': { $in: req.user } },
            { 'creator': { $in: req.user } }
        ]
    }).select('-tasks')

    res.json(proyects)
}

const newProyect = async (req, res) => {
    const proyect = new Proyect(req.body)
    proyect.creator = req.user._id

    try {
        const storeProyect = await proyect.save()
        res.json(storeProyect)
    } catch (error) {
        console.log(error)
    }
}

const getProyect = async (req, res) => {
    const { id } = req.params

    const proyect = await Proyect.findById(id).populate({ path: 'tasks', populate: { path: 'completed', select: 'name' } }).populate('collaborators', "name email")

    if(!proyect) {
        const error = new Error('Not found')
        return res.status(404).json({ msg: error.message })
    }

    if(proyect.creator.toString() !== req.user._id.toString() && !proyect.collaborators.some( collaborator => collaborator._id.toString() === req.user._id.toString())) {
        const error = new Error('Invalid action')
        return res.status(401).json({ msg: error.message })
    }
    
    res.json(proyect)
}

const editProyect = async (req, res) => {
    const { id } = req.params

    const proyect = await Proyect.findById(id)

    if (!proyect) {
        const error = new Error('Not found')
        return res.status(404).json({ msg: error.message })
    }

    if (proyect.creator.toString() !== req.user._id.toString()) {
        const error = new Error('Invalid action')
        return res.status(401).json({ msg: error.message })
    }

    proyect.name = req.body.name || proyect.name
    proyect.description = req.body.description || proyect.description
    proyect.deliverDate = req.body.deliverDate || proyect.deliverDate
    proyect.client = req.body.client || proyect.client

    try {
        const storeProyect = await proyect.save()
        res.json(storeProyect)
    } catch (error) {
        console.log(error)
    }
}

const deleteProyect = async (req, res) => {
    const { id } = req.params

    const proyect = await Proyect.findById(id)

    if (!proyect) {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }

    if (proyect.creator.toString() !== req.user._id.toString()) {
        const error = new Error('Acción no válida')
        return res.status(401).json({ msg: error.message })
    }

    try {
        await proyect.deleteOne()
        res.json({ msg: 'Proyecto eliminado correctamente' })
    } catch (error) {
        console.log(error)
    }
}

const searchCollaborator = async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({email}).select('-confirmed -createdAt -updatedAt -password -token -__v')

    if(!user) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    res.json(user)
}

const addCollaborator = async (req, res) => {
    const project = await Proyect.findById(req.params.id)

    if(!project) {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({msg: error.message})
    }

    if(project.creator.toString() !== req.user._id.toString()) {
        const error = new Error('Acción no válida')
        return res.status(404).json({ msg: error.message })
    }

    const { email } = req.body
    const user = await User.findOne({ email }).select('-confirmed -createdAt -updatedAt -password -token -__v')

    if (!user) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({ msg: error.message })
    }

    if(project.creator.toString() === user._id.toString()) {
        const error = new Error('El creador del proyecto no puede ser colaborador')
        return res.status(404).json({ msg: error.message })
    }

    if (project.collaborators.includes(user._id)) {
        const error = new Error('El usuario ya pertenece al proyecto')
        return res.status(404).json({ msg: error.message })
    }

    // Esta bien, se puede agregar
    project.collaborators.push(user._id)
    await project.save()
    res.json({msg: 'Colaborador agregado correctamente'})
}

const deleteCollaborator = async (req, res) => {
    const project = await Proyect.findById(req.params.id)

    if (!project) {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }

    if (project.creator.toString() !== req.user._id.toString()) {
        const error = new Error('Acción no válida')
        return res.status(404).json({ msg: error.message })
    }

    // Esta bien, se puede eliminar
    project.collaborators.pull(req.body.id)
    await project.save()
    res.json({ msg: 'Colaborador eliminado correctamente' })
}

export {
    getProyects,
    newProyect,
    getProyect,
    editProyect,
    deleteProyect,
    searchCollaborator,
    addCollaborator,
    deleteCollaborator
}