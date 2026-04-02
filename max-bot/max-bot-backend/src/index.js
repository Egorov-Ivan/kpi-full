// src/index.js
require('dotenv').config();
const MaxBot = require('./bot');
const createApi = require('./api');
const db = require('./db');

// Проверяем наличие токена
if (!process.env.BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не указан в файле .env');
  console.log('📝 Добавьте строку: BOT_TOKEN=ваш_токен');
  process.exit(1);
}

const bot = new MaxBot(process.env.BOT_TOKEN);

// Обработчик команды /start
bot.on('start', async ({ userId, chatId }) => {
  console.log(`👤 Новый пользователь: ${userId}`);
  await db.saveUser(userId, chatId);
  
  const message = `👋 Добро пожаловать!\n\n` +
    `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
    `📱 *Пожалуйста, отправьте свой номер телефона*, чтобы мы могли связать ваш аккаунт с биллингом.\n\n` +
    `Вы можете отправить контакт через кнопку ниже или вручную набрать номер.`;
  
  await bot.sendMessage(chatId, message);
  console.log(`✅ Приветствие отправлено пользователю ${userId}`);
});

// Обработчик команды /balance
bot.on('balance', async ({ userId, chatId }) => {
  const user = await db.getUser(userId);
  if (user) {
    const message = `💰 *Ваш баланс:* ${user.balance} руб.\n` +
      `📊 *Порог уведомления:* ${user.threshold} руб.`;
    await bot.sendMessage(chatId, message);
    console.log(`📊 Баланс отправлен пользователю ${userId}: ${user.balance} руб.`);
  } else {
    await bot.sendMessage(chatId, 'ℹ️ Вы еще не зарегистрированы. Напишите /start');
  }
});

// Обработчик контакта
bot.on('contact', async ({ userId, chatId, contact }) => {
  let phone = '';
  
  if (contact.vcf_info) {
    const match = contact.vcf_info.match(/TEL[^:]*:(\+?\d+)/i);
    if (match) {
      phone = match[1].replace(/\D/g, '');
      if (phone.length === 11 && phone.startsWith('8')) {
        phone = '7' + phone.slice(1);
      }
    }
  }
  
  if (phone) {
    await db.saveUser(userId, chatId, phone);
    await bot.sendMessage(chatId, `✅ Номер ${phone} успешно сохранен! Теперь вы будете получать уведомления о балансе.\n\nДля проверки баланса отправьте /balance`);
    console.log(`📱 Номер сохранен для пользователя ${userId}: ${phone}`);
  } else {
    await bot.sendMessage(chatId, '❌ Не удалось распознать номер. Пожалуйста, отправьте номер еще раз.');
    console.log(`⚠️ Не удалось распознать номер от пользователя ${userId}`);
  }
});

// Создаем и запускаем API
const api = createApi(bot);
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`✅ API сервер запущен на http://localhost:${PORT}`);
  console.log(`   Доступные эндпоинты:`);
  console.log(`   POST   /api/balance/update - обновить баланс`);
  console.log(`   GET    /api/user/:userId    - получить пользователя`);
  console.log(`   GET    /api/users           - получить всех пользователей`);
  console.log(`   GET    /api/health          - проверка состояния`);
});

// Запускаем бота
bot.start().catch(console.error);