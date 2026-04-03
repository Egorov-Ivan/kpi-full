// src/bot.js
const axios = require('axios');

class MaxBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = process.env.API_URL || 'https://platform-api.max.ru';
    this.lastUpdateId = 0;
    this.handlers = new Map();
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        text: text,
        format: options.format || 'markdown'
      };
      
      if (options.attachments) {
        payload.attachments = options.attachments;
      }
      
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${chatId}`,
        payload,
        {
          headers: {
            'Authorization': `${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отправки:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessageWithButtons(chatId, text, buttonList) {
    const buttons = [];
    
    for (const row of buttonList) {
      const buttonRow = [];
      for (const btn of row) {
        const button = { text: btn.text };
        if (btn.url) {
          button.url = btn.url;
          button.type = 'url';
        }
        if (btn.callback_data) {
          button.callback_data = btn.callback_data;
          button.type = 'callback';
        }
        if (btn.request_contact) {
          button.request_contact = true;
          button.type = 'request_contact';
        }
        buttonRow.push(button);
      }
      buttons.push(buttonRow);
    }
    
    const attachments = [
      {
        type: 'inline_keyboard',
        payload: { buttons }
      }
    ];
    
    return this.sendMessage(chatId, text, { attachments });
  }

  on(command, handler) {
    this.handlers.set(command, handler);
  }

  async getUpdates() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/updates`,
        {
          params: { offset: this.lastUpdateId + 1, limit: 100 },
          headers: { 'Authorization': `${this.token}` }
        }
      );
      
      const updates = response.data.updates || [];
      
      for (const update of updates) {
        await this.processUpdate(update);
        this.lastUpdateId = update.update_id;
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }
  }

  async processUpdate(update) {
    console.log('📨 Получено обновление:', JSON.stringify(update, null, 2));
    
    const db = require('./db');
    
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      const chatId = update.chat_id;
      
      console.log(`👤 Новый пользователь: ${userId}`);
      await db.saveUser(userId, chatId);
      
      const message = `👋 *Добро пожаловать!*\n\n` +
        `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
        `📱 *Отправьте свой номер телефона*`;
      
      const buttons = [
        [{ text: "📱 Отправить номер", request_contact: true }]
      ];
      
      await this.sendMessageWithButtons(userId, message, buttons);
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
            
            const message = `✅ *Номер ${phone} сохранен!*\n\nВыберите действие:`;
            
            const buttons = [
              [{ text: "💰 Баланс", callback_data: "balance" }],
              [{ text: "⚙️ Настройки", callback_data: "settings" }],
              [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
            ];
            
            await this.sendMessageWithButtons(userId, message, buttons);
          }
          return;
        }
      }
    }
    
    if (text === '/start') {
      const user = await db.getUser(userId);
      
      const message = user && user.phone_number 
        ? `👋 *Главное меню*`
        : `👋 *Добро пожаловать!*\n\nОтправьте номер телефона:`;
      
      const buttons = user && user.phone_number
        ? [
            [{ text: "💰 Баланс", callback_data: "balance" }],
            [{ text: "⚙️ Настройки", callback_data: "settings" }],
            [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
          ]
        : [{ text: "📱 Отправить номер", request_contact: true }];
      
      await this.sendMessageWithButtons(userId, message, buttons);
      return;
    }
    
    // Остальная обработка...
    console.log(`ℹ️ Неизвестное сообщение от ${userId}`);
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
        await new Promise(resolve => setTimeout(resolve, 5000 * consecutiveErrors));
      }
    }
  }
}

module.exports = MaxBot;