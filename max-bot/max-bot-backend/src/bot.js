// src/bot.js
const axios = require('axios');

class MaxBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = process.env.API_URL || 'https://platform-api.max.ru';
    this.lastUpdateId = 0;
    this.handlers = new Map();
  }

  // Отправить сообщение пользователю
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        text: text,
        format: options.format || 'markdown'
      };
      
      // Кнопки в правильном формате для MAX API
      if (options.buttons && options.buttons.length > 0) {
        payload.buttons = options.buttons;
      }
      
      console.log('📤 Отправка:', { chatId, textLength: text.length, hasButtons: !!options.buttons });
      
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
      console.error('Ошибка отправки:', error.response?.data || error.message);
      throw error;
    }
  }

  // Отправить сообщение с кнопками (упрощенный формат)
  async sendMessageWithButtons(chatId, text, buttonList) {
    // Конвертируем в формат MAX API
    const buttons = buttonList.map(row => {
      return row.map(btn => {
        const button = { text: btn.text };
        if (btn.url) button.url = btn.url;
        if (btn.callback_data) button.data = btn.callback_data;
        if (btn.request_contact) button.request_contact = true;
        return button;
      });
    });
    
    return this.sendMessage(chatId, text, { buttons });
  }

  // Зарегистрировать обработчик
  on(command, handler) {
    this.handlers.set(command, handler);
  }

  // Получить обновления
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

  // Обработать обновление
  async processUpdate(update) {
    console.log('📨 Получено обновление:', JSON.stringify(update, null, 2));
    
    const db = require('./db');
    
    // Запуск бота
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      const chatId = update.chat_id;
      
      console.log(`👤 Новый пользователь: ${userId}`);
      await db.saveUser(userId, chatId);
      
      const message = `👋 *Добро пожаловать!*\n\n` +
        `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
        `📱 Отправьте свой номер телефона:`;
      
      const buttons = [
        [{ text: "📱 Отправить номер", request_contact: true }]
      ];
      
      await this.sendMessageWithButtons(userId, message, buttons);
      return;
    }
    
    // Обычные сообщения
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
            
            const message = `✅ *Номер сохранен!*\n\n` +
              `Ваш баланс: ${await this.getBalance(phone)} руб.\n\n` +
              `Что хотите сделать?`;
            
            const buttons = [
              [{ text: "💰 Проверить баланс", callback_data: "balance" }],
              [{ text: "⚙️ Настройки", callback_data: "settings" }],
              [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
            ];
            
            await this.sendMessageWithButtons(userId, message, buttons);
          }
          return;
        }
      }
    }
    
    // Команда /start
    if (text === '/start') {
      const user = await db.getUser(userId);
      
      if (user && user.phone_number) {
        const message = `👋 *Главное меню*`;
        const buttons = [
          [{ text: "💰 Баланс", callback_data: "balance" }],
          [{ text: "⚙️ Настройки", callback_data: "settings" }],
          [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
        ];
        await this.sendMessageWithButtons(userId, message, buttons);
      } else {
        const message = `👋 *Добро пожаловать!*\n\nОтправьте номер телефона:`;
        const buttons = [
          [{ text: "📱 Отправить номер", request_contact: true }]
        ];
        await this.sendMessageWithButtons(userId, message, buttons);
      }
      return;
    }
    
    // Callback запросы (кнопки)
    if (update.update_type === 'callback_query') {
      const callback = update.callback_query;
      const userId = callback.user_id;
      const data = callback.data;
      const chatId = callback.chat_id;
      
      console.log(`🔘 Нажата кнопка: ${data}`);
      
      const user = await db.getUser(userId);
      
      switch (data) {
        case 'balance':
          const balanceMsg = `💰 *Баланс:* ${user?.balance || 0} руб.\n📊 *Порог:* ${user?.threshold || 500} руб.`;
          const balanceButtons = [
            [{ text: "🔄 Обновить", callback_data: "refresh" }],
            [{ text: "⚙️ Изменить порог", callback_data: "threshold" }],
            [{ text: "🔙 Назад", callback_data: "menu" }]
          ];
          await this.sendMessageWithButtons(chatId, balanceMsg, balanceButtons);
          break;
          
        case 'refresh':
          const refreshedMsg = `💰 *Баланс:* ${user?.balance || 0} руб.\n📊 *Порог:* ${user?.threshold || 500} руб.`;
          await this.sendMessageWithButtons(chatId, refreshedMsg, [
            [{ text: "🔄 Обновить", callback_data: "refresh" }],
            [{ text: "⚙️ Изменить порог", callback_data: "threshold" }],
            [{ text: "🔙 Назад", callback_data: "menu" }]
          ]);
          break;
          
        case 'threshold':
          await this.sendMessage(chatId, "✏️ Введите новый порог (в рублях):");
          await db.setUserState(userId, 'waiting_for_threshold');
          break;
          
        case 'settings':
          const settingsMsg = `⚙️ *Настройки*\n\n📊 Порог: ${user?.threshold || 500} руб.\n📱 Телефон: ${user?.phone_number || 'не указан'}`;
          const settingsButtons = [
            [{ text: "✏️ Изменить порог", callback_data: "threshold" }],
            [{ text: "📱 Сменить номер", callback_data: "phone" }],
            [{ text: "🔙 Назад", callback_data: "menu" }]
          ];
          await this.sendMessageWithButtons(chatId, settingsMsg, settingsButtons);
          break;
          
        case 'menu':
          const menuMsg = `👋 *Главное меню*`;
          const menuButtons = [
            [{ text: "💰 Баланс", callback_data: "balance" }],
            [{ text: "⚙️ Настройки", callback_data: "settings" }],
            [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
          ];
          await this.sendMessageWithButtons(chatId, menuMsg, menuButtons);
          break;
          
        case 'phone':
          await this.sendMessage(chatId, "📱 Отправьте новый номер через кнопку контакта:");
          await db.setUserState(userId, 'waiting_for_phone');
          break;
      }
      
      // Ответ на callback
      try {
        await axios.post(
          `${this.apiUrl}/callback/answer`,
          { callback_query_id: callback.id },
          { headers: { 'Authorization': `${this.token}` } }
        );
      } catch (e) {}
      
      return;
    }
    
    // Текстовый ввод (для порога)
    if (text && !text.startsWith('/')) {
      const userState = await db.getUserState(userId);
      
      if (userState === 'waiting_for_threshold') {
        const newThreshold = parseInt(text);
        if (!isNaN(newThreshold) && newThreshold > 0) {
          await db.updateThreshold(userId, newThreshold);
          await this.sendMessage(userId, `✅ Порог изменен на ${newThreshold} руб.`);
          await db.clearUserState(userId);
          
          const menuMsg = `👋 *Главное меню*`;
          const menuButtons = [
            [{ text: "💰 Баланс", callback_data: "balance" }],
            [{ text: "⚙️ Настройки", callback_data: "settings" }],
            [{ text: "🔗 Пополнить", url: "https://benzigo.ru/accounting" }]
          ];
          await this.sendMessageWithButtons(userId, menuMsg, menuButtons);
        } else {
          await this.sendMessage(userId, `❌ Введите корректное число.`);
        }
        return;
      }
    }
  }
  
  async getBalance(phone) {
    // Заглушка - здесь должен быть запрос к вашему API биллинга
    return 339.07;
  }

  // Запуск
  async start() {
    console.log('🤖 Бот запущен, ожидание сообщений...');
    
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