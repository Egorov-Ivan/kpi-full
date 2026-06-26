// api/get-kpi-received.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows } = await sql`
      SELECT client, manager_name, month 
      FROM kpi_received_clients 
      ORDER BY created_at DESC
    `;

    return res.status(200).json({
      success: true,
      clients: rows
    });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(200).json({ success: true, clients: [] });
    }
    console.error('Get KPI Error:', error);
    return res.status(500).json({ error: error.message });
  }
}