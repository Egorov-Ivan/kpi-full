// api/proxy/rn-card-balance.js
import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const accounts = {
    rncard: {
      faeton: {
        login: process.env.RNCARD_FAETON_LOGIN,
        password: process.env.RNCARD_FAETON_PASSWORD,
        contracts: [{ name: 'Роснефть Фаэтон', contract: 'ISS238084' }]
      },
      monblan: {
        login: process.env.RNCARD_MONBLAN_LOGIN,
        password: process.env.RNCARD_MONBLAN_PASSWORD,
        contracts: [{ name: 'Роснефть Монблан', contract: 'ISS218557' }]
      }
    },
    licard: {
      faeton: {
        contracts: [{ name: 'Ликард Фаэтон', contractId: process.env.LICARD_CONTRACT_FAETON || '223686501' }]
      },
      monblan: {
        contracts: [{ name: 'Ликард Монблан', contractId: process.env.LICARD_CONTRACT_MONBLAN || '111' }]
      }
    }
  };

  const { supplier, client } = req.query;
  
  if (!supplier || !client || !accounts[supplier]?.[client]) {
    return res.status(400).json({ error: 'Укажите supplier=rncard|licard и client=faeton|monblan' });
  }

  const acc = accounts[supplier][client];
  const time = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  try {
    // Ликард — без клиентского сертификата (проверяем)
    if (supplier === 'licard') {
      const results = await Promise.all(
        acc.contracts.map(async (c) => {
          const data = await licardRequest('getContractBalance', { contractId: parseInt(c.contractId) });
          const available = data?.getContractBalancePayload?.find(b => b.balanceTypeCode === 'AVAILABLE');
          return {
            supplier: c.name,
            balance: available?.balanceValue || 0,
            updatedAt: time
          };
        })
      );
      return res.status(200).json({ success: true, balances: results });
    }

    // РН-Карт
    const base64pass = Buffer.from(acc.password || '').toString('base64');
    const results = await Promise.all(
      acc.contracts.map(async (c) => {
        const response = await fetch(
          `https://lkapi.rn-card.ru/api/emv/v1/GetContractBalance?u=${acc.login}&contract=${c.contract}&type=json`,
          { headers: { 'RnCard-Identity-Account-Pass': base64pass } }
        );
        const data = await response.json();
        return {
          supplier: c.name,
          balance: data.Available || data.Balance || 0,
          updatedAt: time
        };
      })
    );
    return res.status(200).json({ success: true, balances: results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Запрос к Ликард (без клиентского сертификата)
function licardRequest(service, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '91.234.16.145',
      port: 443,
      path: '/solar-bridge-ext/ext/json-services/' + service,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      rejectUnauthorized: false
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        console.log('🔍 Ликард ответ:', data.substring(0, 500)); // ← лог
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Невалидный JSON: ' + data.substring(0, 100))); }
      });
    });

    request.on('error', reject);
    request.write(JSON.stringify(body));
    request.end();
  });
}