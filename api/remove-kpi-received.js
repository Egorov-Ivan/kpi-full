// api/remove-kpi-received.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client } = req.body;
    if (!client) {
      return res.status(400).json({ error: 'client required' });
    }

    await sql`
      DELETE FROM kpi_received_clients 
      WHERE client = ${client}
    `;

    return res.status(200).json({ 
      success: true, 
      message: `KPI разрешён для ${client}` 
    });
  } catch (error) {
    console.error('Remove KPI Error:', error);
    return res.status(500).json({ error: error.message });
  }
}