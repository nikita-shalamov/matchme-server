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
import { log } from 'console'
import fs from 'fs'

const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка, где хранятся загруженные файлы
const uploadDir = path.join(__dirname, 'uploads');

app.use(cors({
    origin: '*', // Разрешить все домены (можно заменить на конкретные домены, если нужно)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
app.use(express.json());
app.use(routerPhoto);
app.use(routerAuth);
app.use(routerTest);
app.use(routerRegister);
app.use('/uploads', express.static(uploadDir));

const PORT = config.get('PORT') || 3000

app.get('/',
    async (req, res) => {
        // const data = await User.find()
        // await User.deleteMany()
        const data = {message: 'успешно'}
        res.send(`
            <html>
                <head><title>Server</title></head>
                <body>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </body>
            </html>
        `);
        
    }
)


async function start() {
    try {
        await mongoose.connect(config.get('Uri'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            console.log('Connected to MongoDB');
        })

        app.listen(PORT, () => {
            console.log(`Server started on ${PORT} port`);
        })
    } catch (e) {
        console.log('server fail: ', e.message);
        process.exit(1);
    }
}

start()