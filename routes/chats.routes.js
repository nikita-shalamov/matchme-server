import { Router } from "express";
import Rooms from "../models/Rooms.js";
import Messages from "../models/Messages.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import authenticateToken from "../middleware/auth.middleware.js";

const routerChats = Router()

routerChats.get('/getMessages/:roomId', authenticateToken, async (req, res) => {
    try {
        const roomId = new mongoose.Types.ObjectId(req.params.roomId)
        
        const messages = await Messages.find({room: roomId})

        res.status(200).json({messages})
    } catch(e) {
        res.status(500).send('Ошибка сервера при отправке сообщения');
    }
})



routerChats.post('/addMessage', authenticateToken, async (req, res) => {
    try {
        const { room, user, content, timestamp } = req.body;

        const message = new Messages({ room, user, content, timestamp });

        await message.save();
        res.status(201).json({message, result: 'Сообщение успешно отправлено'});
    } catch (error) {
        res.status(500).send('Ошибка сервера при отправке сообщения');
    }
})

routerChats.post('/checkRoom', async (req, res) => {
    try {
        const {firstUser, secondUser} = req.body

        const firstUserData = await User.findOne({telegramId: firstUser})
        if (!firstUserData) {
            return res.status(404).json({message: 'Пользователь firstUser не найден'})
        }
        const firstUserId = firstUserData._id

        const secondUserData = await User.findOne({telegramId: secondUser})
        if (!secondUserData) {
            return res.status(404).json({message: 'Пользователь secondUser не найден'})
        }
        const secondUserId = secondUserData._id

        const room = await Rooms.findOne({$or: [{firstUser: firstUserId, secondUser: secondUserId}, {firstUser: secondUserId, secondUser: firstUserId}]})
    
        if (room) {
            return res.status(200).json({room})
        }
        
        if (firstUser !== secondUser) {
            const newRoom = new Rooms({firstUser: firstUserId, secondUser: secondUserId})    

            await newRoom.save()
    
            res.status(200).json({message: 'Чат создан!', room: newRoom._id})
        } else {
            res.status(400).json({message: 'Пользователи одинаковые, чат создать нельзя'})
        }
        
    } catch(e) {
        res.status(500).send('Ошибка сервера при отправке сообщения');
    }
})

routerChats.get('/getCountUnreadChats/:telegramId', authenticateToken, async (req, res) => {
    try {
        const {telegramId} = req.params        

        const user = await User.findOne({telegramId})

        const rooms = await Rooms.find({$or: [{firstUser: user._id}, {secondUser: user._id}]})

        let unReadMessagesCounter = 0;        

        for (const element of rooms) {
            const messages = await Messages.find({ room: element._id });
            const unReadMessages = messages.filter((msg) => {
                return msg.user !== Number(telegramId) && !msg.isRead;
            });
            if (unReadMessages.length > 0) {
                unReadMessagesCounter++;
            }
        }

        res.status(200).json({unReadCounter: unReadMessagesCounter})
    } catch (e) {
        res.status(500).send('Ошибка при получении количества сообщений')
    }
})

routerChats.get('/getChats/:userId', authenticateToken, async (req, res) => {
    try {
        const {userId} = req.params

        const userData = await User.findOne({telegramId: userId})
        if (!userData) {
            return res.status(404).json({message: 'Пользователь не найден'})
        }
        
        const rooms = await Rooms.find({$or: [{firstUser: userData._id}, {secondUser: userData._id}]})
        
        if (!rooms) {
            return res.status(400).json({message: 'Чаты не найдены!'})
        }

        const chatData = await Promise.all(rooms.map(async room => {
            const firstUser = await User.findById(room.firstUser);
            const secondUser = await User.findById(room.secondUser);
            let anotherUser 
            
            if (firstUser._id.toString() === userData._id.toString()) {
                anotherUser = secondUser
            } else {
                anotherUser = firstUser
            }
            

            const messages = await Messages.find({ room: room._id }).sort({ createdAt: -1 });
            const lastMessage = messages[messages.length - 1]; 
            const unReadMessages = await Messages.find({ room: room._id, user: {$ne: userId}, isRead: false })
            return {
                roomId: room._id,
                anotherUser: {
                    id: anotherUser._id,
                    name: anotherUser.name,
                    telegramId: anotherUser.telegramId,
                    photos: `https://shalamov-nikita.ru/api/upload/${anotherUser.photos[0]}`
                },
                lastMessage: lastMessage,
                unReadMessages: unReadMessages.length
            };
        }));

        // Возвращаем данные чатов с информацией о пользователях
        res.status(200).json({ chats: chatData });
    } catch(e) {
        res.status(500).send('Ошибка сервера при поиске чатов');
    }
})

routerChats.post('/markMessagesAsRead/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    try {
        await Messages.updateMany({ room: roomId, user: { $ne: userId }, isRead: false }, { isRead: true });
        res.status(200).json({ message: 'Сообщения отмечены как прочитанные' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при отметке сообщений о прочтении' });
    }
});

export default routerChats