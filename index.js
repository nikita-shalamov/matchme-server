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
app.use('/api', routerPhoto);
app.use('/api', routerAuth);
app.use('/api', routerTest);
app.use('/api', routerRegister);
app.use('/uploads', express.static(uploadDir));

const PORT = config.get('PORT') || 3002

app.get('/',
    async (req, res) => {
        const data = await User.find()
        // await User.deleteMany()
        const userId = 5328560635
        const token = config.get('TOKEN')
        const queryUrl = `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${userId}`

        const userFiles = await axios.get(queryUrl)
        console.log('file id: ', userFiles.data.result.photos[0][2]);
        console.log(`https://api.telegram.org/bot${token}/getFile?file_id=${userFiles.data.result.photos[0][2].file_id}`);
        
        const filePath = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${userFiles.data.result.photos[0][2].file_id}`)
        console.log('file path: ', filePath.data.result.file_path);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath.data.result.file_path}`

        async function downloadImage(url, filename) {
            const response = await axios.get(url, { responseType: 'arraybuffer' });

            const folderPath = path.join(__dirname, 'images')
            const filePath = path.join(folderPath, filename);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            
            fs.writeFile(filePath, response.data, (err) => {
              if (err) throw err;
              console.log('Image downloaded successfully!');
            });
          }
        downloadImage(fileUrl, 'kate-image.png')
        
        console.log(__dirname)
        res.send(`
            <html>
                <head><title>Users</title></head>
                <body>  
                    ${queryUrl}
                    ${__dirname + '/' + 'kate-image.jpg'}
                    <img src=${__dirname + '/' + 'kate-image.jpg'}>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </body>
            </html>
        `);
        
    }
)

const addCity = () => {
    const city = new City({name: 'moscow'})
    city.save()
}


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