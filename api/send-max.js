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
  const CHAT_ID = process.env.MAX_CHAT_ID;
  const API_URL = 'https://platform-api.max.ru';

  // Логируем наличие переменных
  console.log('🔍 Проверка переменных:', {
    hasToken: !!BOT_TOKEN,
    hasChatId: !!CHAT_ID,
    tokenPrefix: BOT_TOKEN ? BOT_TOKEN.substring(0, 20) : 'none',
    chatId: CHAT_ID
  });

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'MAX_BOT_TOKEN not configured' });
  }

  if (!CHAT_ID) {
    return res.status(500).json({ error: 'MAX_CHAT_ID not configured' });
  }

  try {
    const message = `⚠️ Уведомление о низком балансе ⚠️\n\nБаланс: ${balance} руб.\nПорог: ${threshold} руб.\n\nКлиент: ${userName}\n\nПополнить счет: https://benzigo.ru/accounting`;
    
    // Пробуем разные варианты endpoint'ов
    const endpoints = [
      `${API_URL}/v1/messages/send`,
      `${API_URL}/messages/send`,
      `${API_URL}/send`,
      `${API_URL}/bot/sendMessage`
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📤 Пробуем endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': BOT_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message
          })
        });
        
        const result = await response.json();
        console.log(`📨 Ответ от ${endpoint}:`, { status: response.status, result });
        
        if (response.ok) {
          console.log('✅ Уведомление отправлено через:', endpoint);
          return res.status(200).json({ success: true, endpoint, result });
        }
        
        lastError = { endpoint, status: response.status, result };
      } catch (e) {
        console.log(`❌ Ошибка на ${endpoint}:`, e.message);
        lastError = { endpoint, error: e.message };
      }
    }
    
    // Если ни один endpoint не сработал
    console.error('❌ Все endpointы не сработали:', lastError);
    return res.status(500).json({ 
      error: 'MAX API error', 
      details: lastError,
      message: 'Ни один из endpointов не ответил успешно'
    });
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    return res.status(500).json({ error: error.message });
  }
}