// src/api.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

module.exports = function(bot) {
  const app = express();
  
  // Простые настройки CORS
  app.use(cors());
  app.use(express.json());
  
  // Обновление баланса (вызывается из Vue)
  app.post('/api/balance/update', async (req, res) => {
    const { userId, balance, threshold } = req.body;
    
    if (!userId || balance === undefined) {
      return res.status(400).json({ error: 'userId и balance обязательны' });
    }
    
    try {
      await db.updateBalance(userId, balance);
      const user = await db.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      const currentThreshold = threshold || user.threshold;
      let notified = false;
      
      if (balance < currentThreshold) {
        const message = `⚠️ *Внимание!*\n\nВаш баланс: *${balance} руб.*\nНиже порога: *${currentThreshold} руб.*\n\nПожалуйста, пополните счет.`;
        
        const buttons = [
          [{ text: '💰 Пополнить', url: 'https://ваш-сайт/payment' }]
        ];
        
        await bot.sendMessageWithButtons(user.max_chat_id, message, buttons);
        notified = true;
        console.log(`📨 Уведомление отправлено пользователю ${userId}`);
      }
      
      res.json({ success: true, notified, balance, threshold: currentThreshold });
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).json({ error: 'Внутренняя ошибка' });
    }
  });
  
  // Отправка сообщений (вызывается из фронтенда)
  app.post('/api/send-message', async (req, res) => {
    const { userId, chatId, message, balance, threshold, userName } = req.body;
    
    console.log('📨 Получен запрос на отправку сообщения:', { userId, chatId, balance, threshold });
    
    try {
      let targetChatId = chatId;
      
      if (userId && !targetChatId) {
        const user = await db.getUser(parseInt(userId));
        if (user && user.max_chat_id) {
          targetChatId = user.max_chat_id;
        } else {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }
      }
      
      if (!targetChatId) {
        return res.status(400).json({ error: 'Не указан chatId или userId' });
      }
      
      let finalMessage = message;
      if (!finalMessage && balance !== undefined && threshold !== undefined) {
        finalMessage = `⚠️ *Уведомление о низком балансе* ⚠️\n\n` +
          `📊 *Баланс:* ${balance} руб.\n` +
          `📉 *Порог уведомления:* ${threshold} руб.\n` +
          `🆘 Баланс ниже установленного порога.\n\n` +
          (userName ? `👤 *Клиент:* ${userName}\n\n` : '') +
          `🔗 [Пополнить счет](https://benzigo.ru/accounting)`;
      }
      
      if (!finalMessage) {
        return res.status(400).json({ error: 'Нет текста сообщения' });
      }
      
      await bot.sendMessage(targetChatId, finalMessage);
      
      console.log(`✅ Сообщение отправлено в chat ${targetChatId}`);
      res.json({ success: true, message: 'Сообщение отправлено', chatId: targetChatId });
      
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Получить информацию о пользователе
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const user = await db.getUser(parseInt(req.params.userId));
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'Пользователь не найден' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Ошибка базы данных' });
    }
  });
  
  // Получить всех пользователей
  app.get('/api/users', async (req, res) => {
    try {
      const users = await db.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка базы данных' });
    }
  });
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
};