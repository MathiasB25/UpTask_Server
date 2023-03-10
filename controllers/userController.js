import User from "../models/User.js"
import createId from "../helpers/createId.js"
import createJWT from "../helpers/createJWT.js"
import { emailRegister, emailResetPassword } from "../helpers/email.js"

const register = async (req, res) => {

    // Check if user/email already exists
    const { email } = req.body
    const emailExist = await User.findOne({ email })

    if(emailExist) {
        const error = new Error('Usuario ya registrado')
        return res.status(400).json({ msg: error.message })
    }

    // Create and send user to DB
    try {
        const user = new User(req.body)
        user.token = createId()
        await user.save()
        // Send confirmation email
        const { email, name, token } = user
        emailRegister({
            email,
            name,
            token
        })

        res.json({ msg: 'Usuario creado correctamente, inicia sesión' })
    } catch (error) {
        console.log(error)
    }
}

const authenticate = async (req, res) => {
    const { email, password } = req.body

    // Check if email exists
    const user = await User.findOne({ email })
    if(!user) {
        const error = new Error('El usuario no existe')
        return res.status(404).json({ msg: error.message })
    }
    // Check if user is confirmed
    if (!user.confirmed) {
        const error = new Error('Tu cuenta no ha sido confirmada')
        return res.status(403).json({ msg: error.message })
    }
    // Check user password
    if(await user.checkPassword(password)) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: createJWT(user._id)
        })
    } else {
        const error = new Error('Contraseña incorrecta')
        return res.status(403).json({ msg: error.message })
    }
}

const confirm = async (req, res) => {
    const { token } = req.params
    const user = await User.findOne({token})
    if (!user) {
        const error = new Error('Token no válido')
        return res.status(403).json({ msg: error.message })
    }

    try {
        user.confirmed = true
        user.token = ''
        await user.save()
        res.json({ msg: 'Usuario confirmado correctamente' })
    } catch (error) {
        console.log(error)
    }
}

const forgotPass = async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        const error = new Error('El usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    try {
        user.token = createId()
        await user.save()
        
        // Send email
        const { email, name, token } = user
        emailResetPassword({
            email,
            name,
            token
        })

        res.json({ msg: "Hemos enviado las instrucciones a tu email" })
    } catch (error) {
        console.log(error)
    }
}

const checkToken = async (req, res) => {
    const { token } = req.params

    const user = await User.findOne({ token })

    if(user) {
        res.json({ msg: 'Valid token and User exists' })
    } else {
        const error = new Error('Invalid Token')
        return res.status(403).json({ msg: error.message })
    }

}

const newPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({ token })

    if (user) {
        user.password = password
        user.token = ''
        try {
            await user.save()
            res.json({ msg: 'Has cambiado tu contraseña correctamente' })
        } catch (error) {
            console.log(error)
        }
    } else {
        const error = new Error('Invalid Token')
        return res.status(403).json({ msg: error.message })
    }
}

const profile = async (req, res) => {
    const { user } = req

    res.json(user)
}

export { 
    register,
    authenticate,
    confirm,
    forgotPass,
    checkToken,
    newPassword,
    profile
}