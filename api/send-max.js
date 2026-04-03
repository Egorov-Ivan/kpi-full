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
  
  const BOT_TOKEN = process.env.MAX_BOT_TOKEN;
  const USER_ID = '225236594'; // ID пользователя из логов (Иван Егоров)
  const API_URL = 'https://platform-api.max.ru';

  if (!BOT_TOKEN) {
    console.error('❌ MAX_BOT_TOKEN не настроен');
    return res.status(500).json({ error: 'MAX_BOT_TOKEN not configured' });
  }

  try {
    const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
      `📊 *Баланс:* ${balance} руб.\n` +
      `📉 *Порог уведомления:* ${threshold} руб.\n` +
      `🆘 Баланс ниже установленного порога.\n\n` +
      (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
      `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;

    // Правильный endpoint согласно документации MAX [citation:5]
    const url = `${API_URL}/messages?user_id=${USER_ID}`;
    
    console.log('📤 Отправка в MAX:', { url, messageLength: message.length });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        format: 'markdown'  // Поддерживается markdown форматирование [citation:5]
      })
    });

    const result = await response.json();
    console.log('📨 Ответ MAX API:', { status: response.status, result });

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