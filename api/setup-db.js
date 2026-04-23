// api/setup-db.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Создаем таблицу для хранения всех настроек KPI
    await sql`
      CREATE TABLE IF NOT EXISTS kpi_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Создаем индекс для быстрого поиска по ключу
    await sql`
      CREATE INDEX IF NOT EXISTS idx_kpi_settings_key 
      ON kpi_settings(key);
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'KPI settings table created successfully' 
    });
  } catch (error) {
    console.error('Setup DB Error:', error);
    return res.status(500).json({ 
      error: 'Failed to setup database',
      details: error.message 
    });
  }
}