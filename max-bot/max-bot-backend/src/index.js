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

// Приветствие при старте
bot.on('start', async ({ userId }) => {
  console.log(`👤 Приветствие для userId: ${userId}`);
  
  const message = `👋 *Добро пожаловать в BenziGo бот!*\n\n` +
    `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
    `📱 *Пожалуйста, отправьте свой номер телефона*`;
  
  await bot.sendContactRequest(userId, message);
});

// Обработка полученного номера телефона
bot.on('contact', async ({ userId, contact }) => {
  console.log(`📱 Получен номер от ${userId}: ${contact.phone}`);
  
  // Сохраняем номер в bot_users
  await db.saveBotUser(userId, contact.phone);
  
  // Ищем учетную запись в CRM по номеру телефона
  const crmUser = await db.findCrmUserByPhone(contact.phone);
  
  if (crmUser) {
    // Получаем имя из контакта или из БД
    const userName = contact.name || crmUser.username;
    
    console.log(`🔍 Найдена учетная запись: ${crmUser.username}`);
    console.log(`🏢 Клиент: ${crmUser.company_name}`);
    console.log(`💰 Баланс: ${crmUser.balance} руб.`);
    
    const message = `✅ *Добро пожаловать, ${userName}!*\n\n` +
      `🏢 *Компания:* ${crmUser.company_name}\n` +
      `💰 *Баланс:* ${crmUser.balance} руб.\n` +
      `🆔 *Аккаунт:* ${crmUser.client_id}\n\n` +
      `Теперь вы будете получать уведомления о снижении баланса.\n\n` +
      `📌 *Текущий порог уведомления:* 500 руб.\n\n` +
      `Используйте меню для управления настройками.`;
    
    await bot.sendMessage(userId, message);
    await bot.sendMainMenu(userId);
    
    // Сохраняем баланс в bot_users
    await db.updateBotBalance(userId, crmUser.balance);
    
  } else {
    console.log(`⚠️ Номер ${contact.phone} не найден в CRM`);
    
    const message = `⚠️ *Внимание!*\n\n` +
      `Номер ${contact.phone} не найден в нашей базе клиентов.\n\n` +
      `Пожалуйста, обратитесь в поддержку для привязки аккаунта.\n\n` +
      `📞 Телефон поддержки: +7 (800) 123-45-67`;
    
    await bot.sendMessage(userId, message);
  }
});

// Запрос баланса
bot.on('balance', async ({ userId }) => {
  const botUser = await db.getBotUser(userId);
  
  if (botUser?.phone_number) {
    const crmUser = await db.findCrmUserByPhone(botUser.phone_number);
    
    if (crmUser) {
      const message = `💰 *Баланс компании ${crmUser.company_name}:* ${crmUser.balance} руб.\n` +
        `📊 *Порог уведомления:* ${botUser.threshold || 500} руб.`;
      
      await bot.sendMessage(userId, message);
    } else {
      await bot.sendMessage(userId, `⚠️ Ваш номер не найден в CRM. Обратитесь в поддержку.`);
    }
  } else {
    await bot.sendMessage(userId, `📱 Сначала отправьте номер телефона через кнопку "Отправить номер".`);
  }
  
  await bot.sendMainMenu(userId);
});

// Настройки
bot.on('settings', async ({ userId }) => {
  const botUser = await db.getBotUser(userId);
  const threshold = botUser?.threshold || 500;
  const phone = botUser?.phone_number || 'не указан';
  
  let crmInfo = '';
  if (botUser?.phone_number) {
    const crmUser = await db.findCrmUserByPhone(botUser.phone_number);
    if (crmUser) {
      crmInfo = `\n🏢 *Компания:* ${crmUser.company_name}\n💰 *Баланс:* ${crmUser.balance} руб.`;
    }
  }
  
  const message = `⚙️ *Настройки*\n\n` +
    `📊 *Порог уведомления:* ${threshold} руб.\n` +
    `📱 *Ваш номер:* ${phone}${crmInfo}\n\n` +
    `✏️ Чтобы изменить порог, отправьте новое число (например: 1000)`;
  
  await bot.sendMessage(userId, message);
});

// Обработка текстового ввода (изменение порога)
bot.on('message', async ({ userId, text }) => {
  const userState = await db.getUserState(userId);
  
  if (userState === 'waiting_for_threshold') {
    const newThreshold = parseInt(text);
    if (!isNaN(newThreshold) && newThreshold > 0) {
      await db.updateThreshold(userId, newThreshold);
      await bot.sendMessage(userId, `✅ Порог уведомления изменен на ${newThreshold} руб.`);
      await db.clearUserState(userId);
      await bot.sendMainMenu(userId);
    } else {
      await bot.sendMessage(userId, `❌ Пожалуйста, введите корректное число.`);
    }
    return;
  }
  
  // Если число и не в режиме ожидания - предлагаем изменить порог
  const num = parseInt(text);
  if (!isNaN(num) && num > 0 && !text.startsWith('/')) {
    await db.updateThreshold(userId, num);
    await bot.sendMessage(userId, `✅ Порог уведомления изменен на ${num} руб.`);
    await bot.sendMainMenu(userId);
  }
});

// Запуск API сервера
const api = createApi(bot);
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`✅ API сервер запущен на http://localhost:${PORT}`);
});

// Запуск бота
bot.start().catch(console.error);