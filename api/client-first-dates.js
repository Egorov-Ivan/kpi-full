import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — получить все даты
  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT * FROM client_first_dates ORDER BY client_name`;
      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST — сохранить/обновить дату
  if (req.method === 'POST') {
    try {
      const { clientName, firstTransactionDate } = req.body;
      
      if (!clientName || !firstTransactionDate) {
        return res.status(400).json({ error: 'clientName и firstTransactionDate обязательны' });
      }
      
      await sql`
        INSERT INTO client_first_dates (client_name, first_transaction_date, updated_at)
        VALUES (${clientName}, ${firstTransactionDate}, NOW())
        ON CONFLICT (client_name) 
        DO UPDATE SET first_transaction_date = ${firstTransactionDate}, updated_at = NOW()
      `;
      
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE — удалить дату
  if (req.method === 'DELETE') {
    try {
      const { clientName } = req.query;
      await sql`DELETE FROM client_first_dates WHERE client_name = ${clientName}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}