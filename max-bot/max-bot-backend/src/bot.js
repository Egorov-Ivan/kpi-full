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
      
      // Добавляем клавиатуру если есть (правильный формат MAX)
      if (options.keyboard) {
        payload.reply_markup = {
          inline_keyboard: options.keyboard
        };
      }
      
      console.log('📤 Отправка сообщения:', { chatId, textLength: text.length, hasKeyboard: !!options.keyboard });
      
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
      console.error('Ошибка отправки сообщения:', error.response?.data || error.message);
      throw error;
    }
  }

  // Отправить сообщение с кнопками
  async sendMessageWithKeyboard(chatId, text, buttons) {
    // Формат кнопок для MAX API
    const keyboard = [];
    
    for (const row of buttons) {
      const buttonRow = [];
      for (const btn of row) {
        const button = { text: btn.text };
        if (btn.url) {
          button.url = btn.url;
        }
        if (btn.callback_data) {
          button.callback_data = btn.callback_data;
        }
        if (btn.request_contact) {
          button.request_contact = true;
        }
        buttonRow.push(button);
      }
      keyboard.push(buttonRow);
    }
    
    return this.sendMessage(chatId, text, { keyboard });
  }

  // Зарегистрировать обработчик команды
  on(command, handler) {
    this.handlers.set(command, handler);
  }

  // Получить обновления (Long Polling)
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

  // Обработать входящее обновление
  async processUpdate(update) {
    console.log('📨 Получено обновление:', JSON.stringify(update, null, 2));
    
    const db = require('./db');
    
    // Обработка запуска бота
    if (update.update_type === 'bot_started') {
      const userId = update.user_id;
      const chatId = update.chat_id;
      
      console.log(`👤 Пользователь запустил бота: ${userId}`);
      await db.saveUser(userId, chatId);
      
      const message = `👋 *Добро пожаловать в BenziGo_bot!*\n\n` +
        `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
        `📱 *Для начала работы отправьте свой номер телефона*`;
      
      const buttons = [
        [{ text: "📱 Отправить номер", request_contact: true }]
      ];
      
      await this.sendMessageWithKeyboard(userId, message, buttons);
      console.log(`✅ Приветствие отправлено пользователю ${userId}`);
      return;
    }
    
    // Обработка обычных сообщений
    if (!update.message) return;
    
    const msg = update.message;
    const text = msg.body?.text || '';
    const userId = msg.sender?.user_id;
    const chatId = msg.recipient?.chat_id;
    
    console.log(`📨 Получено сообщение от ${userId}: ${text || '[контакт]'}`);
    
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
            
            const message = `✅ *Номер ${phone} успешно сохранен!*\n\n` +
              `Теперь вы можете управлять уведомлениями.`;
            
            const buttons = [
              [{ text: "💰 Баланс", callback_data: "show_balance" }],
              [{ text: "⚙️ Настройки", callback_data: "settings" }],
              [{ text: "🔗 Пополнить счет", url: "https://benzigo.ru/accounting" }]
            ];
            
            await this.sendMessageWithKeyboard(userId, message, buttons);
            console.log(`📱 Номер сохранен для ${userId}: ${phone}`);
          } else {
            await this.sendMessage(userId, '❌ Не удалось распознать номер. Попробуйте еще раз.');
          }
          return;
        }
      }
    }
    
    // Главное меню
    if (text === '/start' || text === 'Меню' || text === '🔙 Главное меню') {
      const user = await db.getUser(userId);
      
      if (user && user.phone_number) {
        const message = `👋 *Главное меню*\n\nВыберите действие:`;
        const buttons = [
          [{ text: "💰 Баланс", callback_data: "show_balance" }],
          [{ text: "⚙️ Настройки", callback_data: "settings" }],
          [{ text: "🔗 Пополнить счет", url: "https://benzigo.ru/accounting" }]
        ];
        await this.sendMessageWithKeyboard(userId, message, buttons);
      } else {
        const message = `👋 *Добро пожаловать!*\n\nПожалуйста, отправьте ваш номер телефона:`;
        const buttons = [
          [{ text: "📱 Отправить номер", request_contact: true }]
        ];
        await this.sendMessageWithKeyboard(userId, message, buttons);
      }
      return;
    }
    
    // Обработка callback-запросов (нажатия на кнопки)
    if (update.update_type === 'callback_query') {
      const callback = update.callback_query;
      const userId = callback.user_id;
      const callbackData = callback.data;
      const chatId = callback.chat_id;
      
      console.log(`🔘 Нажата кнопка: ${callbackData} от ${userId}`);
      
      const user = await db.getUser(userId);
      
      switch (callbackData) {
        case 'show_balance':
          const balanceMsg = `💰 *Ваш баланс:* ${user?.balance || 0} руб.\n📊 *Порог:* ${user?.threshold || 500} руб.`;
          const balanceButtons = [
            [{ text: "🔄 Обновить", callback_data: "refresh_balance" }],
            [{ text: "⚙️ Изменить порог", callback_data: "change_threshold" }],
            [{ text: "🔙 Главное меню", callback_data: "main_menu" }]
          ];
          await this.sendMessageWithKeyboard(chatId, balanceMsg, balanceButtons);
          break;
          
        case 'refresh_balance':
          const newBalanceMsg = `💰 *Ваш баланс:* ${user?.balance || 0} руб.\n📊 *Порог:* ${user?.threshold || 500} руб.`;
          const refreshButtons = [
            [{ text: "🔄 Обновить", callback_data: "refresh_balance" }],
            [{ text: "⚙️ Изменить порог", callback_data: "change_threshold" }],
            [{ text: "🔙 Главное меню", callback_data: "main_menu" }]
          ];
          await this.sendMessageWithKeyboard(chatId, newBalanceMsg, refreshButtons);
          break;
          
        case 'change_threshold':
          await this.sendMessage(chatId, "✏️ Введите новый порог уведомления (в рублях):");
          await db.setUserState(userId, 'waiting_for_threshold');
          break;
          
        case 'settings':
          const settingsMsg = `⚙️ *Настройки*\n\n` +
            `📊 Текущий порог: ${user?.threshold || 500} руб.\n` +
            `📱 Номер телефона: ${user?.phone_number || 'не указан'}`;
          const settingsButtons = [
            [{ text: "✏️ Изменить порог", callback_data: "change_threshold" }],
            [{ text: "📱 Сменить номер", callback_data: "change_phone" }],
            [{ text: "🔙 Главное меню", callback_data: "main_menu" }]
          ];
          await this.sendMessageWithKeyboard(chatId, settingsMsg, settingsButtons);
          break;
          
        case 'main_menu':
          const menuMsg = `👋 *Главное меню*\n\nВыберите действие:`;
          const menuButtons = [
            [{ text: "💰 Баланс", callback_data: "show_balance" }],
            [{ text: "⚙️ Настройки", callback_data: "settings" }],
            [{ text: "🔗 Пополнить счет", url: "https://benzigo.ru/accounting" }]
          ];
          await this.sendMessageWithKeyboard(chatId, menuMsg, menuButtons);
          break;
          
        case 'change_phone':
          await this.sendMessage(chatId, "📱 Отправьте новый номер телефона через кнопку контакта:");
          await db.setUserState(userId, 'waiting_for_phone');
          break;
          
        default:
          console.log(`⚠️ Неизвестный callback: ${callbackData}`);
      }
      
      // Отвечаем на callback
      try {
        await axios.post(
          `${this.apiUrl}/callback/answer`,
          { callback_query_id: callback.id },
          { headers: { 'Authorization': `${this.token}` } }
        );
      } catch (e) {}
      
      return;
    }
    
    // Обработка текстового ввода (для порога)
    if (text && !text.startsWith('/')) {
      const userState = await db.getUserState(userId);
      
      if (userState === 'waiting_for_threshold') {
        const newThreshold = parseInt(text);
        if (!isNaN(newThreshold) && newThreshold > 0) {
          await db.updateThreshold(userId, newThreshold);
          await this.sendMessage(userId, `✅ Порог изменен на ${newThreshold} руб.`);
          await db.clearUserState(userId);
          
          // Показываем главное меню
          const menuMsg = `👋 *Главное меню*`;
          const menuButtons = [
            [{ text: "💰 Баланс", callback_data: "show_balance" }],
            [{ text: "⚙️ Настройки", callback_data: "settings" }],
            [{ text: "🔗 Пополнить счет", url: "https://benzigo.ru/accounting" }]
          ];
          await this.sendMessageWithKeyboard(userId, menuMsg, menuButtons);
        } else {
          await this.sendMessage(userId, `❌ Введите корректное число.`);
        }
        return;
      }
    }
    
    console.log(`ℹ️ Неизвестное сообщение от ${userId}`);
  }

  // Запуск Long Polling
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