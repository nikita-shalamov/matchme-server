import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import User from '../models/User.js';
import express from 'express'
const routerPhoto = Router();
import config from 'config'
import axios from 'axios';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import authenticateToken from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.dirname(__dirname);

// Убедитесь, что папка 'uploads' существует
const uploadDir = path.join(parentDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Настройка хранилища для Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.floor(Math.random() * 10000) + path.extname(file.originalname));
  }
});

// Фильтрация файлов по типу
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|heic/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

// Настройка Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Максимальный размер файла: 5MB
  fileFilter: fileFilter
});

// Маршрут для загрузки и обновления фотографий
routerPhoto.post('/upload', upload.array('photos', 10), authenticateToken, async (req, res) => {
  try {
    const telegramId = req.body.telegramId;

    // Получаем пути к загруженным файлам
    const uploadedFiles = [];

    for (const file of req.files) {
      const inputPath = path.join(uploadDir, file.filename);
      const stats = fs.statSync(inputPath);

      // Проверка размера файла (в байтах)
      if (stats.size > 300 * 1024) { // 200 КБ
        // Сжимаем изображение с помощью imagemin
        const compressed = await imagemin([inputPath], {
          destination: uploadDir,
          plugins: [
            imageminMozjpeg({ quality: 87 }), // Сжатие для JPEG
            imageminPngquant({ quality: [0.90, 1] }) // Сжатие для PNG
          ]
        });

        // Если сжатие прошло успешно, обновляем путь
        if (compressed && compressed.length > 0) {
          uploadedFiles.push(path.basename(compressed[0].destinationPath));
        } else {
          uploadedFiles.push(file.filename);
        }
      } else {
        // Файл меньше 200 КБ, не сжимаем
        uploadedFiles.push(file.filename);
      }
    }


    // Найти пользователя по telegramId
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Удалить старые фотографии
    user.photos.forEach(photo => {
      const filePath = path.join(uploadDir, photo);
      fs.unlink(filePath, err => {
        if (err) console.error(`Ошибка при удалении файла ${photo}:`, err);
      });
    });

    // Обновить фотографии пользователя
    user.photos = uploadedFiles;
    await user.save();

    res.status(200).json({ message: 'Файлы успешно загружены', files: uploadedFiles });
  } catch (error) {
    console.error('Ошибка при загрузке файлов:', error);
    res.status(500).json({ error: 'Ошибка при загрузке файлов' });
  }
});


// получение фотографий пользователя
routerPhoto.post('/userPhotos', authenticateToken, async (req, res) => {
 	try {
		const userId = req.body.telegramId;
		const user = await User.findOne({ telegramId: userId }).exec();

		if (!user) {
		return res.status(404).json({ error: 'Пользователь не найден' });
		}

		const photoUrls = user.photos.map(photo => `${photo}`);

		res.status(200).json({ photos: photoUrls });
  	} catch (error) {
		console.error('Ошибка при получении данных пользователя:', error);
		res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  	}
});

routerPhoto.post(
  '/userPhotoTelegram',
  authenticateToken,
  async (req, res) => {
    try {
		const token = config.get('TOKEN')
		const telegramId = req.body.telegramId
		const limit = req.body.limit
    
		let allFiles;
		if (limit != 0) {
			allFiles = await axios.get(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${telegramId}&limit=${limit}`)
		} else {
			return res.json({files: []})
		}
        
		
		const allFilesId = allFiles.data.result.photos.map((item, index) => {
			return item[2].file_id
		})

		const allFilesPaths = await Promise.all(
			allFilesId.map(async (item) => {
				const response = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${item}`);
				return response.data.result.file_path;
			})
		);
        
		const files = await Promise.all(
            allFilesPaths.map(async (filePath) => {
                const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });

                // Преобразование данных в base64
                const base64String = Buffer.from(response.data, 'binary').toString('base64');
                return {
                    data: base64String,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpg',
                };
            })
        );

        res.setHeader('Content-Type', 'application/json');
        res.json({ files });
    } catch (e) {
    	res.status(500).json({message: 'Ошибка получения фото из телеграм'})
    }
  }
)


export default routerPhoto;
