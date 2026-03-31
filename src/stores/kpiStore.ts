// src/stores/kpiStore.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getReplenishments, type Replenishment } from '@/services/crmApi.mock';
import { bufferService, type BufferOperation } from '@/services/bufferService'; // ← добавлен импорт bufferService

export const useKpiStore = defineStore('kpi', () => {
  // ========== СОСТОЯНИЕ ==========
  const managers = ref<any[]>([]);
  const maintenanceRates = ref<any[]>([]);
  const kpiRates = ref<any[]>([]);
  const bufferData = ref<any[]>([]);
  const bonusHistory = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // ========== CRM СОСТОЯНИЕ ==========
  const crmData = ref<Replenishment[]>([]);
  const crmLoading = ref(false);
  const crmError = ref<string | null>(null);
  const useCrmSource = ref(true); // true = данные из CRM, false = из локального buffer.json

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

  // Конвертация CRM данных в формат bufferData
  const convertCrmToBufferFormat = (crmData: Replenishment[]): BufferOperation[] => {
  return crmData.map(item => ({
    date: item.date,
    amount: item.amount,
    client: item.client,
    legalEntity: item.legalEntity,
    manager: item.managerName,        // ← managerName → manager
    managerName: item.managerName,    // ← для совместимости
    managerId: item.managerId,
    clientType: item.clientType,
    operationType: 'replenishment'
  }));
};

  // ========== МЕТОДЫ ==========

  // Загрузка менеджеров
  const loadManagers = async () => {
    loading.value = true;
    try {
      const response = await fetch('/data/managers.json');
      const data = await response.json();
      
      if (data.managers && Array.isArray(data.managers)) {
        managers.value = data.managers;
        console.log(`✅ Менеджеры загружены: ${managers.value.length}`);
      } else if (Array.isArray(data)) {
        managers.value = data;
        console.log(`✅ Менеджеры загружены: ${managers.value.length}`);
      } else {
        console.warn('⚠️ Неожиданный формат managers.json:', data);
        managers.value = [];
      }
      
      if (data.maintenanceRates) {
        maintenanceRates.value = data.maintenanceRates;
      }
      if (data.kpiRates) {
        kpiRates.value = data.kpiRates;
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки менеджеров:', error);
      managers.value = [
        { id: "crm_7", displayName: "Федосеенко Дана", role: "Старший Менеджер", aliases: ["Дана"], allowedMaintenanceRates: ["m015", "m020", "m030", "m150"] },
        { id: "crm_18", displayName: "Воропаев Степан", role: "Менеджер", aliases: ["Степан"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_21", displayName: "Храмов Дмитрий", role: "Менеджер", aliases: ["Дмитрий"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_22", displayName: "Сартаков Роман", role: "Менеджер", aliases: ["Роман"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_24", displayName: "Архипова Анна", role: "Менеджер", aliases: ["Анна"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_12", displayName: "Кошарный Евгений", role: "Руководитель ОП", aliases: ["Евгений"], allowedMaintenanceRates: ["m015", "m020", "m030"] },
        { id: "crm_32", displayName: "Масленников Никита", role: "Менеджер", aliases: ["Никита"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_33", displayName: "Массаков Даниил", role: "Менеджер", aliases: ["Даниил"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_34", displayName: "Марушкевич Иван", role: "Менеджер", aliases: ["Иван"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_36", displayName: "Кухарь Роман", role: "Менеджер", aliases: ["Роман"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_37", displayName: "Самедов Али", role: "Менеджер", aliases: ["Али"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_40", displayName: "Овсянников Артем", role: "Менеджер", aliases: ["Артем"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_41", displayName: "Сысоева Кристина", role: "Менеджер", aliases: ["Кристина"], allowedMaintenanceRates: ["m015", "m020"] },
        { id: "crm_42", displayName: "Морева Кристина", role: "Менеджер", aliases: ["Кристина"], allowedMaintenanceRates: ["m015", "m020"] },
      ];
    } finally {
      loading.value = false;
    }
  };

  // Загрузка ставок ведения
  const loadMaintenanceRates = async () => {
    if (maintenanceRates.value.length > 0) {
      return maintenanceRates.value;
    }
    
    try {
      const response = await fetch('/data/maintenance-rates.json');
      const data = await response.json();
      if (Array.isArray(data)) {
        maintenanceRates.value = data;
      } else if (data.rates) {
        maintenanceRates.value = data.rates;
      } else {
        maintenanceRates.value = [
          { id: 'm015', value: 0.0015, label: '0.15%' },
          { id: 'm020', value: 0.002, label: '0.20%' },
          { id: 'm030', value: 0.003, label: '0.30%' },
          { id: 'm150', value: 0.015, label: '1.50%' },
        ];
      }
    } catch (error) {
      console.error('Ошибка загрузки ставок ведения:', error);
      maintenanceRates.value = [
        { id: 'm015', value: 0.0015, label: '0.15%' },
        { id: 'm020', value: 0.002, label: '0.20%' },
        { id: 'm030', value: 0.003, label: '0.30%' },
        { id: 'm150', value: 0.015, label: '1.50%' },
      ];
    }
  };

  // Загрузка KPI ставок
  const loadKpiRates = async () => {
    if (kpiRates.value.length > 0) return kpiRates.value;
    
    try {
      const response = await fetch('/data/kpi-rates.json');
      const data = await response.json();
      if (Array.isArray(data)) {
        kpiRates.value = data;
      } else if (data.rates) {
        kpiRates.value = data.rates;
      } else {
        kpiRates.value = [
          { id: 'kpi_1', value: 0.015, label: '1.50%' },
          { id: 'kpi_2', value: 0.02, label: '2.00%' },
          { id: 'kpi_3', value: 0.03, label: '3.00%' },
        ];
      }
    } catch (error) {
      console.error('Ошибка загрузки KPI ставок:', error);
      kpiRates.value = [
        { id: 'kpi_1', value: 0.015, label: '1.50%' },
        { id: 'kpi_2', value: 0.02, label: '2.00%' },
        { id: 'kpi_3', value: 0.03, label: '3.00%' },
      ];
    }
  };

  // Загрузка буфера данных (локальный JSON)
  const loadBufferData = async (year?: number, month?: number) => {
    try {
      console.log('🔄 Загрузка /data/buffer.json...');
      const response = await fetch('/data/buffer.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      let loadedData: any[] = [];
      
      if (Array.isArray(data)) {
        loadedData = data;
        console.log(`✅ Буфер загружен из JSON: ${loadedData.length} записей`);
      } else if (data.operations && Array.isArray(data.operations)) {
        loadedData = data.operations;
        console.log(`✅ Буфер загружен из JSON: ${loadedData.length} записей`);
      } else if (data.data && Array.isArray(data.data)) {
        loadedData = data.data;
        console.log(`✅ Буфер загружен из JSON: ${loadedData.length} записей`);
      } else {
        console.warn('⚠️ Неожиданный формат buffer.json:', data);
        loadedData = [];
      }
      
      bufferData.value = loadedData;
      
      // ← ОБНОВЛЯЕМ bufferService
      bufferService.updateOperations(bufferData.value);
      
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
      const response = await fetch('/data/bonushistory.json');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        bonusHistory.value = data;
        console.log(`✅ История бонусов загружена: ${bonusHistory.value.length} записей`);
      } else if (data.bonusHistory && Array.isArray(data.bonusHistory)) {
        bonusHistory.value = data.bonusHistory;
      } else {
        bonusHistory.value = [];
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки bonushistory.json:', error);
      bonusHistory.value = [];
    }
  };

  // ========== CRM МЕТОДЫ ==========

  // Загрузка данных из CRM API
  const loadCrmData = async (params: {
    dateStart: string;
    dateEnd?: string;
    legalEntity?: string;
    managerID?: string;
    managername?: string;
  }) => {
    crmLoading.value = true;
    crmError.value = null;
    
    try {
      console.log('🔄 Загрузка из CRM API...', params);
      const response = await getReplenishments(params);
      
      if (response.status === 'ok' && response.data.replenishments) {
        crmData.value = response.data.replenishments;
        console.log(`✅ CRM данные загружены: ${crmData.value.length} записей`);
        
        // Если включен режим использования CRM, обновляем bufferData
        if (useCrmSource.value) {
          const convertedData = convertCrmToBufferFormat(crmData.value);
          bufferData.value = convertedData;
          
          // ← ОБНОВЛЯЕМ bufferService
          bufferService.updateOperations(bufferData.value);
          
          console.log(`✅ Буфер обновлен из CRM: ${bufferData.value.length} записей`);
        }
        
        return crmData.value;
      } else {
        throw new Error(response.message || 'Неизвестная ошибка');
      }
      
    } catch (error) {
      crmError.value = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка загрузки из CRM:', crmError.value);
      return [];
    } finally {
      crmLoading.value = false;
    }
  };

  // Удобный метод для загрузки данных за месяц
  const loadDataForMonth = async (year: number, month: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      if (useCrmSource.value) {
        const dateStart = `01-${month.toString().padStart(2, '0')}-${year}`;
        const lastDay = new Date(year, month, 0).getDate();
        const dateEnd = `${lastDay}-${month.toString().padStart(2, '0')}-${year}`;
        
        await loadCrmData({ dateStart, dateEnd });
      } else {
        await loadBufferData(year, month);
      }
      
      return bufferData.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      console.error('❌ Ошибка загрузки данных:', error.value);
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Переключатель источника данных
  const setDataSource = (useCrm: boolean) => {
    useCrmSource.value = useCrm;
    console.log(`📊 Источник данных: ${useCrm ? 'CRM API' : 'Локальный buffer.json'}`);
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
      op.managerName === managerName ||
      op.responsible === managerName
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
    // Состояние
    managers,
    maintenanceRates,
    kpiRates,
    bufferData,
    bonusHistory,
    loading,
    error,
    
    // CRM состояние
    crmData,
    crmLoading,
    crmError,
    useCrmSource,
    
    // Методы загрузки
    loadManagers,
    loadMaintenanceRates,
    loadKpiRates,
    loadBufferData,
    loadBonusHistory,
    
    // CRM методы
    loadCrmData,
    loadDataForMonth,
    setDataSource,
    
    // Хелперы
    getManagerById,
    getManagerByName,
    getAllBufferOperations,
    getBufferOperationsByManager,
    getBufferOperationsByPeriod,
    getBonusHistoryForManager,
    getBonusStatusForClient
  };
});