// api/proxy/[...path].js
export default async function handler(req, res) {
  // Разрешаем CORS для ответов прокси (опционально)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Получаем путь из запроса
  // Например: /api/proxy/managers/list/ → path = ['managers', 'list']
  const { path } = req.query;
  
  if (!path || !path.length) {
    return res.status(400).json({ error: 'Path is required' });
  }

  // Формируем URL к API
  const targetUrl = `https://api.benzigo.ru/${path.join('/')}`;
  
  console.log(`🔄 Прокси: ${req.method} ${targetUrl}`);

  try {
    // Настройки для запроса к API
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'accessToken': process.env.VITE_CRM_API_TOKEN
      }
    };

    // Добавляем тело для POST запросов
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Отправляем запрос к API
    const response = await fetch(targetUrl, options);
    const data = await response.json();

    console.log(`✅ Прокси: ${response.status} ${targetUrl}`);

    // Возвращаем ответ клиенту
    return res.status(200).json(data);
    
  } catch (error) {
    console.error(`❌ Прокси ошибка: ${targetUrl}`, error);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}