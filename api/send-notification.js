import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Разрешаем CORS для разработки
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

  const { email, balance, threshold, userName } = req.body;

  if (!email || balance === undefined || threshold === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Используем переменные окружения из .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Benzigo" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `⚠️ Уведомление о низком балансе: ${balance} руб.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #E60410; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px; border: 1px solid #E8E9ED; border-top: none; border-radius: 0 0 8px 8px; }
            .balance { font-size: 32px; font-weight: bold; color: #E60410; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #E60410; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Benzigo</h1>
            </div>
            <div class="content">
              <h2>Здравствуйте, ${userName}!</h2>
              <p>Ваш баланс на счете достиг порога уведомления.</p>
              <div class="balance">${balance} руб.</div>
              <p>Порог уведомления: ${threshold} руб.</p>
              <p>Рекомендуем пополнить счет:</p>
              <p>Если у вас есть вопросы, свяжитесь с менеджером:</p>
              <p>📧 d.fedoseenko@benzigo.ru<br>📞 +7 996 410-39-81</p>
            </div>
            <div class="footer">
              <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
              <p>&copy; 2026 Benzigo</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Уважаемый(ая) ${userName}!

Ваш баланс: ${balance} руб.
Порог уведомления: ${threshold} руб.
Рекомендуем пополнить счет

С уважением,
Команда Benzigo
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}