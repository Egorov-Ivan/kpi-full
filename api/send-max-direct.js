import { Bot } from '../max-bot-backend/src/bot.js';
import db from '../max-bot-backend/src/db.js';

export default async function handler(req, res) {
  // Разрешаем CORS
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

  const { balance, threshold, userName } = req.body;
  
  // ID пользователя в MAX (из ваших логов - Иван Егоров)
  const MAX_USER_ID = '225236594';
  // Используем существующую переменную MAX_BOT_TOKEN
  const BOT_TOKEN = process.env.MAX_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error('❌ MAX_BOT_TOKEN не настроен в Vercel');
    return res.status(500).json({ error: 'MAX_BOT_TOKEN not configured' });
  }

  try {
    // Инициализируем бота
    const bot = new Bot(BOT_TOKEN);
    
    // Получаем пользователя из базы данных
    let chatId = MAX_USER_ID;
    try {
      const user = await db.getUser(parseInt(MAX_USER_ID));
      if (user && user.max_chat_id) {
        chatId = user.max_chat_id;
      }
    } catch (dbError) {
      console.log('⚠️ База данных не доступна, используем userId как chatId');
    }
    
    // Формируем сообщение
    const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
      `📊 *Баланс:* ${balance} руб.\n` +
      `📉 *Порог уведомления:* ${threshold} руб.\n` +
      `🆘 Баланс ниже установленного порога.\n\n` +
      (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
      `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;
    
    // Отправляем сообщение через бота
    await bot.sendMessage(chatId, message);
    
    console.log(`✅ Уведомление отправлено в chat ${chatId}`);
    res.status(200).json({ success: true, message: 'Уведомление в МАХ отправлено' });
    
  } catch (error) {
    console.error('❌ Ошибка отправки в MAX:', error);
    res.status(500).json({ error: error.message });
  }
}