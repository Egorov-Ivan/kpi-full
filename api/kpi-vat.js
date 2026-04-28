// api/kpi-vat.js
import multer from 'multer';
import XLSX from 'xlsx';

// Настраиваем multer для парсинга FormData
const upload = multer({ storage: multer.memoryStorage() });

// Отключаем bodyParser для этого маршрута (нужно для multer)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Подключаемся к PostgreSQL на Vercel
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
      console.error('GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========== POST — загрузить Excel и рассчитать KPI ==========
  if (req.method === 'POST') {
    // Используем multer для парсинга файла
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Ошибка загрузки файла' });
      }
      
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Файл не загружен' });
        }

        const { year, month, manager } = req.body;
        
        if (!year || !month) {
          return res.status(400).json({ error: 'year и month обязательны' });
        }
        
        // Читаем Excel из буфера
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Конвертируем в массив
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          return res.status(400).json({ error: 'Файл пустой или нет данных' });
        }
        
        const headers = rows[0].map(h => h?.toString()?.toLowerCase()?.trim() || '');
        const data = rows.slice(1);
        
        // Находим индексы колонок
        const indexes = findColumnIndexes(headers);
        
        // Обрабатываем транзакции
        const managerClients = processTransactions(data, indexes, year, month, manager);
        
        // Сохраняем в БД
        await saveToDatabase(managerClients, year, month);
        
        // Получаем сохранённые данные
        const savedData = await getSavedDataFromDb(year, month, manager);
        
        return res.status(200).json({
          success: true,
          data: savedData,
          summary: getSummary(managerClients)
        });
        
      } catch (error) {
        console.error('POST error:', error);
        return res.status(500).json({ error: error.message });
      }
    });
    
    return; // multer сам отправит ответ
  }

  // ========== Другие методы ==========
  return res.status(405).json({ error: 'Method not allowed' });
}

// ========== Вспомогательные функции ==========

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
    .filter(([key, value]) => value === -1)
    .map(([key]) => key);
    
  if (notFound.length > 0) {
    throw new Error(`Не найдены колонки: ${notFound.join(', ')}`);
  }

  return indexes;
}

function processTransactions(rows, indexes, targetYear, targetMonth, filterManager = null) {
  const managerClients = {};

  rows.forEach(row => {
    if (!row[indexes.manager]) return;
    
    const manager = row[indexes.manager].toString().trim();
    if (filterManager && manager !== filterManager) return;
    
    const client = row[indexes.client]?.toString().trim() || 'Неизвестный';
    const operation = row[indexes.operation]?.toString().trim() || '';
    const sumForUs = parseFloat(row[indexes.sumForUs]) || 0;
    const sumForClient = parseFloat(row[indexes.sumForClient]) || 0;
    const dateStr = row[indexes.date]?.toString().trim() || '';
    
    // Парсим дату
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    
    if (isNaN(date.getTime())) return;
    if (date.getFullYear() != targetYear) return;
    if ((date.getMonth() + 1).toString().padStart(2, '0') !== targetMonth) return;
    
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
    
    if (!clientData.firstTransactionDate || date < clientData.firstTransactionDate) {
      clientData.firstTransactionDate = date;
    }
    
    const profit = sumForUs - sumForClient;
    clientData.totalProfit += profit;
    clientData.transactionsCount++;
  });

  // Расчёт KPI
  for (const manager of Object.keys(managerClients)) {
    for (const client of Object.keys(managerClients[manager])) {
      const data = managerClients[manager][client];
      const ageMonths = getClientAgeMonths(data.firstTransactionDate, targetYear, targetMonth);
      const rate = ageMonths < 3 ? 0.25 : 0.025;
      
      data.kpiVat = data.totalProfit * rate;
      data.rate = rate;
      data.clientAgeMonths = ageMonths;
    }
  }

  return managerClients;
}

function getClientAgeMonths(firstDate, year, month) {
  if (!firstDate) return 0;
  
  const calculationDate = new Date(year, month - 1, 1);
  let months = (calculationDate.getFullYear() - firstDate.getFullYear()) * 12;
  months += calculationDate.getMonth() - firstDate.getMonth();
  
  return Math.max(0, months);
}

async function saveToDatabase(managerClients, year, month) {
  // Очищаем старые данные
  await sql.query('DELETE FROM kpi_vat_details WHERE year = $1 AND month = $2', [year, month]);
  
  // Вставляем новые
  for (const manager of Object.keys(managerClients)) {
    for (const clientName of Object.keys(managerClients[manager])) {
      const data = managerClients[manager][clientName];
      
      await sql.query(
        `INSERT INTO kpi_vat_details 
         (manager_name, client_name, total_profit, transactions_count, 
          kpi_vat, rate, client_age_months, first_transaction_date, year, month)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          manager,
          clientName,
          data.totalProfit,
          data.transactionsCount,
          data.kpiVat,
          data.rate,
          data.clientAgeMonths,
          data.firstTransactionDate?.toISOString().split('T')[0] || null,
          year,
          month
        ]
      );
    }
  }
}

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

function getSummary(managerClients) {
  const summary = [];
  
  for (const manager of Object.keys(managerClients)) {
    let totalKpi = 0;
    let totalProfit = 0;
    let clientsCount = 0;
    
    for (const client of Object.keys(managerClients[manager])) {
      const data = managerClients[manager][client];
      totalKpi += data.kpiVat;
      totalProfit += data.totalProfit;
      clientsCount++;
    }
    
    summary.push({
      manager,
      clientsCount,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalKpiVat: Math.round(totalKpi * 100) / 100
    });
  }
  
  return summary;
}