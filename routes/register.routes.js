import { Router } from "express";
import User from "../models/User.js";
import Sex from "../models/Sex.js";
import City from "../models/City.js";


const routerRegister = Router()


routerRegister.post(
    '/pushUserData',
    async (req, res) => {
        const {telegramId, name, birthDate, sex, city, description, photos = [], interests} = req.body

        try {
            if (!telegramId || !name || !birthDate || !sex || !city) {
                return res.status(400).json({ message: 'Пожалуйста, заполните все обязательные поля.' });
            }

            const existingUser = await User.findOne({ telegramId });
            if (existingUser) {
                return res.status(400).json({ message: `Пользователь с telegramId ${telegramId} уже существует.` });
            }

            const sexDoc = await Sex.findOne({ name: sex });
            if (!sexDoc) {
                return res.status(400).json({ message: `Пол '${sex}' не найден.` });
            }
            const sexId = sexDoc._id;

            const cityDoc = await City.findOne({ name: city });
            if (!cityDoc) {
                return res.status(400).json({ message: `Город '${city}' не найден.` });
            }
            const cityId = cityDoc._id;

            const newUser = new User({
                telegramId,
                name,
                birthDate,
                sex: sexId,
                city: cityId,
                description,
                photos,
                interests
            });

            await newUser.save();

            res.status(201).json({ message: 'Пользователь успешно добавлен.', user: newUser });
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при добавлении пользователя', e: e });
        }
    }
)

routerRegister.post(
    '/takeUserData',
    async (req, res) => {
        try {
            const { telegramId } = req.body;

            const user = await User.findOne({ telegramId });

            if (!user) {
                return res.json({message: 'Пользователь не найден'})
            }

            const sex = await Sex.findById(user.sex);
            const city = await City.findById(user.city);

            const userObject = user.toObject();
            delete userObject._id;
            
            res.json({
                message: {
                    ...userObject,
                    sex: sex.name,
                    city: city.name
                },
                query: 'takeUserData'
            });
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'})
        }
    }
)



routerRegister.post(
    '/changeUserData',
    async (req, res) => {
        try {
            const { updateData } = req.body;            
            
            const sexId = await Sex.findOne({name: updateData.sex})
            const cityId = await City.findOne({name: updateData.city})

            const updateUser = await User.findOneAndUpdate({telegramId: updateData.telegramId}, {...updateData, sex: sexId._id, city: cityId._id}, {new: true})

            if (!updateUser) {
                return res.status(404).json({ message: 'Ошибка изменения данных пользователя' });
            }
            
            res.json({message: 'Данные изменены успешно!', updateUser});
        } catch (e) {
            res.status(500).json({message: 'Что-то пошло не так'})
        }
    }
)





export default routerRegister