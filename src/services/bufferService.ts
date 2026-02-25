// src/services/bufferService.ts
import rawData from '../../data/buffer.json';

export interface BufferOperation {
  date: string;
  amount: number;
  client: string;
  clientType: 'VAT' | 'NO_VAT';
  manager: string;
}

// Типы для статистики
export interface ManagerStats {
  manager: string;
  totalAmount: number;
  operationsCount: number;
  clients: Set<string>;
  monthlyTotals: Map<string, number>;
}

class BufferService {
  private data: BufferOperation[];

  constructor() {
    this.data = rawData as BufferOperation[];
    console.log('✅ BufferService инициализирован, загружено операций:', this.data.length);
  }

  /**
   * Получить все операции
   */
  getAllOperations(): BufferOperation[] {
    return this.data;
  }

  /**
   * Получить операции за конкретный месяц
   */
  getOperationsByMonth(year: number, month: number): BufferOperation[] {
    const monthStr = month.toString().padStart(2, '0');
    return this.data.filter(op => op.date.startsWith(`${year}-${monthStr}`));
  }

  /**
   * Получить операции менеджера за месяц
   */
  getOperationsByManagerAndMonth(managerName: string, year: number, month: number): BufferOperation[] {
  const monthStr = month.toString().padStart(2, '0');
  const managerLower = managerName.toLowerCase().trim();
  
  console.log(`🔍 Поиск операций для менеджера "${managerName}" за ${year}-${monthStr}`);
  
  const result = this.data.filter(op => {
    const opManager = op.manager.toLowerCase().trim();
    const dateMatch = op.date.startsWith(`${year}-${monthStr}`);
    const managerMatch = opManager === managerLower || 
                        opManager.includes(managerLower) || 
                        managerLower.includes(opManager);
    
    if (dateMatch && managerMatch) {
      console.log(`   ✅ Найдена операция: ${op.date} | ${op.client} | ${op.amount} ₽ | ${op.clientType}`);
    }
    
    return dateMatch && managerMatch;
  });
  
  console.log(`📊 Найдено операций: ${result.length}`);
  return result;
}
  /**
   * Получить операции без VAT
   */
  getNonVatOperations(): BufferOperation[] {
    return this.data.filter(op => op.clientType === 'NO_VAT');
  }

  /**
   * Получить статистику по менеджеру
   */
  getManagerStats(managerName: string, year?: number, month?: number): {
    totalAmount: number;
    operationsCount: number;
    uniqueClients: number;
    averageAmount: number;
    vatAmount: number;
    noVatAmount: number;
  } {
    let operations = this.data;
    
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      operations = operations.filter(op => op.date.startsWith(`${year}-${monthStr}`));
    }
    
    const managerLower = managerName.toLowerCase();
    const managerOps = operations.filter(op => {
      const opManager = op.manager.toLowerCase();
      return opManager === managerLower || 
             opManager.includes(managerLower) || 
             managerLower.includes(opManager);
    });
    
    const totalAmount = managerOps.reduce((sum, op) => sum + op.amount, 0);
    const vatAmount = managerOps
      .filter(op => op.clientType === 'VAT')
      .reduce((sum, op) => sum + op.amount, 0);
    const noVatAmount = managerOps
      .filter(op => op.clientType === 'NO_VAT')
      .reduce((sum, op) => sum + op.amount, 0);
    
