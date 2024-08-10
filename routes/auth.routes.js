import { Router } from "express";
import User from "../models/User.js";

const routerAuth = Router()

routerAuth.post(
    '/checkAuth',
    async (req, res) => {
        try {
            const {userId} = req.body
            const user = await User.findOne({telegramId: userId})
    
            if (!user) {
                return res.json({message: 'Пользователь не найден'})
            }
            
            res.json({message: "Пользователь найден", user})
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'})
        }
    }
)

routerAuth.post(
    '/createUser',
    async (req, res) => {
        try {
            const {userId, name, description} = req.body

            const user = new User({userId, name, description})
            await user.save()

            res.json({message: "Пользователь создан"})
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'})
        }
    }
)

export default routerAuth