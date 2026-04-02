// src/api.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

module.exports = function(bot) {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Обновление баланса (вызывается из Vue)
  app.post('/api/balance/update', async (req, res) => {
    const { userId, balance, threshold } = req.body;
    
    if (!userId || balance === undefined) {
      return res.status(400).json({ error: 'userId и balance обязательны' });
    }
    
    try {
      // Обновляем баланс
      await db.updateBalance(userId, balance);
      
      // Получаем пользователя
      const user = await db.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      const currentThreshold = threshold || user.threshold;
      let notified = false;
      
      // Проверяем порог
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