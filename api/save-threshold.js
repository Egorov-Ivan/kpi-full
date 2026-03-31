// Используем Vercel KV для хранения (если есть)
// Или просто сохраняем в памяти (для теста)

// Временное хранилище (сбросится при перезапуске)
let thresholds = {};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { userId, threshold, email } = req.body;

    if (!userId || threshold === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    thresholds[userId] = {
      threshold,
      email,
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Threshold saved for ${userId}: ${threshold}`);
    
    return res.status(200).json({ 
      success: true, 
      threshold,
      savedAt: thresholds[userId].updatedAt
    });
  }

  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const userData = thresholds[userId] || { threshold: 500 };
    
    return res.status(200).json({ 
      threshold: userData.threshold,
      email: userData.email
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}