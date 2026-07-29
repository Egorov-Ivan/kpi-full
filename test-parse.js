// test-parse.js — полная сводка по всем менеджерам
import XLSX from 'xlsx';

const FILE_PATH = './test.xlsx'; // ваш файл
const YEAR = '2026';
const MONTH = '04';

function findColumnIndexes(headers) {
  const indexes = {
    manager: -1, sumForUs: -1, sumForClient: -1,
    operation: -1, client: -1, date: -1, ourEntity: -1
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
    if (h.includes('наше юр.лицо')) indexes.ourEntity = index;
  });
  
  return indexes;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const num = parseFloat(dateStr);
  if (!isNaN(num) && num > 40000 && num < 100000) {
    return new Date((num - 25569) * 86400 * 1000);
  }
  const clean = String(dateStr).trim();
  const dotMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    return new Date(parseInt(dotMatch[3]), parseInt(dotMatch[2]) - 1, parseInt(dotMatch[1]));
  }
  const d = new Date(clean);
  return !isNaN(d.getTime()) ? d : null;
}

function parseAmount(val) {
  if (val === null || val === undefined) return 0;
  let str = val.toString().trim();
  str = str.replace(/,/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ========== ЧИТАЕМ EXCEL ==========
console.log('📂 Файл:', FILE_PATH);
const workbook = XLSX.readFile(FILE_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

console.log('📊 Всего строк:', rows.length);

const headers = rows[0].map(h => h?.toString()?.toLowerCase()?.trim() || '');
const data = rows.slice(1);
const indexes = findColumnIndexes(headers);

console.log('📊 Индексы:', indexes);

// ========== СВОДКА ПО ВСЕМ МЕНЕДЖЕРАМ ==========
console.log('\n========== СВОДКА ПО МЕНЕДЖЕРАМ ==========');

const managerClients = {};

data.forEach((row) => {
  if (!row[indexes.manager]) return;
  
  const ourEntity = row[indexes.ourEntity]?.toString().trim() || '';
  if (!ourEntity.toLowerCase().includes('фаэтон')) return;
  
  const manager = row[indexes.manager].toString().trim();
  const client = row[indexes.client]?.toString().trim() || 'Неизвестный';
  const sumForUs = parseAmount(row[indexes.sumForUs]);
  const sumForClient = parseAmount(row[indexes.sumForClient]);
  const dateStr = row[indexes.date]?.toString().trim() || '';
  const date = parseDate(dateStr);
  
  if (!date) return;
  const rowYear = date.getFullYear();
  const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  
  if (rowYear != YEAR || rowMonth !== MONTH) return;
  
  if (!managerClients[manager]) managerClients[manager] = {};
  if (!managerClients[manager][client]) {
    managerClients[manager][client] = {
      client,
      totalProfit: 0,
      transactionsCount: 0,
      firstTransactionDate: null
    };
  }
  
  const d = managerClients[manager][client];
  if (!d.firstTransactionDate || date < d.firstTransactionDate) {
    d.firstTransactionDate = date;
  }
  
  d.totalProfit += sumForClient - sumForUs;
  d.transactionsCount++;
});

// Расчёт KPI
for (const mgr of Object.keys(managerClients)) {
  for (const cl of Object.keys(managerClients[mgr])) {
    const d = managerClients[mgr][cl];
    const calcDate = new Date(YEAR, MONTH - 1, 1);
    let months = (calcDate.getFullYear() - d.firstTransactionDate.getFullYear()) * 12;
    months += calcDate.getMonth() - d.firstTransactionDate.getMonth();
    months = Math.max(0, months);
    d.rate = months < 3 ? 0.25 : 0.025;
    d.kpiVat = d.totalProfit * d.rate;
    d.clientAgeMonths = months;
  }
}

// Вывод
let grandTotal = 0;
for (const mgr of Object.keys(managerClients)) {
  console.log(`\n--- ${mgr} ---`);
  let mgrTotal = 0;
  for (const cl of Object.keys(managerClients[mgr])) {
    const d = managerClients[mgr][cl];
    console.log(`  ${cl}: прибыль=${d.totalProfit.toFixed(2)}, KPI=${d.kpiVat.toFixed(2)}, ставка=${(d.rate * 100).toFixed(1)}%, транзакций=${d.transactionsCount}`);
    mgrTotal += d.kpiVat;
  }
  console.log(`  ИТОГО: ${mgrTotal.toFixed(2)}`);
  grandTotal += mgrTotal;
}

console.log(`\n========== ОБЩИЙ KPI: ${grandTotal.toFixed(2)} ==========`);