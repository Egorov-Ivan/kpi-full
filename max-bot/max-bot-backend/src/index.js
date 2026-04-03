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

// Обработчик команды /start
bot.on('start', async ({ userId, chatId }) => {
  console.log(`👤 Обработка /start для userId: ${userId}`);
  
  const message = `👋 Добро пожаловать!\n\n` +
    `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
    `📱 *Отправьте свой номер телефона*`;
  
  await bot.sendContactButton(userId, message);
  console.log(`✅ Приветствие отправлено`);
});

// Обработчик команды /balance
bot.on('balance', async ({ userId, chatId }) => {
  const user = await db.getUser(userId);
  const balance = user?.balance || 0;
  const threshold = user?.threshold || 500;
  await bot.sendMessage(userId, `💰 *Баланс:* ${balance} руб.\n📊 *Порог:* ${threshold} руб.`);
  console.log(`📊 Баланс отправлен`);
});

// Обработчик контакта
bot.on('contact', async ({ userId, chatId, contact }) => {
  console.log(`📱 Получен номер от ${userId}: ${contact.phone}`);
  await bot.sendMessage(userId, `✅ Номер ${contact.phone} сохранен!\n\nТеперь вы будете получать уведомления.\n\nДля проверки баланса отправьте /balance`);
});

// Запускаем API
const api = createApi(bot);
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`✅ API сервер запущен на http://localhost:${PORT}`);
});

// Запускаем бота
bot.start().catch(console.error);