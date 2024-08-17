import { Router } from "express";
import Likes from "../models/Likes.js";
import User from "../models/User.js";



const routerLikes = Router()

routerLikes.post('/getUserProfiles', async (req, res) => {
    const { telegramId, page = 1, pageSize = 5 } = req.body;
    
    try {
        console.log('try started');

        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        const userId = user._id;
        
        const userSec = await User.findById(userId).populate('city');
        const userCityId = userSec.city._id;

        // Step 1: Get users from the same city
        const usersFromCity = await User.find({ city: userCityId, _id: { $ne: userId } }).select('_id');
        
        const userIdsFromCity = usersFromCity.map(user => user._id.toString());
        console.log('userIdsFromCity', userIdsFromCity);
        
    
        // Step 2: Find users who have been liked by the current user
        const likedUsers = await Likes.find({ fromUser: userId }).select('toUser');
        const likedUserIds = likedUsers.map(like => like.toUser.toString());
        console.log('likedUserIds', likedUserIds);
    
        // Step 3: Filter out users who have been liked
        const usersNotLiked = userIdsFromCity.filter(userId => !likedUserIds.includes(userId));
        console.log('usersNotLiked', usersNotLiked);

        // Step 4: Find user profiles of those who have not been liked
        const users = await User.find({ _id: { $in: usersNotLiked } }).populate('city', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Ошибка сервера:', error); // Выводим ошибку в консоль
        res.status(500).json({ message: "Ошибка сервера", error });
    }
});


routerLikes.post('/addLike', async (req, res) => {
    const fromUser = req.body.fromUser
    const toUser = req.body.toUser

    console.log(req.body);

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

        return res.json({message: 'Есть взаимный лайк!'})
    } else if (existingLike2) {
        return res.json({message: 'Уже ставили лайк этому пользователю!'});
    } else {
        await Likes.create({ fromUser: fromUserId, toUser: toUserId });
    }
    res.json({message: 'Лайк поставлен успешно!'})
})

routerLikes.post('/addDislike', async (req, res) => {
    const fromUser = req.body.fromUser
    const toUser = req.body.toUser

    console.log(req.body);

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
        console.log(telegramId);

        // Find the user by telegramId
        const user = await User.findOne({ telegramId }).select('name birthDate');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const userId = user._id;
        console.log(userId);

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

            const matches = await Likes.find({$and: [{$or: [{fromUser: userId._id}, {toUser: userId._id}] }, { isMutual: true }]}).populate('fromUser', 'telegramId name').populate('toUser', 'telegramId name photos')

            // Фильтрация для удаления совпадений с обратными пользователями
            const uniqueMatches = [];
            const matchSet = new Set();

            matches.forEach(match => {
                const key1 = `${match.fromUser._id}-${match.toUser._id}`;
                const key2 = `${match.toUser._id}-${match.fromUser._id}`;

                if (!matchSet.has(key1) && !matchSet.has(key2)) {
                    uniqueMatches.push(match);
                    matchSet.add(key1);
                }
            });

            res.json({ matches: uniqueMatches });
            
        } catch(e) {
            return res.status(500).json({ error: 'Ошибка сервера при получении взаимных лайков' });
        }

    }
)




export default routerLikes