// src/services/bufferService.ts
import rawData from '../../data/buffer.json';

export interface BufferOperation {
  date: string;
  amount: number;
  client: string;
  clientType: 'VAT' | 'NO_VAT';
  manager: string;
  legalEntity?: string;
}

export interface ManagerStats {
  totalAmount: number;
  operationsCount: number;
  uniqueClients: number;
  vatAmount: number;
  noVatAmount: number;
}

class BufferService {
  private data: BufferOperation[];

  constructor() {
    this.data = rawData as BufferOperation[];
    console.log('✅ BufferService инициализирован, загружено операций:', this.data.length);
    
    // Показываем статистику по датам для отладки
    this.showDateStats();
    
    // Показываем статистику по менеджерам для отладки
    this.showManagerStats();
  }

  /**
   * Показать статистику по датам (для отладки)
   */
  private showDateStats(): void {
    if (this.data.length === 0) return;
    
    console.log('📅 Примеры дат (первые 5):', this.data.slice(0, 5).map(op => op.date));
    
    // Группировка по годам и месяцам
    const yearMonthStats = new Map<string, number>();
    
    this.data.forEach(op => {
      const parsed = this.parseDate(op.date);
      if (parsed) {
        const key = `${parsed.year}-${parsed.month.toString().padStart(2, '0')}`;
        yearMonthStats.set(key, (yearMonthStats.get(key) || 0) + 1);
      } else {
        console.warn('⚠️ Не удалось распарсить дату:', op.date);
      }
    });
    
    console.log('📊 Статистика по месяцам:');
    Array.from(yearMonthStats.entries())
      .sort()
      .forEach(([month, count]) => {
        console.log(`   ${month}: ${count} операций`);
      });
  }

  /**
   * Показать статистику по менеджерам (для отладки)
   */
  private showManagerStats(): void {
    const managerCount = new Map<string, number>();
    const managerTotal = new Map<string, number>();
    
    this.data.forEach(op => {
      const manager = op.manager;
      managerCount.set(manager, (managerCount.get(manager) || 0) + 1);
      managerTotal.set(manager, (managerTotal.get(manager) || 0) + op.amount);
    });
    
    console.log('📊 Статистика по менеджерам в буфере:');
    Array.from(managerCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([manager, count]) => {
        const total = managerTotal.get(manager) || 0;
        console.log(`   ${manager}: ${count} опер., ${total.toLocaleString()}₽`);
      });
  }

  /**
   * Получить все операции
   */
  getAllOperations(): BufferOperation[] {
    return this.data;
  }

  /**
   * Преобразовать дату из ДД-ММ-ГГГГ в объект Date
   */
  private parseDate(dateStr: string): { year: number; month: number; day: number } | null {
    if (!dateStr) return null;
    
    // Формат ДД-ММ-ГГГГ (с дефисами) - ОСНОВНОЙ ФОРМАТ
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Проверка на валидность
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          console.warn('⚠️ Некорректная дата:', dateStr);
          return null;
        }
        
