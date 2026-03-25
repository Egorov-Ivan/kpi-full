// import-with-service-account.js
import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '15gqxkSosWCe0On9k5zPC9XJ6gFqVgYwzsJIDmgJ6Kks';
const SERVICE_ACCOUNT_KEY_FILE = './import-kpi-65986131fb85.json';

// Функция для создания прогресс-бара
function createProgressBar(total, message = 'Прогресс') {
  const width = 40;
  let current = 0;
  
  return {
    update(increment = 1) {
      current += increment;
      const percent = Math.floor((current / total) * 100);
      const filled = Math.floor((current / total) * width);
      const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${message}: [${bar}] ${percent}% (${current}/${total})`);
      
      if (current === total) {
        process.stdout.write('\n');
      }
    },
    
    set(value) {
      current = value;
      const percent = Math.floor((current / total) * 100);
      const filled = Math.floor((current / total) * width);
      const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${message}: [${bar}] ${percent}% (${current}/${total})`);
      
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  };
}

// Функция для парсинга суммы (работает с запятыми и точками)
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  
  // Убираем пробелы, заменяем запятую на точку
  const cleaned = amountStr.toString()
    .replace(/\s/g, '')           // убираем пробелы
    .replace(',', '.')             // заменяем запятую на точку
    .replace(/[^\d.-]/g, '');      // оставляем только цифры, точку и минус
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

// Функция для форматирования даты (ДД.ММ.ГГГГ -> ДД-ММ-ГГГГ)
function formatDate(dateStr) {
  if (!dateStr) return '';
  // Заменяем точки на дефисы
  return dateStr.replace(/\./g, '-');
}

async function importFromGoogleSheet() {
  console.time('⏱️ Общее время импорта');
  
  try {
    console.log('📥 Загрузка данных из Google Таблицы...');
    console.log('🆔 ID таблицы:', SPREADSHEET_ID);
    console.log('📋 Лист: Поступления');
    
    console.log('🔑 Авторизация через сервисный аккаунт...');
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('📊 Получение данных из таблицы...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Поступления',
    });
    
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('\n❌ Таблица пуста');
      return;
    }
    
    console.log(`✅ Загружено ${rows.length} строк\n`);
    
    // Ищем индекс колонок
    const headers = rows[0];
    const dateIndex = headers.findIndex(h => h === 'Дата');
    const amountIndex = headers.findIndex(h => h === 'Поступление');
    const clientIndex = headers.findIndex(h => h === 'Клиент');
    const legalEntityIndex = headers.findIndex(h => h === 'Юр.Лицо');
    const managerIndex = headers.findIndex(h => h === 'Менеджер');
    
    console.log('📊 Индексы колонок:', {
      date: dateIndex,
      amount: amountIndex,
      client: clientIndex,
      legalEntity: legalEntityIndex,
      manager: managerIndex
    });
    console.log(''); // пустая строка для отступа
    
    // Обрабатываем данные с прогрессом
    console.log('🔄 Обработка данных...');
    const progressBar = createProgressBar(rows.length - 1, '🔄 Обработка');
    
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      const clientName = clientIndex >= 0 ? (row[clientIndex] || '') : '';
      const legalEntity = legalEntityIndex >= 0 ? (row[legalEntityIndex] || '') : '';
      const amount = amountIndex >= 0 ? parseAmount(row[amountIndex]) : 0;
      const manager = managerIndex >= 0 ? (row[managerIndex] || '') : '';
      const rawDate = dateIndex >= 0 ? (row[dateIndex] || '') : '';
      
      // VAT если в Юр.Лице есть "ФАЭТОН" (регистронезависимый поиск)
      const isVat = legalEntity.toLowerCase().includes('фаэтон');
      
      data.push({
        date: formatDate(rawDate),        // Преобразуем дату в единый формат ДД-ММ-ГГГГ
        amount: amount,
        client: clientName,
        legalEntity: legalEntity,
        manager: manager,
        clientType: isVat ? 'VAT' : 'NO_VAT',
      });
      
      progressBar.update();
    }
    
    console.log('\n✅ Обработка завершена\n');
    
    // Статистика
    console.log('📊 Статистика:');
    console.log(`   Всего записей: ${data.length}`);
    
    const vatCount = data.filter(item => item.clientType === 'VAT').length;
    const noVatCount = data.filter(item => item.clientType === 'NO_VAT').length;
    console.log(`   VAT (ФАЭТОН в Юр.Лице): ${vatCount}`);
    console.log(`   NO_VAT: ${noVatCount}`);
    
    // Показываем примеры VAT записей
    const vatRecords = data.filter(item => item.clientType === 'VAT');
    if (vatRecords.length > 0) {
      console.log('\n🔍 Найдены VAT записи:');
      vatRecords.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i+1}. ${item.client} | Юр.Лицо: ${item.legalEntity} | Сумма: ${item.amount}₽`);
      });
      if (vatRecords.length > 5) {
        console.log(`   ... и еще ${vatRecords.length - 5} записей`);
      }
    }
    
    // Примеры дат для проверки
    console.log('\n📅 Примеры дат (первые 5):');
    data.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i+1}. Исходная: ${rows[i+1][dateIndex]} -> Преобразованная: ${item.date}`);
    });
    
    // Считаем сумму с прогрессом
    console.log('\n💰 Подсчет общей суммы...');
    const sumProgress = createProgressBar(data.length, '💰 Подсчет');
    let totalAmount = 0;
    
    for (let i = 0; i < data.length; i++) {
      totalAmount += data[i].amount;
      sumProgress.update();
    }
    
    console.log(`💰 Общая сумма: ${totalAmount.toLocaleString()}₽`);
    
    // Сохраняем в buffer.json с прогрессом
    console.log('\n💾 Сохранение данных...');
    const bufferPath = path.join(__dirname, 'data', 'buffer.json');
    
    // Создаем папку data если её нет
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Создаем бэкап
    if (fs.existsSync(bufferPath)) {
      const backupPath = path.join(__dirname, 'data', `buffer-backup-${Date.now()}.json`);
      fs.copyFileSync(bufferPath, backupPath);
      console.log(`📦 Бэкап создан: ${path.basename(backupPath)}`);
    }
    
    // Сохраняем с прогрессом
    const writeProgress = createProgressBar(data.length, '💾 Запись');
    const writeStream = fs.createWriteStream(bufferPath);
    writeStream.write('[\n');
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const comma = i < data.length - 1 ? ',' : '';
      writeStream.write(JSON.stringify(item, null, 2) + comma + '\n');
      writeProgress.update();
    }
    
    writeStream.write(']');
    writeStream.end();
    
    await new Promise(resolve => writeStream.on('finish', resolve));
    
    console.log('\n✅ Данные успешно сохранены в data/buffer.json');
    console.log(`📊 Всего записей: ${data.length}`);
    console.log(`💰 Общая сумма: ${totalAmount.toLocaleString()}₽`);
    console.timeEnd('⏱️ Общее время импорта');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Детали:', error.response.data);
    }
    console.timeEnd('⏱️ Общее время импорта');
  }
}

importFromGoogleSheet()