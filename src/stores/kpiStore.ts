// src/stores/kpiStore.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useKpiStore = defineStore('kpi', () => {
  // Состояние
  const managers = ref<any[]>([]);
  const maintenanceRates = ref<any[]>([]);
  const kpiRates = ref<any[]>([]);
  const bufferData = ref<any[]>([]);
  const bonusHistory = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Загрузка менеджеров
  const loadManagers = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // Пробуем загрузить через API
      const response = await fetch('/api/managers');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      managers.value = data;
      console.log('✅ Менеджеры загружены через API:', data.length);
      
    } catch (apiError) {
      console.warn('❌ Не удалось загрузить через API, пробуем локальный сервер...');
      
      // Пробуем локальный json-server (для разработки)
      try {
        const response = await fetch('http://localhost:3000/managers');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        managers.value = data;
        console.log('✅ Менеджеры загружены через локальный сервер:', data.length);
        
      } catch (localError) {
        console.error('❌ Локальный сервер тоже не работает');
        error.value = 'Не удалось загрузить менеджеров';
        
        // Запасные данные на крайний случай
        managers.value = [
          { 
            id: "crm_7", 
            displayName: "Федосеенко Дана", 
            role: "Старший Менеджер", 
            aliases: ["Дана", "Федосеенко Д", "Федосеенко"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_12", 
            displayName: "Кошарный Евгений", 
            role: "Старший Менеджер", 
            aliases: ["Евгений К", "Евгений", "Кошарный Е"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_18", 
            displayName: "Воропаев Степан", 
            role: "Менеджер", 
            aliases: ["Степан", "Воропаев С", "Воропаев"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_21", 
            displayName: "Храмов Дмитрий", 
            role: "Старший Менеджер", 
            aliases: ["Дмитрий", "Храмов Д", "Храмов"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_22", 
            displayName: "Сартаков Роман", 
            role: "Менеджер", 
            aliases: ["Роман С", "Сартаков Р", "Сартаков"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_24", 
            displayName: "Архипова Анна", 
            role: "Менеджер", 
            aliases: ["Анна", "Архипова А", "Архипова"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_32", 
            displayName: "Масленников Никита", 
            role: "Менеджер", 
            aliases: ["Никита", "Масленников Н", "Масленников"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_33", 
            displayName: "Массаков Даниил", 
            role: "Менеджер", 
            aliases: ["Даниил М", "Массаков Д", "Даниил", "Даня"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_34", 
            displayName: "Марушкевич Иван", 
            role: "Менеджер", 
            aliases: ["Иван", "Марушкевич И", "Марушкевич"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_36", 
            displayName: "Кухарь Роман", 
            role: "Менеджер", 
            aliases: ["Роман К", "Кухарь Р", "Кухарь"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_37", 
            displayName: "Самедов Али", 
            role: "Менеджер", 
            aliases: ["Али", "Самедов А", "Самедов"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_40", 
            displayName: "Овсянников Артем", 
            role: "Менеджер", 
            aliases: ["Артем", "Овсянников А", "Овсянников"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_41", 
            displayName: "Сысоева Кристина", 
            role: "Менеджер", 
            aliases: ["Кристина С", "Сысоева К", "Сысоева"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          },
          { 
            id: "crm_42", 
            displayName: "Морева Кристина", 
            role: "Менеджер", 
            aliases: ["Кристина М", "Морева К", "Морева"], 
            allowedMaintenanceRates: ["m015", "m020", "m030"] 
          }
        ];
        console.log('⚠️ Используются запасные данные менеджеров');
      }
    } finally {
      loading.value = false;
    }
  };

  // Загрузка ставок ведения
  const loadMaintenanceRates = async () => {
    try {
      const response = await fetch('/api/maintenanceRates');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      maintenanceRates.value = data;
      console.log('✅ Ставки ведения загружены:', data.length);
      
    } catch (apiError) {
      console.warn('❌ Не удалось загрузить через API, пробуем локальный сервер...');
      
      try {
        const response = await fetch('http://localhost:3000/maintenanceRates');
        const data = await response.json();
        maintenanceRates.value = data;
        console.log('✅ Ставки ведения загружены через локальный сервер:', data.length);
      } catch (localError) {
        console.error('❌ Локальный сервер тоже не работает');
        // Запасные данные
        maintenanceRates.value = [
          { id: "m015", value: 0.0015, label: "0.15%" },
          { id: "m020", value: 0.002, label: "0.20%" },
          { id: "m030", value: 0.003, label: "0.30%" }
        ];
      }
    }
  };

  // Загрузка KPI ставок
  const loadKpiRates = async () => {
    try {
      const response = await fetch('/api/kpiRates');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      kpiRates.value = data;
      console.log('✅ KPI ставки загружены:', data.length);
      
    } catch (apiError) {
      console.warn('❌ Не удалось загрузить через API, пробуем локальный сервер...');
      
      try {
        const response = await fetch('http://localhost:3000/kpiRates');
        const data = await response.json();
        kpiRates.value = data;
        console.log('✅ KPI ставки загружены через локальный сервер:', data.length);
      } catch (localError) {
        console.error('❌ Локальный сервер тоже не работает');
        // Запасные данные
        kpiRates.value = [
          { id: "kpi_1", value: 0.015, label: "1.50%" },
          { id: "kpi_2", value: 0.02, label: "2.00%" },
          { id: "kpi_3", value: 0.03, label: "3.00%" }
        ];
      }
    }
  };

  // Загрузка данных буфера
  const loadBufferData = async () => {
    try {
      console.log('🔄 Загрузка /data/buffer.json...');
      const response = await fetch('/data/buffer.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверяем структуру данных
      if (Array.isArray(data)) {
        bufferData.value = data;
        console.log(`✅ Буфер загружен: ${data.length} записей`);
      } else if (data.operations && Array.isArray(data.operations)) {
        bufferData.value = data.operations;
        console.log(`✅ Буфер загружен: ${data.operations.length} записей`);
      } else if (data.data && Array.isArray(data.data)) {
        bufferData.value = data.data;
        console.log(`✅ Буфер загружен: ${data.data.length} записей`);
      } else {
        console.warn('⚠️ Неожиданный формат buffer.json:', data);
        bufferData.value = [];
      }
      
      return bufferData.value;
    } catch (error) {
      console.error('❌ Ошибка загрузки buffer.json:', error);
      bufferData.value = [];
      return [];
    }
  };

  // Загрузка истории бонусов
  const loadBonusHistory = async () => {
    try {
      console.log('🔄 Загрузка /data/bonushistory.json...');
      const response = await fetch('/data/bonushistory.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверяем структуру данных
      if (data && data.bonuses) {
        bonusHistory.value = data.bonuses;
        console.log(`✅ Bonus history загружен: ${bonusHistory.value.length} записей`);
      } else if (Array.isArray(data)) {
        bonusHistory.value = data;
        console.log(`✅ Bonus history загружен: ${bonusHistory.value.length} записей`);
      } else {
        console.warn('⚠️ Неожиданный формат bonushistory.json:', data);
        bonusHistory.value = [];
      }
      
      return bonusHistory.value;
    } catch (error) {
      console.error('❌ Ошибка загрузки bonusHistory:', error);
      bonusHistory.value = [];
      return [];
    }
  };

  // Получить менеджера по ID
  const getManagerById = (id: string) => {
    return managers.value.find(m => m.id === id);
  };

  // Получить менеджера по имени (с учетом алиасов)
  const getManagerByName = (name: string) => {
    return managers.value.find(m => 
      m.displayName === name || m.aliases?.includes(name)
    );
  };

  // Получить все операции из буфера
  const getAllBufferOperations = () => {
    return bufferData.value;
  };

  // Получить операции по менеджеру
  const getBufferOperationsByManager = (managerName: string) => {
    return bufferData.value.filter(op => 
      op.manager === managerName || 
      op.managerName === managerName ||
      op.responsible === managerName
    );
  };

  // Получить операции за период
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

  // Получить бонусную историю для менеджера
  const getBonusHistoryForManager = (managerName: string) => {
    return bonusHistory.value.filter(b => 
      b.currentManager === managerName || 
      b.manager === managerName
    );
  };

  // Получить статус бонуса для клиента
  const getBonusStatusForClient = (clientName: string, managerName: string) => {
    return bonusHistory.value.find(b => 
      b.client === clientName && 
      (b.currentManager === managerName || b.manager === managerName)
    );
  };

  return {
    // Состояние
    managers,
    maintenanceRates,
    kpiRates,
    bufferData,
    bonusHistory,
    loading,
    error,
    
    // Методы загрузки
    loadManagers,
    loadMaintenanceRates,
    loadKpiRates,
    loadBufferData,
    loadBonusHistory,
    
    // Хелперы
    getManagerById,
    getManagerByName,
    
    // Методы для работы с буфером
    getAllBufferOperations,
    getBufferOperationsByManager,
    getBufferOperationsByPeriod,
    
    // Методы для работы с бонусной историей
    getBonusHistoryForManager,
    getBonusStatusForClient
  };
});