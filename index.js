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
import routerToken from './routes/token.routes.js'
import { fakerRU as faker } from '@faker-js/faker';
import {cities} from './constants/cities.js'
import { Random } from "random-js";
const random = new Random(); // uses the nativeMath engine

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
    socket.on('message', ({ room, message, user, timestamp, isRead}) => {
        console.log(`Получено сообщение: ${message} в комнате: ${room}`);
        io.to(room).emit('message', { room, message, user, timestamp, isRead });
    });

    socket.on('markRead', ({user, room}) => {
        io.to(room).emit('markRead', {user})
    })
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
app.use('/api', routerToken);
app.use('/api/upload', express.static(uploadDir));

const PORT = config.get('PORT') || 3000

app.get('/api',
    async (req, res) => {
        
        const data = await User.find()
        const likes = await Likes.find()
        const rooms = await Rooms.find()
        const messages = await Messages.find()
        const cities = await City.find()

        res.send(`
            <html>
                <head><title>Server</title></head>
                <body>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                    <pre>${JSON.stringify(likes, null, 2)}</pre>
                    <pre>${JSON.stringify(rooms, null, 2)}</pre>
                    <pre>${JSON.stringify(messages, null, 2)}</pre>
                    <pre>${JSON.stringify(cities, null, 2)}</pre>
                </body>
            </html>
        `);
        
    }
)

async function addCitiesToDB() {
    try {
        for (const city of cities) {
            const existingCity = await City.findOne({ name: city.value });
            if (!existingCity) {
                const newCity = new City({
                    name: city.value,
                });
                await newCity.save();
                console.log(`Город ${city.label} добавлен в базу данных.`);
            } else {
                console.log(`Город ${city.label} уже существует в базе данных.`);
            }
        }
        console.log('Загрузка городов завершена.');
    } catch (error) {
        console.error('Ошибка при добавлении городов в базу данных:', error);
    }
}

// addCitiesToDB();


// app.get('/addPhotos', async (req, res) => {
//     const personsDir = path.join(__dirname, 'persons');

//     // Функция для генерации нового имени файла
//     const renameFile = (ext) => {
//         return Date.now() + '-' + Math.floor(Math.random() * 10000) + ext;
//     };

//     // Функция для получения расширения файла
//     const getFileExtension = (filename) => path.extname(filename);

//     // Храним структуру для вывода в консоль
//     const folderStructure = {};

//     // Рекурсивная функция для обхода папок и файлов
//     const processDirectory = (dir) => {
//         const files = fs.readdirSync(dir);

//         files.forEach(file => {
//             const filePath = path.join(dir, file);
//             const stat = fs.statSync(filePath);

//             if (stat.isDirectory()) {
//                 // Если это папка, рекурсивно обрабатываем её
//                 processDirectory(filePath);
//             } else {
//                 const ext = getFileExtension(file); // Получаем расширение файла
//                 const newFileName = renameFile(ext); // Генерируем новое имя с текущим расширением
//                 const newFilePath = path.join(dir, newFileName);

//                 // Переименовываем файл
//                 fs.renameSync(filePath, newFilePath);

//                 // Логируем структуру папки и имя файла
//                 const folderName = path.basename(dir);
//                 if (!folderStructure[folderName]) {
//                     folderStructure[folderName] = [];
//                 }
//                 folderStructure[folderName].push(newFileName);
//             }
//         });
//     };

//     // Начинаем обход с корневой папки persons
//     processDirectory(personsDir);

//     // Выводим в консоль результат
//     Object.keys(folderStructure).forEach(folder => {
//         console.log(`${folder}: {`);
//         folderStructure[folder].forEach(file => {
//             console.log(`  ${file},`);
//         });
//         console.log('}');
//     });

//     res.send(`
//         <html>
//             <head><title>Server</title></head>
//             <body>
//                 <pre>${JSON.stringify(folderStructure, null, 2)}</pre>
//             </body>
//         </html>
//     `);
// });

// app.get('/updatePhotos', async (req, res) => {
//     const result = await User.updateMany(
//         { telegramId: { $gte: 1000, $lte: 1036 }, photos: { $size: 0 } }, // Находим пользователей с пустым массивом photos
//         { $set: { photos: ["1726740364631-6427.png", "1726740364631-2499.png", "1726740364631-2048.png"] } } // Добавляем фото
//       );
//     res.json({result})
// })

// app.get('/randomDataInput', async (req, res) => {
//     const users = await User.find()
//     let profileCounter = 2259;

//     const interestsList = [
//         { label: "travel", name: "Путешествия", emoji: "🌍" },
//         { label: "movies", name: "Кино", emoji: "🎬" },
//         { label: "music", name: "Музыка", emoji: "🎵" },
//         { label: "photography", name: "Фотография", emoji: "📷" },
//         { label: "cooking", name: "Кулинария", emoji: "🍳" },
//         { label: "sports", name: "Спорт", emoji: "⚽" },
//         { label: "art", name: "Искусство", emoji: "🎨" },
//         { label: "technology", name: "Технологии", emoji: "💻" },
//         { label: "literature", name: "Литература", emoji: "📚" },
//         { label: "nature", name: "Природа", emoji: "🌳" },
//         { label: "animals", name: "Животные", emoji: "🐾" },
//         { label: "games", name: "Игры", emoji: "🎮" },
//     ];

//     const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
//     const photos = ["1726740364629-6286.png",
//     "1726740364629-1688.png",
//     "1726740364629-1731.png"]

//     const getRandomInterests = (list) => {
//         const numberOfInterests = getRandomNumber(1, 6);
//         const chosenInterests = new Set();
//         const chosenInterestsNames = new Set();

//         while (chosenInterests.size < numberOfInterests) {
//             const randomIndex = getRandomNumber(0, list.length - 1);
//             chosenInterests.add(list[randomIndex].label);
//             chosenInterestsNames.add(list[randomIndex].name);
//         }

//         return [Array.from(chosenInterests), Array.from(chosenInterestsNames)];
//     };
//     for (const element of cities) {

//         const interests = getRandomInterests(interestsList)
//         const fakeProfile = {
//             telegramId: profileCounter,
//             name: faker.person.firstName('male'),
//             city: element.value,
//             sex: 'man',
//             photos: photos,
//             birthDate: faker.date.birthdate({ min: 18, max: 30, mode: 'age' }),
//             interests: interests[0],
//         };

//         fakeProfile.description = `Привет! Я ${fakeProfile.name} из города ${element.label}. Много чем занимаюсь и интересуюсь, но в основном это ${interests[1].join(', ')}.`;

//         const existingUser = await User.findOne({ telegramId: fakeProfile.telegramId });
//         if (existingUser) {
//             profileCounter++;
//             continue;
//         }

//         const sexDoc = await Sex.findOne({ name: fakeProfile.sex });
//         const sexId = sexDoc._id;

//         const cityDoc = await City.findOne({ name: fakeProfile.city });

//         const cityId = cityDoc._id;

//         const newUser = new User({ ...fakeProfile, city: cityId, sex: sexId });

//         await newUser.save();

//         console.log('профиль создан', profileCounter);
//         profileCounter++;
//     }

//     res.send(`
//         <html>
//             <head><title>Server</title></head>
//             <body>
//                 <pre>${JSON.stringify(cities.length, null, 2)}</pre>
//                 <pre>${JSON.stringify(users, null, 2)}</pre>
//             </body>
//         </html>
//     `);
// });


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