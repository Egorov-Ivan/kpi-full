// src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../users.db'));

// Создаем таблицы
db.serialize(() => {
  // Таблица пользователей бота
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      max_user_id INTEGER UNIQUE NOT NULL,
      phone_number TEXT,
      balance REAL DEFAULT 0,
      threshold REAL DEFAULT 500,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Удаляем старые таблицы если есть (для пересоздания с правильной структурой)
  db.run(`DROP TABLE IF EXISTS crm_users`);
  db.run(`DROP TABLE IF EXISTS crm_clients`);
  
  // Таблица клиентов CRM
  db.run(`
    CREATE TABLE crm_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (!err) console.log('✅ Таблица crm_clients создана');
  });
  
  // Таблица учетных записей CRM
  db.run(`
    CREATE TABLE crm_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      client_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES crm_clients(client_id)
    )
  `, (err) => {
    if (!err) console.log('✅ Таблица crm_users создана');
  });
  
  // Добавляем моковые данные в CRM
  db.run(`
    INSERT INTO crm_clients (client_id, company_name, balance)
    VALUES 
      ('ACC001', 'ИП Руденко С.В.', 339.07),
      ('ACC002', 'ООО Тест', 1250.50),
      ('ACC003', 'ИП Иванов', 89.30)
  `, (err) => {
    if (!err) console.log('✅ Добавлены моковые клиенты');
  });
  
  db.run(`
    INSERT INTO crm_users (phone_number, username, client_id)
    VALUES 
      ('79939819869', 'Иван Егоров', 'ACC001'),
      ('79123456789', 'Петр Сидоров', 'ACC002'),
      ('79234567890', 'Игорь Иванов', 'ACC003')
  `, (err) => {
    if (!err) console.log('✅ Добавлены моковые учетные записи');
  });
  
  console.log('✅ База данных инициализирована');
});

// ============ BOT USERS ============

// Сохранить пользователя бота
function saveBotUser(userId, phoneNumber = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO bot_users (max_user_id, phone_number)
      VALUES (?, ?)
      ON CONFLICT(max_user_id) DO UPDATE SET
        phone_number = COALESCE(?, phone_number)
    `);
    stmt.run(userId, phoneNumber, phoneNumber, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
    stmt.finalize();
  });
}

// Получить пользователя бота
function getBotUser(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM bot_users WHERE max_user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Обновить баланс пользователя бота
function updateBotBalance(userId, balance) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE bot_users SET balance = ? WHERE max_user_id = ?',
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
      'UPDATE bot_users SET threshold = ? WHERE max_user_id = ?',
      [threshold, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Сохранить состояние
function setUserState(userId, state) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE bot_users SET state = ? WHERE max_user_id = ?',
      [state, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// Получить состояние
function getUserState(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT state FROM bot_users WHERE max_user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row?.state || null);
    });
  });
}

// Очистить состояние
function clearUserState(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE bot_users SET state = NULL WHERE max_user_id = ?',
      [userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

// ============ CRM ============

// Поиск учетной записи в CRM по номеру телефона
function findCrmUserByPhone(phoneNumber) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT u.*, c.company_name, c.balance 
      FROM crm_users u
      JOIN crm_clients c ON u.client_id = c.client_id
      WHERE u.phone_number = ?
    `, [phoneNumber], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Получить клиента по ID
function getCrmClientByClientId(clientId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM crm_clients WHERE client_id = ?', [clientId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Получить всех клиентов
function getAllCrmClients() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM crm_clients', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Обновить баланс клиента в CRM
function updateCrmClientBalance(clientId, balance) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE crm_clients SET balance = ? WHERE client_id = ?',
      [balance, clientId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
}

module.exports = { 
  saveBotUser,
  getBotUser,
  updateBotBalance,
  updateThreshold,
  setUserState,
  getUserState,
  clearUserState,
  findCrmUserByPhone,
  getCrmClientByClientId,
  getAllCrmClients,
  updateCrmClientBalance
};