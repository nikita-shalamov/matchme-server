// Инициализируйте dotenv только если нужно загрузить переменные из .env файла
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import config from 'config';

// Если вы используете dotenv, вызовите config() один раз в начале
dotenv.config();

const token = config.get("TOKEN");
const webAppLink = config.get("LINK");

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Тиндер', web_app: { url: webAppLink } }]
                ]
            }
        });
    }

    bot.sendMessage(chatId, 'Received your message');
});
