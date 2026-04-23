// src/stores/kpiStore.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { bufferService } from '@/services/bufferService';

// Получаем токен из переменных окружения
const ADR_TOKEN = import.meta.env.VITE_CRM_API_TOKEN;

// Интерфейсы для типизации
interface Manager {
  id: string;
  displayName: string;
  role: string;
  aliases: string[];
  plan?: number;
  originalManager?: any;
}

interface MaintenanceRate {
  id: string;
  value: number;
  label: string;
}

interface KpiRate {
  id: string;
  value: number;
  label: string;
}

interface BufferOperation {
  date: string;
  amount: number;
  client: string;
  clientType: 'VAT' | 'NO_VAT';
  legalEntity: string;
  managerId: string;
  manager: string;
  operationId?: string;
}

interface BonusHistory {
  client: string;
  currentManager?: string;
  manager?: string;
  status?: string;
  firstFillDate?: string;
}

interface ApiManager {
  managerId: string;
  fullName: string;
  managerName: string;
  role: string;
}

interface ApiPlan {
  managerId: string;
  amount: string;
}

interface ApiReplenishment {
  managerId: string;
  date: string;
  amount: string;
  client: string;
  clientType: 'VAT' | 'NO_VAT';
  legalEntity: string;
  id?: string;
}

