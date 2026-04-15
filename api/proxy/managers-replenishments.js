// api/proxy/managers-replenishments.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { dateStart, dateEnd } = req.body;
  
  const response = await fetch('https://api.benzigo.ru/managers/replenishments/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accessToken': process.env.VITE_CRM_API_TOKEN
    },
    body: JSON.stringify({ dateStart, dateEnd })
  });
  
  const data = await response.json();
  res.status(200).json(data);
}