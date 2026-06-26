const fs = require('fs');

console.log('📂 Читаю dump.sql...');

let dump;
try {
  dump = fs.readFileSync('dump.sql', 'utf-8');
  console.log('✅ Размер:', dump.length, 'символов');
} catch (e) {
  console.log('❌ Файл dump.sql не найден!');
  process.exit(1);
}

let lines = dump.split('\n');
console.log('📊 Всего строк:', lines.length);
console.log('📊 Первые 3 строки:', lines.slice(0, 3));

let currentTable = '';
let inCopy = false;
let data = {};

for (let line of lines) {
  let copyMatch = line.match(/COPY public\.(\w+) \(.*\) FROM stdin;/);
  if (copyMatch) {
    currentTable = copyMatch[1];
    inCopy = true;
    data[currentTable] = '';
    console.log('🔍 Нашёл таблицу:', currentTable);
    continue;
  }
  
  if (inCopy && line.trim() === '\\.') {
    console.log('✅ Конец данных для:', currentTable);
    inCopy = false;
    continue;
  }
  
  if (inCopy && line.trim()) {
    data[currentTable] += line + '\n';
  }
}

console.log('\n📊 Найдено таблиц:', Object.keys(data).length);

for (let table of Object.keys(data)) {
  const count = data[table].split('\n').filter(l => l.trim()).length;
  fs.writeFileSync(`${table}.csv`, data[table]);
  console.log(`✅ ${table}.csv — ${count} строк`);
}

if (Object.keys(data).length === 0) {
  console.log('❌ Ничего не найдено. Содержимое дампа (первые 500 символов):');
  console.log(dump.substring(0, 500));
}