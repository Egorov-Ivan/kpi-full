// api/kpi-settings.js
import { sql } from '@vercel/postgres';

let dbInitialized = false;

async function initDatabase() {
  if (dbInitialized) return;
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS kpi_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_kpi_settings_key 
      ON kpi_settings(key);
    `;
    
    dbInitialized = true;
    console.log('✅ KPI settings table ready');
  } catch (error) {
    console.error('DB init error:', error);
  }
}

export default async function handler(req, res) {
  await initDatabase();

  try {
    if (req.method === 'GET') {
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

    } else if (req.method === 'POST') {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ 
          error: 'key and value are required' 
        });
      }

      await sql`
        INSERT INTO kpi_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
      `;

      return res.status(200).json({
        success: true,
        message: `Setting '${key}' saved`,
        key,
        value
      });

    } else if (req.method === 'PUT') {
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ 
          error: 'settings object is required' 
        });
      }

      for (const [key, value] of Object.entries(settings)) {
        await sql`
          INSERT INTO kpi_settings (key, value, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}, NOW())
          ON CONFLICT (key) 
          DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
        `;
      }

      return res.status(200).json({
        success: true,
        message: `${Object.keys(settings).length} settings saved`
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('KPI Settings API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}