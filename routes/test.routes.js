import { Router } from "express";
import multer from "multer";
import path from "path";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Получаем путь к текущему файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = dirname(__dirname);

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(parentDir, '/uploads')); // Папка для хранения загруженных файлов
        console.log('parentDir', parentDir);
        
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, `${Date.now()}${extension}`); // Создание уникального имени файла
    }
});

const upload = multer({ storage });

const routerTest = Router();

// Маршрут для загрузки файлов
routerTest.post('/uploadPhotos', upload.array('files', 10), (req, res) => { // Accept up to 10 files
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Файлы не были загружены' });
    }
    log
    const fileInfos = req.files.map(file => ({
        filename: file.filename,
        path: `uploads/${file.filename}`
    }));
    res.json({ message: 'Файлы загружены успешно', files: fileInfos });
});

// Маршрут для получения файла
routerTest.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(parentDir, 'uploads/', filename);
    console.log(__dirname, filePath);
    res.sendFile(filePath);
});



routerTest.post(
    '/test',
    async (req, res) => {
        const {data} = req.body;
    
        if (data === 'Тестовые данные') {
            res.json({message: 'Проверка пройдена успешно по запросу /test'});
        } else {
            res.json({message: 'Проверка ошибочная по запросу /test'});
        }
    }
);

routerTest.get(
    '/testget',
    async (req, res) => {
        res.json({message: 'Проверка пройдена успешно по запросу /testget'});
    }
);



export default routerTest
