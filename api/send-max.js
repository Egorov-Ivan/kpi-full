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
  
  // Используем BOT_TOKEN (не MAX_BOT_TOKEN)
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const USER_ID = '225236594';
  const API_URL = 'https://platform-api.max.ru';

  // Логируем для отладки
  console.log('🔍 Проверка переменных:', {
    hasBOT_TOKEN: !!BOT_TOKEN,
    tokenPrefix: BOT_TOKEN ? BOT_TOKEN.substring(0, 20) : 'none'
  });

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не настроен в Vercel');
    return res.status(500).json({ error: 'BOT_TOKEN not configured' });
  }

  try {
    const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
      `📊 *Баланс:* ${balance} руб.\n` +
      `📉 *Порог уведомления:* ${threshold} руб.\n` +
      `🆘 Баланс ниже установленного порога.\n\n` +
      (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
      `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;

    const url = `${API_URL}/messages?user_id=${USER_ID}`;
    
    console.log('📤 Отправка в MAX:', { url });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        format: 'markdown'
      })
    });

    const result = await response.json();
    console.log('📨 Ответ:', { status: response.status, result });

    if (response.ok) {
      console.log('✅ Уведомление в МАХ отправлено');
      res.status(200).json({ success: true, result });
    } else {
      console.error('❌ Ошибка:', result);
      res.status(500).json({ error: 'MAX API error', details: result });
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
}