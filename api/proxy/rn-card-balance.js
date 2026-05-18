export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { contract } = req.query;
  const login = process.env.RNCARD_LOGIN;
  const password = process.env.RNCARD_PASSWORD;
  
  if (!login || !password) {
    return res.status(500).json({ error: 'RNCARD_LOGIN и RNCARD_PASSWORD не настроены' });
  }
  
  const base64pass = Buffer.from(password).toString('base64');
  
  try {
    const response = await fetch(
      `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${login}&contract=${contract}&type=json`,
      {
        headers: { 'RnCard-Identity-Account-Pass': base64pass }
      }
    );
    
    const data = await response.json();
    return res.status(200).json({ success: true, balance: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}