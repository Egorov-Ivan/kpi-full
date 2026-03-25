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

  // ========== СУЩЕСТВУЮЩИЕ МЕТОДЫ ==========
  
  const loadManagers = async () => {
    // ... ваш существующий код
  };

  const loadMaintenanceRates = async () => {
    // ... ваш существующий код
  };

  const loadKpiRates = async () => {
    // ... ваш существующий код
  };

  // ========== НОВЫЙ МЕТОД ДЛЯ API ==========
  
  const loadBufferDataFromApi = async (year?: number, month?: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Формируем даты в формате DD-MM-YYYY
      const dateStart = year && month 
        ? `01-${String(month).padStart(2, '0')}-${year}`
        : null;
      
      const dateEnd = year && month
        ? `${new Date(year, month, 0).getDate()}-${String(month).padStart(2, '0')}-${year}`
        : null;
      
      console.log(`📡 Запрос к API /api/buffer:`, { dateStart, dateEnd });
      
      const response = await fetch('/api/buffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateStart,
          dateEnd
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверяем структуру ответа
      if (data.operations && Array.isArray(data.operations)) {
        bufferData.value = data.operations;
        console.log(`✅ Буфер загружен из API: ${bufferData.value.length} записей`);
        return bufferData.value;
      } else if (Array.isArray(data)) {
        bufferData.value = data;
        console.log(`✅ Буфер загружен из API: ${bufferData.value.length} записей`);
        return bufferData.value;
      } else {
        console.warn('⚠️ Неожиданный формат ответа API:', data);
        bufferData.value = [];
        return [];
      }
      
    } catch (apiError) {
      console.error('❌ Ошибка загрузки из API:', apiError);
      error.value = 'Не удалось загрузить данные из API';
      
      // Fallback: пробуем загрузить из JSON
      console.log('🔄 Fallback: загрузка из /data/buffer.json...');
      return await loadBufferData();
    } finally {
      loading.value = false;
    }
  };

  // ========== ОБНОВЛЕННЫЙ МЕТОД (с поддержкой параметров) ==========
  
  const loadBufferData = async (year?: number, month?: number) => {
    // Если переданы year и month — пробуем API сначала
    if (year && month) {
      return await loadBufferDataFromApi(year, month);
    }
    
    // Иначе загружаем из JSON (старая логика)
    try {
      console.log('🔄 Загрузка /data/buffer.json...');
      const response = await fetch('/data/buffer.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  // ========== ОСТАЛЬНЫЕ СУЩЕСТВУЮЩИЕ МЕТОДЫ ==========
  
  const loadBonusHistory = async () => {
    // ... ваш существующий код
  };

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

  // ========== RETURN (ВСЕ МЕТОДЫ) ==========
  
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
    loadBufferData,        // ← обновлен, принимает year, month
    loadBufferDataFromApi, // ← новый метод
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