// api/buffer.js

// Тестовые данные (имитация данных из CRM)
const mockData = {
  operations: [
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
      date: "18-01-2025",
      amount: 3500,
      client: "ООО ТехноСервис",
      clientType: "NO_VAT",
      legalEntity: "Газпромнефть",
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
      date: "22-01-2025",
      amount: 8000,
      client: "ИП Толмачёв Виктор Иванович",
      clientType: "NO_VAT",
      legalEntity: "Кард Сервис",
      managerId: "crm_7",
      managerName: "Дана"
    },
    {
      date: "25-01-2025",
      amount: 12000,
      client: "ООО Берёзка",
      clientType: "VAT",
      legalEntity: "Татнефть",
      managerId: "crm_21",
      managerName: "Дмитрий"
    },
    {
      date: "28-01-2025",
      amount: 25000,
      client: "ООО Берёзка",
      clientType: "VAT",
      legalEntity: "Татнефть",
      managerId: "crm_21",
      managerName: "Дмитрий"
    },
    {
      date: "05-02-2025",
      amount: 4500,
      client: "ООО ТехноСервис",
      clientType: "NO_VAT",
      legalEntity: "Газпромнефть",
      managerId: "crm_7",
      managerName: "Дана"
    },
    {
      date: "10-02-2025",
      amount: 18000,
      client: "ООО Ромашка",
      clientType: "VAT",
      legalEntity: "Газпромнефть",
      managerId: "crm_18",
      managerName: "Степан"
    }
  ]
};

export default function handler(req, res) {
  // CORS для тестирования
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
  }

  const { dateStart, dateEnd, legalEntity, managerId } = req.body;

  // Логируем запрос
  console.log('📥 Получен запрос:', { dateStart, dateEnd, legalEntity, managerId });

  // Валидация обязательного параметра
  if (!dateStart) {
    return res.status(400).json({ 
      error: 'Параметр dateStart обязателен',
      operations: [] 
    });
  }

  // Фильтрация операций
  let filtered = [...mockData.operations];

  // Фильтр по дате начала (включительно)
  if (dateStart) {
    filtered = filtered.filter(op => op.date >= dateStart);
  }

  // Фильтр по дате окончания (включительно)
  if (dateEnd) {
    filtered = filtered.filter(op => op.date <= dateEnd);
  }

  // Фильтр по юр.лицу
  if (legalEntity) {
    filtered = filtered.filter(op => op.legalEntity === legalEntity);
  }

  // Фильтр по менеджеру
  if (managerId) {
    filtered = filtered.filter(op => op.managerId === managerId);
  }

  // Логируем результат
  console.log(`📤 Возвращено ${filtered.length} операций`);

  // Возвращаем результат
  return res.status(200).json({
    operations: filtered
  });
}