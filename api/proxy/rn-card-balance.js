export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const accounts = {
    monblan: {
      login: process.env.RNCARD_MONBLAN_LOGIN,
      password: process.env.RNCARD_MONBLAN_PASSWORD,
      contracts: [
        { name: 'Роснефть Монблан', contract: 'ISS218557' }
      ]
    },
    faeton: {
      login: process.env.RNCARD_FAETON_LOGIN,
      password: process.env.RNCARD_FAETON_PASSWORD,
      contracts: [
        { name: 'Роснефть Фаэтон', contract: 'ISS238084' }
      ]
    }
  };

  const { entity } = req.query;
  
  if (!entity || !accounts[entity]) {
    return res.status(400).json({ error: 'Укажите entity=faeton или entity=monblan' });
  }

  const acc = accounts[entity];
  const base64pass = Buffer.from(acc.password || '').toString('base64');

   try {
    const results = await Promise.all(
      acc.contracts.map(async (c) => {
        const response = await fetch(
          `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${acc.login}&contract=${c.contract}&type=json`,
          { headers: { 'RnCard-Identity-Account-Pass': base64pass } }
        );
        const data = await response.json();
        console.log('🔍 Ответ для', c.name, ':', JSON.stringify(data));
        return {
          supplier: c.name,
          balance: data.Available || data.Balance || 0,
          updatedAt: new Date().toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      })
    );

    return res.status(200).json({ success: true, balances: results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }}