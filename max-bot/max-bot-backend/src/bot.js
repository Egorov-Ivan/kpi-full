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

  // Отправка сообщения пользователю по user_id
  async sendMessage(userId, text, options = {}) {
    if (!userId) {
      console.error('❌ Ошибка: userId не указан');
      return;
    }
    
    try {
      const payload = {
        text: text,
        format: options.format || 'markdown'
      };
      
      if (options.attachments) {
        payload.attachments = options.attachments;
      }
      
      console.log(`📤 Отправка сообщения пользователю ${userId}`);
      
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${userId}`,
        payload,
        {
          headers: {
            'Authorization': `${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Сообщение отправлено пользователю ${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отправки:', error.response?.data || error.message);
      throw error;
    }
  }

  // Создание inline клавиатуры
  createInlineKeyboard(buttons) {
    const keyboardRows = [];
    
    for (const row of buttons) {
      const buttonRow = [];
      for (const btn of row) {
        const button = { text: btn.text };
        
        if (btn.type === 'callback') {
          button.type = 'callback';
          button.payload = btn.payload || btn.text;
          if (btn.intent) button.intent = btn.intent;
        } else if (btn.type === 'link') {
          button.type = 'link';
          button.url = btn.url;
        } else if (btn.type === 'request_contact') {
          button.type = 'request_contact';
        } else if (btn.type === 'request_geo') {
          button.type = 'request_geo_location';
        }
        
        buttonRow.push(button);
      }
      keyboardRows.push(buttonRow);
    }
    
    return {
      type: 'inline_keyboard',
      payload: {
        buttons: keyboardRows
      }
    };
  }

  // Отправка кнопки запроса контакта
  async sendContactRequest(userId, text) {
    const keyboard = this.createInlineKeyboard([
      [{ text: "📱 Отправить номер телефона", type: "request_contact" }]
    ]);
    
    return this.sendMessage(userId, text, { attachments: [keyboard] });
  }

  // Отправка главного меню
  async sendMainMenu(userId) {
    const keyboard = this.createInlineKeyboard([
      [
        { text: "💰 Баланс", type: "callback", payload: "balance" },
        { text: "⚙️ Настройки", type: "callback", payload: "settings" }
      ],
      [
        { text: "🔗 Пополнить счет", type: "link", url: "https://benzigo.ru/accounting" }
      ]
    ]);
    
    return this.sendMessage(userId, "👋 *Главное меню*\n\nВыберите действие:", { attachments: [keyboard] });
  }

  // Получение обновлений
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
      if (error.response?.status !== 404) throw error;
    }
  }

  // Обработка обновления
  async processUpdate(update) {
    console.log('📨 Получено обновление тип:', update.update_type);
    
    const db = require('./db');
    
    // bot_started - пользователь запустил бота
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      
      console.log(`👤 Бот запущен пользователем: ${userId}`);
      await db.saveBotUser(userId, null);
      
      const startHandler = this.handlers.get('start');
      if (startHandler) {
        await startHandler({ userId });
      }
      return;
    }
    
    // message_callback - нажатие на кнопку
    if (update.update_type === 'message_callback') {
      const callback = update.callback;
      const userId = callback.user_id;
      const payload = callback.payload;
      
      console.log(`🔘 Нажата кнопка: ${payload} от ${userId}`);
      
      if (payload === 'balance') {
        const balanceHandler = this.handlers.get('balance');
        if (balanceHandler) {
          await balanceHandler({ userId });
        }
      } else if (payload === 'settings') {
        const settingsHandler = this.handlers.get('settings');
        if (settingsHandler) {
          await settingsHandler({ userId });
        }
      }
      
      // Ответ на callback (убираем индикатор загрузки)
      try {
        await axios.post(
          `${this.apiUrl}/callback/answer`,
          { callback_query_id: update.callback_id },
          { headers: { 'Authorization': `${this.token}` } }
        );
      } catch (e) {
        console.log('⚠️ Не удалось ответить на callback:', e.message);
      }
      
      return;
    }
    
    // Обычные сообщения
    if (!update.message) return;
    
    const msg = update.message;
    const text = msg.body?.text || '';
    const userId = msg.sender?.user_id;
    
    console.log(`📨 Сообщение от пользователя ${userId}: "${text || '[контакт]'}"`);
    
    // Обработка контакта (отправка номера телефона)
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
            await db.BotUser(userId, null, phone);
            
            const contactHandler = this.handlers.get('contact');
            if (contactHandler) {
              await contactHandler({ userId, contact: { phone } });
            }
            console.log(`📱 Номер ${phone} сохранен для userId: ${userId}`);
          }
          return;
        }
      }
    }
    
    // Команда /start
    if (text === '/start') {
      await db.saveBotUser(userId, null);
      
      const startHandler = this.handlers.get('start');
      if (startHandler) {
        await startHandler({ userId });
      }
      return;
    }
    
    // Команда /balance
    if (text === '/balance') {
      const balanceHandler = this.handlers.get('balance');
      if (balanceHandler) {
        await balanceHandler({ userId });
      }
      return;
    }
    
    // Обработка текстового ввода (например, для изменения порога)
    if (text && !text.startsWith('/')) {
      const userState = await db.getUserState(userId);
      
      if (userState === 'waiting_for_threshold') {
        const newThreshold = parseInt(text);
        if (!isNaN(newThreshold) && newThreshold > 0) {
          await db.updateThreshold(userId, newThreshold);
          await this.sendMessage(userId, `✅ Порог уведомления изменен на ${newThreshold} руб.`);
          await db.clearUserState(userId);
          await this.sendMainMenu(userId);
        } else {
          await this.sendMessage(userId, `❌ Пожалуйста, введите корректное число.`);
        }
        return;
      }
    }
  }

  // Запуск бота
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
        
        if (error.response?.status === 429) {
          const waitTime = Math.min(10000 * Math.pow(2, consecutiveErrors - 1), 60000);
          console.log(`⚠️ Слишком много запросов. Пауза ${waitTime / 1000} сек...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (error.response?.status === 404) {
          console.error('❌ Эндпоинт /updates не найден. Проверьте API_URL в .env');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          const waitTime = Math.min(10000 * consecutiveErrors, 60000);
          console.log(`🔄 Повторная попытка через ${waitTime / 1000} сек...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }
}

module.exports = MaxBot;