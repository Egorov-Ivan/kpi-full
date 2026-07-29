export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    
    if (message?.text?.startsWith('/start')) {
      const chatId = message.chat.id;
      
      try {
        const response = await fetch('https://work.benzigo.ru/api/balances-api.php');
        const data = await response.json();
        
        let msg = `💰 *Балансы на ${data.time}*\n\n`;
        
        for (const [supplier, balances] of Object.entries(data.balances)) {
          const m = formatMoney(balances.montblanc);
          const f = formatMoney(balances.faeton);
          msg += `*${supplier}*\nМонблан: ${m}\nФаэтон: ${f}\n\n`;
        }
        
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        });
        
      } catch (e) {
        console.error('Ошибка:', e);
      }
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(200).json({ ok: true });
}

function formatMoney(amount) {
  if (!amount) return '—';
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}