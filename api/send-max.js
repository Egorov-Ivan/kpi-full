export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { balance, threshold, userName } = req.body

  const message = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
    `📊 *Баланс:* ${balance} руб.\n` +
    `📉 *Порог уведомления:* ${threshold} руб.\n` +
    `🆘 Баланс ниже установленного порога.\n\n` +
    `👤 *Клиент:* ${userName}\n`

  const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN
  const MAX_CHAT_ID = process.env.MAX_CHAT_ID

  if (!MAX_BOT_TOKEN || !MAX_CHAT_ID) {
    console.error('MAX_BOT_TOKEN или MAX_CHAT_ID не заданы')
    return res.status(500).json({ error: 'MAX credentials not configured' })
  }

  const url = `https://api.telegram.org/bot${MAX_BOT_TOKEN}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: MAX_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Уведомление в МАХ отправлено')
      res.status(200).json({ success: true, result })
    } else {
      console.error('❌ Ошибка МАХ:', result)
      res.status(500).json({ error: 'MAX API error', details: result })
    }
  } catch (error) {
    console.error('❌ Ошибка отправки в МАХ:', error)
    res.status(500).json({ error: error.message })
  }
}