// Хранилище последних уведомлений (в реальном проекте используйте БД)
const lastNotifications = {};

export default async function handler(req, res) {
  // CORS headers
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

  const { userId, balance, threshold, email, userName } = req.body;

  const key = `${userId}`;
  const lastNotification = lastNotifications[key];
  const now = Date.now();
  
  // Проверяем, нужно ли отправлять уведомление:
  // 1. Баланс ниже порога
  // 2. Предыдущее уведомление было больше часа назад (или его не было)
  const shouldNotify = balance <= threshold && 
    (!lastNotification || now - lastNotification.timestamp > 60 * 1000);

  if (shouldNotify) {
    // Отправляем email через существующий эндпоинт
    try {
      const emailResponse = await fetch(`${process.env.VERCEL_URL || 'https://kpi-ashen.vercel.app'}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          balance,
          threshold,
          userName
        })
      });
      
      const emailResult = await emailResponse.json();
      
      if (emailResult.success) {
        // Сохраняем время отправки
        lastNotifications[key] = {
          timestamp: now,
          balance,
          threshold
        };
        
        return res.status(200).json({ 
          notified: true, 
          emailSent: true,
          message: 'Уведомление отправлено'
        });
      } else {
        return res.status(200).json({ 
          notified: false, 
          emailSent: false,
          message: 'Ошибка отправки email'
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(200).json({ 
        notified: false, 
        emailSent: false,
        message: error.message
      });
    }
  }
  
  return res.status(200).json({ 
    notified: false, 
    message: lastNotification ? 'Уведомление уже отправлено недавно' : 'Баланс выше порога'
  });
}