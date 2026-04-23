// api/kpi-settings.js
import { sql } from '@vercel/postgres';

// GET /api/kpi-settings — получить ВСЕ настройки
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Получаем все настройки
      const { rows } = await sql`
        SELECT key, value, updated_at 
        FROM kpi_settings 
        ORDER BY key
      `;

      // Преобразуем в объект { key: value }
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
      // POST /api/kpi-settings — сохранить одну или несколько настроек
      const { key, value } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ 
          error: 'key and value are required' 
        });
      }

      // UPSERT: вставляем или обновляем
      await sql`
        INSERT INTO kpi_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
      `;

      return res.status(200).json({
        success: true,
        message: `Setting '${key}' saved successfully`,
        key,
        value
      });

    } else if (req.method === 'PUT') {
      // PUT /api/kpi-settings — пакетное обновление ВСЕХ настроек
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ 
          error: 'settings object is required' 
        });
      }

      // Обновляем каждую настройку в транзакции
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
        message: `${Object.keys(settings).length} settings saved successfully`
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