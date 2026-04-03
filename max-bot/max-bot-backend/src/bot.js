// src/bot.js
const axios = require('axios');

class MaxBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = process.env.API_URL || 'https://platform-api.max.ru';
    this.lastUpdateId = 0;
    this.handlers = new Map(); // Добавляем Map для обработчиков
  }

  // Регистрация обработчика команды
  on(command, handler) {
    this.handlers.set(command, handler);
  }

  // Простая отправка сообщения
  async sendMessage(chatId, text) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${chatId}`,
        { text: text, format: 'markdown' },
        { headers: { 'Authorization': `${this.token}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка:', error.response?.data || error.message);
      throw error;
    }
  }

  // Отправка с кнопкой контакта
  async sendContactButton(chatId, text) {
    try {
      const payload = {
        text: text,
        format: 'markdown',
        attachments: [
          {
            type: 'keyboard',
            payload: {
              buttons: [
                [
                  {
                    text: "📱 Отправить номер",
                    type: "request_contact"
                  }
                ]
              ]
            }
          }
        ]
      };
      
      console.log('📤 Отправка кнопки контакта');
      
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${chatId}`,
        payload,
        { headers: { 'Authorization': `${this.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ Кнопка отправлена');
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUpdates() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/updates`,
        { params: { offset: this.lastUpdateId + 1, limit: 100 }, headers: { 'Authorization': `${this.token}` } }
      );
      
      const updates = response.data.updates || [];
      for (const update of updates) {
        await this.processUpdate(update);
        this.lastUpdateId = update.update_id;
      }
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }
  }

  async processUpdate(update) {
    console.log('📨 Получено обновление');
    
    const db = require('./db');
    
    // Запуск бота
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      const chatId = update.chat_id;
      
      console.log(`👤 Новый пользователь: ${userId}`);
      await db.saveUser(userId, chatId);
      
      // Вызываем обработчик 'start' если есть
      const startHandler = this.handlers.get('start');
      if (startHandler) {
        await startHandler({ userId, chatId });
      }
      return;
    }
    
    if (!update.message) return;
    
    const msg = update.message;
    const text = msg.body?.text || '';
    const userId = msg.sender?.user_id;
    const chatId = msg.recipient?.chat_id;
    
    console.log(`📨 Сообщение от ${userId}: ${text || '[контакт]'}`);
    
    // Обработка контакта
    if (msg.body?.attachments) {
      for (const att of msg.body.attachments) {
        if (att.type === 'contact' && att.payload?.vcf_info) {
          let phone = '';
          const match = att.payload.vcf_info.match(/TEL[^:]*:(\+?\d+)/i);
          if (match) {
            phone = match[1].replace(/\D/g, '');
            if (phone.length === 11 && phone.startsWith('8')) {
              phone = '7' + phone.slice(1);
            }
          }
          
          if (phone) {
            await db.saveUser(userId, chatId, phone);
            
            // Вызываем обработчик 'contact'
            const contactHandler = this.handlers.get('contact');
            if (contactHandler) {
              await contactHandler({ userId, chatId, contact: { phone, vcf_info: att.payload.vcf_info } });
            } else {
              await this.sendMessage(userId, `✅ Номер ${phone} сохранен!`);
            }
            console.log(`📱 Номер сохранен: ${phone}`);
          }
          return;
        }
      }
    }
    
    // Обработка команд /start и /balance
    if (text === '/start') {
      const startHandler = this.handlers.get('start');
      if (startHandler) {
        await startHandler({ userId, chatId });
      }
      return;
    }
    
    if (text === '/balance') {
      const balanceHandler = this.handlers.get('balance');
      if (balanceHandler) {
        await balanceHandler({ userId, chatId });
      }
      return;
    }
  }

  async start() {
    console.log('🤖 Бот запущен');
    while (true) {
      try {
        await this.getUpdates();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

module.exports = MaxBot;