export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).json({ success: true });
    }
    
    const chatId = message.chat.id;
    const text = message.text.trim();
    
    if (text === '/start') {
      // Получаем балансы
      try {
        const rnCardPass = Buffer.from(process.env.RNCARD_PASSWORD || '').toString('base64');
        const rnRes = await fetch(
          `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${process.env.RNCARD_LOGIN}&contract=ISS00000&type=json`,
          { headers: { 'RnCard-Identity-Account-Pass': rnCardPass } }
        );
        const rnData = await rnRes.json();
        console.log('🔍 RN-Card ответ:', JSON.stringify(rnData)); // ← добавить эту строку
        const msg = `💰 *РН-Карт*\nДоступно: ${rnData.Available?.toLocaleString('ru-RU') || 'н/д'} ₽`;
        
        await sendMessage(chatId, msg);
      } catch (e) {
        await sendMessage(chatId, '❌ Ошибка получения баланса');
      }
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}