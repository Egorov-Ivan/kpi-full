// api/buffer.js
export default function handler(req, res) {
  // CORS для тестирования
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

  console.log('📥 API запрос:', { dateStart, dateEnd, legalEntity, managerId });

  // Тестовые данные
  const mockOperations = [
    {
      date: "15-01-2025",
      amount: 6000,
      client: "ИП Толмачёв Виктор Иванович",
      clientType: "NO_VAT",
      legalEntity: "Кард Сервис",
      managerId: "crm_7",
      managerName: "Дана"
    },
    {
      date: "20-01-2025",
      amount: 15000,
      client: "ООО Ромашка",
      clientType: "VAT",
      legalEntity: "Газпромнефть",
      managerId: "crm_18",
      managerName: "Степан"
    },
    {
      date: "25-01-2025",
      amount: 8000,
      client: "ИП Толмачёв Виктор Иванович",
      clientType: "NO_VAT",
      legalEntity: "Кард Сервис",
      managerId: "crm_7",
      managerName: "Дана"
    }
  ];

  // Фильтрация
  let filtered = [...mockOperations];

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

  console.log(`📤 API ответ: ${filtered.length} операций`);
  return res.status(200).json({ operations: filtered });
}