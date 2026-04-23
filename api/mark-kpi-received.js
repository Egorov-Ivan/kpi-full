// api/mark-kpi-received.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client, managerName, month } = req.body;

    if (!client || !managerName || !month) {
      return res.status(400).json({ error: 'client, managerName, and month are required' });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS kpi_received_clients (
        id SERIAL PRIMARY KEY,
        client VARCHAR(500) NOT NULL,
        manager_name VARCHAR(500) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(client)
      );
    `;

    await sql`
      INSERT INTO kpi_received_clients (client, manager_name, month)
      VALUES (${client}, ${managerName}, ${month})
      ON CONFLICT (client) DO UPDATE 
      SET manager_name = ${managerName}, month = ${month}
    `;

    return res.status(200).json({
      success: true,
      message: `KPI зафиксирован: ${client} → ${managerName} (${month})`
    });
  } catch (error) {
    console.error('Mark KPI Error:', error);
    return res.status(500).json({ error: error.message });
  }
}