        return { year, month, day };
      }
    }
    
    // Формат ДД.ММ.ГГГГ (с точками) - запасной вариант
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          return null;
        }
        
        return { year, month, day };
      }
    }
    
    console.warn('⚠️ Неподдерживаемый формат даты:', dateStr);
    return null;
  }

  /**
   * Получить операции за конкретный месяц
   */
  getOperationsByMonth(year: number, month: number): BufferOperation[] {
    console.log(`🔍 Поиск операций за ${year}-${month.toString().padStart(2, '0')}`);
    
    const result = this.data.filter(op => {
      const parsed = this.parseDate(op.date);
      if (!parsed) return false;
      
      return parsed.year === year && parsed.month === month;
    });
    
    console.log(`   Найдено: ${result.length} операций`);
    
    // Для отладки покажем первых 3 менеджеров
    if (result.length > 0) {
      const managers = [...new Set(result.map(op => op.manager))];
      console.log(`   Менеджеры: ${managers.slice(0, 3).join(', ')}${managers.length > 3 ? '...' : ''}`);
    }
    
    return result;
  }

  /**
   * Получить операции менеджера за месяц по списку возможных имен (алиасов)
   */
  getOperationsByManagerNames(managerNames: string[], year: number, month: number): BufferOperation[] {
    const normalizedNames = managerNames
      .map(name => name?.toLowerCase().trim())
      .filter(Boolean);
    
    console.log(`🔍 Поиск операций для менеджера по именам: [${normalizedNames.join(', ')}] за ${year}-${month}`);
    
    const result = this.data.filter(op => {
      const parsed = this.parseDate(op.date);
      if (!parsed) return false;
      
      const dateMatch = parsed.year === year && parsed.month === month;
      if (!dateMatch) return false;
      
      const opManager = op.manager.toLowerCase().trim();
      
      // ТОЛЬКО точное совпадение с одним из алиасов
      // Никакого includes или частичного вхождения!
      return normalizedNames.some(name => name === opManager);
    });
    
    console.log(`   Найдено операций: ${result.length}`);
    if (result.length > 0) {
      const totalSum = result.reduce((sum, op) => sum + op.amount, 0);
      console.log(`   Общая сумма: ${totalSum}₽`);
    }
    
    return result;
  }

  /**
   * Получить статистику по менеджеру (по алиасам)
   */
  getManagerStatsByNames(managerNames: string[], year?: number, month?: number): {
    totalAmount: number;
    operationsCount: number;
    uniqueClients: number;
    averageAmount: number;
    vatAmount: number;
    noVatAmount: number;
  } {
    const normalizedNames = managerNames
      .map(name => name?.toLowerCase().trim())
      .filter(Boolean);
    
    let operations = this.data;
    
    if (year && month) {
      operations = operations.filter(op => {
        const parsed = this.parseDate(op.date);
        return parsed ? parsed.year === year && parsed.month === month : false;
      });
    }
    
    const managerOps = operations.filter(op => {
      const opManager = op.manager.toLowerCase().trim();
      return normalizedNames.some(name => name === opManager);
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
   * Получить операции менеджера за месяц (старая версия, оставлена для совместимости)
   * @deprecated Используйте getOperationsByManagerNames
   */
  getOperationsByManagerAndMonth(managerName: string, year: number, month: number): BufferOperation[] {
    console.warn('⚠️ getOperationsByManagerAndMonth устарел, используйте getOperationsByManagerNames');
    return this.getOperationsByManagerNames([managerName], year, month);
  }

  /**
   * Получить операции без VAT
   */
  getNonVatOperations(): BufferOperation[] {
    return this.data.filter(op => op.clientType === 'NO_VAT');
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
      operations = operations.filter(op => {
        const parsed = this.parseDate(op.date);
        return parsed ? parsed.year === year && parsed.month === month : false;
      });
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
      operations = operations.filter(op => {
        const parsed = this.parseDate(op.date);
        return parsed ? parsed.year === year && parsed.month === month : false;
      });
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
    const monthOps = this.data.filter(op => {
      const parsed = this.parseDate(op.date);
      return parsed ? parsed.year === year && parsed.month === month : false;
    });
    
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
      operations = operations.filter(op => {
        const parsed = this.parseDate(op.date);
        return parsed ? parsed.year === year && parsed.month === month : false;
      });
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
    
    // Получаем все даты и сортируем
    const dates = allOps
      .map(op => this.parseDate(op.date))
      .filter(d => d !== null)
      .map(d => `${d.day.toString().padStart(2, '0')}-${d.month.toString().padStart(2, '0')}-${d.year}`)
      .sort((a, b) => {
        // Сортировка по дате (ДД-ММ-ГГГГ)
        const [d1, m1, y1] = a.split('-').map(Number);
        const [d2, m2, y2] = b.split('-').map(Number);
        if (y1 !== y2) return y1 - y2;
        if (m1 !== m2) return m1 - m2;
        return d1 - d2;
      });
    
    return {
      totalOperations: allOps.length,
      totalManagers: new Set(allOps.map(op => op.manager)).size,
      totalClients: new Set(allOps.map(op => op.client)).size,
      dateRange: {
        first: dates[0] || 'нет данных',
        last: dates[dates.length - 1] || 'нет данных'
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