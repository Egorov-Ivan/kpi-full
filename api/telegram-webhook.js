// api/telegram-webhook.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    
    if (message?.text?.startsWith('/start')) {
      const chatId = message.chat.id;
      
      try {
        const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' });
        
        // === РОСНЕФТЬ ===
        const faetonPass = Buffer.from(process.env.RNCARD_FAETON_PASSWORD || '').toString('base64');
        const faetonRes = await fetch(
          `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${process.env.RNCARD_FAETON_LOGIN}&contract=ISS238084&type=json`,
          { headers: { 'RnCard-Identity-Account-Pass': faetonPass } }
        );
        const faetonData = await faetonRes.json();
        
        const monblanPass = Buffer.from(process.env.RNCARD_MONBLAN_PASSWORD || '').toString('base64');
        const monblanRes = await fetch(
          `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${process.env.RNCARD_MONBLAN_LOGIN}&contract=ISS218557&type=json`,
          { headers: { 'RnCard-Identity-Account-Pass': monblanPass } }
        );
        const monblanData = await monblanRes.json();
        // === РОСНЕФТЬ ===
        const rnMsg = `*Роснефть*\n` +
          `Фаэтон: ${(faetonData.Available || 0).toLocaleString('ru-RU')} ₽\n` +
          `Монблан: ${(monblanData.Available || 0).toLocaleString('ru-RU')} ₽`;
        
        // === ЛУКОЙЛ (заглушка) ===
        const lukoilMsg = `*Лукойл*\n` +
          `Фаэтон: —\n` +
          `Монблан: —`;
        
         // === ТАТНЕФТЬ (заглушка) ===
        const tnMsg = `*Татнефть*\n` +
          `Фаэтон: —\n` +
          `Монблан: —`;
        
          // === НАТКАР (заглушка) ===
        const natcarMsg = `*Наткар*\n` +
          `Фаэтон: —\n` +
          `Монблан: —`;

          // === ППР (заглушка) ===
          const pprMsg = `*ППР*\n` +
          `Фаэтон: —\n` +
          `Монблан: —`;

        const msg = `💰 *Балансы на ${time}*\n\n${rnMsg}\n\n${lukoilMsg}\n\n${tnMsg}\n\n${natcarMsg}\n\n${pprMsg}`
        
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        });
        
      } catch (e) {
        console.error('❌ Ошибка:', e);
      }
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(200).json({ ok: true });
}