export const useKpiStore = defineStore('kpi', () => {
  // Состояние
  const managers = ref<Manager[]>([]);
  const maintenanceRates = ref<MaintenanceRate[]>([]);
  const kpiRates = ref<KpiRate[]>([]);
  const bufferData = ref<BufferOperation[]>([]);
  const bonusHistory = ref<BonusHistory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ========== ЗАГРУЗКА МЕНЕДЖЕРОВ (через прокси) ==========
  const loadManagers = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('📡 Запрос к прокси /api/proxy/managers-list');
      
      const response = await fetch('/api/proxy/managers-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accessToken': ADR_TOKEN
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'ok' && data.managers && Array.isArray(data.managers)) {
        managers.value = data.managers.map((m: ApiManager) => ({
          id: String(m.managerId),
          displayName: m.managerName || m.fullName || `Менеджер ${m.managerId}`,
          role: m.role || 'Менеджер',
          aliases: [m.managerName || m.fullName],
          originalManager: m
        }));
        console.log(`✅ Менеджеры загружены из API: ${managers.value.length}`);
      } else {
        throw new Error('Неверный формат ответа');
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки менеджеров:', err);
      error.value = 'Не удалось загрузить менеджеров';
      
      // Fallback: загружаем из JSON
      try {
        const response = await fetch('/data/managers.json');
        const data = await response.json();
        managers.value = data.managers || data;
        console.log(`✅ Менеджеры загружены из JSON: ${managers.value.length}`);
      } catch (jsonError) {
        console.error('❌ Ошибка загрузки managers.json:', jsonError);
      }
    } finally {
      loading.value = false;
    }
  };

  // ========== ЗАГРУЗКА ПЛАНОВ (через прокси) ==========
  const loadPlans = async (year: number, month: number) => {
    try {
      console.log(`📡 Запрос к прокси /api/proxy/managers-plans: year=${year}, month=${month}`);
      
      const response = await fetch('/api/proxy/managers-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accessToken': ADR_TOKEN
        },
        body: JSON.stringify({ year: String(year), month })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'ok' && data.plans && Array.isArray(data.plans)) {
        data.plans.forEach((plan: ApiPlan) => {
          const manager = managers.value.find(m => m.id === String(plan.managerId));
          if (manager) {
            manager.plan = parseFloat(plan.amount);
          }
        });
        console.log(`✅ Планы загружены из API: ${data.plans.length}`);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки планов:', err);
    }
  };

  // ========== ЗАГРУЗКА СТАВОК ВЕДЕНИЯ ==========
  const loadMaintenanceRates = async () => {
    try {
      const response = await fetch('/data/managers.json');
      const data = await response.json();
      
      if (data.maintenanceRates && Array.isArray(data.maintenanceRates)) {
        maintenanceRates.value = data.maintenanceRates;
      } else {
        maintenanceRates.value = [
          { id: "m015", value: 0.0015, label: "0.15%" },
          { id: "m020", value: 0.002, label: "0.20%" },
          { id: "m030", value: 0.003, label: "0.30%" }
        ];
      }
      console.log(`✅ Ставки ведения загружены: ${maintenanceRates.value.length}`);
    } catch (error) {
      console.error('❌ Ошибка загрузки ставок ведения:', error);
      maintenanceRates.value = [
        { id: "m015", value: 0.0015, label: "0.15%" },
        { id: "m020", value: 0.002, label: "0.20%" },
        { id: "m030", value: 0.003, label: "0.30%" }
      ];
    }
  };

  // ========== ЗАГРУЗКА KPI СТАВОК ==========
  const loadKpiRates = async () => {
    try {
      const response = await fetch('/data/managers.json');
      const data = await response.json();
      
      if (data.kpiRates && Array.isArray(data.kpiRates)) {
        kpiRates.value = data.kpiRates;
      } else {
        kpiRates.value = [
          { id: "kpi_1", value: 0.015, label: "1.50%" },
          { id: "kpi_2", value: 0.02, label: "2.00%" },
          { id: "kpi_3", value: 0.03, label: "3.00%" }
        ];
      }
      console.log(`✅ KPI ставки загружены: ${kpiRates.value.length}`);
    } catch (error) {
      console.error('❌ Ошибка загрузки KPI ставок:', error);
      kpiRates.value = [
        { id: "kpi_1", value: 0.015, label: "1.50%" },
        { id: "kpi_2", value: 0.02, label: "2.00%" },
        { id: "kpi_3", value: 0.03, label: "3.00%" }
      ];
    }
  };

  // ========== ЗАГРУЗКА ОПЕРАЦИЙ (через прокси) ==========
  const loadBufferData = async (year?: number, month?: number) => {
  loading.value = true;
  error.value = null;
  
  try {
    let dateStart: string | null = null;
    let dateEnd: string | null = null;
    
    if (year && month) {
      dateStart = `01-${String(month).padStart(2, '0')}-${year}`;
      const lastDay = new Date(year, month, 0).getDate();
      dateEnd = `${String(lastDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
    
    const body: { dateStart: string | null; dateEnd?: string | null } = { dateStart };
    if (dateEnd) {
      body.dateEnd = dateEnd;
    }
    
    console.log('📡 Запрос к прокси /api/proxy/managers-replenishments:', body);
    
    const response = await fetch('/api/proxy/managers-replenishments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accessToken': ADR_TOKEN
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'ok' && data.replenishments && Array.isArray(data.replenishments)) {
      const newOps = data.replenishments.map((item: ApiReplenishment) => ({
        date: item.date,
        amount: parseFloat(item.amount),
        client: item.client,
        clientType: item.clientType,
        legalEntity: item.legalEntity,
        managerId: String(item.managerId),
        manager: managers.value.find(m => m.id === String(item.managerId))?.displayName || `Менеджер ${item.managerId}`,
        operationId: item.id
      }));
      
      // Добавляем новые операции, исключая дубликаты по operationId
      const existingIds = new Set(bufferData.value.map(op => op.operationId).filter(Boolean));
      const uniqueNewOps = newOps.filter(op => !op.operationId || !existingIds.has(op.operationId));
      bufferData.value = [...bufferData.value, ...uniqueNewOps];
      
      // 🔥 Обновляем bufferService
      if (bufferService && typeof bufferService.updateOperations === 'function') {
        bufferService.updateOperations(bufferData.value);
        console.log(`✅ BufferService обновлен: ${bufferData.value.length} операций`);
      }
      
      console.log(`✅ Загружено операций: ${bufferData.value.length} (новых: ${uniqueNewOps.length})`);
    } else {
      console.warn('⚠️ Неожиданный формат ответа:', data);
    }
    
    return bufferData.value;
    
  } catch (err) {
    console.error('❌ Ошибка загрузки операций:', err);
    error.value = 'Не удалось загрузить данные';
    bufferData.value = [];
    return [];
  } finally {
    loading.value = false;
  }
};

  // ========== ЗАГРУЗКА ИСТОРИИ БОНУСОВ ==========
  const loadBonusHistory = async () => {
    try {
      const response = await fetch('/data/bonushistory.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.bonuses) {
        bonusHistory.value = data.bonuses;
      } else if (Array.isArray(data)) {
        bonusHistory.value = data;
      } else {
        bonusHistory.value = [];
      }
      
      console.log(`✅ Bonus history загружен: ${bonusHistory.value.length} записей`);
      return bonusHistory.value;
    } catch (error) {
      console.error('❌ Ошибка загрузки bonusHistory:', error);
      bonusHistory.value = [];
      return [];
    }
  };

// ========== ЗАГРУЗКА НАСТРОЕК KPI С СЕРВЕРА ==========
const loadKpiSettings = async () => {
  try {
    console.log('📡 Загрузка KPI настроек с сервера...');
    
    const response = await fetch('/api/kpi-settings', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.settings) {
      console.log('✅ KPI настройки загружены:', data.settings);
      return data.settings;
    } else {
      console.warn('⚠️ Сервер вернул пустые настройки');
      return {};
    }
    
  } catch (error) {
    console.error('❌ Ошибка загрузки KPI настроек:', error);
    return {};
  }
};

// ========== СОХРАНЕНИЕ НАСТРОЙКИ KPI НА СЕРВЕР ==========
const saveKpiSetting = async (key: string, value: any) => {
  try {
    console.log(`📤 Сохранение настройки '${key}' на сервер...`);
    
    const response = await fetch('/api/kpi-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Настройка '${key}' сохранена:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ Ошибка сохранения настройки '${key}':`, error);
    throw error;
  }
};

// ========== ПАКЕТНОЕ СОХРАНЕНИЕ НАСТРОЕК ==========
const saveAllKpiSettings = async (settings: Record<string, any>) => {
  try {
    console.log('📤 Пакетное сохранение настроек на сервер...');
    
    const response = await fetch('/api/kpi-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Настройки сохранены:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Ошибка пакетного сохранения настроек:', error);
    throw error;
  }
};

// ========== РАБОТА С KPI КЛИЕНТАМИ ==========
const kpiReceivedClients = ref<any[]>([]);

const loadKpiReceivedClients = async () => {
  try {
    const response = await fetch('/api/get-kpi-received');
    const data = await response.json();
    if (data.success) {
      kpiReceivedClients.value = data.clients || [];
      console.log(`✅ Загружено ${kpiReceivedClients.value.length} клиентов с KPI`);
    }
  } catch (error) {
    console.error('Ошибка загрузки KPI клиентов:', error);
  }
};

const markKpiReceived = async (client: string, managerName: string, month: string) => {
  try {
    const response = await fetch('/api/mark-kpi-received', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, managerName, month })
    });
    const data = await response.json();
    if (data.success) {
      await loadKpiReceivedClients();
      return data;
    }
    throw new Error(data.error || 'Unknown error');
  } catch (error) {
    console.error('Ошибка отметки KPI:', error);
    throw error;
  }
};


