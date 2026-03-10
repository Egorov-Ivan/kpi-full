// src/services/kpiService.ts
import axios from 'axios';
import type { 
  Manager, 
  MaintenanceRate, 
  KpiRate,
  MaintenanceRequest,
  MaintenanceResponse,
  KpiNoVatRequest,
  KpiNoVatResponse,
  KpiVatRecord,
  KpiVatHistory
} from '@/types/kpi.types';

// Базовый URL нашего json-server
const API_BASE_URL = '/api';

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const kpiService = {
  // ============= МЕНЕДЖЕРЫ =============
  
  /**
   * Получить список всех менеджеров
   * GET /managers
   */
  async getManagers(): Promise<Manager[]> {
    try {
      const response = await api.get('/managers');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении менеджеров:', error);
      throw error;
    }
  },

  /**
   * Добавить нового менеджера
   * POST /managers
   */
  async addManager(displayName: string, aliases: string[]): Promise<{ success: boolean; manager: Manager }> {
    try {
      // json-server автоматически генерирует id
      const response = await api.post('/managers', {
        displayName,
        aliases: aliases.length ? aliases : [displayName],
        allowedMaintenanceRates: ['m015', 'm020'],
        allowedKpiRates: ['kpi015', 'kpi02', 'kpi03'],
        active: true
      });
      return { success: true, manager: response.data };
    } catch (error) {
      console.error('Ошибка при добавлении менеджера:', error);
      throw error;
    }
  },

  // ============= СТАВКИ =============
  
  /**
   * Получить ставки для ведения
   * GET /maintenanceRates
   */
  async getMaintenanceRates(): Promise<MaintenanceRate[]> {
    try {
      const response = await api.get('/maintenanceRates');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении ставок ведения:', error);
      throw error;
    }
  },

  /**
   * Получить ставки для KPI
   * GET /kpiRates
   */
  async getKpiRates(): Promise<KpiRate[]> {
    try {
      const response = await api.get('/kpiRates');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении ставок KPI:', error);
      throw error;
    }
  },

  // ============= РАСЧЕТЫ (ВРЕМЕННО МОКОВЫЕ) =============
  
  /**
   * Рассчитать ведение за месяц
   * Временная реализация с моковыми данными
   */
  async calculateMaintenance(data: MaintenanceRequest): Promise<MaintenanceResponse> {
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Имитация расчета
    const totalAmount = Math.random() * 1000000 + 500000;
    const maintenance = totalAmount * data.rate;
    
    return {
      manager: data.managerName,
      month: data.month,
      operations: Math.floor(Math.random() * 50 + 20),
      totalAmount,
      ratePercent: data.rate,
      maintenance
    };
  },

  /**
   * Рассчитать KPI NO_VAT
   * Временная реализация с моковыми данными
   */
  async calculateKpiNoVat(data: KpiNoVatRequest): Promise<KpiNoVatResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const clientDetails = [
      {
        client: "ООО 'Ромашка'",
        firstDate: "2025-01-15",
        maxMonthSum: 150000,
        maxMonth: "2025-03"
      },
      {
        client: "ИП Иванов",
        firstDate: "2025-02-01",
        maxMonthSum: 85000,
        maxMonth: "2025-04"
      },
      {
        client: "ООО 'ТехноСервис'",
        firstDate: "2025-01-10",
        maxMonthSum: 210000,
        maxMonth: "2025-05"
      }
    ];
    
    const totalMaxSum = clientDetails.reduce((sum, c) => sum + c.maxMonthSum, 0);
    const kpiResult = totalMaxSum * data.rate;
    
    return {
      manager: data.managerName,
      statusStats: {
        DA: 5,
        NET: 2,
        BYL: 3,
        NEW: 1
      },
      eligibleClientsCount: clientDetails.length,
      totalClientsConsidered: 11,
      totalMaxSum,
      appliedRate: data.rate,
      kpiResult,
      clientDetails,
      participatingClients: clientDetails.map(c => c.client)
    };
  },

  // ============= KPI VAT =============
  
  /**
   * Сохранить запись KPI VAT
   * POST /kpiVatRecords
   */
  async saveKpiVat(record: Omit<KpiVatRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; record: KpiVatRecord }> {
    try {
      const recordWithDate = {
        ...record,
        createdAt: new Date().toISOString()
      };
      const response = await api.post('/kpiVatRecords', recordWithDate);
      return { success: true, record: response.data };
    } catch (error) {
      console.error('Ошибка при сохранении KPI VAT:', error);
      throw error;
    }
  },

  /**
   * Получить историю KPI VAT
   * GET /kpiVatRecords
   */
  async getKpiVatHistory(managerName?: string): Promise<KpiVatHistory> {
    try {
      let url = '/kpiVatRecords';
      if (managerName) {
        // json-server поддерживает фильтрацию
        url += `?manager=${encodeURIComponent(managerName)}`;
      }
      
      const response = await api.get(url);
      const records = response.data;
      
      // Сортируем по месяцу (сначала новые)
      records.sort((a: KpiVatRecord, b: KpiVatRecord) => 
        new Date(b.month).getTime() - new Date(a.month).getTime()
      );
      
      return {
        records,
        total: records.length,
        totalAmount: records.reduce((sum: number, r: KpiVatRecord) => sum + r.amount, 0)
      };
    } catch (error) {
      console.error('Ошибка при получении истории KPI VAT:', error);
      throw error;
    }
  },

  /**
   * Удалить запись KPI VAT
   * DELETE /kpiVatRecords/:id
   */
  async deleteKpiVatRecord(id: string): Promise<{ success: boolean }> {
    try {
      await api.delete(`/kpiVatRecords/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при удалении записи KPI VAT:', error);
      throw error;
    }
  }
};