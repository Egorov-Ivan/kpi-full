// src/stores/kpiStore.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useKpiStore = defineStore('kpi', () => {
  // Состояние
  const managers = ref<any[]>([]);
  const maintenanceRates = ref<any[]>([]);
  const kpiRates = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Загрузка менеджеров
  const loadManagers = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // Пробуем загрузить через API (работает на Vercel)
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
          { id: "crm_7", displayName: "Федосеенко Д", role: "Менеджер", aliases: ["Федосеенко Денис"], allowedMaintenanceRates: ["m015", "m020", "m030"] },
          { id: "crm_22", displayName: "Сартаков Р", role: "Менеджер", aliases: ["Сартаков Роман"], allowedMaintenanceRates: ["m015", "m020"] },
          { id: "crm_23", displayName: "Воропаев С", role: "Менеджер", aliases: ["Воропаев Сергей"], allowedMaintenanceRates: ["m015", "m020", "m030"] },
          { id: "crm_24", displayName: "Храмов Д", role: "Менеджер", aliases: ["Храмов Дмитрий"], allowedMaintenanceRates: ["m015", "m020"] },
          { id: "crm_25", displayName: "Архипова А", role: "Менеджер", aliases: ["Архипова Анна"], allowedMaintenanceRates: ["m015", "m020", "m030"] }
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
          { id: "kpi_1", value: 0.01, label: "1.00%" },
          { id: "kpi_2", value: 0.02, label: "2.00%" },
          { id: "kpi_3", value: 0.03, label: "3.00%" },
          { id: "kpi_4", value: 0.04, label: "4.00%" },
          { id: "kpi_5", value: 0.05, label: "5.00%" }
        ];
      }
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

  return {
    // Состояние
    managers,
    maintenanceRates,
    kpiRates,
    loading,
    error,
    
    // Методы загрузки
    loadManagers,
    loadMaintenanceRates,
    loadKpiRates,
    
    // Хелперы
    getManagerById,
    getManagerByName
  };
});