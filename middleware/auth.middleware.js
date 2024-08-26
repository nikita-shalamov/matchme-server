// authMiddleware.js
import jwt from 'jsonwebtoken'
import config from 'config';
import dotenv from "dotenv";

dotenv.config()

const SECRET_KEY = config.get('SECRET_KEY');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

export default authenticateToken
