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

  // Определяем URL для вызова
  const isProduction = process.env.VERCEL_ENV === 'production';
  const apiUrl = isProduction 
    ? `https://${process.env.VERCEL_URL}/api/send-max-direct`
    : 'http://localhost:3000/api/send-message';

  try {
    console.log(`📤 Отправка запроса: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        balance: balance,
        threshold: threshold,
        userName: userName
      })
    });

    const result = await response.json();
    console.log('📨 Ответ:', result);

    if (response.ok) {
      console.log('✅ Уведомление в МАХ отправлено');
      res.status(200).json({ success: true, result });
    } else {
      console.error('❌ Ошибка:', result);
      res.status(500).json({ error: 'MAX bot error', details: result });
    }
  } catch (error) {
    console.error('❌ Ошибка при вызове:', error);
    res.status(500).json({ error: error.message });
  }
}