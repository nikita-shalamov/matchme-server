import express from 'express'
import mongoose from 'mongoose'
import config from 'config'
import cors from 'cors'
import routerPhoto from './routes/photos.routes.js'
import routerAuth from './routes/auth.routes.js'
import routerTest from './routes/test.routes.js'
import Sex from './models/Sex.js'
import routerRegister from './routes/register.routes.js'
import City from './models/City.js'
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js'
import prettyjson from 'prettyjson';
const { ObjectId } = mongoose.Types;
import axios from 'axios'
import { count, log } from 'console'
import fs from 'fs'
import routerLikes from './routes/likes.routes.js'
import Likes from './models/Likes.js'
import routerChats from './routes/chats.routes.js'
import Rooms from './models/Rooms.js'
import http from 'http'
import { Server } from 'socket.io';
import Messages from './models/Messages.js'

const app = express()
const server = http.createServer(app)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка, где хранятся загруженные файлы
const uploadDir = path.join(__dirname, 'uploads');

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // подключение к комнате
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // сообщение отправляем в комнату определенную
    socket.on('message', ({ room, message, user, timestamp}) => {
        console.log(`Получено сообщение: ${message} в комнате: ${room}`);
        io.to(room).emit('message', { room, message, user, timestamp });
    });
    

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use(cors({
    origin: '*', // Разрешить все домены (можно заменить на конкретные домены, если нужно)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
app.use(express.json());
app.use('/api', routerPhoto);
app.use('/api', routerAuth);
app.use('/api', routerTest);
app.use('/api', routerRegister);
app.use('/api', routerLikes);
app.use('/api', routerChats);
app.use('/upload', express.static(uploadDir));

const PORT = config.get('PORT') || 3000

app.get('/api',
    async (req, res) => {
        
        const data = await User.find()
        const likes = await Likes.find()
        const rooms = await Rooms.find()
        const messages = await Messages.find()
        // await Rooms.deleteOne({secondUser: new mongoose.Types.ObjectId('66c063ddfc87b601e0baf8a6')})
        // await Rooms.deleteMany()
        // await Likes.deleteMany({toUser: new ObjectId('66b9e032f8bc8e44c5789083')})
        // await Likes.deleteMany()
        // await User.deleteOne({telegramId: 7})
        // const data = {message: 'успешно'}
        res.send(`
            <html>
                <head><title>Server</title></head>
                <body>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                    <pre>${JSON.stringify(likes, null, 2)}</pre>
                    <pre>${JSON.stringify(rooms, null, 2)}</pre>
                    <pre>${JSON.stringify(messages, null, 2)}</pre>
                </body>
            </html>
        `);
        
    }
)


async function start() {
    try {
        await mongoose.connect(config.get('Uri')).then(() => {
            console.log('Connected to MongoDB');
        })

        server.listen(PORT, () => {
            console.log(`Server started on ${PORT} port`);
        })
    } catch (e) {
        console.log('server fail: ', e.message);
        process.exit(1);
    }
}

start()