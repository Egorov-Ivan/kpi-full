// src/index.js
require('dotenv').config();
const MaxBot = require('./bot');
const createApi = require('./api');
const db = require('./db');

if (!process.env.BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не указан');
  process.exit(1);
}

const bot = new MaxBot(process.env.BOT_TOKEN);

bot.on('start', async ({ userId, chatId }) => {
  console.log(`👤 Приветствие для ${userId}`);
  
  const message = `👋 *Добро пожаловать в BenziGo бот!*\n\n` +
    `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
    `📱 *Пожалуйста, отправьте свой номер телефона*`;
  
  await bot.sendContactRequest(userId, message);
  console.log(`✅ Приветствие отправлено`);
});

bot.on('balance', async ({ userId, chatId }) => {
  const user = await db.getUser(userId);
  const balance = user?.balance || 0;
  const threshold = user?.threshold || 500;
  
  const message = `💰 *Ваш баланс:* ${balance} руб.\n📊 *Порог:* ${threshold} руб.`;
  await bot.sendMessage(chatId, message);
  await bot.sendMainMenu(chatId);
  console.log(`📊 Баланс отправлен`);
});

bot.on('contact', async ({ userId, chatId, contact }) => {
  console.log(`📱 Получен номер: ${contact.phone}`);
  await bot.sendMessage(chatId, `✅ Номер ${contact.phone} сохранен!\n\nТеперь вы будете получать уведомления.`);
  await bot.sendMainMenu(chatId);
});

bot.on('settings', async ({ userId, chatId }) => {
  const user = await db.getUser(userId);
  const message = `⚙️ *Настройки*\n\n📊 Порог: ${user?.threshold || 500} руб.\n📱 Телефон: ${user?.phone_number || 'не указан'}`;
  await bot.sendMessage(chatId, message);
});

const api = createApi(bot);
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`✅ API сервер запущен на http://localhost:${PORT}`);
});

bot.start().catch(console.error);