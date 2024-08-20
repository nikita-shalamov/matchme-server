// socketServer.js

import { Server } from 'socket.io';
import http from 'http';

const PORT = 3002; // Порт для сервера сокетов

// Создаем HTTP-сервер
const server = http.createServer();

// Создаем Socket.IO сервер
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Здесь укажите URL вашего клиентского приложения
        methods: ['GET', 'POST'],
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('message', ({ room, message }) => {
        io.to(room).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
