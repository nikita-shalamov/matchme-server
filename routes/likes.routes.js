import { Router } from "express";
import Likes from "../models/Likes.js";
import User from "../models/User.js";
import Rooms from "../models/Rooms.js";
import Messages from "../models/Messages.js";
import authenticateToken from "../middleware/auth.middleware.js";
import Sex from "../models/Sex.js";


const routerLikes = Router()

routerLikes.post('/getUserProfiles', async (req, res) => {
    const { telegramId, filters, page = 1, pageSize = 3 } = req.body; // Устанавливаем pageSize по умолчанию на 3
    
    try {
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        const userId = user._id;

        const userSec = await User.findById(userId).populate('city');
        const userCityId = userSec.city._id;

        const selectedSex = await Sex.findOne({ name: filters.sex });
        console.log(filters, filters.sex, selectedSex);
        

        const today = new Date();
        const startDate = new Date(today.getFullYear() - filters.highAge, today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear() - filters.lowAge, today.getMonth(), today.getDate());

        // Находим пользователей из города с заданными фильтрами
        const usersFromCity = await User.find({
            city: userCityId,
            _id: { $ne: userId },
            birthDate: { $gte: startDate, $lt: endDate },
            ...(selectedSex?._id ? { sex: selectedSex._id } : {})
        }).sort({ createdAt: -1 }); // Сортировка по дате создания, старые сначала
        console.log(usersFromCity);
        
        const userIdsFromCity = usersFromCity.map(user => user._id.toString());

        // Находим пользователей, которые были уже отмечены
        const likedUsers = await Likes.find({ fromUser: userId }).select('toUser');
        const likedUserIds = likedUsers.map(like => like.toUser.toString());

        // Фильтруем пользователей, которые еще не были отмечены
        const usersNotLiked = userIdsFromCity.filter(userId => !likedUserIds.includes(userId));

        // Реализация пагинации
        const skip = (page) * pageSize;
        const users = await User.find({ _id: { $in: usersNotLiked } })
            .populate('sex', 'name')
            .populate('city', 'name')
            .skip(skip)
            .limit(pageSize);
        users.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(users);
    } catch (error) {
        console.error('Ошибка сервера:', error);
        res.status(500).json({ message: "Ошибка сервера", error });
    }
});


routerLikes.get('/getCountLikes/:telegramId', authenticateToken, async (req, res) => {
    try {
        const { telegramId } = req.params;

        const user = await User.findOne({ telegramId }).select('name birthDate');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const likes = await Likes.find({ toUser: user._id, isMutual: false })

        return res.status(200).json({ likesCounter: likes.length });
    } catch (e) {
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Ошибка сервера при получении количества лайков' });
        }
    }
})


routerLikes.post('/addLike', async (req, res) => {
    const fromUser = req.body.fromUser
    const toUser = req.body.toUser

    const fromUserData = await User.findOne({telegramId: fromUser})
    if (!fromUserData) {
        return res.status(404).json({ message: "Пользователь не найден fromUserData" });
    }
    const fromUserId = fromUserData._id
    const toUserData = await User.findOne({telegramId: toUser})
    if (!toUserData) {
        return res.status(404).json({ message: "Пользователь не найден toUserData" });
    }
    const toUserId = toUserData._id

    const existingLike = await Likes.findOne({ fromUser: toUserId , toUser: fromUserId });
    const existingLike2 = await Likes.findOne({ fromUser: fromUserId , toUser: toUserId });

    if (existingLike) {
        // Если toUser уже лайкал fromUser, создаем взаимный лайк
        existingLike.isMutual = true;
        await existingLike.save();

        // Создаем взаимный лайк и для текущего пользователя
        await Likes.create({ fromUser: fromUserId, toUser: toUserId, isMutual: true });

        return res.json({message: 'Есть взаимный лайк!', mutual: true})
    } else if (existingLike2) {
        return res.json({message: 'Уже ставили лайк этому пользователю!'});
    } else {
        await Likes.create({ fromUser: fromUserId, toUser: toUserId });
    }
    res.json({message: 'Лайк поставлен успешно!', mutual: false})
})

