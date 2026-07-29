// src/services/bufferService.ts

export interface BufferOperation {
  date: string;
  amount: number;
  client: string;
  clientType: 'VAT' | 'NO_VAT';
  legalEntity: string;
  managerId?: string;
  manager?: string;
  managerName?: string;
  operationId?: string;
}

export interface ManagerStats {
  manager: string;
  managerId?: string;
  totalAmount: number;
  noVatAmount: number;
  vatAmount: number;
  operationsCount: number;
  uniqueClients: number;
}

class BufferService {
  private operations: BufferOperation[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Пробуем загрузить из API сначала
      const response = await fetch('/api/buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateStart: '01-01-2024' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.operations && Array.isArray(data.operations)) {
          this.operations = data.operations;
          console.log(`✅ BufferService инициализирован через API, загружено операций: ${this.operations.length}`);
          this.initialized = true;
          return;
        }
      }
    } catch (error) {
      console.warn('API не доступен, пробуем загрузить из JSON');
    }
    
    // Fallback: загрузка из buffer.json
    try {
      const response = await fetch('/data/buffer.json');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        this.operations = data;
      } else if (data.operations && Array.isArray(data.operations)) {
        this.operations = data.operations;
      } else if (data.data && Array.isArray(data.data)) {
        this.operations = data.data;
      } else {
        this.operations = [];
      }
      
      console.log(`✅ BufferService инициализирован, загружено операций: ${this.operations.length}`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Ошибка загрузки buffer.json:', error);
      this.operations = [];
    }
  }

  // НОВЫЙ МЕТОД: обновить данные в bufferService из API
  updateOperations(operations: BufferOperation[]) {
    this.operations = operations;
    this.initialized = true;
    console.log(`✅ BufferService обновлен: ${this.operations.length} записей`);
  }

  // Получить все операции
  getAllOperations(): BufferOperation[] {
    return this.operations;
  }

  // Получить операции за период
  getOperationsByPeriod(year: number, month: number): BufferOperation[] {
    const monthStr = month.toString().padStart(2, '0');
    return this.operations.filter(op => {
      if (!op.date) return false;
      
      // Поддерживаем форматы: DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
      return op.date.includes(`-${monthStr}-${year}`) || 
             op.date.startsWith(`${year}-${monthStr}`) ||
             op.date.includes(`.${monthStr}.${year}`);
    });
  }

  // Получить операции по менеджеру за период
  getOperationsByManager(managerName: string, year: number, month: number): BufferOperation[] {
    const operations = this.getOperationsByPeriod(year, month);
    return operations.filter(op => {
      const opManager = op.manager || op.managerName;
      return opManager?.toLowerCase() === managerName.toLowerCase();
    });
  }

  // Получить операции по ID менеджера за период
  getOperationsByManagerId(managerId: string, year: number, month: number): BufferOperation[] {
    const operations = this.getOperationsByPeriod(year, month);
    return operations.filter(op => op.managerId === managerId);
  }

  // Получить статистику по менеджерам за период
  getManagersStats(year: number, month: number): Map<string, ManagerStats> {
  const operations = this.getOperationsByPeriod(year, month);
  const stats = new Map<string, ManagerStats>();
  const clientSet = new Map<string, Set<string>>();
  
  operations.forEach(op => {
    // 🔥 ГРУППИРУЕМ ПО managerId (а не по имени)
    const managerId = op.managerId;
    if (!managerId) return;
    
    // Имя менеджера берём из op.manager или op.managerName
    const managerName = op.manager || op.managerName || `Менеджер ${managerId}`;
    
    if (!stats.has(managerId)) {
      stats.set(managerId, {
        manager: managerName,
        managerId: managerId,
        totalAmount: 0,
        noVatAmount: 0,
        vatAmount: 0,
        operationsCount: 0,
        uniqueClients: 0
      });
      clientSet.set(managerId, new Set());
    }
    
    const stat = stats.get(managerId)!;
    stat.totalAmount += op.amount;
    stat.operationsCount += 1;
    
    if (op.clientType === 'NO_VAT') {
      stat.noVatAmount += op.amount;
    } else if (op.clientType === 'VAT') {
      stat.vatAmount += op.amount;
    }
    
    if (op.client) {
      clientSet.get(managerId)!.add(op.client);
    }
  });
  
  // Обновляем количество уникальных клиентов
  for (const [managerId, stat] of stats.entries()) {
    stat.uniqueClients = clientSet.get(managerId)?.size || 0;
  }
  
  return stats;
}

  // Получить статистику по менеджерам за период (в виде массива)
  getManagersStatsArray(year: number, month: number): ManagerStats[] {
    const stats = this.getManagersStats(year, month);
    return Array.from(stats.values());
  }

  // Получить детализацию по клиентам для менеджера
  getClientDetailsForManager(managerName: string, year: number, month: number): any[] {
    const operations = this.getOperationsByManager(managerName, year, month);
    const clientMap = new Map();
    
    operations.forEach(op => {
      if (!clientMap.has(op.client)) {
        clientMap.set(op.client, {
          client: op.client,
          totalAmount: 0,
          noVatAmount: 0,
          vatAmount: 0,
          operationsCount: 0
        });
      }
      
      const data = clientMap.get(op.client);
      data.totalAmount += op.amount;
      data.operationsCount += 1;
      
      if (op.clientType === 'NO_VAT') {
        data.noVatAmount += op.amount;
      } else {
        data.vatAmount += op.amount;
      }
    });
    
    return Array.from(clientMap.values());
  }

  // Получить статистику по буферу
  getBufferStats() {
    if (!this.operations.length) {
      return {
        totalOperations: 0,
        totalClients: 0,
        dateRange: { first: null, last: null }
      };
    }
    
    const dates = this.operations.filter(op => op.date).map(op => op.date);
    const uniqueClients = new Set(this.operations.map(op => op.client));
    
    return {
      totalOperations: this.operations.length,
      totalClients: uniqueClients.size,
      dateRange: {
        first: dates.length ? dates.reduce((a, b) => a < b ? a : b) : null,
        last: dates.length ? dates.reduce((a, b) => a > b ? a : b) : null
      }
    };
  }

  // Обновить данные из API
  async refreshFromApi(dateStart?: string, dateEnd?: string) {
    try {
      const body: any = {};
      if (dateStart) body.dateStart = dateStart;
      if (dateEnd) body.dateEnd = dateEnd;
      
      const response = await fetch('/api/buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.operations && Array.isArray(data.operations)) {
          this.operations = data.operations;
          console.log(`✅ Буфер обновлен из API: ${this.operations.length} записей`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Ошибка обновления из API:', error);
      return false;
    }
  }
}

// Экспортируем единственный экземпляр
export const bufferService = new BufferService();