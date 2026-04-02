// src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../users.db'));

// Создаем таблицы
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      max_user_id INTEGER UNIQUE NOT NULL,
      max_chat_id INTEGER NOT NULL,
      phone_number TEXT,
      balance REAL DEFAULT 0,
      threshold REAL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ База данных инициализирована');
});

// Сохранить пользователя
function saveUser(userId, chatId, phoneNumber = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO users (max_user_id, max_chat_id, phone_number)
      VALUES (?, ?, ?)
      ON CONFLICT(max_user_id) DO UPDATE SET
        max_chat_id = excluded.max_chat_id,
        phone_number = COALESCE(?, phone_number)
    `);
    stmt.run(userId, chatId, phoneNumber, phoneNumber, function(err) {
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

module.exports = { saveUser, updateBalance, getUser, getAllUsers };