routerLikes.post('/addDislike', async (req, res) => {
    const fromUser = req.body.fromUser
    const toUser = req.body.toUser


    const fromUserData = await User.findOne({telegramId: fromUser})
    if (!fromUserData) {
        return res.status(404).json({ message: "Пользователь не найден fromUserData" });
    }
    const fromUserId = fromUserData._id
    const toUserData = await User.findOne({telegramId: toUser})
    if (!toUserData) {
        return res.status(404).json({ message: "Пользователь не найден toUserData" });
    }
    const toUserId = toUserData._id

    const existLike = await Likes.findOne({$and: [{fromUser: toUserId}, {toUser: fromUserId}]})

    if (existLike) {
        await Likes.deleteOne({ _id: existLike._id });
        res.json({message: 'Лайк пользователя удален'})
    } else {
        res.json({message: 'пропускаем анкету'})
    }
    
    

})

routerLikes.get('/getMyLikes/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;

        // Find the user by telegramId
        const user = await User.findOne({ telegramId }).select('name birthDate');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const userId = user._id;

        // Find the likes with populated user data
        const likes = await Likes.find({ toUser: userId, isMutual: false })
            .populate('fromUser', 'telegramId name birthDate')  // Populate additional fields
            .populate('toUser', 'telegramId name birthDate');    // Populate additional fields

        // Calculate the current year
        const currentYear = new Date().getFullYear();

        // Format likes with additional user info and calculated year
        const formattedLikes = likes.map(like => {
            const fromUser = like.fromUser;
            const toUser = like.toUser;

            // Calculate years based on birthDate
            const fromUserYear = fromUser.birthDate ? currentYear - new Date(fromUser.birthDate).getFullYear() : null;
            const toUserYear = toUser.birthDate ? currentYear - new Date(toUser.birthDate).getFullYear() : null;

            return {
                ...like._doc,
                fromUser: {
                    ...fromUser._doc,
                    year: fromUserYear
                },
                toUser: {
                    ...toUser._doc,
                    year: toUserYear
                }
            };
        });

        // Send response with formatted likes
        return res.status(200).json({ likes: formattedLikes });
    } catch (e) {
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Ошибка сервера при получении лайков' });
        }
    }
});

routerLikes.get(
    '/getMatches/:telegramId',
    async (req, res) => {
        try {
            const {telegramId} = req.params

            const userId = await User.findOne({telegramId})

            const rooms = await Rooms.find({$or: [{firstUser: userId._id}, {secondUser: userId._id}]})
            const userChats = []
            
            
            rooms.forEach(async (room) => {
                const messages = await Messages.find({room: room._id})
                if (messages.length > 0) {
                    if (userId._id.toString() === room.firstUser.toString()) {
                        userChats.push(room.secondUser.toString())
                    } else {
                        userChats.push(room.firstUser.toString())
                    }
                }
                
            })

            const matches = await Likes.find({$and: [{$or: [{fromUser: userId._id}, {toUser: userId._id}] }, { isMutual: true }]}).populate('fromUser', 'telegramId name').populate('toUser', 'telegramId name photos')

            // Фильтрация для удаления совпадений с обратными пользователями
            const uniqueMatches = [];
            const matchSet = new Set();

            matches.forEach(match => {
                const key1 = `${match.fromUser._id}-${match.toUser._id}`;
                const key2 = `${match.toUser._id}-${match.fromUser._id}`;

                if (!matchSet.has(key1) && !matchSet.has(key2)) {
                    if (!userChats.includes(match.fromUser._id.toString()) && !userChats.includes(match.toUser._id.toString())) {
                        uniqueMatches.push(match);
                        matchSet.add(key1);
                    }
                    
                }
            });

            


            

            res.json({ matches: uniqueMatches });
        } catch(e) {
            return res.status(500).json({ error: 'Ошибка сервера при получении взаимных лайков' });
        }

    }
)




export default routerLikes