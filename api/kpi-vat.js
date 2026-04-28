// api/kpi-vat.js
import XLSX from 'xlsx';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ========== GET — получить сохранённые данные ==========
  if (req.method === 'GET') {
    try {
      const { year, month, manager } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ error: 'year и month обязательны' });
      }
      
      let query = 'SELECT * FROM kpi_vat_details WHERE year = $1 AND month = $2';
      const params = [year, month];
      
      if (manager) {
        query += ' AND manager_name = $3';
        params.push(manager);
      }
      
      query += ' ORDER BY manager_name, kpi_vat DESC';
      
      const result = await sql.query(query, params);
      
      return res.status(200).json({
        success: true,
        data: result.rows
      });
      
    } catch (error) {
      console.error('❌ GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========== POST — загрузить Excel и рассчитать KPI ==========
  if (req.method === 'POST') {
    try {
      console.log('📥 POST получен');
      console.log('📥 Content-Type:', req.headers['content-type']);
      
      // Парсим сырые данные
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      console.log('📥 Буфер:', buffer.length, 'байт');
      
      // Ищем границу multipart
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      
      if (!boundaryMatch) {
        console.error('❌ Boundary не найден');
        return res.status(400).json({ error: 'Неверный Content-Type, ожидается multipart/form-data' });
      }
      
      const boundary = boundaryMatch[1];
      console.log('📥 Boundary:', boundary.substring(0, 30) + '...');
      
      // Парсим multipart/form-data
      const parts = parseMultipart(buffer, boundary);
      
      console.log('📥 Ключи:', Object.keys(parts));
      console.log('📥 file:', !!parts['file']);
      console.log('📥 year:', parts['year']);
      console.log('📥 month:', parts['month']);
      
      const file = parts['file'];
      const year = parts['year'] || '';
      const month = parts['month'] || '';
      const manager = parts['manager'] || '';
      
      if (!file || !file.data) {
        console.error('❌ Файл не найден');
        return res.status(400).json({ error: 'Файл не найден в запросе' });
      }
      
      if (!year || !month) {
        console.error('❌ year или month отсутствуют');
        return res.status(400).json({ error: 'year и month обязательны' });
      }
      
      // Читаем Excel
      console.log('📊 Читаю Excel...');
      const workbook = XLSX.read(file.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      console.log('📊 Лист:', sheetName);
      
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('📊 Строк:', rows.length);
      console.log('📊 Заголовки:', JSON.stringify(rows[0]));
      console.log('📊 Первая строка:', JSON.stringify(rows[1]));
      
      if (rows.length < 2) {
        console.error('❌ Файл пустой');
        return res.status(400).json({ error: 'Файл пустой или нет данных' });
      }
      
      const headers = rows[0].map(h => h?.toString()?.toLowerCase()?.trim() || '');
      console.log('📊 Заголовки (чистые):', headers);
      
      const data = rows.slice(1);
      
      // Находим индексы колонок
      const indexes = findColumnIndexes(headers);
      console.log('📊 Индексы:', JSON.stringify(indexes));
      
      // Обрабатываем транзакции
      const managerClients = processTransactions(data, indexes, year, month, manager);
      
      const managerNames = Object.keys(managerClients);
      console.log('📊 Менеджеров:', managerNames.length);
      console.log('📊 Имена:', managerNames);
      
      // Детали по менеджерам
      for (const mgr of managerNames) {
        const clients = Object.keys(managerClients[mgr]);
        console.log(`📊 ${mgr}: ${clients.length} клиентов`);
        for (const cl of clients) {
          const d = managerClients[mgr][cl];
          console.log(`   ${cl}: прибыль=${d.totalProfit.toFixed(2)}, KPI=${d.kpiVat.toFixed(2)}, ставка=${(d.rate * 100).toFixed(1)}%, возраст=${d.clientAgeMonths}мес`);
        }
      }
      
      if (managerNames.length === 0) {
        console.warn('⚠️ Нет менеджеров после обработки');
        return res.status(200).json({
          success: true,
          data: [],
          summary: [],
          warning: 'Нет транзакций за выбранный период'
        });
      }
      
      // Сохраняем в БД
      console.log('💾 Сохраняю в БД...');
      await saveToDatabase(managerClients, year, month);
      console.log('✅ Сохранено');
      
      // Получаем сохранённые данные
      const savedData = await getSavedDataFromDb(year, month, manager);
      console.log('📊 Сохранено записей:', savedData.length);
      
      const summary = getSummary(managerClients);
      console.log('📊 Сводка:', JSON.stringify(summary));
      
      return res.status(200).json({
        success: true,
        data: savedData,
        summary: summary
      });
      
    } catch (error) {
      console.error('❌ POST error:', error);
      console.error('❌ Stack:', error.stack);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ========== ПАРСИНГ MULTIPART/FORMDATA ==========
function parseMultipart(buffer, boundary) {
  const parts = {};
  const str = buffer.toString('binary');
  const sections = str.split('--' + boundary);
  
  for (const section of sections) {
    if (section.startsWith('--') || section.trim() === '') continue;
    
    const headerEndIndex = section.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;
    
    const headerStr = section.substring(0, headerEndIndex);
    const bodyStart = headerEndIndex + 4;
    let bodyEnd = section.lastIndexOf('\r\n');
    if (bodyEnd === -1) bodyEnd = section.length;
    
    // Ищем name
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    
    const fieldName = nameMatch[1];
    
    // Ищем filename (если это файл)
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    
    if (filenameMatch) {
      // Это файл
      const bodyStr = section.substring(bodyStart, bodyEnd);
      parts[fieldName] = {
        filename: filenameMatch[1],
        data: Buffer.from(bodyStr, 'binary')
      };
    } else {
      // Это текстовое поле
      parts[fieldName] = section.substring(bodyStart, bodyEnd).trim();
    }
  }
  
  return parts;
}

// ========== ПОИСК КОЛОНОК ==========
function findColumnIndexes(headers) {
  const indexes = {
    manager: -1,
    sumForUs: -1,
    sumForClient: -1,
    operation: -1,
    client: -1,
    date: -1
  };
  
  headers.forEach((header, index) => {
    if (!header) return;
    const h = header.toLowerCase().trim();
    
    if (h.includes('менеджер')) indexes.manager = index;
    if (h.includes('сумма для нас')) indexes.sumForUs = index;
    if (h.includes('сумма для клиента')) indexes.sumForClient = index;
    if (h.includes('операция')) indexes.operation = index;
    if (h.includes('юр.лицо клиента') || h.includes('юридическое лицо клиента')) indexes.client = index;
    if (h.includes('дата и время записи')) indexes.date = index;
  });
  
  const notFound = Object.entries(indexes)
    .filter(([, value]) => value === -1)
    .map(([key]) => key);
    
  if (notFound.length > 0) {
    throw new Error(`Не найдены колонки: ${notFound.join(', ')}`);
  }
  
  return indexes;
}

// ========== ОБРАБОТКА ТРАНЗАКЦИЙ ==========
function processTransactions(rows, indexes, targetYear, targetMonth, filterManager = null) {
  const managerClients = {};
  
  rows.forEach((row, rowIndex) => {
    if (!row[indexes.manager]) return;
    
    const manager = row[indexes.manager].toString().trim();
    if (filterManager && manager !== filterManager) return;
    
    const client = row[indexes.client]?.toString().trim() || 'Неизвестный';
    const operation = row[indexes.operation]?.toString().trim() || '';
    const sumForUs = parseFloat(row[indexes.sumForUs]) || 0;
    const sumForClient = parseFloat(row[indexes.sumForClient]) || 0;
    const dateStr = row[indexes.date]?.toString().trim() || '';
    
    // Парсим дату
    let date = parseDate(dateStr);
    
    if (!date) {
      console.log(`⚠️ Строка ${rowIndex}: не удалось распарсить дату "${dateStr}"`);
      return;
    }
    
    const rowYear = date.getFullYear();
    const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Проверяем год и месяц
    if (rowYear != targetYear) {
      console.log(`⚠️ Строка ${rowIndex}: год ${rowYear} != ${targetYear}`);
      return;
    }
    if (rowMonth !== targetMonth) {
      console.log(`⚠️ Строка ${rowIndex}: месяц ${rowMonth} !== ${targetMonth}`);
      return;
    }
    
    // Инициализация
    if (!managerClients[manager]) managerClients[manager] = {};
    if (!managerClients[manager][client]) {
      managerClients[manager][client] = {
        client,
        totalProfit: 0,
        transactionsCount: 0,
        firstTransactionDate: null
      };
    }
    
    const clientData = managerClients[manager][client];
    
    // Запоминаем первую дату
    if (!clientData.firstTransactionDate || date < clientData.firstTransactionDate) {
      clientData.firstTransactionDate = date;
    }
    
    // Прибыль = Сумма для нас - Сумма для клиента
    const profit = sumForUs - sumForClient;
    clientData.totalProfit += profit;
    clientData.transactionsCount++;
  });
  
  // Рассчитываем KPI
  for (const mgr of Object.keys(managerClients)) {
    for (const cl of Object.keys(managerClients[mgr])) {
      const d = managerClients[mgr][cl];
      const ageMonths = getClientAgeMonths(d.firstTransactionDate, targetYear, targetMonth);
      const rate = ageMonths < 3 ? 0.25 : 0.025;
      
      d.kpiVat = d.totalProfit * rate;
      d.rate = rate;
      d.clientAgeMonths = ageMonths;
    }
  }
  
  return managerClients;
}

// ========== ПАРСИНГ ДАТЫ ==========
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const clean = dateStr.trim();
  
  // Формат DD.MM.YYYY HH:MM:SS или DD.MM.YYYY
  const dotMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    const day = parseInt(dotMatch[1]);
    const month = parseInt(dotMatch[2]) - 1; // месяцы с 0
    const year = parseInt(dotMatch[3]);
    return new Date(year, month, day);
  }
  
  // Стандартный формат
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  
  return null;
}

// ========== ВОЗРАСТ КЛИЕНТА В МЕСЯЦАХ ==========
function getClientAgeMonths(firstDate, year, month) {
  if (!firstDate) return 0;
  
  const calculationDate = new Date(year, month - 1, 1);
  let months = (calculationDate.getFullYear() - firstDate.getFullYear()) * 12;
  months += calculationDate.getMonth() - firstDate.getMonth();
  
  return Math.max(0, months);
}

// ========== СОХРАНЕНИЕ В БД ==========
async function saveToDatabase(managerClients, year, month) {
  // Очищаем старые данные
  await sql.query('DELETE FROM kpi_vat_details WHERE year = $1 AND month = $2', [year, month]);
  
  // Вставляем новые
  for (const mgr of Object.keys(managerClients)) {
    for (const cl of Object.keys(managerClients[mgr])) {
      const d = managerClients[mgr][cl];
      
      await sql.query(
        `INSERT INTO kpi_vat_details 
         (manager_name, client_name, total_profit, transactions_count, 
          kpi_vat, rate, client_age_months, first_transaction_date, year, month)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          mgr,
          cl,
          d.totalProfit,
          d.transactionsCount,
          d.kpiVat,
          d.rate,
          d.clientAgeMonths,
          d.firstTransactionDate?.toISOString().split('T')[0] || null,
          year,
          month
        ]
      );
    }
  }
}

// ========== ПОЛУЧИТЬ СОХРАНЁННЫЕ ДАННЫЕ ==========
async function getSavedDataFromDb(year, month, manager = null) {
  let query = 'SELECT * FROM kpi_vat_details WHERE year = $1 AND month = $2';
  const params = [year, month];
  
  if (manager) {
    query += ' AND manager_name = $3';
    params.push(manager);
  }
  
  query += ' ORDER BY manager_name, kpi_vat DESC';
  
  const result = await sql.query(query, params);
  return result.rows;
}

// ========== СВОДКА ==========
function getSummary(managerClients) {
  const summary = [];
  
  for (const mgr of Object.keys(managerClients)) {
    let totalKpi = 0;
    let totalProfit = 0;
    let clientsCount = 0;
    
    for (const cl of Object.keys(managerClients[mgr])) {
      const d = managerClients[mgr][cl];
      totalKpi += d.kpiVat;
      totalProfit += d.totalProfit;
      clientsCount++;
    }
    
    summary.push({
      manager: mgr,
      clientsCount,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalKpiVat: Math.round(totalKpi * 100) / 100
    });
  }
  
  return summary;
}