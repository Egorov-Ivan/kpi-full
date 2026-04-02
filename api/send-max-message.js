import { Bot } from '../max-bot-backend/src/bot.js';
import db from '../max-bot-backend/src/db.js';

export default async function handler(req, res) {
  // CORS настройки
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, balance, threshold, userName } = req.body;
  
  // ID пользователя в MAX
  const MAX_USER_ID = userId || '225236594';
  
  try {
    // Инициализируем бота
    const bot = new Bot(process.env.BOT_TOKEN);
    
    // Получаем пользователя из базы (если нужно)
    const user = await db.getUser(parseInt(MAX_USER_ID));
    const chatId = user?.max_chat_id || MAX_USER_ID;
    
    // Формируем сообщение
    const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
      `📊 *Баланс:* ${balance} руб.\n` +
      `📉 *Порог уведомления:* ${threshold} руб.\n` +
      `🆘 Баланс ниже установленного порога.\n\n` +
      (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
      `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;
    
    // Отправляем сообщение
    await bot.sendMessage(chatId, message);
    
    res.status(200).json({ success: true, message: 'Уведомление отправлено' });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
}