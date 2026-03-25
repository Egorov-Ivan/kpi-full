// api/buffer.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
  }

  const { dateStart, dateEnd, legalEntity, managerId } = req.body;

  // Читаем реальные данные из buffer.json
  const bufferPath = path.join(process.cwd(), 'data', 'buffer.json');
  const bufferData = JSON.parse(fs.readFileSync(bufferPath, 'utf-8'));
  
  // Преобразуем в нужный формат, если нужно
  let operations = bufferData;
  if (bufferData.operations) {
    operations = bufferData.operations;
  } else if (bufferData.data) {
    operations = bufferData.data;
  }

  // Фильтрация
  let filtered = [...operations];

  if (dateStart) {
    filtered = filtered.filter(op => op.date >= dateStart);
  }
  if (dateEnd) {
    filtered = filtered.filter(op => op.date <= dateEnd);
  }
  if (legalEntity) {
    filtered = filtered.filter(op => op.legalEntity === legalEntity);
  }
  if (managerId) {
    filtered = filtered.filter(op => op.managerId === managerId);
  }

  return res.status(200).json({ operations: filtered });
}