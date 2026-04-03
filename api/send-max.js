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
  
  // Используем правильные имена переменных из Vercel
  const BOT_TOKEN = process.env.MAX_BOT_TOKEN;
  const CHAT_ID = process.env.MAX_CHAT_ID;  // ← исправлено
  const API_URL = 'https://platform-api.max.ru';
  
  const MAX_USER_ID = '225236594'; // ID пользователя из логов

  if (!BOT_TOKEN) {
    console.error('❌ MAX_BOT_TOKEN не настроен');
    return res.status(500).json({ error: 'MAX_BOT_TOKEN not configured' });
  }

  if (!CHAT_ID) {
    console.error('❌ MAX_CHAT_ID не настроен');
    return res.status(500).json({ error: 'MAX_CHAT_ID not configured' });
  }

  try {
    const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
      `📊 *Баланс:* ${balance} руб.\n` +
      `📉 *Порог уведомления:* ${threshold} руб.\n` +
      `🆘 Баланс ниже установленного порога.\n\n` +
      (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
      `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;
    
    console.log('📤 Отправка в MAX API:', { 
      url: `${API_URL}/v1/messages/send`,
      chatId: CHAT_ID,
      userId: MAX_USER_ID
    });
    
    // Пробуем разные возможные форматы запроса
    // Формат 1: с chat_id
    const response = await fetch(`${API_URL}/v1/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });
    
    const result = await response.json();
    console.log('📨 Ответ MAX API:', result);
    
    if (response.ok) {
      console.log('✅ Уведомление в МАХ отправлено');
      res.status(200).json({ success: true, result });
    } else {
      console.error('❌ Ошибка MAX API:', result);
      res.status(500).json({ error: 'MAX API error', details: result });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
}