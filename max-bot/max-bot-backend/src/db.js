// src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../users.db'));

// Создаем таблицы (без NOT NULL для max_chat_id)
db.serialize(() => {
  // Таблица пользователей бота
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      max_user_id INTEGER UNIQUE NOT NULL,
      max_chat_id INTEGER,
      phone_number TEXT,
      balance REAL DEFAULT 0,
      threshold REAL DEFAULT 500,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Таблица CRM пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS crm_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      account_id TEXT NOT NULL,
      company_name TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания crm_users:', err.message);
    } else {
      console.log('✅ Таблица crm_users создана/проверена');
    }
  });
  
  // Добавляем моковые данные в CRM (если таблица пустая)
  db.get('SELECT COUNT(*) as count FROM crm_users', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`
        INSERT INTO crm_users (phone_number, account_id, company_name, balance)
        VALUES 
          ('79939819869', 'ACC001', 'ИП Руденко С.В.', 339.07),
          ('79123456789', 'ACC002', 'ООО Тест', 1250.50),
          ('79234567890', 'ACC003', 'ИП Иванов', 89.30)
      `, (err2) => {
        if (!err2) console.log('✅ Добавлены моковые данные в crm_users');
      });
    }
  });
  
  console.log('✅ База данных инициализирована');
});

// Сохранить пользователя (max_chat_id может быть NULL)
function saveUser(userId, chatId = null, phoneNumber = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO users (max_user_id, max_chat_id, phone_number)
      VALUES (?, ?, ?)
      ON CONFLICT(max_user_id) DO UPDATE SET
        max_chat_id = COALESCE(?, max_chat_id),
        phone_number = COALESCE(?, phone_number)
    `);
    stmt.run(userId, chatId, phoneNumber, chatId, phoneNumber, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
    stmt.finalize();
  });
}

// Обновить баланс
function updateBalance(userId, balance) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET balance = ? WHERE max_user_id = ?',
      [balance, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Обновить порог
function updateThreshold(userId, threshold) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET threshold = ? WHERE max_user_id = ?',
      [threshold, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Сохранить состояние пользователя
function setUserState(userId, state) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET state = ? WHERE max_user_id = ?',
      [state, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Получить состояние пользователя
function getUserState(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT state FROM users WHERE max_user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row?.state || null);
    });
  });
}

// Очистить состояние пользователя
function clearUserState(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET state = NULL WHERE max_user_id = ?',
      [userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Получить пользователя
function getUser(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE max_user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Получить всех пользователей
function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { 
  saveUser, 
  updateBalance, 
  updateThreshold,
  setUserState,
  getUserState,
  clearUserState,
  getUser, 
  getAllUsers 
};