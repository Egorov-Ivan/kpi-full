// src/stores/kpiStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { kpiService } from '@/services/kpiService';
import type { 
  Manager, 
  MaintenanceRate, 
  KpiRate,
  MaintenanceResponse,
  KpiNoVatResponse,
  KpiVatRecord
} from '@/types/kpi.types';

export const useKpiStore = defineStore('kpi', () => {
  // ============= СОСТОЯНИЕ =============
  const managers = ref<Manager[]>([]);
  const maintenanceRates = ref<MaintenanceRate[]>([]);
  const kpiRates = ref<KpiRate[]>([]);
  const maintenanceResult = ref<MaintenanceResponse | null>(null);
  const kpiNoVatResult = ref<KpiNoVatResponse | null>(null);
  const kpiVatHistory = ref<KpiVatRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============= ГЕТТЕРЫ =============
  const sortedManagers = computed(() => {
    return [...managers.value].sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    );
  });

  const kpiVatTotal = computed(() => {
    return kpiVatHistory.value.reduce((sum, record) => sum + record.amount, 0);
  });

  // ============= ДЕЙСТВИЯ =============
  
  // Загрузка менеджеров
  async function loadManagers() {
    loading.value = true;
    error.value = null;
    try {
      managers.value = await kpiService.getManagers();
      console.log('✅ Менеджеры загружены:', managers.value.length);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Ошибка загрузки менеджеров:', err);
    } finally {
      loading.value = false;
    }
  }

  // Загрузка ставок ведения
  async function loadMaintenanceRates() {
    try {
      maintenanceRates.value = await kpiService.getMaintenanceRates();
      console.log('✅ Ставки ведения загружены:', maintenanceRates.value.length);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки ставок ведения:', err);
    }
  }

  // Загрузка ставок KPI
  async function loadKpiRates() {
    try {
      kpiRates.value = await kpiService.getKpiRates();
      console.log('✅ Ставки KPI загружены:', kpiRates.value.length);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки ставок KPI:', err);
    }
  }

  // Расчет ведения
  async function calculateMaintenance(managerName: string, month: string, rate: number) {
    loading.value = true;
    error.value = null;
    try {
      maintenanceResult.value = await kpiService.calculateMaintenance({
        managerName,
        month,
        rate
      });
      console.log('✅ Расчет ведения выполнен:', maintenanceResult.value);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Ошибка расчета ведения:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Расчет KPI NO_VAT
  async function calculateKpiNoVat(managerName: string, rate: number) {
    loading.value = true;
    error.value = null;
    try {
      kpiNoVatResult.value = await kpiService.calculateKpiNoVat({
        managerName,
        rate
      });
      console.log('✅ Расчет KPI NO_VAT выполнен:', kpiNoVatResult.value);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Ошибка расчета KPI NO_VAT:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Загрузка истории KPI VAT
  async function loadKpiVatHistory(managerName?: string) {
    try {
      const history = await kpiService.getKpiVatHistory(managerName);
      kpiVatHistory.value = history.records;
      console.log('✅ История KPI VAT загружена:', kpiVatHistory.value.length);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки истории KPI VAT:', err);
    }
  }

  // Сохранение записи KPI VAT
  async function saveKpiVatRecord(record: Omit<KpiVatRecord, 'id' | 'createdAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const result = await kpiService.saveKpiVat(record);
      console.log('✅ Запись KPI VAT сохранена:', result);
      await loadKpiVatHistory(record.manager);
      return result;
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Ошибка сохранения KPI VAT:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Удаление записи KPI VAT
  async function deleteKpiVatRecord(id: string, managerName: string) {
    try {
      await kpiService.deleteKpiVatRecord(id);
      console.log('✅ Запись KPI VAT удалена:', id);
      await loadKpiVatHistory(managerName);
    } catch (err: any) {
      console.error('❌ Ошибка удаления записи KPI VAT:', err);
      throw err;
    }
  }

  // Добавление нового менеджера
  async function addNewManager(displayName: string, aliases: string[]) {
    loading.value = true;
    error.value = null;
    try {
      await kpiService.addManager(displayName, aliases);
      console.log('✅ Менеджер добавлен:', displayName);
      await loadManagers();
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Ошибка добавления менеджера:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Сброс результатов
  function resetResults() {
    maintenanceResult.value = null;
    kpiNoVatResult.value = null;
  }

  return {
    // Состояние
    managers,
    maintenanceRates,
    kpiRates,
    maintenanceResult,
    kpiNoVatResult,
    kpiVatHistory,
    loading,
    error,
    
    // Геттеры
    sortedManagers,
    kpiVatTotal,
    
    // Действия
    loadManagers,
    loadMaintenanceRates,
    loadKpiRates,
    calculateMaintenance,
    calculateKpiNoVat,
    loadKpiVatHistory,
    saveKpiVatRecord,
    deleteKpiVatRecord,
    addNewManager,
    resetResults,
  };
});