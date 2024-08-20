import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import config from 'config';

dotenv.config();

const token = config.get("TOKEN");
const webAppLink = config.get("LINK");

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, '*Привет! 👋*\n\nГотовы встретить свою судьбу? 💘\n\nНажмите на кнопку ниже, чтобы начать знакомиться с новыми людьми прямо сейчас!', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Открыть приложение', web_app: { url: webAppLink } }]
                ],
                remove_keyboard: true
            }
        });
    }
});
