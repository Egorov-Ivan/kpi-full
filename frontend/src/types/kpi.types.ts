// src/types/kpi.types.ts
export interface Manager {
  id: string;              // теперь ID в формате "crm_7"
  displayName: string;     // Отображаемое имя ("Федосеенко Д")
  email?: string;
  phone?: string;
  role?: string;           // Роль в системе
  createdAt?: string;
  aliases: string[];       // Алиасы для поиска в буфере ["Дана", "Dana"]
  allowedMaintenanceRates?: string[];
  allowedKpiRates?: string[];
  active?: boolean;
}