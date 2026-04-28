// api/kpi-vat.js — ПОЛНАЯ ЗАМЕНА
import XLSX from 'xlsx';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET
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
      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST — парсим FormData ВРУЧНУЮ без multer
  if (req.method === 'POST') {
    try {
      console.log('📥 Content-Type:', req.headers['content-type']);
      
      // Парсим сырые данные
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      console.log('📥 Размер буфера:', buffer.length, 'байт');
      
      // Ищем границу multipart
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      
      if (!boundaryMatch) {
        return res.status(400).json({ error: 'Неверный Content-Type, ожидается multipart/form-data' });
      }
      
      const boundary = boundaryMatch[1];
      console.log('📥 Boundary:', boundary);
      
      // Парсим multipart/form-data вручную
      const parts = parseMultipart(buffer, boundary);
      
      console.log('📥 Части запроса:', Object.keys(parts));
      
      const file = parts['file'];
      const year = parts['year'] || '';
      const month = parts['month'] || '';
      const manager = parts['manager'] || '';
      
      console.log('📥 file есть:', !!file);
      console.log('📥 year:', year);
      console.log('📥 month:', month);
      
      if (!file) {
        return res.status(400).json({ error: 'Файл не найден в запросе. Ключ должен быть "file"' });
      }
      
      if (!year || !month) {
        return res.status(400).json({ error: 'year и month обязательны' });
      }
      
      // Читаем Excel
      const workbook = XLSX.read(file.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log('📊 Всего строк в Excel:', rows.length);
      console.log('📊 Заголовки (строка 0):', rows[0]);
      console.log('📊 Первая строка данных:', rows[1]);
      
      console.log('📥 Строк в Excel:', rows.length);
      
      if (rows.length < 2) {
        return res.status(400).json({ error: 'Файл пустой или нет данных' });
      }
      
      const headers = rows[0].map(h => h?.toString()?.toLowerCase()?.trim() || '');
      const data = rows.slice(1);
      
      const indexes = findColumnIndexes(headers);
      console.log('📊 Индексы колонок:', indexes);
      const managerClients = processTransactions(data, indexes, year, month, manager);
      console.log('📊 Менеджеров найдено:', Object.keys(managerClients).length);
      console.log('📊 Менеджеры:', Object.keys(managerClients));
      
      await saveToDatabase(managerClients, year, month);
      
      const savedData = await getSavedDataFromDb(year, month, manager);
      
      return res.status(200).json({
        success: true,
        data: savedData,
        summary: getSummary(managerClients)
      });
      
    } catch (error) {
      console.error('❌ POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ========== ПАРСИНГ MULTIPART ==========
function parseMultipart(buffer, boundary) {
  const parts = {};
  const boundaryBuffer = Buffer.from('--' + boundary);
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
    
    // Ищем name в заголовке
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

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ==========

function findColumnIndexes(headers) {
  const indexes = { manager: -1, sumForUs: -1, sumForClient: -1, operation: -1, client: -1, date: -1 };
  
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
  
  const notFound = Object.entries(indexes).filter(([, v]) => v === -1).map(([k]) => k);
  if (notFound.length > 0) throw new Error(`Не найдены колонки: ${notFound.join(', ')}`);
  
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
    
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split('.');
      if (parts.length === 3) date = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    if (isNaN(date.getTime())) return;
    if (date.getFullYear() != targetYear) return;
    if ((date.getMonth() + 1).toString().padStart(2, '0') !== targetMonth) return;
    
    if (!managerClients[manager]) managerClients[manager] = {};
    if (!managerClients[manager][client]) {
      managerClients[manager][client] = {
        client, totalProfit: 0, transactionsCount: 0, firstTransactionDate: null
      };
    }
    
    const d = managerClients[manager][client];
    if (!d.firstTransactionDate || date < d.firstTransactionDate) d.firstTransactionDate = date;
    
    d.totalProfit += sumForUs - sumForClient;
    d.transactionsCount++;
  });
  
  for (const m of Object.keys(managerClients)) {
    for (const c of Object.keys(managerClients[m])) {
      const d = managerClients[m][c];
      const age = getClientAgeMonths(d.firstTransactionDate, targetYear, targetMonth);
      d.rate = age < 3 ? 0.25 : 0.025;
      d.kpiVat = d.totalProfit * d.rate;
      d.clientAgeMonths = age;
    }
  }
  
  return managerClients;
}

function getClientAgeMonths(firstDate, year, month) {
  if (!firstDate) return 0;
  const calc = new Date(year, month - 1, 1);
  let months = (calc.getFullYear() - firstDate.getFullYear()) * 12;
  months += calc.getMonth() - firstDate.getMonth();
  return Math.max(0, months);
}

async function saveToDatabase(managerClients, year, month) {
  await sql.query('DELETE FROM kpi_vat_details WHERE year = $1 AND month = $2', [year, month]);
  
  for (const m of Object.keys(managerClients)) {
    for (const c of Object.keys(managerClients[m])) {
      const d = managerClients[m][c];
      await sql.query(
        `INSERT INTO kpi_vat_details 
         (manager_name, client_name, total_profit, transactions_count, 
          kpi_vat, rate, client_age_months, first_transaction_date, year, month)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [m, c, d.totalProfit, d.transactionsCount, d.kpiVat, d.rate, d.clientAgeMonths,
         d.firstTransactionDate?.toISOString().split('T')[0] || null, year, month]
      );
    }
  }
}

async function getSavedDataFromDb(year, month, manager = null) {
  let query = 'SELECT * FROM kpi_vat_details WHERE year = $1 AND month = $2';
  const params = [year, month];
  if (manager) { query += ' AND manager_name = $3'; params.push(manager); }
  query += ' ORDER BY manager_name, kpi_vat DESC';
  const result = await sql.query(query, params);
  return result.rows;
}

function getSummary(managerClients) {
  const summary = [];
  for (const m of Object.keys(managerClients)) {
    let tk = 0, tp = 0, cc = 0;
    for (const c of Object.keys(managerClients[m])) {
      const d = managerClients[m][c];
      tk += d.kpiVat; tp += d.totalProfit; cc++;
    }
    summary.push({ manager: m, clientsCount: cc, totalProfit: Math.round(tp * 100) / 100, totalKpiVat: Math.round(tk * 100) / 100 });
  }
  return summary;
}