// src/services/crmApi.mock.ts

export interface Replenishment {
  date: string;
  amount: number;
  client: string;
  legalEntity: string;
  managerName: string;     // ← manager → managerName
  managerId?: string;
  clientType: 'VAT' | 'NO_VAT';
}

export interface CrmApiResponse {
  status: 'ok' | 'error';
  data: {
    replenishments: Replenishment[];
  };
  message: string | null;
}

export async function getReplenishments(params: any): Promise<CrmApiResponse> {
  console.log('📦 MOCK: Запрос к CRM API', params);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Извлекаем managerId из параметров (если передан)
  const filterManagerId = params.managerID;
  const filterManagerName = params.managername;
  
  // База данных менеджеров с ID
  const managersDb: Record<string, { name: string; id: string }> = {
    'crm_7': { name: 'Федосеенко Дана', id: 'crm_7' },
    'crm_18': { name: 'Воропаев Степан', id: 'crm_18' },
    'crm_24': { name: 'Архипова Анна', id: 'crm_24' },
  };
  
  // Все тестовые операции
  const allOperations: Replenishment[] = [
    // Дана (crm_7)
    {
      date: "15-03-2026",
      amount: 50000,
      client: "ООО Ромашка",
      legalEntity: "Солар",
      managerName: "Федосеенко Дана",
      managerId: "crm_7",
      clientType: "NO_VAT"
    },
    {
      date: "20-03-2026",
      amount: 23750,
      client: "ИП Петров",
      legalEntity: "Фаэтон",
      managerName: "Федосеенко Дана",
      managerId: "crm_7",
      clientType: "VAT"
    },
    {
      date: "05-03-2026",
      amount: 13675,
      client: "ИП Шевченко Валерий Валерьевич",
      legalEntity: "Кард Сервис",
      managerName: "Федосеенко Дана",
      managerId: "crm_7",
      clientType: "NO_VAT"
    },
    // Степан (crm_18)
    {
      date: "10-03-2026",
      amount: 150000,
      client: "ООО ТехноСервис",
      legalEntity: "Солар",
      managerName: "Воропаев Степан",
      managerId: "crm_18",
      clientType: "NO_VAT"
    },
    {
      date: "12-03-2026",
      amount: 45000,
      client: "ООО Альфа",
      legalEntity: "Солар",
      managerName: "Воропаев Степан",
      managerId: "crm_18",
      clientType: "NO_VAT"
    },
    // Анна (crm_24)
    {
      date: "25-03-2026",
      amount: 89000,
      client: "ИП Сидоров",
      legalEntity: "Фаэтон",
      managerName: "Архипова Анна",
      managerId: "crm_24",
      clientType: "VAT"
    },
    {
      date: "18-03-2026",
      amount: 120000,
      client: "ИП Кузнецов",
      legalEntity: "Фаэтон",
      managerName: "Архипова Анна",
      managerId: "crm_24",
      clientType: "VAT"
    }
  ];
  
  // Фильтруем по managerId или managerName
  let filteredOperations = allOperations;
  
  if (filterManagerId) {
    filteredOperations = allOperations.filter(op => op.managerId === filterManagerId);
    console.log(`🔍 Фильтр по managerId: ${filterManagerId}, найдено: ${filteredOperations.length}`);
  } else if (filterManagerName) {
    filteredOperations = allOperations.filter(op => 
      op.managerName.toLowerCase() === filterManagerName.toLowerCase()
    );
    console.log(`🔍 Фильтр по managerName: ${filterManagerName}, найдено: ${filteredOperations.length}`);
  }
  
  return {
    status: 'ok',
    data: {
      replenishments: filteredOperations
    },
    message: null
  };
}