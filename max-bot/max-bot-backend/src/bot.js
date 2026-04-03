// src/bot.js
const axios = require('axios');

class MaxBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = process.env.API_URL || 'https://platform-api.max.ru';
    this.lastUpdateId = 0;
    this.handlers = new Map();
  }

  // Отправить сообщение пользователю (исправлено: user_id в URL)
  async sendMessage(chatId, text, options = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages?user_id=${chatId}`,
        {
          text: text,
          format: options.format || 'markdown',
          ...options
        },
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
  async sendMessageWithButtons(chatId, text, buttons) {
    return this.sendMessage(chatId, text, {
      attachments: [
        {
          type: 'inline_keyboard',
          payload: { buttons }
        }
      ]
    });
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
    
    // Обработка события запуска бота (bot_started)
    
// При первом запуске бота
if (update.update_type === 'bot_started') {
  const userId = update.user_id;
  const chatId = update.chat_id;
  
  console.log(`👤 Пользователь запустил бота: ${userId}`);
  
  const db = require('./db');
  await db.saveUser(userId, chatId);
  
  const message = `👋 *Добро пожаловать в бот уведомлений!*\n\n` +
    `Я буду предупреждать вас, когда баланс станет ниже установленного порога.\n\n` +
    `📱 *Для начала работы отправьте свой номер телефона*, чтобы связать аккаунт с биллингом.`;
  
  const keyboard = {
    buttons: [
      [
        {
          type: 'request_contact',
          text: '📱 Отправить номер телефона'
        }
      ]
    ]
  };
  
  await this.sendMessage(userId, message, {
    attachments: [
      {
        type: 'inline_keyboard',
        payload: keyboard
      }
    ]
  });
  
  console.log(`✅ Приветствие с кнопкой отправлено пользователю ${userId}`);
  return;
}
    
    // Обработка обычных сообщений
    if (!update.message) return;
    
    const msg = update.message;
    const text = msg.body?.text || '';
    const userId = msg.sender?.user_id;
    
    console.log(`📨 Получено сообщение от ${userId}: ${text}`);
    
    // Обработка команды /start
    // Обработка команды /start
if (text === '/start') {
  const db = require('./db');
  await db.saveUser(userId, userId);
  
  const message = `👋 Добро пожаловать!\n\n` +
    `Я буду уведомлять вас, когда баланс станет ниже порога.\n\n` +
    `📱 *Пожалуйста, отправьте свой номер телефона*, чтобы мы могли связать ваш аккаунт с биллингом.`;
  
  // Создаем клавиатуру с кнопкой для отправки контакта
  const keyboard = {
    buttons: [
      [
        {
          type: 'request_contact',
          text: '📱 Отправить номер телефона'
        }
      ]
    ]
  };
  
  // Отправляем сообщение с кнопкой
  await this.sendMessage(userId, message, {
    attachments: [
      {
        type: 'inline_keyboard',
        payload: keyboard
      }
    ]
  });
  
  console.log(`✅ Приветствие с кнопкой отправлено пользователю ${userId}`);
  return;
}
    
    if (text === '/balance') {
  const db = require('./db');
  const user = await db.getUser(userId);
  
  if (user) {
    const message = `💰 *Ваш баланс:* ${user.balance} руб.\n` +
      `📊 *Порог уведомления:* ${user.threshold} руб.\n\n` +
      `Что хотите сделать?`;
    
    // Кнопки для действий
    const keyboard = {
      buttons: [
        [
          {
            type: 'url',
            text: '💰 Пополнить счет',
            url: 'https://benzigo.ru/accounting'
          },
          {
            type: 'callback',
            text: '⚙️ Изменить порог',
            callback_data: 'change_threshold'
          }
        ],
        [
          {
            type: 'callback',
            text: '🔄 Обновить баланс',
            callback_data: 'refresh_balance'
          }
        ]
      ]
    };
    
    await this.sendMessage(userId, message, {
      attachments: [
        {
          type: 'inline_keyboard',
          payload: keyboard
        }
      ]
    });
    console.log(`📊 Меню баланса с кнопками отправлено пользователю ${userId}`);
  } else {
    await this.sendMessage(userId, 'ℹ️ Вы еще не зарегистрированы. Напишите /start');
  }
  return;
}
    
    // Обработка контакта (номера телефона)
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
          // Обработка callback-запросов (нажатия на кнопки)
if (update.update_type === 'callback_query') {
  const callback = update.callback_query;
  const userId = callback.user_id;
  const callbackData = callback.data;
  const chatId = callback.chat_id;
  
  console.log(`🔘 Нажата кнопка: ${callbackData} от пользователя ${userId}`);
  
  const db = require('./db');
  
  switch (callbackData) {
    case 'change_threshold':
      // Отправляем сообщение с запросом нового порога
      await this.sendMessage(chatId, "✏️ Введите новый порог уведомления (в рублях):");
      // Сохраняем состояние, что пользователь ожидает ввода порога
      // Для этого нужно добавить поле state в БД или использовать временное хранилище
      console.log(`📝 Запрошен ввод нового порога для пользователя ${userId}`);
      break;
      
    case 'refresh_balance':
      // Обновляем баланс из биллинга
      const user = await db.getUser(userId);
      if (user && user.phone_number) {
        // Здесь должен быть запрос к вашему API биллинга
        // Пока используем демо-логику
        const newBalance = Math.floor(Math.random() * 1000);
        await db.updateBalance(userId, newBalance);
        
        const message = `🔄 *Баланс обновлен:* ${newBalance} руб.`;
        await this.sendMessage(chatId, message);
        console.log(`📊 Баланс обновлен для ${userId}: ${newBalance} руб.`);
      } else {
        await this.sendMessage(chatId, "❌ Не удалось обновить баланс. Номер телефона не найден.");
      }
      break;
      
    default:
      console.log(`⚠️ Неизвестный callback: ${callbackData}`);
  }
  
  // Отправляем ответ на callback (чтобы убрать индикатор загрузки)
  await axios.post(
    `${this.apiUrl}/callback/answer`,
    { callback_query_id: callback.id },
    { headers: { 'Authorization': `${this.token}` } }
  ).catch(() => {});
  
  return;
}



          if (phone) {
            const db = require('./db');
            await db.saveUser(userId, userId, phone);
            await this.sendMessage(userId, `✅ Номер ${phone} успешно сохранен! Теперь вы будете получать уведомления о балансе.\n\nДля проверки баланса отправьте /balance`);
            console.log(`📱 Номер сохранен для пользователя ${userId}: ${phone}`);
          } else {
            await this.sendMessage(userId, '❌ Не удалось распознать номер. Пожалуйста, отправьте номер еще раз.');
            console.log(`⚠️ Не удалось распознать номер от пользователя ${userId}`);
          }
          return;
        }
      }
    }
    
    console.log(`ℹ️ Неизвестный тип сообщения от ${userId}`);
  }

  // Запуск Long Polling
  async start() {
    console.log('🤖 Бот запущен, ожидание сообщений...');
    let consecutiveErrors = 0;
    
    while (true) {
      try {
        await this.getUpdates();
        consecutiveErrors = 0;
        await new Promise(resolve => setTimeout(resolve, 5000));
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