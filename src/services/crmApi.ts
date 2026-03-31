// src/services/crmApi.ts

const API_BASE_URL = import.meta.env.VITE_CRM_API_URL || 'https://crm.benzigo.ru';
const API_TOKEN = import.meta.env.VITE_CRM_API_TOKEN;

export interface ReplenishmentParams {
  dateStart: string;
  dateEnd?: string;
  legalEntity?: string;
  managerID?: string;
  managername?: string;
}

export interface Replenishment {
  date: string;
  amount: number;
  client: string;
  legalEntity: string;
  managerName: string;     // ← manager → managerName
  managerId?: string;
  clientType: 'VAT' | 'NO_VAT';
}

export interface CrmApiResponse {
  status: 'ok' | 'error';
  data: {
    replenishments: Replenishment[];
  };
  message: string | null;
}

export async function getReplenishments(params: ReplenishmentParams): Promise<CrmApiResponse> {
  if (!params.dateStart) {
    throw new Error('dateStart is required');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('dateStart', params.dateStart);
  
  if (params.dateEnd) queryParams.append('dateEnd', params.dateEnd);
  if (params.legalEntity) queryParams.append('legalEntity', params.legalEntity);
  if (params.managerID) queryParams.append('managerID', params.managerID);
  if (params.managername) queryParams.append('managername', params.managername);
  
  const url = `${API_BASE_URL}/api/v1/replenishments?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data: CrmApiResponse = await response.json();
    
    if (!response.ok || data.status === 'error') {
      throw new Error(data.message || 'Ошибка запроса к CRM');
    }
    
    return data;
  } catch (error) {
    console.error('CRM API Error:', error);
    throw error;
  }
}