// Удаление клиента из списка получивших KPI
const removeKpiReceived = async (client: string) => {
  try {
    const response = await fetch('/api/remove-kpi-received', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client })
    });
    const data = await response.json();
    if (data.success) {
      await loadKpiReceivedClients();
      return data;
    }
    throw new Error(data.error || 'Unknown error');
  } catch (error) {
    console.error('Ошибка удаления KPI:', error);
    throw error;
  }
};

// ВРЕМЕННО: импорт всех клиентов как "KPI получен"
const importAllClientsAsKpiReceived = async () => {
  if (bufferData.value.length === 0) {
    console.log('⚠️ Нет данных для импорта');
    return;
  }
  
  const allClients = [...new Set(bufferData.value.map(op => op.client))];
  console.log(`📤 Импорт ${allClients.length} клиентов как "KPI получен"...`);
  
  for (const client of allClients) {
    try {
      await fetch('/api/mark-kpi-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, managerName: 'system', month: '1970-01' })
      });
    } catch (e) {
      // игнорируем дубликаты
    }
  }
  
  await loadKpiReceivedClients();
  console.log('✅ Импорт завершён');
};




const isKpiReceivedForClient = (client: string): boolean => {
  return kpiReceivedClients.value.some(c => c.client === client);
};

  // ========== ХЕЛПЕРЫ ==========
  const getManagerById = (id: string) => {
    return managers.value.find(m => m.id === id);
  };

  const getManagerByName = (name: string) => {
    return managers.value.find(m => 
      m.displayName === name || m.aliases?.includes(name)
    );
  };

  const getAllBufferOperations = () => {
    return bufferData.value;
  };

  const getBufferOperationsByManager = (managerName: string) => {
    return bufferData.value.filter(op => 
      op.manager === managerName || 
      (op as any).managerName === managerName ||
      (op as any).responsible === managerName
    );
  };

  const getBufferOperationsByPeriod = (year: number, month: number) => {
    const monthStr = month.toString().padStart(2, '0');
    return bufferData.value.filter(op => {
      if (op.date) {
        return op.date.startsWith(`${year}-${monthStr}`) || 
               op.date.includes(`-${monthStr}-${year}`) ||
               op.date.includes(`.${monthStr}.${year}`);
      }
      return false;
    });
  };

  const getBonusHistoryForManager = (managerName: string) => {
    return bonusHistory.value.filter(b => 
      b.currentManager === managerName || 
      b.manager === managerName
    );
  };

  const getBonusStatusForClient = (clientName: string, managerName: string) => {
    return bonusHistory.value.find(b => 
      b.client === clientName && 
      (b.currentManager === managerName || b.manager === managerName)
    );
  };

  // ========== RETURN ==========
  return {
    managers,
    maintenanceRates,
    kpiRates,
    bufferData,
    bonusHistory,
    loading,
    error,
    isKpiReceivedForClient,
    kpiReceivedClients,

    loadManagers,
    loadPlans,
    loadMaintenanceRates,
    loadKpiRates,
    loadBufferData,
    loadBonusHistory,
    loadKpiSettings,
    removeKpiReceived,
    importAllClientsAsKpiReceived,

    saveKpiSetting,
    saveAllKpiSettings,

    getManagerById,
    getManagerByName,
    getAllBufferOperations,
    getBufferOperationsByManager,
    getBufferOperationsByPeriod,
    getBonusHistoryForManager,
    getBonusStatusForClient,
    loadKpiReceivedClients,
    markKpiReceived,
    
    
    
  };
});