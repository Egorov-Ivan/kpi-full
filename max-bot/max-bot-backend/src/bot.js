// src/bot.js
const axios = require('axios');

class MaxBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = process.env.API_URL || 'https://platform-api.max.ru';
    this.lastUpdateId = 0;
    this.handlers = new Map();
  }

  on(command, handler) {
    this.handlers.set(command, handler);
  }

  // Отправка сообщения - используем user_id как chat_id
  async sendMessage(userId, text) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${userId}`,
        { text: text, format: 'markdown' },
        { headers: { 'Authorization': `${this.token}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отправки:', error.response?.data || error.message);
      throw error;
    }
  }

  // Отправка кнопки с номером телефона
  async sendContactButton(userId, text) {
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
      
      console.log('📤 Отправка кнопки контакта пользователю:', userId);
      
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${userId}`,
        payload,
        { headers: { 'Authorization': `${this.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ Кнопка отправлена');
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отправки кнопки:', error.response?.data || error.message);
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
    console.log('📨 Получено обновление тип:', update.update_type);
    
    const db = require('./db');
    
    // bot_started - когда пользователь впервые запускает бота
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      const chatId = update.chat_id || userId;
      
      console.log(`👤 Бот запущен пользователем: ${userId}`);
      await db.saveUser(userId, chatId);
      
      const startHandler = this.handlers.get('start');
      if (startHandler) {
        await startHandler({ userId, chatId });
      }
      return;
    }
    
    // Обычные сообщения
    if (!update.message) return;
    
    const msg = update.message;
    const text = msg.body?.text || '';
    const userId = msg.sender?.user_id;
    const chatId = msg.recipient?.chat_id || userId;
    
    console.log(`📨 Сообщение от ${userId}: "${text || '[контакт]'}"`);
    
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
            
            const contactHandler = this.handlers.get('contact');
            if (contactHandler) {
              await contactHandler({ userId, chatId, contact: { phone, vcf_info: att.payload.vcf_info } });
            }
            console.log(`📱 Номер ${phone} сохранен`);
          }
          return;
        }
      }
    }
    
    // Обработка команд
    if (text === '/start') {
      await db.saveUser(userId, chatId);
      
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
    console.log('🤖 Бот запущен, ожидание сообщений...');
    let consecutiveErrors = 0;
    
    while (true) {
      try {
        await this.getUpdates();
        consecutiveErrors = 0;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Ошибка (${consecutiveErrors}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 5000 * Math.min(consecutiveErrors, 5)));
      }
    }
  }
}

module.exports = MaxBot;