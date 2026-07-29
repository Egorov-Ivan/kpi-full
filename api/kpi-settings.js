// api/kpi-settings.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // GET /api/kpi-settings
    if (req.method === 'GET') {
      try {
        const { rows } = await sql`
          SELECT key, value, updated_at 
          FROM kpi_settings 
          ORDER BY key
        `;

        const settings = {};
        rows.forEach(row => {
          settings[row.key] = row.value;
        });

        return res.status(200).json({
          success: true,
          settings,
          lastUpdate: rows.length > 0 ? rows[0].updated_at : null
        });
      } catch (e) {
        // Если таблицы нет — создаём
        if (e.message?.includes('relation') || e.code === '42P01') {
          await sql`
            CREATE TABLE IF NOT EXISTS kpi_settings (
              id SERIAL PRIMARY KEY,
              key VARCHAR(255) NOT NULL UNIQUE,
              value JSONB NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          return res.status(200).json({ success: true, settings: {} });
        }
        throw e;
      }
    } 
    
    // POST /api/kpi-settings
    else if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
      }
      await safeUpsert(key, value);
      return res.status(200).json({ success: true });
    } 
    
    // PUT /api/kpi-settings
    else if (req.method === 'PUT') {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'settings object is required' });
      }
      for (const [key, value] of Object.entries(settings)) {
        await safeUpsert(key, value);
      }
      return res.status(200).json({ success: true });
    } 
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('KPI API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function safeUpsert(key, value) {
  try {
    await sql`
      INSERT INTO kpi_settings (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
    `;
  } catch (e) {
    if (e.message?.includes('relation') || e.code === '42P01') {
      await sql`
        CREATE TABLE IF NOT EXISTS kpi_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      await sql`
        INSERT INTO kpi_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, NOW())
      `;
    } else {
      throw e;
    }
  }
}