    return {
      totalAmount,
      vatAmount,
      noVatAmount,
      operationsCount: managerOps.length,
      uniqueClients: new Set(managerOps.map(op => op.client)).size,
      averageAmount: managerOps.length ? totalAmount / managerOps.length : 0
    };
  }

  /**
   * Получить топ клиентов по сумме
   */
  getTopClients(limit: number = 10, year?: number, month?: number): {
    client: string;
    totalAmount: number;
    operationsCount: number;
    managers: string[];
  }[] {
    let operations = this.data;
    
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      operations = operations.filter(op => op.date.startsWith(`${year}-${monthStr}`));
    }
    
    const clientStats = new Map<string, { total: number; count: number; managers: Set<string> }>();
    
    operations.forEach(op => {
      const stats = clientStats.get(op.client) || { total: 0, count: 0, managers: new Set() };
      stats.total += op.amount;
      stats.count += 1;
      stats.managers.add(op.manager);
      clientStats.set(op.client, stats);
    });
    
    return Array.from(clientStats.entries())
      .map(([client, stats]) => ({
        client,
        totalAmount: stats.total,
        operationsCount: stats.count,
        managers: Array.from(stats.managers)
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }

  /**
   * Получить распределение по типам клиентов
   */
  getClientTypeDistribution(year?: number, month?: number): {
    vat: { count: number; total: number };
    noVat: { count: number; total: number };
  } {
    let operations = this.data;
    
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      operations = operations.filter(op => op.date.startsWith(`${year}-${monthStr}`));
    }
    
    const vatOps = operations.filter(op => op.clientType === 'VAT');
    const noVatOps = operations.filter(op => op.clientType === 'NO_VAT');
    
    return {
      vat: {
        count: vatOps.length,
        total: vatOps.reduce((sum, op) => sum + op.amount, 0)
      },
      noVat: {
        count: noVatOps.length,
        total: noVatOps.reduce((sum, op) => sum + op.amount, 0)
      }
    };
  }

  /**
   * Получить статистику по дням месяца
   */
  getDailyStats(year: number, month: number): {
    date: string;
    totalAmount: number;
    operationsCount: number;
    vatAmount: number;
    noVatAmount: number;
  }[] {
    const monthStr = month.toString().padStart(2, '0');
    const monthOps = this.data.filter(op => op.date.startsWith(`${year}-${monthStr}`));
    
    const dailyStats = new Map<string, { 
      total: number; 
      count: number;
      vat: number;
      noVat: number;
    }>();
    
    monthOps.forEach(op => {
      const stats = dailyStats.get(op.date) || { total: 0, count: 0, vat: 0, noVat: 0 };
      stats.total += op.amount;
      stats.count += 1;
      if (op.clientType === 'VAT') {
        stats.vat += op.amount;
      } else {
        stats.noVat += op.amount;
      }
      dailyStats.set(op.date, stats);
    });
    
    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        totalAmount: stats.total,
        operationsCount: stats.count,
        vatAmount: stats.vat,
        noVatAmount: stats.noVat
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Поиск операций по клиенту
   */
  searchByClient(searchTerm: string): BufferOperation[] {
    const term = searchTerm.toLowerCase();
    return this.data.filter(op => 
      op.client.toLowerCase().includes(term)
    );
  }

  /**
   * Получить статистику по всем менеджерам за период
   */
  getManagersStats(year?: number, month?: number): Map<string, {
    totalAmount: number;
    operationsCount: number;
    uniqueClients: number;
    vatAmount: number;
    noVatAmount: number;
  }> {
    let operations = this.data;
    
    if (year && month) {
      const monthStr = month.toString().padStart(2, '0');
      operations = operations.filter(op => op.date.startsWith(`${year}-${monthStr}`));
    }
    
    const stats = new Map();
    
    operations.forEach(op => {
      const manager = op.manager;
      const current = stats.get(manager) || {
        totalAmount: 0,
        operationsCount: 0,
        uniqueClients: new Set(),
        vatAmount: 0,
        noVatAmount: 0
      };
      
      current.totalAmount += op.amount;
      current.operationsCount += 1;
      current.uniqueClients.add(op.client);
      
      if (op.clientType === 'VAT') {
        current.vatAmount += op.amount;
      } else {
        current.noVatAmount += op.amount;
      }
      
      stats.set(manager, current);
    });
    
    // Преобразуем Set в число
    return new Map(
      Array.from(stats.entries()).map(([manager, data]) => [
        manager,
        {
          totalAmount: data.totalAmount,
          operationsCount: data.operationsCount,
          uniqueClients: data.uniqueClients.size,
          vatAmount: data.vatAmount,
          noVatAmount: data.noVatAmount
        }
      ])
    );
  }

  /**
   * Получить общую статистику по буферу
   */
  getBufferStats() {
    const allOps = this.data;
    const dates = allOps.map(op => op.date).sort();
    
    return {
      totalOperations: allOps.length,
      totalManagers: new Set(allOps.map(op => op.manager)).size,
      totalClients: new Set(allOps.map(op => op.client)).size,
      dateRange: {
        first: dates[0],
        last: dates[dates.length - 1]
      },
      totalAmount: allOps.reduce((sum, op) => sum + op.amount, 0),
      vatAmount: allOps.filter(op => op.clientType === 'VAT').reduce((sum, op) => sum + op.amount, 0),
      noVatAmount: allOps.filter(op => op.clientType === 'NO_VAT').reduce((sum, op) => sum + op.amount, 0)
    };
  }

  /**
   * Получить список всех менеджеров из буфера
   */
  getManagerList(): string[] {
    return Array.from(new Set(this.data.map(op => op.manager))).sort();
  }
}

export const bufferService = new BufferService();