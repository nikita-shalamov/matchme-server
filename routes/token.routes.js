import dotenv from "dotenv";
import { Router } from "express";
import config from 'config';
import jwt from 'jsonwebtoken'

const routerToken = Router()

dotenv.config();

const SECRET_KEY = config.get("SECRET_KEY")

routerToken.post('/login', (req, res) => {
    const { telegramId } = req.body;

    // Дополнительные проверки подлинности пользователя (например, сверка с базой данных)

    // Генерация токена
    const token = jwt.sign({ id: telegramId }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
});


// Маршрут для проверки токена
routerToken.get('/checkToken', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ message: 'Access granted', decoded });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default routerToken